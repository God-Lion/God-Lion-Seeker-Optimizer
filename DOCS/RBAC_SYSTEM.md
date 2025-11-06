# RBAC (Role-Based Access Control) System Documentation

## Overview

This document describes the comprehensive Role-Based Access Control (RBAC) system implemented in the God Lion Seeker Optimizer application. The system provides granular permission management, audit logging, and secure access control across all API endpoints.

## Table of Contents

1. [Roles](#roles)
2. [Permissions](#permissions)
3. [Permission Enforcement](#permission-enforcement)
4. [Audit Logging](#audit-logging)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Setup & Configuration](#setup--configuration)
8. [Usage Examples](#usage-examples)

---

## Roles

The system defines **6 hierarchical roles** with different privilege levels:

| Role | Level | Description |
|------|-------|-------------|
| **GUEST** | 1 | Read-only access to public content |
| **BASIC_USER** | 2 | Limited feature access (profile management, basic job search) |
| **PREMIUM_USER** | 3 | Full feature access (scraping, automation, advanced analytics) |
| **MANAGER** | 4 | Team oversight, reporting, user management (read-only) |
| **ADMIN** | 5 | User management, system configuration, full access except system-wide settings |
| **SUPERADMIN** | 6 | Full system access including role/permission management |

### Role Hierarchy

Higher-level roles inherit permissions from lower-level roles. The hierarchy ensures:
- SUPERADMIN can do everything ADMIN can do
- ADMIN can do everything MANAGER can do
- And so on...

---

## Permissions

### Permission Types

The system implements **30 granular permissions** organized by resource type:

#### Jobs Permissions
- `jobs.read` - View job listings
- `jobs.create` - Create job postings
- `jobs.update` - Modify job postings
- `jobs.delete` - Remove job postings

#### Scraper Permissions
- `scraper.start` - Start scraping sessions
- `scraper.stop` - Stop active sessions
- `scraper.configure` - Configure scraper settings

#### User Management Permissions
- `users.read` - View user information
- `users.create` - Create user accounts
- `users.update` - Modify user accounts
- `users.delete` - Delete user accounts

#### Admin Permissions
- `admin.access` - Access admin dashboard
- `admin.configure` - Configure system settings

#### Reports & Analytics Permissions
- `reports.view` - View reports
- `reports.export` - Export reports
- `analytics.view` - View analytics
- `analytics.manage` - Configure analytics

#### Profile Permissions
- `profiles.read` - View resume profiles
- `profiles.create` - Create resume profiles
- `profiles.update` - Modify resume profiles
- `profiles.delete` - Delete resume profiles

#### Application Permissions
- `applications.read` - View job applications
- `applications.create` - Submit applications
- `applications.update` - Update application status
- `applications.delete` - Remove applications

#### Notification Permissions
- `notifications.read` - View notifications
- `notifications.manage` - Manage notification settings

#### System Permissions
- `system.configure` - Configure system-wide settings
- `system.monitor` - Monitor system health

### Default Role-Permission Mapping

```python
GUEST:
  - jobs.read

BASIC_USER:
  - jobs.read
  - profiles.read, profiles.create, profiles.update
  - applications.read, applications.create
  - notifications.read

PREMIUM_USER:
  - All BASIC_USER permissions
  - scraper.start, scraper.stop, scraper.configure
  - profiles.delete
  - applications.update, applications.delete
  - notifications.manage
  - reports.view, reports.export
  - analytics.view

MANAGER:
  - All PREMIUM_USER permissions
  - jobs.create, jobs.update
  - users.read
  - analytics.manage

ADMIN:
  - All MANAGER permissions
  - jobs.delete
  - users.create, users.update, users.delete
  - admin.access, admin.configure
  - system.monitor

SUPERADMIN:
  - ALL permissions including:
  - system.configure
```

---

## Permission Enforcement

### Backend Enforcement (CRITICAL)

All API endpoints are protected with decorator-based permission checks:

```python
from src.auth.dependencies import require_permission, require_all_permissions, require_role
from src.models.permission import PermissionType

@router.post("/scraping/start")
async def start_scraping(
    current_user: User = Depends(require_permission(PermissionType.SCRAPER_START))
):
    # Endpoint logic
    pass
```

### Permission Check Methods

1. **require_permission(*permissions)** - User needs ANY of the specified permissions
2. **require_all_permissions(*permissions)** - User needs ALL specified permissions
3. **require_role(*roles)** - User must have one of the specified roles
4. **require_role_hierarchy(minimum_role)** - User must be at or above role level

### Fail-Secure Design

- **Deny by default** - Endpoints without explicit permission checks reject all requests
- **Permission checks before business logic** - Authorization happens before any data access
- **Clear error messages** - 403 Forbidden with required permissions listed

---

## Audit Logging

### What is Logged

The system logs all security-sensitive actions:

1. **Role Changes** (severity: CRITICAL)
   - User promoted to admin/superadmin
   - User demoted from privileged roles

2. **Permission Grants/Revocations** (severity: WARNING)
   - Custom permissions assigned to users
   - Permissions removed from users

3. **User Management** (severity: INFO to CRITICAL)
   - User account creation
   - User account deletion (CRITICAL)
   - User status changes (suspend, ban, activate)

4. **Unauthorized Access Attempts** (severity: WARNING)
   - Failed permission checks
   - Attempts to access admin endpoints without privileges

5. **System Configuration Changes** (severity: WARNING)
   - System-wide setting modifications

### Audit Log Fields

```python
{
    "id": 123,
    "user_id": 45,              # User affected by action
    "performed_by_id": 67,      # Admin who performed action
    "action": "role_change",
    "resource_type": "user",
    "resource_id": "45",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "old_value": "basic_user",
    "new_value": "admin",
    "success": true,
    "severity": "critical",
    "created_at": "2025-11-05T10:30:00"
}
```

### Audit Log Retrieval

```bash
# Get all audit logs
GET /api/admin/rbac/audit-logs?skip=0&limit=100

# Filter by user
GET /api/admin/rbac/audit-logs?user_id=45

# Filter by action
GET /api/admin/rbac/audit-logs?action=role_change

# Filter by severity
GET /api/admin/rbac/audit-logs?severity=critical

# Get unauthorized access attempts
GET /api/admin/rbac/audit-logs/unauthorized
```

---

## Database Schema

### Tables

#### `permissions`
```sql
CREATE TABLE permissions (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    permission_type ENUM(...) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME,
    updated_at DATETIME
);
```

#### `role_permissions`
```sql
CREATE TABLE role_permissions (
    id INTEGER PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    permission_id INTEGER NOT NULL REFERENCES permissions(id),
    is_granted BOOLEAN DEFAULT TRUE,
    created_at DATETIME,
    updated_at DATETIME,
    UNIQUE(role, permission_id)
);
```

#### `user_permissions`
```sql
CREATE TABLE user_permissions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    permission_id INTEGER NOT NULL REFERENCES permissions(id),
    is_granted BOOLEAN DEFAULT TRUE,
    granted_by_id INTEGER REFERENCES users(id),
    granted_at DATETIME,
    expires_at DATETIME,
    reason TEXT,
    created_at DATETIME,
    updated_at DATETIME,
    UNIQUE(user_id, permission_id)
);
```

#### `audit_logs`
```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    performed_by_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    old_value TEXT,
    new_value TEXT,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    severity VARCHAR(20) DEFAULT 'info',
    metadata TEXT,
    created_at DATETIME,
    updated_at DATETIME
);
```

---

## API Endpoints

### Permission Management

#### Get All Permissions
```bash
GET /api/admin/rbac/permissions
Query Parameters:
  - skip: int (default 0)
  - limit: int (default 100)
  - resource: string (filter by resource type)
  - is_active: boolean
```

#### Get Role Permissions
```bash
GET /api/admin/rbac/roles/{role}/permissions
Example: GET /api/admin/rbac/roles/premium_user/permissions
```

#### Assign Permission to Role (SUPERADMIN only)
```bash
POST /api/admin/rbac/roles/{role}/permissions
Body: {
    "permission_id": 5
}
```

#### Remove Permission from Role (SUPERADMIN only)
```bash
DELETE /api/admin/rbac/roles/{role}/permissions/{permission_id}
```

### User Permission Management

#### Get User Permissions
```bash
GET /api/admin/rbac/users/{user_id}/permissions
Returns: ["jobs.read", "scraper.start", ...]
```

#### Grant Custom Permission to User
```bash
POST /api/admin/rbac/users/permissions/grant
Body: {
    "user_id": 45,
    "permission_id": 12,
    "reason": "Temporary access for testing",
    "expires_at": "2025-12-31T23:59:59"  // Optional
}
```

#### Revoke Custom Permission
```bash
POST /api/admin/rbac/users/permissions/revoke
Body: {
    "user_id": 45,
    "permission_id": 12,
    "reason": "Test completed"
}
```

### Role Management

#### Update User Role (SUPERADMIN only)
```bash
PUT /api/admin/rbac/users/role
Body: {
    "user_id": 45,
    "new_role": "admin",
    "reason": "Promoted to admin team"
}
```

#### Get All Roles
```bash
GET /api/admin/rbac/roles
```

### Audit Logs

#### Get Audit Logs
```bash
GET /api/admin/rbac/audit-logs
Query Parameters:
  - skip, limit: pagination
  - user_id: filter by user
  - action: filter by action type
  - severity: filter by severity
  - start_date, end_date: date range
```

#### Get Unauthorized Access Attempts
```bash
GET /api/admin/rbac/audit-logs/unauthorized
```

---

## Setup & Configuration

### 1. Run Database Migration

```bash
cd src
alembic upgrade head
```

This creates the `permissions`, `role_permissions`, `user_permissions`, and `audit_logs` tables.

### 2. Seed Permissions

```bash
cd src
python scripts/seed_rbac_permissions.py
```

This populates:
- 30 permission entries
- 100+ role-permission mappings

### 3. Verify Setup

```bash
# Check permissions table
SELECT COUNT(*) FROM permissions;  -- Should return 30

# Check role-permission mappings
SELECT role, COUNT(*) FROM role_permissions GROUP BY role;
```

### 4. Create First Superadmin

```python
from src.models.user import User, UserRole
from src.config.database import get_db

async with get_db() as db:
    admin = User(
        email="admin@example.com",
        role=UserRole.SUPERADMIN,
        status=UserStatus.ACTIVE,
        email_verified=True
    )
    db.add(admin)
    await db.commit()
```

---

## Usage Examples

### Protecting an Endpoint

```python
from fastapi import APIRouter, Depends
from src.auth.dependencies import require_permission
from src.models.permission import PermissionType
from src.models.user import User

router = APIRouter()

@router.post("/jobs/{job_id}/delete")
async def delete_job(
    job_id: int,
    current_user: User = Depends(require_permission(PermissionType.JOBS_DELETE))
):
    # Only users with jobs.delete permission can access
    # Automatically returns 403 Forbidden if permission missing
    pass
```

### Multiple Permissions (ANY)

```python
@router.get("/dashboard")
async def get_dashboard(
    current_user: User = Depends(
        require_permission(
            PermissionType.ADMIN_ACCESS,
            PermissionType.ANALYTICS_VIEW
        )
    )
):
    # User needs admin.access OR analytics.view
    pass
```

### Multiple Permissions (ALL)

```python
from src.auth.dependencies import require_all_permissions

@router.post("/system/critical-action")
async def critical_action(
    current_user: User = Depends(
        require_all_permissions(
            PermissionType.SYSTEM_CONFIGURE,
            PermissionType.ADMIN_CONFIGURE
        )
    )
):
    # User needs BOTH permissions
    pass
```

### Role-Based Check

```python
from src.auth.dependencies import require_role
from src.models.user import UserRole

@router.get("/admin/users")
async def list_users(
    current_user: User = Depends(
        require_role(UserRole.ADMIN, UserRole.SUPERADMIN)
    )
):
    # Only admins and superadmins can access
    pass
```

### Hierarchical Role Check

```python
from src.auth.dependencies import require_role_hierarchy
from src.models.user import UserRole

@router.get("/manager/reports")
async def get_reports(
    current_user: User = Depends(require_role_hierarchy(UserRole.MANAGER))
):
    # MANAGER, ADMIN, and SUPERADMIN can access
    # BASIC_USER and PREMIUM_USER cannot
    pass
```

### Manual Permission Check

```python
from src.auth.rbac_service import RBACService
from src.models.permission import PermissionType

async def some_function(user: User, db: AsyncSession):
    has_access = await RBACService.has_permission(
        user,
        PermissionType.SCRAPER_START,
        db
    )
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Permission denied")
```

### Audit Logging Example

```python
from src.services.audit_service import AuditLogger
from fastapi import Request

@router.put("/users/{user_id}/role")
async def update_role(
    user_id: int,
    new_role: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    user = await get_user_by_id(user_id, db)
    old_role = user.role
    user.role = UserRole(new_role)
    await db.commit()
    
    # Log the role change
    await AuditLogger.log_role_change(
        db=db,
        user=user,
        old_role=old_role,
        new_role=user.role,
        performed_by=current_user,
        request=request,
        reason="Admin request"
    )
    
    return {"message": "Role updated"}
```

---

## Security Best Practices

1. **Never bypass permission checks** - Always use decorators on endpoints
2. **Log all privilege escalations** - Use AuditLogger for sensitive actions
3. **Fail-secure by default** - Deny access unless explicitly granted
4. **Verify permissions on backend** - Never trust client-side checks
5. **Use least privilege** - Grant minimum permissions needed
6. **Regular audit reviews** - Monitor unauthorized access attempts
7. **Temporary permissions** - Use expires_at for time-limited access
8. **Document permission changes** - Always include reason in audit logs

---

## Troubleshooting

### Permission Denied Errors

```bash
# Check user's effective permissions
GET /api/admin/rbac/users/{user_id}/permissions

# Check role's default permissions
GET /api/admin/rbac/roles/{role}/permissions

# Review audit logs for unauthorized attempts
GET /api/admin/rbac/audit-logs/unauthorized?user_id={user_id}
```

### Missing Permissions After Migration

```bash
# Re-run permission seeding
python src/scripts/seed_rbac_permissions.py
```

### User Can't Access After Role Change

- Role changes take effect immediately
- User may need to refresh JWT token (re-login)
- Check if custom user permissions are denying access

---

## Future Enhancements

- [ ] Permission groups/bundles for easier management
- [ ] IP-based access restrictions
- [ ] Time-based access windows
- [ ] Approval workflows for privilege escalations
- [ ] Real-time alerts for critical audit events
- [ ] Permission inheritance customization
- [ ] Multi-tenant permission isolation

---

## Support

For questions or issues:
1. Check audit logs for detailed error information
2. Review this documentation
3. Contact system administrator
4. File an issue in the project repository

---

**Last Updated**: 2025-11-05  
**Version**: 1.0.0
