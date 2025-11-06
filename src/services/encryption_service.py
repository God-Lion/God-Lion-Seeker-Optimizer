"""Encryption service for PII data protection"""
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
import base64
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class EncryptionService:
    """AES-256 encryption service for sensitive data"""
    
    def __init__(self, encryption_key: Optional[str] = None):
        """
        Initialize encryption service
        
        Args:
            encryption_key: Base64-encoded encryption key. If None, uses environment variable
        """
        if encryption_key is None:
            encryption_key = os.getenv("ENCRYPTION_KEY")
            
        if not encryption_key:
            raise ValueError(
                "Encryption key not provided. Set ENCRYPTION_KEY environment variable "
                "or generate one using EncryptionService.generate_key()"
            )
        
        try:
            # Validate and load the key
            self.cipher = Fernet(encryption_key.encode() if isinstance(encryption_key, str) else encryption_key)
        except Exception as e:
            logger.error(f"Failed to initialize encryption service: {e}")
            raise ValueError("Invalid encryption key format")
    
    @staticmethod
    def generate_key() -> str:
        """
        Generate a new encryption key
        
        Returns:
            Base64-encoded encryption key (AES-256)
        """
        return Fernet.generate_key().decode()
    
    @staticmethod
    def derive_key_from_password(password: str, salt: Optional[bytes] = None) -> tuple[str, bytes]:
        """
        Derive an encryption key from a password using PBKDF2
        
        Args:
            password: Password to derive key from
            salt: Optional salt (generates new one if None)
            
        Returns:
            Tuple of (base64-encoded key, salt)
        """
        if salt is None:
            salt = os.urandom(16)
        
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key.decode(), salt
    
    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt plaintext string
        
        Args:
            plaintext: String to encrypt
            
        Returns:
            Base64-encoded encrypted string
        """
        if not plaintext:
            return plaintext
        
        try:
            encrypted = self.cipher.encrypt(plaintext.encode())
            return base64.urlsafe_b64encode(encrypted).decode()
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise
    
    def decrypt(self, ciphertext: str) -> str:
        """
        Decrypt ciphertext string
        
        Args:
            ciphertext: Base64-encoded encrypted string
            
        Returns:
            Decrypted plaintext string
        """
        if not ciphertext:
            return ciphertext
        
        try:
            encrypted = base64.urlsafe_b64decode(ciphertext.encode())
            decrypted = self.cipher.decrypt(encrypted)
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise
    
    def encrypt_dict(self, data: dict, fields: list[str]) -> dict:
        """
        Encrypt specific fields in a dictionary
        
        Args:
            data: Dictionary containing data
            fields: List of field names to encrypt
            
        Returns:
            Dictionary with encrypted fields
        """
        encrypted_data = data.copy()
        
        for field in fields:
            if field in encrypted_data and encrypted_data[field]:
                encrypted_data[field] = self.encrypt(str(encrypted_data[field]))
        
        return encrypted_data
    
    def decrypt_dict(self, data: dict, fields: list[str]) -> dict:
        """
        Decrypt specific fields in a dictionary
        
        Args:
            data: Dictionary containing encrypted data
            fields: List of field names to decrypt
            
        Returns:
            Dictionary with decrypted fields
        """
        decrypted_data = data.copy()
        
        for field in fields:
            if field in decrypted_data and decrypted_data[field]:
                try:
                    decrypted_data[field] = self.decrypt(decrypted_data[field])
                except Exception as e:
                    logger.warning(f"Failed to decrypt field {field}: {e}")
                    # Keep encrypted value if decryption fails
        
        return decrypted_data


class PIIEncryptionService:
    """Service for encrypting PII fields in database models"""
    
    # Define PII fields for each model
    USER_PII_FIELDS = [
        'email',
        'first_name',
        'last_name',
        'google_id'
    ]
    
    RESUME_PII_FIELDS = [
        'resume_text',
        'parsed_data'
    ]
    
    SECURITY_LOG_PII_FIELDS = [
        'ip_address',
        'user_agent',
        'location'
    ]
    
    APPLICATION_PII_FIELDS = [
        'cover_letter'
    ]
    
    def __init__(self, encryption_service: EncryptionService):
        """
        Initialize PII encryption service
        
        Args:
            encryption_service: Encryption service instance
        """
        self.encryption = encryption_service
    
    def encrypt_user_pii(self, user_data: dict) -> dict:
        """Encrypt PII fields in user data"""
        return self.encryption.encrypt_dict(user_data, self.USER_PII_FIELDS)
    
    def decrypt_user_pii(self, user_data: dict) -> dict:
        """Decrypt PII fields in user data"""
        return self.encryption.decrypt_dict(user_data, self.USER_PII_FIELDS)
    
    def encrypt_resume_pii(self, resume_data: dict) -> dict:
        """Encrypt PII fields in resume data"""
        return self.encryption.encrypt_dict(resume_data, self.RESUME_PII_FIELDS)
    
    def decrypt_resume_pii(self, resume_data: dict) -> dict:
        """Decrypt PII fields in resume data"""
        return self.encryption.decrypt_dict(resume_data, self.RESUME_PII_FIELDS)
    
    def encrypt_security_log_pii(self, log_data: dict) -> dict:
        """Encrypt PII fields in security log data"""
        return self.encryption.encrypt_dict(log_data, self.SECURITY_LOG_PII_FIELDS)
    
    def decrypt_security_log_pii(self, log_data: dict) -> dict:
        """Decrypt PII fields in security log data"""
        return self.encryption.decrypt_dict(log_data, self.SECURITY_LOG_PII_FIELDS)
    
    def encrypt_application_pii(self, app_data: dict) -> dict:
        """Encrypt PII fields in application data"""
        return self.encryption.encrypt_dict(app_data, self.APPLICATION_PII_FIELDS)
    
    def decrypt_application_pii(self, app_data: dict) -> dict:
        """Decrypt PII fields in application data"""
        return self.encryption.decrypt_dict(app_data, self.APPLICATION_PII_FIELDS)


# Global encryption service instance
_encryption_service: Optional[EncryptionService] = None
_pii_encryption_service: Optional[PIIEncryptionService] = None


def get_encryption_service() -> EncryptionService:
    """Get global encryption service instance"""
    global _encryption_service
    
    if _encryption_service is None:
        _encryption_service = EncryptionService()
    
    return _encryption_service


def get_pii_encryption_service() -> PIIEncryptionService:
    """Get global PII encryption service instance"""
    global _pii_encryption_service
    
    if _pii_encryption_service is None:
        encryption_service = get_encryption_service()
        _pii_encryption_service = PIIEncryptionService(encryption_service)
    
    return _pii_encryption_service
