"""
Encrypt existing resume files

This script encrypts all resume files in the uploads directory.
Run with: python -m src.scripts.encrypt_existing_files
"""
import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

import asyncio
import logging
from sqlalchemy import select
from src.config.database import get_session
from src.models.user import ResumeProfile
from src.services.file_encryption_service import get_file_encryption_service
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FileEncryptionMigrator:
    """Migrate existing resume files to encrypted format"""
    
    def __init__(self, base_path: str = "uploads"):
        """
        Initialize file encryption migrator
        
        Args:
            base_path: Base upload directory path
        """
        self.base_path = Path(base_path)
        self.encryption = get_file_encryption_service()
    
    def encrypt_file(self, file_path: Path) -> bool:
        """
        Encrypt a single file
        
        Args:
            file_path: Path to file to encrypt
            
        Returns:
            True if successful
        """
        try:
            # Skip if already encrypted
            if file_path.suffix == '.enc':
                return False
            
            # Encrypt file
            encrypted_path = self.encryption.encrypt_file_in_place(
                str(file_path),
                delete_original=True
            )
            
            logger.info(f"Encrypted: {file_path} -> {encrypted_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to encrypt {file_path}: {e}")
            return False
    
    async def update_database_paths(self, session) -> int:
        """
        Update resume file paths in database to point to encrypted files
        
        Args:
            session: Database session
            
        Returns:
            Number of records updated
        """
        logger.info("Updating database file paths...")
        
        result = await session.execute(select(ResumeProfile))
        profiles = result.scalars().all()
        
        updated_count = 0
        
        for profile in profiles:
            if profile.resume_file_url and not profile.resume_file_url.endswith('.enc'):
                # Update path to encrypted file
                profile.resume_file_url = f"{profile.resume_file_url}.enc"
                updated_count += 1
        
        await session.commit()
        
        logger.info(f"Updated {updated_count} database records")
        return updated_count
    
    def scan_and_encrypt(self) -> dict:
        """
        Scan upload directory and encrypt all files
        
        Returns:
            Dictionary with encryption statistics
        """
        stats = {
            'total_files': 0,
            'encrypted': 0,
            'skipped': 0,
            'failed': 0
        }
        
        if not self.base_path.exists():
            logger.warning(f"Upload directory not found: {self.base_path}")
            return stats
        
        # Find all resume files
        for file_path in self.base_path.rglob('*'):
            if file_path.is_file():
                stats['total_files'] += 1
                
                # Skip already encrypted files
                if file_path.suffix == '.enc':
                    stats['skipped'] += 1
                    continue
                
                # Encrypt file
                if self.encrypt_file(file_path):
                    stats['encrypted'] += 1
                else:
                    stats['failed'] += 1
        
        return stats
    
    async def run(self) -> None:
        """Run the file encryption migration"""
        logger.info("Starting file encryption migration...")
        logger.info(f"Base path: {self.base_path.absolute()}")
        
        start_time = datetime.now()
        
        # Encrypt files
        stats = self.scan_and_encrypt()
        
        # Update database
        async with get_session() as session:
            db_updated = await self.update_database_paths(session)
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        logger.info("=" * 80)
        logger.info("File encryption migration completed!")
        logger.info(f"Total files found: {stats['total_files']}")
        logger.info(f"Files encrypted: {stats['encrypted']}")
        logger.info(f"Files skipped: {stats['skipped']}")
        logger.info(f"Files failed: {stats['failed']}")
        logger.info(f"Database records updated: {db_updated}")
        logger.info(f"Total time: {duration:.2f} seconds")
        logger.info("=" * 80)


async def main():
    """Main entry point"""
    # Check if file encryption key is set
    file_key = os.getenv("FILE_ENCRYPTION_KEY")
    if not file_key:
        logger.error("FILE_ENCRYPTION_KEY environment variable not set!")
        logger.error("Generate a key using: python -m src.scripts.generate_encryption_keys")
        sys.exit(1)
    
    # Confirm before running
    print("\n" + "=" * 80)
    print("WARNING: This script will encrypt all resume files in the uploads directory.")
    print("This is a one-way operation. Make sure you have:")
    print("  1. Backed up your files")
    print("  2. Tested the file encryption service")
    print("  3. Saved your encryption keys securely")
    print("=" * 80)
    
    response = input("\nDo you want to continue? (yes/no): ")
    
    if response.lower() != 'yes':
        logger.info("File encryption migration cancelled")
        sys.exit(0)
    
    # Run migration
    migrator = FileEncryptionMigrator()
    await migrator.run()


if __name__ == "__main__":
    asyncio.run(main())
