"""File encryption service for resume and document storage"""
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
import os
import logging
from typing import Optional
from pathlib import Path

logger = logging.getLogger(__name__)


class FileEncryptionService:
    """AES-256-CBC encryption service for files"""
    
    def __init__(self, encryption_key: Optional[bytes] = None):
        """
        Initialize file encryption service
        
        Args:
            encryption_key: 32-byte encryption key for AES-256. If None, uses environment variable
        """
        if encryption_key is None:
            key_str = os.getenv("FILE_ENCRYPTION_KEY")
            if not key_str:
                raise ValueError(
                    "File encryption key not provided. Set FILE_ENCRYPTION_KEY environment variable "
                    "or generate one using FileEncryptionService.generate_key()"
                )
            encryption_key = bytes.fromhex(key_str)
        
        if len(encryption_key) != 32:
            raise ValueError("Encryption key must be 32 bytes for AES-256")
        
        self.key = encryption_key
    
    @staticmethod
    def generate_key() -> str:
        """
        Generate a new 256-bit encryption key
        
        Returns:
            Hex-encoded encryption key
        """
        return os.urandom(32).hex()
    
    def encrypt_file(self, input_path: str, output_path: Optional[str] = None) -> str:
        """
        Encrypt a file using AES-256-CBC
        
        Args:
            input_path: Path to file to encrypt
            output_path: Path to save encrypted file (defaults to input_path + '.enc')
            
        Returns:
            Path to encrypted file
        """
        if output_path is None:
            output_path = f"{input_path}.enc"
        
        try:
            # Generate random IV
            iv = os.urandom(16)
            
            # Create cipher
            cipher = Cipher(
                algorithms.AES(self.key),
                modes.CBC(iv),
                backend=default_backend()
            )
            encryptor = cipher.encryptor()
            
            # Read input file
            with open(input_path, 'rb') as f:
                plaintext = f.read()
            
            # Apply PKCS7 padding
            padder = padding.PKCS7(128).padder()
            padded_data = padder.update(plaintext) + padder.finalize()
            
            # Encrypt
            ciphertext = encryptor.update(padded_data) + encryptor.finalize()
            
            # Write IV + ciphertext to output file
            with open(output_path, 'wb') as f:
                f.write(iv)
                f.write(ciphertext)
            
            logger.info(f"File encrypted: {input_path} -> {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"File encryption failed: {e}")
            raise
    
    def decrypt_file(self, input_path: str, output_path: Optional[str] = None) -> str:
        """
        Decrypt a file encrypted with AES-256-CBC
        
        Args:
            input_path: Path to encrypted file
            output_path: Path to save decrypted file
            
        Returns:
            Path to decrypted file
        """
        if output_path is None:
            if input_path.endswith('.enc'):
                output_path = input_path[:-4]
            else:
                output_path = f"{input_path}.dec"
        
        try:
            # Read encrypted file
            with open(input_path, 'rb') as f:
                iv = f.read(16)
                ciphertext = f.read()
            
            # Create cipher
            cipher = Cipher(
                algorithms.AES(self.key),
                modes.CBC(iv),
                backend=default_backend()
            )
            decryptor = cipher.decryptor()
            
            # Decrypt
            padded_data = decryptor.update(ciphertext) + decryptor.finalize()
            
            # Remove PKCS7 padding
            unpadder = padding.PKCS7(128).unpadder()
            plaintext = unpadder.update(padded_data) + unpadder.finalize()
            
            # Write decrypted file
            with open(output_path, 'wb') as f:
                f.write(plaintext)
            
            logger.info(f"File decrypted: {input_path} -> {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"File decryption failed: {e}")
            raise
    
    def encrypt_file_in_place(self, file_path: str, delete_original: bool = True) -> str:
        """
        Encrypt a file and optionally delete the original
        
        Args:
            file_path: Path to file to encrypt
            delete_original: Whether to delete the original unencrypted file
            
        Returns:
            Path to encrypted file
        """
        encrypted_path = self.encrypt_file(file_path)
        
        if delete_original:
            try:
                os.remove(file_path)
                logger.info(f"Original file deleted: {file_path}")
            except Exception as e:
                logger.warning(f"Failed to delete original file: {e}")
        
        return encrypted_path
    
    def decrypt_file_in_place(self, encrypted_path: str, delete_encrypted: bool = False) -> str:
        """
        Decrypt a file and optionally delete the encrypted version
        
        Args:
            encrypted_path: Path to encrypted file
            delete_encrypted: Whether to delete the encrypted file
            
        Returns:
            Path to decrypted file
        """
        decrypted_path = self.decrypt_file(encrypted_path)
        
        if delete_encrypted:
            try:
                os.remove(encrypted_path)
                logger.info(f"Encrypted file deleted: {encrypted_path}")
            except Exception as e:
                logger.warning(f"Failed to delete encrypted file: {e}")
        
        return decrypted_path


class SecureFileStorage:
    """Secure file storage with automatic encryption"""
    
    def __init__(self, base_path: str, encryption_service: FileEncryptionService):
        """
        Initialize secure file storage
        
        Args:
            base_path: Base directory for file storage
            encryption_service: File encryption service instance
        """
        self.base_path = Path(base_path)
        self.encryption = encryption_service
        self.base_path.mkdir(parents=True, exist_ok=True)
    
    def save_file(self, file_data: bytes, filename: str, encrypt: bool = True) -> str:
        """
        Save file with optional encryption
        
        Args:
            file_data: File data to save
            filename: Filename to use
            encrypt: Whether to encrypt the file
            
        Returns:
            Relative path to saved file
        """
        file_path = self.base_path / filename
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write file
        with open(file_path, 'wb') as f:
            f.write(file_data)
        
        # Encrypt if requested
        if encrypt:
            encrypted_path = self.encryption.encrypt_file_in_place(str(file_path), delete_original=True)
            return str(Path(encrypted_path).relative_to(self.base_path))
        
        return str(file_path.relative_to(self.base_path))
    
    def read_file(self, relative_path: str, encrypted: bool = True) -> bytes:
        """
        Read file with optional decryption
        
        Args:
            relative_path: Relative path to file
            encrypted: Whether the file is encrypted
            
        Returns:
            File data
        """
        file_path = self.base_path / relative_path
        
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {relative_path}")
        
        if encrypted:
            # Decrypt to temporary file
            temp_path = str(file_path) + ".tmp"
            self.encryption.decrypt_file(str(file_path), temp_path)
            
            try:
                with open(temp_path, 'rb') as f:
                    data = f.read()
            finally:
                # Clean up temporary file
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            
            return data
        else:
            with open(file_path, 'rb') as f:
                return f.read()
    
    def delete_file(self, relative_path: str) -> None:
        """
        Delete file
        
        Args:
            relative_path: Relative path to file
        """
        file_path = self.base_path / relative_path
        
        if file_path.exists():
            os.remove(file_path)
            logger.info(f"File deleted: {relative_path}")


# Global file encryption service instance
_file_encryption_service: Optional[FileEncryptionService] = None


def get_file_encryption_service() -> FileEncryptionService:
    """Get global file encryption service instance"""
    global _file_encryption_service
    
    if _file_encryption_service is None:
        _file_encryption_service = FileEncryptionService()
    
    return _file_encryption_service
