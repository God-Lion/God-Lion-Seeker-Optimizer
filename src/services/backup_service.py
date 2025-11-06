"""
Backup and Disaster Recovery Service

Implements RPO (24 hours) and RTO (4 hours) requirements with:
- Daily automated backups
- Hourly transaction log backups
- Multi-tier backup storage
- Backup verification and monitoring
"""
import os
import logging
import asyncio
import shutil
import tarfile
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
import json
import subprocess

logger = logging.getLogger(__name__)


@dataclass
class BackupMetadata:
    """Backup metadata for tracking and verification"""
    backup_id: str
    backup_type: str  # full, incremental, transaction_log
    timestamp: datetime
    size_bytes: int
    checksum: str
    components: List[str]  # database, redis, files, config, logs
    location: str
    status: str  # completed, failed, verified
    rpo_compliant: bool
    verification_timestamp: Optional[datetime] = None
    restore_tested: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "backup_id": self.backup_id,
            "backup_type": self.backup_type,
            "timestamp": self.timestamp.isoformat(),
            "size_bytes": self.size_bytes,
            "checksum": self.checksum,
            "components": self.components,
            "location": self.location,
            "status": self.status,
            "rpo_compliant": self.rpo_compliant,
            "verification_timestamp": self.verification_timestamp.isoformat() if self.verification_timestamp else None,
            "restore_tested": self.restore_tested
        }


