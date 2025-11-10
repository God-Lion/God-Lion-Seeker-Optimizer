# User Account Management Enhancement

## Overview
This document describes the new password management and account deactivation features added to the User model.

## New Fields Added

### Password Management
- **`password_changed_at`** (`DateTime`, nullable)
  - Tracks the timestamp of the last password change
  - Used for enforcing password rotation policies
  - Can be used to force password resets after a certain period

### Account Deactivation
- **`deactivated_at`** (`DateTime`, nullable)
  - Timestamp when the account was deactivated
  - `NULL` means the account is active
  - Non-null value indicates deactivated status

- **`deactivation_reason`** (`String(500)`, nullable)
  - Predefined reason for account deactivation
  - Examples: "User request", "Security concern", "Inactive account"
  - Limited to 500 characters

- **`deactivation_feedback`** (`Text`, nullable)
  - Additional free-form feedback from the user
  - Can contain detailed explanation or suggestions
  - Useful for understanding user churn reasons

## Database Migration

### Running the Migration

```bash
# Navigate to your project directory
cd "E:\AI Point\Automated search job project\God Lion Seeker Optimizer"

# Activate virtual environment (if using one)
venv\Scripts\activate

# Run the migration
cd src
alembic upgrade head
```

### Migration Details
- **Revision ID**: `20251109_pwd_deact`
- **Down Revision**: `auth_enhancements_001_add_auth_features`
- **Migration File**: `20251109_add_password_and_deactivation_fields.py`

The migration adds:
1. Four new columns to the `users` table
2. One index on `deactivated_at` for efficient querying

### Rollback (if needed)
```bash
alembic downgrade -1
```

## Model Methods

### New Methods Added to User Model

#### `is_deactivated()`
```python
def is_deactivated(self) -> bool:
    """Check if account is deactivated"""
    return self.deactivated_at is not None
```

#### `deactivate_account(reason, feedback)`
```python
def deactivate_account(self, reason: str = None, feedback: str = None):
    """Deactivate user account"""
    self.deactivated_at = datetime.utcnow()
    self.deactivation_reason = reason
    self.deactivation_feedback = feedback
    self.status = UserStatus.SUSPENDED
```

#### `reactivate_account()`
```python
def reactivate_account(self):
    """Reactivate user account"""
    self.deactivated_at = None
    self.deactivation_reason = None
    self.deactivation_feedback = None
    self.status = UserStatus.ACTIVE
```

### Updated Methods

#### `can_login()`
Now checks if the account is deactivated:
```python
def can_login(self):
    """Check if user can login"""
    if not self.is_active():
        return False
    if self.account_locked_until and self.account_locked_until > datetime.utcnow():
        return False
    # NEW: Check if account is deactivated
    if self.deactivated_at is not None:
        return False
    return True
```

## Usage Examples

### Example 1: Tracking Password Changes

```python
from datetime import datetime
from sqlalchemy.orm import Session
from src.models.user import User

def change_user_password(db: Session, user_id: int, new_password: str):
    """Change user password and track the change"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise ValueError("User not found")
    
    # Hash the password (use your password hashing function)
    user.hashed_password = hash_password(new_password)
    
    # Track password change timestamp
    user.password_changed_at = datetime.utcnow()
    
    db.commit()
    return user
```

### Example 2: Deactivating an Account

```python
from sqlalchemy.orm import Session
from src.models.user import User

def deactivate_user_account(
    db: Session, 
    user_id: int, 
    reason: str = None, 
    feedback: str = None
):
    """Deactivate a user account"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise ValueError("User not found")
    
    # Deactivate the account
    user.deactivate_account(
        reason=reason or "User request",
        feedback=feedback
    )
    
    db.commit()
    return user

# Usage
deactivate_user_account(
    db=db,
    user_id=123,
    reason="Account closure requested by user",
    feedback="Found a better job through another platform"
)
```

### Example 3: Reactivating an Account

```python
from sqlalchemy.orm import Session
from src.models.user import User

def reactivate_user_account(db: Session, user_id: int):
    """Reactivate a previously deactivated account"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise ValueError("User not found")
    
    if not user.is_deactivated():
        raise ValueError("Account is not deactivated")
    
    # Reactivate the account
    user.reactivate_account()
    
    db.commit()
    return user
```

### Example 4: Enforcing Password Rotation Policy

```python
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from src.models.user import User

def check_password_age(db: Session, user_id: int, max_days: int = 90):
    """Check if password needs to be changed based on age"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.password_changed_at:
        return True  # Force password change if never changed
    
    password_age = datetime.utcnow() - user.password_changed_at
    
    if password_age.days > max_days:
        return True  # Password too old
    
    return False  # Password is still valid

def force_password_reset_if_needed(db: Session, user_id: int):
    """Force password reset if password is too old"""
    if check_password_age(db, user_id):
        user = db.query(User).filter(User.id == user_id).first()
        # Set password reset token and send email
        user.password_reset_token = generate_reset_token()
        user.password_reset_expires = datetime.utcnow() + timedelta(hours=24)
        db.commit()
        send_password_reset_email(user)
```

### Example 5: Querying Deactivated Accounts

