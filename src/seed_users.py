"""
Database Seeding Script - Create Initial Users
Creates a regular user and an admin user for testing
"""
import sys
from pathlib import Path
from datetime import datetime, timezone

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy.orm import Session
import bcrypt

from src.config.database import get_sync_session
from src.models.user import User, UserRole, UserStatus


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    # Encode password to bytes and hash it
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    # Return as string for database storage
    return hashed.decode('utf-8')


def create_users(db: Session):
    """Create seed users"""
    
    print("=" * 60)
    print("Creating Seed Users")
    print("=" * 60)
    
    # Check if users already exist
    existing_user = db.query(User).filter(User.email == "user@example.com").first()
    existing_admin = db.query(User).filter(User.email == "admin@example.com").first()
    
    if existing_user:
        print("⚠️  Regular user already exists: user@example.com")
    else:
        # Create regular user
        now = datetime.now(timezone.utc)
        regular_user = User(
            email="user@example.com",
            first_name="Regular",
            last_name="User",
            hashed_password=hash_password("password123"),
            role=UserRole.BASIC_USER,
            status=UserStatus.ACTIVE,
            email_verified=True,
            last_login=now,
            last_activity=now
        )
        db.add(regular_user)
        print("✅ Created regular user:")
        print(f"   Email: user@example.com")
        print(f"   Password: password123")
        print(f"   Role: BASIC_USER")
    
    if existing_admin:
        print("⚠️  Admin user already exists: admin@example.com")
    else:
        # Create admin user
        now = datetime.now(timezone.utc)
        admin_user = User(
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
            hashed_password=hash_password("admin123"),
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            email_verified=True,
            last_login=now,
            last_activity=now
        )
        db.add(admin_user)
        print("✅ Created admin user:")
        print(f"   Email: admin@example.com")
        print(f"   Password: admin123")
        print(f"   Role: ADMIN")
    
    # Commit changes
    try:
        db.commit()
        print("\n" + "=" * 60)
        print("✅ Users created successfully!")
        print("=" * 60)
        print("\nYou can now login with:")
        print("\n📧 Regular User:")
        print("   Email: user@example.com")
        print("   Password: password123")
        print("\n👑 Admin User:")
        print("   Email: admin@example.com")
        print("   Password: admin123")
        print("\n🌐 API Docs: http://localhost:8000/api/docs")
        print("=" * 60)
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error creating users: {e}")
        raise


def main():
    """Main function"""
    print("\n🌱 Starting user seeding process...\n")
    
    # Create database session
    db = get_sync_session()
    
    try:
        create_users(db)
    except Exception as e:
        print(f"\n❌ Seeding failed: {e}")
        sys.exit(1)
    finally:
        db.close()
    
    print("\n✅ Seeding completed successfully!\n")


if __name__ == "__main__":
    main()
