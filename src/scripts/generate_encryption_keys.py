"""
Generate encryption keys for the application

Run with: python -m src.scripts.generate_encryption_keys
"""
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from src.services.encryption_service import EncryptionService
from src.services.file_encryption_service import FileEncryptionService


def main():
    """Generate and display encryption keys"""
    
    print("\n" + "=" * 80)
    print("Encryption Key Generator")
    print("=" * 80)
    print("\nThis script generates encryption keys for your application.")
    print("Store these keys securely in your environment variables or secrets manager.")
    print("\nWARNING: If you lose these keys, encrypted data cannot be recovered!")
    print("=" * 80 + "\n")
    
    # Generate data encryption key (Fernet - for text/PII)
    data_key = EncryptionService.generate_key()
    print("1. DATA ENCRYPTION KEY (for PII fields):")
    print(f"   ENCRYPTION_KEY={data_key}")
    print(f"   Length: {len(data_key)} characters")
    print()
    
    # Generate file encryption key (AES-256 - for files)
    file_key = FileEncryptionService.generate_key()
    print("2. FILE ENCRYPTION KEY (for resume files):")
    print(f"   FILE_ENCRYPTION_KEY={file_key}")
    print(f"   Length: {len(file_key)} characters (hex)")
    print()
    
    # Generate Redis password
    import secrets
    redis_password = secrets.token_urlsafe(32)
    print("3. REDIS PASSWORD:")
    print(f"   REDIS_PASSWORD={redis_password}")
    print()
    
    # Generate JWT secret (if needed)
    jwt_secret = secrets.token_urlsafe(64)
    print("4. JWT SECRET KEY (if not already set):")
    print(f"   JWT_SECRET_KEY={jwt_secret}")
    print()
    
    print("=" * 80)
    print("\nNext Steps:")
    print("1. Add these keys to your .env file or environment variables")
    print("2. NEVER commit these keys to version control")
    print("3. Store backup copies in a secure location (password manager, vault, etc.)")
    print("4. Rotate keys periodically for enhanced security")
    print("5. Run database migration: alembic upgrade head")
    print("6. Run data encryption: python -m src.scripts.encrypt_existing_data")
    print("7. Run file encryption: python -m src.scripts.encrypt_existing_files")
    print("=" * 80 + "\n")
    
    # Offer to save to file
    save_response = input("Do you want to save these keys to a file? (yes/no): ")
    
    if save_response.lower() == 'yes':
        filename = input("Enter filename (default: encryption_keys.txt): ").strip()
        if not filename:
            filename = "encryption_keys.txt"
        
        with open(filename, 'w') as f:
            f.write("# ENCRYPTION KEYS - KEEP SECURE!\n")
            f.write(f"# Generated: {Path(__file__).name}\n\n")
            f.write(f"ENCRYPTION_KEY={data_key}\n")
            f.write(f"FILE_ENCRYPTION_KEY={file_key}\n")
            f.write(f"REDIS_PASSWORD={redis_password}\n")
            f.write(f"JWT_SECRET_KEY={jwt_secret}\n")
        
        print(f"\nKeys saved to: {filename}")
        print("WARNING: Delete this file after copying keys to secure storage!")


if __name__ == "__main__":
    main()