```python
from sqlalchemy.orm import Session
from src.models.user import User

def get_deactivated_accounts(db: Session, days_ago: int = 30):
    """Get accounts deactivated in the last N days"""
    cutoff_date = datetime.utcnow() - timedelta(days=days_ago)
    
    deactivated_users = db.query(User).filter(
        User.deactivated_at.isnot(None),
        User.deactivated_at >= cutoff_date
    ).all()
    
    return deactivated_users

def get_deactivation_statistics(db: Session):
    """Get deactivation statistics"""
    from sqlalchemy import func
    
    stats = db.query(
        User.deactivation_reason,
        func.count(User.id).label('count')
    ).filter(
        User.deactivated_at.isnot(None)
    ).group_by(
        User.deactivation_reason
    ).all()
    
    return {reason: count for reason, count in stats}
```

## API Endpoint Examples

### Deactivate Account Endpoint

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

router = APIRouter()

class DeactivateAccountRequest(BaseModel):
    reason: str
    feedback: str = None

@router.post("/users/me/deactivate", status_code=status.HTTP_200_OK)
async def deactivate_my_account(
    request: DeactivateAccountRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deactivate the current user's account"""
    
    # Deactivate the account
    current_user.deactivate_account(
        reason=request.reason,
        feedback=request.feedback
    )
    
    db.commit()
    
    return {
        "message": "Account deactivated successfully",
        "deactivated_at": current_user.deactivated_at
    }

@router.post("/users/{user_id}/reactivate", status_code=status.HTTP_200_OK)
async def reactivate_user_account(
    user_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Reactivate a user account (Admin only)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.is_deactivated():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is not deactivated"
        )
    
    user.reactivate_account()
    db.commit()
    
    return {
        "message": "Account reactivated successfully",
        "user_id": user.id,
        "email": user.email
    }
```

### Change Password Endpoint

```python
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import datetime

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/users/me/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change the current user's password"""
    
    # Verify current password
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Hash new password
    current_user.hashed_password = hash_password(request.new_password)
    current_user.password_changed_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Password changed successfully",
        "password_changed_at": current_user.password_changed_at
    }
```

## Security Considerations

1. **Password Change Tracking**
   - Always update `password_changed_at` when changing passwords
   - Consider implementing password rotation policies
   - Log password changes in security logs

2. **Account Deactivation**
   - Prevent deactivated accounts from logging in
   - Consider soft delete vs. hard delete approaches
   - Maintain audit trail of deactivations
   - Consider GDPR compliance for data retention

3. **Reactivation**
   - Require admin approval for reactivation
   - Send notification email upon reactivation
   - Consider resetting password on reactivation

## Testing

### Test Deactivation

```python
import pytest
from datetime import datetime
from src.models.user import User, UserStatus

def test_account_deactivation(db_session):
    """Test account deactivation functionality"""
    user = User(
        email="test@example.com",
        status=UserStatus.ACTIVE
    )
    db_session.add(user)
    db_session.commit()
    
    # Deactivate account
    reason = "Test deactivation"
    feedback = "Testing deactivation feature"
    user.deactivate_account(reason=reason, feedback=feedback)
    
    assert user.is_deactivated() == True
    assert user.deactivated_at is not None
    assert user.deactivation_reason == reason
    assert user.deactivation_feedback == feedback
    assert user.status == UserStatus.SUSPENDED
    assert user.can_login() == False

def test_account_reactivation(db_session):
    """Test account reactivation functionality"""
    user = User(
        email="test@example.com",
        status=UserStatus.ACTIVE
    )
    db_session.add(user)
    db_session.commit()
    
    # Deactivate and then reactivate
    user.deactivate_account(reason="Test")
    user.reactivate_account()
    
    assert user.is_deactivated() == False
    assert user.deactivated_at is None
    assert user.deactivation_reason is None
    assert user.deactivation_feedback is None
    assert user.status == UserStatus.ACTIVE

def test_password_change_tracking(db_session):
    """Test password change tracking"""
    user = User(
        email="test@example.com",
        hashed_password="old_hash"
    )
    db_session.add(user)
    db_session.commit()
    
    # Change password
    old_timestamp = user.password_changed_at
    user.hashed_password = "new_hash"
    user.password_changed_at = datetime.utcnow()
    db_session.commit()
    
    assert user.password_changed_at is not None
    if old_timestamp:
        assert user.password_changed_at > old_timestamp
```

## Future Enhancements

1. **Scheduled Deactivation**
   - Allow users to schedule account deactivation
   - Send reminder emails before deactivation

2. **Temporary Deactivation**
   - Add `deactivation_duration` field
   - Auto-reactivate after specified period

3. **Deactivation Analytics**
   - Track deactivation trends
   - Analyze common deactivation reasons
   - Generate retention reports

4. **Password Policy Enforcement**
   - Minimum password age
   - Maximum password age
   - Password complexity requirements
   - Password history (prevent reuse)

## Support

For questions or issues related to this feature, please contact the development team or create an issue in the project repository.

## Changelog

### Version 1.0 (2025-11-09)
- Added `password_changed_at` field
- Added `deactivated_at` field
- Added `deactivation_reason` field
- Added `deactivation_feedback` field
- Added `is_deactivated()` method
- Added `deactivate_account()` method
- Added `reactivate_account()` method
- Updated `can_login()` to check deactivation status
- Created migration `20251109_add_password_and_deactivation_fields.py`