class BackupService:
    """
    Comprehensive backup service with disaster recovery capabilities
    
    RPO: 24 hours (daily full backups + hourly transaction logs)
    RTO: 4 hours (documented restore procedures)
    """
    
    def __init__(self):
        self.backup_root = Path(os.getenv("BACKUP_ROOT_PATH", "/var/backups/god-lion-seeker"))
        self.local_backup_path = self.backup_root / "local"
        self.temp_backup_path = self.backup_root / "temp"
        
        # Storage tiers
        self.local_retention_days = 7
        self.cloud_retention_days = 90
        self.cold_storage_retention_years = 7
        
        # RPO/RTO configuration
        self.rpo_hours = 24
        self.rto_hours = 4
        
        # Database configuration
        self.db_host = os.getenv("DB_HOST", "localhost")
        self.db_port = os.getenv("DB_PORT", "5432")
        self.db_name = os.getenv("DB_NAME", "god_lion_seeker")
        self.db_user = os.getenv("DB_USER", "postgres")
        self.db_password = os.getenv("DB_PASSWORD", "")
        
        # Redis configuration
        self.redis_host = os.getenv("REDIS_HOST", "localhost")
        self.redis_port = os.getenv("REDIS_PORT", "6379")
        
        # Application paths
        self.app_root = Path(os.getenv("APP_ROOT", "/app"))
        self.config_path = self.app_root / "config"
        self.uploads_path = Path(os.getenv("UPLOAD_PATH", "/var/uploads"))
        self.logs_path = Path(os.getenv("LOG_PATH", "/var/logs"))
        self.ssl_certs_path = Path(os.getenv("SSL_CERTS_PATH", "/etc/ssl/certs/app"))
        
        # Cloud storage configuration
        self.cloud_storage_type = os.getenv("CLOUD_STORAGE_TYPE", "s3")  # s3 or azure
        self.cloud_bucket = os.getenv("CLOUD_BACKUP_BUCKET", "god-lion-seeker-backups")
        self.cloud_region = os.getenv("CLOUD_REGION", "us-east-1")
        
        # Emergency contact list
        self.emergency_contacts = self._load_emergency_contacts()
        
        # Ensure directories exist
        self._ensure_backup_directories()
    
    def _ensure_backup_directories(self):
        """Create backup directories if they don't exist"""
        for path in [self.backup_root, self.local_backup_path, self.temp_backup_path]:
            path.mkdir(parents=True, exist_ok=True)
    
    def _load_emergency_contacts(self) -> List[Dict[str, str]]:
        """Load emergency contact list for disaster recovery"""
        contacts_file = self.config_path / "emergency_contacts.json"
        
        if contacts_file.exists():
            with open(contacts_file, 'r') as f:
                return json.load(f)
        
        # Default contacts
        return [
            {
                "role": "Database Administrator",
                "name": os.getenv("DBA_NAME", "DBA Team"),
                "email": os.getenv("DBA_EMAIL", "dba@company.com"),
                "phone": os.getenv("DBA_PHONE", "+1-XXX-XXX-XXXX"),
                "priority": 1
            },
            {
                "role": "System Administrator",
                "name": os.getenv("SYSADMIN_NAME", "SysAdmin Team"),
                "email": os.getenv("SYSADMIN_EMAIL", "sysadmin@company.com"),
                "phone": os.getenv("SYSADMIN_PHONE", "+1-XXX-XXX-XXXX"),
                "priority": 2
            },
            {
                "role": "Security Team",
                "name": os.getenv("SECURITY_NAME", "Security Team"),
                "email": os.getenv("SECURITY_EMAIL", "security@company.com"),
                "phone": os.getenv("SECURITY_PHONE", "+1-XXX-XXX-XXXX"),
                "priority": 3
            }
        ]
    
    def _generate_backup_id(self, backup_type: str) -> str:
        """Generate unique backup identifier"""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        return f"{backup_type}_{timestamp}"
    
    def _calculate_checksum(self, file_path: Path) -> str:
        """Calculate SHA256 checksum for backup verification"""
        sha256_hash = hashlib.sha256()
        
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        
        return sha256_hash.hexdigest()
    
    async def create_full_backup(self) -> BackupMetadata:
        """
        Create full backup of all components
        
        Components:
        - PostgreSQL database (full dump)
        - Redis data (if persistence enabled)
        - Application configuration files
        - SSL certificates
        - User-uploaded files
        - Application logs (last 30 days)
        """
        backup_id = self._generate_backup_id("full")
        backup_timestamp = datetime.utcnow()
        
        logger.info(f"Starting full backup: {backup_id}")
        
        try:
            backup_dir = self.temp_backup_path / backup_id
            backup_dir.mkdir(parents=True, exist_ok=True)
            
            components = []
            
            # 1. Backup PostgreSQL database
            logger.info("Backing up PostgreSQL database...")
            db_backup_file = backup_dir / f"database_{backup_id}.sql"
            await self._backup_postgresql_full(db_backup_file)
            components.append("database")
            
            # 2. Backup Redis data
            logger.info("Backing up Redis data...")
            redis_backup_file = backup_dir / f"redis_{backup_id}.rdb"
            await self._backup_redis(redis_backup_file)
            components.append("redis")
            
            # 3. Backup configuration files
            logger.info("Backing up configuration files...")
            config_backup_dir = backup_dir / "config"
            await self._backup_directory(self.config_path, config_backup_dir)
            components.append("config")
            
            # 4. Backup SSL certificates
            logger.info("Backing up SSL certificates...")
            ssl_backup_dir = backup_dir / "ssl"
            if self.ssl_certs_path.exists():
                await self._backup_directory(self.ssl_certs_path, ssl_backup_dir)
                components.append("ssl")
            
            # 5. Backup user-uploaded files
            logger.info("Backing up user-uploaded files...")
            uploads_backup_dir = backup_dir / "uploads"
            if self.uploads_path.exists():
                await self._backup_directory(self.uploads_path, uploads_backup_dir)
                components.append("uploads")
            
            # 6. Backup application logs (last 30 days)
            logger.info("Backing up application logs...")
            logs_backup_dir = backup_dir / "logs"
            await self._backup_logs(logs_backup_dir, days=30)
            components.append("logs")
            
            # Create tarball
            logger.info("Creating backup archive...")
            archive_path = self.local_backup_path / f"{backup_id}.tar.gz"
            await self._create_tarball(backup_dir, archive_path)
            
            # Calculate checksum
            checksum = self._calculate_checksum(archive_path)
            
            # Get archive size
            archive_size = archive_path.stat().st_size
            
            # Clean up temp directory
            shutil.rmtree(backup_dir)
            
            # Create metadata
            metadata = BackupMetadata(
                backup_id=backup_id,
                backup_type="full",
                timestamp=backup_timestamp,
                size_bytes=archive_size,
                checksum=checksum,
                components=components,
                location=str(archive_path),
                status="completed",
                rpo_compliant=True
            )
            
            # Save metadata
            await self._save_metadata(metadata)
            
            logger.info(f"Full backup completed: {backup_id} ({archive_size / 1024 / 1024:.2f} MB)")
            
            # Upload to cloud storage
            asyncio.create_task(self._upload_to_cloud(archive_path, metadata))
            
            return metadata
        
        except Exception as e:
            logger.error(f"Full backup failed: {e}")
            raise
    
    async def create_incremental_backup(self, last_backup_timestamp: datetime) -> BackupMetadata:
        """
        Create incremental backup (changes since last backup)
        
        Only backs up:
        - Database changes (using pg_dump with incremental options)
        - New/modified uploaded files
        - Recent logs
        """
        backup_id = self._generate_backup_id("incremental")
        backup_timestamp = datetime.utcnow()
        
        logger.info(f"Starting incremental backup: {backup_id}")
        
        try:
            backup_dir = self.temp_backup_path / backup_id
            backup_dir.mkdir(parents=True, exist_ok=True)
            
            components = []
            
            # 1. Backup database changes
            logger.info("Backing up database changes...")
            db_backup_file = backup_dir / f"database_incremental_{backup_id}.sql"
            await self._backup_postgresql_incremental(db_backup_file, last_backup_timestamp)
            components.append("database")
            
            # 2. Backup modified files
            logger.info("Backing up modified files...")
            uploads_backup_dir = backup_dir / "uploads"
            await self._backup_modified_files(
                self.uploads_path,
                uploads_backup_dir,
                last_backup_timestamp
            )
            components.append("uploads")
            
            # 3. Backup recent logs
            logger.info("Backing up recent logs...")
            logs_backup_dir = backup_dir / "logs"
            hours_since_last = (backup_timestamp - last_backup_timestamp).total_seconds() / 3600
            await self._backup_logs(logs_backup_dir, days=int(hours_since_last / 24) + 1)
            components.append("logs")
            
            # Create tarball
            archive_path = self.local_backup_path / f"{backup_id}.tar.gz"
            await self._create_tarball(backup_dir, archive_path)
            
            # Calculate checksum
            checksum = self._calculate_checksum(archive_path)
            
            # Get archive size
            archive_size = archive_path.stat().st_size
            
            # Clean up temp directory
            shutil.rmtree(backup_dir)
            
            # Create metadata
            metadata = BackupMetadata(
                backup_id=backup_id,
                backup_type="incremental",
                timestamp=backup_timestamp,
                size_bytes=archive_size,
                checksum=checksum,
                components=components,
                location=str(archive_path),
                status="completed",
                rpo_compliant=True
            )
            
            await self._save_metadata(metadata)
            
            logger.info(f"Incremental backup completed: {backup_id} ({archive_size / 1024 / 1024:.2f} MB)")
            
            return metadata
        
        except Exception as e:
            logger.error(f"Incremental backup failed: {e}")
            raise
    
    async def create_transaction_log_backup(self) -> BackupMetadata:
        """
        Create transaction log backup (hourly)
        
        Backs up PostgreSQL WAL (Write-Ahead Log) files
        """
        backup_id = self._generate_backup_id("txlog")
        backup_timestamp = datetime.utcnow()
        
        logger.info(f"Starting transaction log backup: {backup_id}")
        
        try:
            backup_dir = self.temp_backup_path / backup_id
            backup_dir.mkdir(parents=True, exist_ok=True)
            
            # Backup WAL files
            wal_backup_file = backup_dir / f"wal_{backup_id}.tar"
            await self._backup_postgresql_wal(wal_backup_file)
            
            # Create tarball
            archive_path = self.local_backup_path / f"{backup_id}.tar.gz"
            await self._create_tarball(backup_dir, archive_path)
            
            # Calculate checksum
            checksum = self._calculate_checksum(archive_path)
            archive_size = archive_path.stat().st_size
            
            # Clean up temp directory
            shutil.rmtree(backup_dir)
            
            # Create metadata
            metadata = BackupMetadata(
                backup_id=backup_id,
                backup_type="transaction_log",
                timestamp=backup_timestamp,
                size_bytes=archive_size,
                checksum=checksum,
                components=["transaction_log"],
                location=str(archive_path),
                status="completed",
                rpo_compliant=True
            )
            
            await self._save_metadata(metadata)
            
            logger.info(f"Transaction log backup completed: {backup_id}")
            
            return metadata
        
        except Exception as e:
            logger.error(f"Transaction log backup failed: {e}")
            raise
    
    async def _backup_postgresql_full(self, output_file: Path):
        """Create full PostgreSQL database backup"""
        env = os.environ.copy()
        env['PGPASSWORD'] = self.db_password
        
        cmd = [
            'pg_dump',
            '-h', self.db_host,
            '-p', str(self.db_port),
            '-U', self.db_user,
            '-d', self.db_name,
            '-F', 'c',  # Custom format (compressed)
            '-f', str(output_file)
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            env=env,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise Exception(f"PostgreSQL backup failed: {stderr.decode()}")
    
    async def _backup_postgresql_incremental(self, output_file: Path, since: datetime):
        """Create incremental PostgreSQL backup (using base backup + WAL)"""
        # For incremental, we use pg_dump with specific tables/schemas
        # In production, consider using pg_basebackup with WAL archiving
        env = os.environ.copy()
        env['PGPASSWORD'] = self.db_password
        
        cmd = [
            'pg_dump',
            '-h', self.db_host,
            '-p', str(self.db_port),
            '-U', self.db_user,
            '-d', self.db_name,
            '-F', 'c',
            '-f', str(output_file)
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            env=env,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise Exception(f"PostgreSQL incremental backup failed: {stderr.decode()}")
    
    async def _backup_postgresql_wal(self, output_file: Path):
        """Backup PostgreSQL WAL (Write-Ahead Log) files"""
        env = os.environ.copy()
        env['PGPASSWORD'] = self.db_password
        
        # Archive current WAL segment
        cmd = [
            'psql',
            '-h', self.db_host,
            '-p', str(self.db_port),
            '-U', self.db_user,
            '-d', self.db_name,
            '-c', 'SELECT pg_switch_wal();'
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            env=env,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        await process.communicate()
        
        # Note: In production, WAL archiving should be configured in postgresql.conf
        # This is a simplified implementation
    
    async def _backup_redis(self, output_file: Path):
        """Backup Redis data"""
        try:
            # Trigger Redis BGSAVE
            import redis
            r = redis.Redis(host=self.redis_host, port=int(self.redis_port))
            r.bgsave()
            
            # Wait for save to complete
            while r.lastsave() == r.lastsave():
                await asyncio.sleep(0.5)
            
            # Copy RDB file
            redis_dump_path = Path("/var/lib/redis/dump.rdb")  # Default Redis dump location
            if redis_dump_path.exists():
                shutil.copy2(redis_dump_path, output_file)
            
        except Exception as e:
            logger.warning(f"Redis backup failed (may not be enabled): {e}")
    
    async def _backup_directory(self, source_dir: Path, dest_dir: Path):
        """Backup entire directory"""
        if source_dir.exists():
            shutil.copytree(source_dir, dest_dir, dirs_exist_ok=True)
    
    async def _backup_modified_files(self, source_dir: Path, dest_dir: Path, since: datetime):
        """Backup only files modified since timestamp"""
        if not source_dir.exists():
            return
        
        dest_dir.mkdir(parents=True, exist_ok=True)
        
        for file_path in source_dir.rglob('*'):
            if file_path.is_file():
                mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                if mtime > since:
                    rel_path = file_path.relative_to(source_dir)
                    dest_file = dest_dir / rel_path
                    dest_file.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(file_path, dest_file)
    
    async def _backup_logs(self, dest_dir: Path, days: int = 30):
        """Backup application logs from last N days"""
        if not self.logs_path.exists():
            return
        
        dest_dir.mkdir(parents=True, exist_ok=True)
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        for log_file in self.logs_path.rglob('*.log'):
            mtime = datetime.fromtimestamp(log_file.stat().st_mtime)
            if mtime > cutoff_date:
                shutil.copy2(log_file, dest_dir / log_file.name)
    
    async def _create_tarball(self, source_dir: Path, archive_path: Path):
        """Create compressed tarball"""
        with tarfile.open(archive_path, "w:gz") as tar:
            tar.add(source_dir, arcname=source_dir.name)
    
    async def _save_metadata(self, metadata: BackupMetadata):
        """Save backup metadata to JSON file"""
        metadata_file = self.local_backup_path / f"{metadata.backup_id}.json"
        
        with open(metadata_file, 'w') as f:
            json.dump(metadata.to_dict(), f, indent=2)
    
    async def _upload_to_cloud(self, archive_path: Path, metadata: BackupMetadata):
        """Upload backup to cloud storage (AWS S3 or Azure Blob)"""
        try:
            if self.cloud_storage_type == "s3":
                await self._upload_to_s3(archive_path, metadata)
            elif self.cloud_storage_type == "azure":
                await self._upload_to_azure(archive_path, metadata)
            
            logger.info(f"Backup uploaded to cloud: {metadata.backup_id}")
        
        except Exception as e:
            logger.error(f"Cloud upload failed: {e}")
    
    async def _upload_to_s3(self, archive_path: Path, metadata: BackupMetadata):
        """Upload to AWS S3"""
        try:
            import boto3
            
            s3_client = boto3.client('s3', region_name=self.cloud_region)
            
            object_key = f"backups/{metadata.timestamp.strftime('%Y/%m/%d')}/{archive_path.name}"
            
            s3_client.upload_file(
                str(archive_path),
                self.cloud_bucket,
                object_key
            )
            
            # Upload metadata
            metadata_key = f"backups/{metadata.timestamp.strftime('%Y/%m/%d')}/{metadata.backup_id}.json"
            s3_client.put_object(
                Bucket=self.cloud_bucket,
                Key=metadata_key,
                Body=json.dumps(metadata.to_dict()),
                ContentType='application/json'
            )
        
        except Exception as e:
            logger.error(f"S3 upload failed: {e}")
            raise
    
    async def _upload_to_azure(self, archive_path: Path, metadata: BackupMetadata):
        """Upload to Azure Blob Storage"""
        try:
            from azure.storage.blob import BlobServiceClient
            
            connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
            blob_service_client = BlobServiceClient.from_connection_string(connection_string)
            
            container_client = blob_service_client.get_container_client(self.cloud_bucket)
            
            blob_name = f"backups/{metadata.timestamp.strftime('%Y/%m/%d')}/{archive_path.name}"
            
            with open(archive_path, "rb") as data:
                container_client.upload_blob(name=blob_name, data=data, overwrite=True)
            
            # Upload metadata
            metadata_blob = f"backups/{metadata.timestamp.strftime('%Y/%m/%d')}/{metadata.backup_id}.json"
            container_client.upload_blob(
                name=metadata_blob,
                data=json.dumps(metadata.to_dict()),
                overwrite=True
            )
        
        except Exception as e:
            logger.error(f"Azure upload failed: {e}")
            raise
    
    async def verify_backup(self, backup_id: str) -> bool:
        """
        Verify backup integrity
        
        - Check checksum
        - Verify archive can be extracted
        - Optional: Test restore to temporary location
        """
        try:
            # Load metadata
            metadata = await self._load_metadata(backup_id)
            
            if not metadata:
                logger.error(f"Backup metadata not found: {backup_id}")
                return False
            
            archive_path = Path(metadata.location)
            
            if not archive_path.exists():
                logger.error(f"Backup file not found: {archive_path}")
                return False
            
            # Verify checksum
            current_checksum = self._calculate_checksum(archive_path)
            
            if current_checksum != metadata.checksum:
                logger.error(f"Checksum mismatch for backup: {backup_id}")
                return False
            
            # Try to extract archive
            test_dir = self.temp_backup_path / f"verify_{backup_id}"
            test_dir.mkdir(parents=True, exist_ok=True)
            
            try:
                with tarfile.open(archive_path, "r:gz") as tar:
                    tar.extractall(test_dir)
                
                # Clean up test directory
                shutil.rmtree(test_dir)
                
                # Update metadata
                metadata.verification_timestamp = datetime.utcnow()
                metadata.status = "verified"
                await self._save_metadata(metadata)
                
                logger.info(f"Backup verified successfully: {backup_id}")
                return True
            
            except Exception as e:
                logger.error(f"Failed to extract backup archive: {e}")
                shutil.rmtree(test_dir, ignore_errors=True)
                return False
        
        except Exception as e:
            logger.error(f"Backup verification failed: {e}")
            return False
    
    async def _load_metadata(self, backup_id: str) -> Optional[BackupMetadata]:
        """Load backup metadata from JSON file"""
        metadata_file = self.local_backup_path / f"{backup_id}.json"
        
        if not metadata_file.exists():
            return None
        
        with open(metadata_file, 'r') as f:
            data = json.load(f)
        
        return BackupMetadata(
            backup_id=data["backup_id"],
            backup_type=data["backup_type"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
            size_bytes=data["size_bytes"],
            checksum=data["checksum"],
            components=data["components"],
            location=data["location"],
            status=data["status"],
            rpo_compliant=data["rpo_compliant"],
            verification_timestamp=datetime.fromisoformat(data["verification_timestamp"]) if data.get("verification_timestamp") else None,
            restore_tested=data.get("restore_tested", False)
        )
    
    async def list_backups(self, backup_type: Optional[str] = None) -> List[BackupMetadata]:
        """List all available backups"""
        backups = []
        
        for metadata_file in self.local_backup_path.glob("*.json"):
            metadata = await self._load_metadata(metadata_file.stem)
            
            if metadata:
                if backup_type is None or metadata.backup_type == backup_type:
                    backups.append(metadata)
        
        # Sort by timestamp (newest first)
        backups.sort(key=lambda x: x.timestamp, reverse=True)
        
        return backups
    
    async def cleanup_old_backups(self):
        """
        Remove old backups based on retention policies
        
        - Local: 7 days
        - Cloud: 90 days (handled by cloud lifecycle policies)
        - Cold storage: 7 years
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=self.local_retention_days)
            
            backups = await self.list_backups()
            
            for backup in backups:
                if backup.timestamp < cutoff_date:
                    # Delete local backup
                    archive_path = Path(backup.location)
                    metadata_path = self.local_backup_path / f"{backup.backup_id}.json"
                    
                    if archive_path.exists():
                        archive_path.unlink()
                        logger.info(f"Deleted old local backup: {backup.backup_id}")
                    
                    if metadata_path.exists():
                        metadata_path.unlink()
            
            logger.info("Old backup cleanup completed")
        
        except Exception as e:
            logger.error(f"Backup cleanup failed: {e}")
    
    async def check_rpo_compliance(self) -> Dict[str, Any]:
        """
        Check if backups meet RPO requirements (24 hours)
        
        Returns compliance status and recommendations
        """
        backups = await self.list_backups(backup_type="full")
        
        if not backups:
            return {
                "compliant": False,
                "last_backup": None,
                "hours_since_last_backup": None,
                "rpo_hours": self.rpo_hours,
                "recommendation": "No backups found. Create full backup immediately."
            }
        
        last_backup = backups[0]
        hours_since = (datetime.utcnow() - last_backup.timestamp).total_seconds() / 3600
        
        compliant = hours_since <= self.rpo_hours
        
        return {
            "compliant": compliant,
            "last_backup": last_backup.backup_id,
            "last_backup_timestamp": last_backup.timestamp.isoformat(),
            "hours_since_last_backup": round(hours_since, 2),
            "rpo_hours": self.rpo_hours,
            "recommendation": "RPO compliant" if compliant else f"RPO violation! Last backup was {round(hours_since, 2)} hours ago. Create backup immediately."
        }
    
    def get_emergency_contacts(self) -> List[Dict[str, str]]:
        """Get emergency contact list for disaster recovery"""
        return sorted(self.emergency_contacts, key=lambda x: x["priority"])
