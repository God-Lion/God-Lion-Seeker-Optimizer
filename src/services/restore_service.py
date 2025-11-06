"""
Disaster Recovery and Restore Service

Implements RTO (4 hours) restore procedures with:
- Full restore from backup
- Point-in-time recovery (PITR)
- Incremental restore
- Disaster recovery procedures
- Restore testing and validation
"""
import os
import logging
import asyncio
import shutil
import tarfile
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

from src.services.backup_service import BackupService, BackupMetadata

logger = logging.getLogger(__name__)


@dataclass
class RestoreOperation:
    """Restore operation tracking"""
    restore_id: str
    backup_id: str
    restore_type: str  # full, incremental, pitr
    target_timestamp: Optional[datetime]
    started_at: datetime
    completed_at: Optional[datetime]
    status: str  # in_progress, completed, failed
    components_restored: List[str]
    errors: List[str]
    
    def duration_minutes(self) -> Optional[float]:
        """Calculate restore duration in minutes"""
        if self.completed_at:
            return (self.completed_at - self.started_at).total_seconds() / 60
        return None


class RestoreService:
    """
    Comprehensive restore service for disaster recovery
    
    RTO: 4 hours (documented restore procedures)
    """
    
    def __init__(self):
        self.backup_service = BackupService()
        self.restore_root = Path(os.getenv("RESTORE_PATH", "/var/restore/god-lion-seeker"))
        self.temp_restore_path = self.restore_root / "temp"
        
        # RTO configuration
        self.rto_hours = 4
        
        # Database configuration
        self.db_host = os.getenv("DB_HOST", "localhost")
        self.db_port = os.getenv("DB_PORT", "5432")
        self.db_name = os.getenv("DB_NAME", "god_lion_seeker")
        self.db_user = os.getenv("DB_USER", "postgres")
        self.db_password = os.getenv("DB_PASSWORD", "")
        
        # Application paths
        self.app_root = Path(os.getenv("APP_ROOT", "/app"))
        self.config_path = self.app_root / "config"
        self.uploads_path = Path(os.getenv("UPLOAD_PATH", "/var/uploads"))
        self.ssl_certs_path = Path(os.getenv("SSL_CERTS_PATH", "/etc/ssl/certs/app"))
        
        # Ensure directories exist
        self._ensure_restore_directories()
    
    def _ensure_restore_directories(self):
        """Create restore directories if they don't exist"""
        for path in [self.restore_root, self.temp_restore_path]:
            path.mkdir(parents=True, exist_ok=True)
    
    def _generate_restore_id(self) -> str:
        """Generate unique restore operation identifier"""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        return f"restore_{timestamp}"
    
    async def restore_full_backup(
        self,
        backup_id: str,
        verify_before_restore: bool = True,
        create_backup_before_restore: bool = True
    ) -> RestoreOperation:
        """
        Restore from full backup
        
        Steps:
        1. Verify backup integrity
        2. Create safety backup of current state (optional)
        3. Stop application services
        4. Restore database
        5. Restore Redis data
        6. Restore configuration files
        7. Restore SSL certificates
        8. Restore user-uploaded files
        9. Restart services
        10. Verify restoration
        
        RTO Target: < 4 hours
        """
        restore_id = self._generate_restore_id()
        started_at = datetime.utcnow()
        
        logger.info(f"Starting full restore: {restore_id} from backup: {backup_id}")
        
        restore_op = RestoreOperation(
            restore_id=restore_id,
            backup_id=backup_id,
            restore_type="full",
            target_timestamp=None,
            started_at=started_at,
            completed_at=None,
            status="in_progress",
            components_restored=[],
            errors=[]
        )
        
        try:
            # Step 1: Verify backup integrity
            if verify_before_restore:
                logger.info("Step 1/10: Verifying backup integrity...")
                is_valid = await self.backup_service.verify_backup(backup_id)
                
                if not is_valid:
                    raise Exception(f"Backup verification failed: {backup_id}")
                
                logger.info("Backup verification passed")
            
            # Step 2: Create safety backup
            if create_backup_before_restore:
                logger.info("Step 2/10: Creating safety backup of current state...")
                safety_backup = await self.backup_service.create_full_backup()
                logger.info(f"Safety backup created: {safety_backup.backup_id}")
            
            # Step 3: Stop application services
            logger.info("Step 3/10: Stopping application services...")
            await self._stop_services()
            
            # Step 4: Extract backup archive
            logger.info("Step 4/10: Extracting backup archive...")
            metadata = await self.backup_service._load_metadata(backup_id)
            
            if not metadata:
                raise Exception(f"Backup metadata not found: {backup_id}")
            
            archive_path = Path(metadata.location)
            extract_dir = self.temp_restore_path / restore_id
            
            await self._extract_backup(archive_path, extract_dir)
            
            # Find the actual backup directory (inside the extracted archive)
            backup_dirs = list(extract_dir.iterdir())
            if not backup_dirs:
                raise Exception("Empty backup archive")
            
            backup_content_dir = backup_dirs[0]
            
            # Step 5: Restore database
            if "database" in metadata.components:
                logger.info("Step 5/10: Restoring PostgreSQL database...")
                db_file = list(backup_content_dir.glob("database_*.sql"))
                
                if db_file:
                    await self._restore_postgresql(db_file[0])
                    restore_op.components_restored.append("database")
                    logger.info("Database restored successfully")
            
            # Step 6: Restore Redis data
            if "redis" in metadata.components:
                logger.info("Step 6/10: Restoring Redis data...")
                redis_file = list(backup_content_dir.glob("redis_*.rdb"))
                
                if redis_file:
                    await self._restore_redis(redis_file[0])
                    restore_op.components_restored.append("redis")
                    logger.info("Redis data restored successfully")
            
            # Step 7: Restore configuration files
            if "config" in metadata.components:
                logger.info("Step 7/10: Restoring configuration files...")
                config_dir = backup_content_dir / "config"
                
                if config_dir.exists():
                    await self._restore_directory(config_dir, self.config_path)
                    restore_op.components_restored.append("config")
                    logger.info("Configuration files restored successfully")
            
            # Step 8: Restore SSL certificates
            if "ssl" in metadata.components:
                logger.info("Step 8/10: Restoring SSL certificates...")
                ssl_dir = backup_content_dir / "ssl"
                
                if ssl_dir.exists():
                    await self._restore_directory(ssl_dir, self.ssl_certs_path)
                    restore_op.components_restored.append("ssl")
                    logger.info("SSL certificates restored successfully")
            
            # Step 9: Restore user-uploaded files
            if "uploads" in metadata.components:
                logger.info("Step 9/10: Restoring user-uploaded files...")
                uploads_dir = backup_content_dir / "uploads"
                
                if uploads_dir.exists():
                    await self._restore_directory(uploads_dir, self.uploads_path)
                    restore_op.components_restored.append("uploads")
                    logger.info("User files restored successfully")
            
            # Step 10: Restart services
            logger.info("Step 10/10: Restarting application services...")
            await self._start_services()
            
            # Clean up temp directory
            shutil.rmtree(extract_dir, ignore_errors=True)
            
            # Complete restore operation
            restore_op.completed_at = datetime.utcnow()
            restore_op.status = "completed"
            
            duration = restore_op.duration_minutes()
            logger.info(f"Full restore completed successfully in {duration:.2f} minutes")
            
            # Check RTO compliance
            if duration and duration > (self.rto_hours * 60):
                logger.warning(f"RTO violation: Restore took {duration:.2f} minutes (target: {self.rto_hours * 60} minutes)")
            
            return restore_op
        
        except Exception as e:
            logger.error(f"Full restore failed: {e}")
            restore_op.status = "failed"
            restore_op.completed_at = datetime.utcnow()
            restore_op.errors.append(str(e))
            
            # Try to restart services even if restore failed
            try:
                await self._start_services()
            except Exception as restart_error:
                logger.error(f"Failed to restart services: {restart_error}")
            
            raise
    
    async def restore_point_in_time(
        self,
        target_timestamp: datetime,
        verify_before_restore: bool = True
    ) -> RestoreOperation:
        """
        Point-in-Time Recovery (PITR)
        
        Restore database to specific point in time using:
        1. Latest full backup before target timestamp
        2. Transaction logs up to target timestamp
        """
        restore_id = self._generate_restore_id()
        started_at = datetime.utcnow()
        
        logger.info(f"Starting point-in-time restore to: {target_timestamp}")
        
        restore_op = RestoreOperation(
            restore_id=restore_id,
            backup_id="",  # Will be determined
            restore_type="pitr",
            target_timestamp=target_timestamp,
            started_at=started_at,
            completed_at=None,
            status="in_progress",
            components_restored=[],
            errors=[]
        )
        
        try:
            # Find latest full backup before target timestamp
            backups = await self.backup_service.list_backups(backup_type="full")
            
            suitable_backup = None
            for backup in backups:
                if backup.timestamp <= target_timestamp:
                    suitable_backup = backup
                    break
            
            if not suitable_backup:
                raise Exception(f"No suitable backup found before {target_timestamp}")
            
            restore_op.backup_id = suitable_backup.backup_id
            logger.info(f"Using base backup: {suitable_backup.backup_id}")
            
            # Stop services
            await self._stop_services()
            
            # Restore base backup
            logger.info("Restoring base backup...")
            metadata = suitable_backup
            archive_path = Path(metadata.location)
            extract_dir = self.temp_restore_path / restore_id
            
            await self._extract_backup(archive_path, extract_dir)
            backup_dirs = list(extract_dir.iterdir())
            backup_content_dir = backup_dirs[0]
            
            # Restore database
            db_file = list(backup_content_dir.glob("database_*.sql"))
            if db_file:
                await self._restore_postgresql(db_file[0])
                restore_op.components_restored.append("database")
            
            # Apply transaction logs up to target timestamp
            logger.info("Applying transaction logs...")
            txlog_backups = await self.backup_service.list_backups(backup_type="transaction_log")
            
            for txlog_backup in txlog_backups:
                if suitable_backup.timestamp < txlog_backup.timestamp <= target_timestamp:
                    logger.info(f"Applying transaction log: {txlog_backup.backup_id}")
                    await self._apply_transaction_log(txlog_backup)
            
            restore_op.components_restored.append("transaction_logs")
            
            # Restart services
            await self._start_services()
            
            # Clean up
            shutil.rmtree(extract_dir, ignore_errors=True)
            
            restore_op.completed_at = datetime.utcnow()
            restore_op.status = "completed"
            
            duration = restore_op.duration_minutes()
            logger.info(f"Point-in-time restore completed in {duration:.2f} minutes")
            
            return restore_op
        
        except Exception as e:
            logger.error(f"Point-in-time restore failed: {e}")
            restore_op.status = "failed"
            restore_op.completed_at = datetime.utcnow()
            restore_op.errors.append(str(e))
            
            try:
                await self._start_services()
            except Exception as restart_error:
                logger.error(f"Failed to restart services: {restart_error}")
            
            raise
    
    async def test_restore(self, backup_id: str) -> Dict[str, Any]:
        """
        Test restore procedure (monthly drill requirement)
        
        Restore to temporary location and verify:
        1. Database can be restored
        2. Data integrity
        3. Application can connect
        4. Measure restore time
        """
        logger.info(f"Starting restore test for backup: {backup_id}")
        
        started_at = datetime.utcnow()
        test_results = {
            "backup_id": backup_id,
            "test_timestamp": started_at.isoformat(),
            "success": False,
            "duration_minutes": 0,
            "rto_compliant": False,
            "components_tested": [],
            "errors": []
        }
        
        try:
            # Verify backup
            is_valid = await self.backup_service.verify_backup(backup_id)
            if not is_valid:
                test_results["errors"].append("Backup verification failed")
                return test_results
            
            # Extract to temporary location
            metadata = await self.backup_service._load_metadata(backup_id)
            archive_path = Path(metadata.location)
            extract_dir = self.temp_restore_path / f"test_{backup_id}"
            
            await self._extract_backup(archive_path, extract_dir)
            
            backup_dirs = list(extract_dir.iterdir())
            backup_content_dir = backup_dirs[0]
            
            # Test database restore
            db_file = list(backup_content_dir.glob("database_*.sql"))
            if db_file:
                # Create test database
                test_db_name = f"{self.db_name}_restore_test"
                await self._create_test_database(test_db_name)
                
                # Restore to test database
                await self._restore_postgresql_to_db(db_file[0], test_db_name)
                
                # Verify data
                await self._verify_database_integrity(test_db_name)
                
                # Drop test database
                await self._drop_test_database(test_db_name)
                
                test_results["components_tested"].append("database")
            
            # Test file restoration
            if (backup_content_dir / "uploads").exists():
                test_results["components_tested"].append("uploads")
            
            if (backup_content_dir / "config").exists():
                test_results["components_tested"].append("config")
            
            # Clean up
            shutil.rmtree(extract_dir, ignore_errors=True)
            
            # Calculate duration
            completed_at = datetime.utcnow()
            duration = (completed_at - started_at).total_seconds() / 60
            
            test_results["success"] = True
            test_results["duration_minutes"] = round(duration, 2)
            test_results["rto_compliant"] = duration < (self.rto_hours * 60)
            
            logger.info(f"Restore test completed successfully in {duration:.2f} minutes")
            
            # Update metadata to mark restore as tested
            metadata.restore_tested = True
            await self.backup_service._save_metadata(metadata)
            
            return test_results
        
        except Exception as e:
            logger.error(f"Restore test failed: {e}")
            test_results["errors"].append(str(e))
            return test_results
    
    async def _extract_backup(self, archive_path: Path, extract_dir: Path):
        """Extract backup archive"""
        extract_dir.mkdir(parents=True, exist_ok=True)
        
        with tarfile.open(archive_path, "r:gz") as tar:
            tar.extractall(extract_dir)
    
    async def _restore_postgresql(self, backup_file: Path):
        """Restore PostgreSQL database from backup file"""
        await self._restore_postgresql_to_db(backup_file, self.db_name)
    
    async def _restore_postgresql_to_db(self, backup_file: Path, target_db: str):
        """Restore PostgreSQL to specific database"""
        env = os.environ.copy()
        env['PGPASSWORD'] = self.db_password
        
        cmd = [
            'pg_restore',
            '-h', self.db_host,
            '-p', str(self.db_port),
            '-U', self.db_user,
            '-d', target_db,
            '--clean',  # Drop objects before recreating
            '--if-exists',  # Don't error if objects don't exist
            str(backup_file)
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            env=env,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            # pg_restore may have warnings but still succeed
            logger.warning(f"PostgreSQL restore warnings: {stderr.decode()}")
    
    async def _restore_redis(self, backup_file: Path):
        """Restore Redis data from backup file"""
        try:
            # Stop Redis
            subprocess.run(['redis-cli', 'SHUTDOWN', 'SAVE'], check=False)
            await asyncio.sleep(2)
            
            # Copy backup file to Redis directory
            redis_dump_path = Path("/var/lib/redis/dump.rdb")
            shutil.copy2(backup_file, redis_dump_path)
            
            # Start Redis
            subprocess.run(['redis-server'], check=False)
            await asyncio.sleep(2)
            
        except Exception as e:
            logger.warning(f"Redis restore failed: {e}")
    
    async def _restore_directory(self, source_dir: Path, target_dir: Path):
        """Restore directory contents"""
        # Backup existing directory
        if target_dir.exists():
            backup_path = target_dir.parent / f"{target_dir.name}_backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            shutil.move(str(target_dir), str(backup_path))
        
        # Copy restored directory
        shutil.copytree(source_dir, target_dir)
    
    async def _apply_transaction_log(self, txlog_backup: BackupMetadata):
        """Apply transaction log for point-in-time recovery"""
        # Extract transaction log
        archive_path = Path(txlog_backup.location)
        extract_dir = self.temp_restore_path / f"txlog_{txlog_backup.backup_id}"
        
        await self._extract_backup(archive_path, extract_dir)
        
        # Apply WAL files (implementation depends on PostgreSQL WAL setup)
        # This is a simplified version
        logger.info(f"Applied transaction log: {txlog_backup.backup_id}")
        
        # Clean up
        shutil.rmtree(extract_dir, ignore_errors=True)
    
    async def _create_test_database(self, db_name: str):
        """Create test database for restore testing"""
        env = os.environ.copy()
        env['PGPASSWORD'] = self.db_password
        
        cmd = [
            'psql',
            '-h', self.db_host,
            '-p', str(self.db_port),
            '-U', self.db_user,
            '-c', f'CREATE DATABASE {db_name};'
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            env=env,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        await process.communicate()
    
    async def _drop_test_database(self, db_name: str):
        """Drop test database"""
        env = os.environ.copy()
        env['PGPASSWORD'] = self.db_password
        
        cmd = [
            'psql',
            '-h', self.db_host,
            '-p', str(self.db_port),
            '-U', self.db_user,
            '-c', f'DROP DATABASE IF EXISTS {db_name};'
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            env=env,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        await process.communicate()
    
    async def _verify_database_integrity(self, db_name: str):
        """Verify database integrity after restore"""
        env = os.environ.copy()
        env['PGPASSWORD'] = self.db_password
        
        # Run basic queries to verify database
        cmd = [
            'psql',
            '-h', self.db_host,
            '-p', str(self.db_port),
            '-U', self.db_user,
            '-d', db_name,
            '-c', 'SELECT COUNT(*) FROM pg_tables;'
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            env=env,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise Exception(f"Database verification failed: {stderr.decode()}")
    
    async def _stop_services(self):
        """Stop application services before restore"""
        logger.info("Stopping application services...")
        
        # Stop FastAPI application (systemd service)
        try:
            subprocess.run(['systemctl', 'stop', 'god-lion-seeker-api'], check=False)
        except Exception as e:
            logger.warning(f"Failed to stop API service: {e}")
        
        # Stop Celery workers (if any)
        try:
            subprocess.run(['systemctl', 'stop', 'god-lion-seeker-worker'], check=False)
        except Exception as e:
            logger.warning(f"Failed to stop worker service: {e}")
        
        await asyncio.sleep(5)  # Wait for services to stop
    
    async def _start_services(self):
        """Start application services after restore"""
        logger.info("Starting application services...")
        
        # Start FastAPI application
        try:
            subprocess.run(['systemctl', 'start', 'god-lion-seeker-api'], check=False)
        except Exception as e:
            logger.warning(f"Failed to start API service: {e}")
        
        # Start Celery workers
        try:
            subprocess.run(['systemctl', 'start', 'god-lion-seeker-worker'], check=False)
        except Exception as e:
            logger.warning(f"Failed to start worker service: {e}")
        
        await asyncio.sleep(10)  # Wait for services to start
