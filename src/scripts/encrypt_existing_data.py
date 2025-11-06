"""
Script to encrypt existing PII data in the database

This script should be run after the encryption migration to encrypt all existing PII data.
Run with: python -m src.scripts.encrypt_existing_data
"""
import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

import asyncio
import logging
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from src.config.database import get_session
from src.models.user import User, ResumeProfile, SecurityLog
from src.services.encryption_service import get_encryption_service
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DataEncryptionMigrator:
    """Migrate existing PII data to encrypted format"""
    
    def __init__(self):
        """Initialize encryption migrator"""
        self.encryption = get_encryption_service()
        self.encryption_version = "v1.0"
    
    async def encrypt_users(self, session: AsyncSession) -> int:
        """
        Encrypt PII fields in users table
        
        Returns:
            Number of users encrypted
        """
        logger.info("Encrypting user data...")
        
        # Get all users that are not yet encrypted
        result = await session.execute(
            select(User).where(User.is_encrypted == False)
        )
        users = result.scalars().all()
        
        encrypted_count = 0
        
        for user in users:
            try:
                # Encrypt PII fields
                if user.email:
                    user.email = self.encryption.encrypt(user.email)
                
                if user.first_name:
                    user.first_name = self.encryption.encrypt(user.first_name)
                
                if user.last_name:
                    user.last_name = self.encryption.encrypt(user.last_name)
                
                if user.google_id:
                    user.google_id = self.encryption.encrypt(user.google_id)
                
                # Mark as encrypted
                user.is_encrypted = True
                user.encryption_version = self.encryption_version
                
                encrypted_count += 1
                
                if encrypted_count % 100 == 0:
                    logger.info(f"Encrypted {encrypted_count} users...")
                    await session.commit()
            
            except Exception as e:
                logger.error(f"Failed to encrypt user {user.id}: {e}")
                await session.rollback()
                continue
        
        await session.commit()
        logger.info(f"Encrypted {encrypted_count} users total")
        
        return encrypted_count
    
    async def encrypt_resume_profiles(self, session: AsyncSession) -> int:
        """
        Encrypt PII fields in resume_profiles table
        
        Returns:
            Number of profiles encrypted
        """
        logger.info("Encrypting resume profile data...")
        
        # Get all profiles that are not yet encrypted
        result = await session.execute(
            select(ResumeProfile).where(ResumeProfile.is_encrypted == False)
        )
        profiles = result.scalars().all()
        
        encrypted_count = 0
        
        for profile in profiles:
            try:
                # Encrypt resume text
                if profile.resume_text:
                    profile.resume_text = self.encryption.encrypt(profile.resume_text)
                
                # Note: parsed_data is JSON and might be too large to encrypt as a whole
                # Consider encrypting specific sensitive fields within the JSON
                
                # Mark as encrypted
                profile.is_encrypted = True
                profile.encryption_version = self.encryption_version
                
                encrypted_count += 1
                
                if encrypted_count % 50 == 0:
                    logger.info(f"Encrypted {encrypted_count} resume profiles...")
                    await session.commit()
            
            except Exception as e:
                logger.error(f"Failed to encrypt resume profile {profile.id}: {e}")
                await session.rollback()
                continue
        
        await session.commit()
        logger.info(f"Encrypted {encrypted_count} resume profiles total")
        
        return encrypted_count
    
    async def encrypt_security_logs(self, session: AsyncSession) -> int:
        """
        Encrypt PII fields in security_logs table
        
        Returns:
            Number of logs encrypted
        """
        logger.info("Encrypting security log data...")
        
        # Get all logs that are not yet encrypted
        result = await session.execute(
            select(SecurityLog).where(SecurityLog.is_encrypted == False)
        )
        logs = result.scalars().all()
        
        encrypted_count = 0
        
        for log in logs:
            try:
                # Encrypt PII fields
                if log.ip_address:
                    log.ip_address = self.encryption.encrypt(log.ip_address)
                
                if log.user_agent:
                    log.user_agent = self.encryption.encrypt(log.user_agent)
                
                if log.location:
                    log.location = self.encryption.encrypt(log.location)
                
                # Mark as encrypted
                log.is_encrypted = True
                log.encryption_version = self.encryption_version
                
                encrypted_count += 1
                
                if encrypted_count % 200 == 0:
                    logger.info(f"Encrypted {encrypted_count} security logs...")
                    await session.commit()
            
            except Exception as e:
                logger.error(f"Failed to encrypt security log {log.id}: {e}")
                await session.rollback()
                continue
        
        await session.commit()
        logger.info(f"Encrypted {encrypted_count} security logs total")
        
        return encrypted_count
    
    async def run(self) -> None:
        """Run the encryption migration"""
        logger.info("Starting PII data encryption migration...")
        logger.info(f"Encryption version: {self.encryption_version}")
        
        start_time = datetime.now()
        
        async with get_session() as session:
            # Encrypt users
            user_count = await self.encrypt_users(session)
            
            # Encrypt resume profiles
            profile_count = await self.encrypt_resume_profiles(session)
            
            # Encrypt security logs
            log_count = await self.encrypt_security_logs(session)
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        logger.info("=" * 80)
        logger.info("Encryption migration completed!")
        logger.info(f"Users encrypted: {user_count}")
        logger.info(f"Resume profiles encrypted: {profile_count}")
        logger.info(f"Security logs encrypted: {log_count}")
        logger.info(f"Total time: {duration:.2f} seconds")
        logger.info("=" * 80)


async def main():
    """Main entry point"""
    # Check if encryption key is set
    encryption_key = os.getenv("ENCRYPTION_KEY")
    if not encryption_key:
        logger.error("ENCRYPTION_KEY environment variable not set!")
        logger.error("Generate a key using: python -m src.scripts.generate_encryption_keys")
        sys.exit(1)
    
    # Confirm before running
    print("\n" + "=" * 80)
    print("WARNING: This script will encrypt all existing PII data in the database.")
    print("This is a one-way operation. Make sure you have:")
    print("  1. Backed up your database")
    print("  2. Tested the encryption service")
    print("  3. Saved your encryption keys securely")
    print("=" * 80)
    
    response = input("\nDo you want to continue? (yes/no): ")
    
    if response.lower() != 'yes':
        logger.info("Encryption migration cancelled")
        sys.exit(0)
    
    # Run migration
    migrator = DataEncryptionMigrator()
    await migrator.run()


if __name__ == "__main__":
    asyncio.run(main())
