# RBAC Quick Reference Guide

## Quick Start

### 1. Add Permission to Endpoint

```python
from src.auth.dependencies import require_permission
from src.models.permission import PermissionType

@router.post("/my-endpoint")
async def my_endpoint(
    current_user: User = Depends(require_permission(PermissionType.JOBS_CREATE))
):
    # Your logic here
    pass
```

### 2. Check Permissions in Code

```python
from src.auth.rbac_service import RBACService

async def check_access(user: User, db: AsyncSession):
    can_scrape = await RBACService.has_permission(
        user,
        PermissionType.SCRAPER_START,
        db
    )
    return can_scrape
```

### 3. Log Sensitive Actions

```python
from src.services.audit_service import AuditLogger

await AuditLogger.log_action(
    db=db,
    action="custom_action",
    resource_type="resource_name",
    performed_by=current_user,
    request=request,
    severity="warning"
)
```

## Permission Types Cheat Sheet

```python
# Jobs
PermissionType.JOBS_READ
PermissionType.JOBS_CREATE
PermissionType.JOBS_UPDATE
PermissionType.JOBS_DELETE

# Scraper
PermissionType.SCRAPER_START
PermissionType.SCRAPER_STOP
PermissionType.SCRAPER_CONFIGURE

# Users
PermissionType.USERS_READ
PermissionType.USERS_CREATE
PermissionType.USERS_UPDATE
PermissionType.USERS_DELETE

# Admin
PermissionType.ADMIN_ACCESS
PermissionType.ADMIN_CONFIGURE

# Reports
PermissionType.REPORTS_VIEW
PermissionType.REPORTS_EXPORT

# Analytics
PermissionType.ANALYTICS_VIEW
PermissionType.ANALYTICS_MANAGE

# System
PermissionType.SYSTEM_CONFIGURE
PermissionType.SYSTEM_MONITOR
```

## Role Hierarchy

```
Level 6: SUPERADMIN    (Full system access)
Level 5: ADMIN         (User management, configuration)
Level 4: MANAGER       (Team oversight, reporting)
Level 3: PREMIUM_USER  (Full features)
Level 2: BASIC_USER    (Limited features)
Level 1: GUEST         (Read-only)
```

## Common Patterns

### Require Specific Role

```python
from src.auth.dependencies import require_role
from src.models.user import UserRole

@router.get("/admin-only")
async def admin_endpoint(
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN))
):
    pass
```

### Require Minimum Role Level

```python
from src.auth.dependencies import require_role_hierarchy

@router.get("/manager-and-above")
async def manager_endpoint(
    current_user: User = Depends(require_role_hierarchy(UserRole.MANAGER))
):
    # Accessible by MANAGER, ADMIN, SUPERADMIN
    pass
```

### Multiple Permissions (ANY)

```python
@router.get("/flexible-access")
async def flexible_endpoint(
    current_user: User = Depends(
        require_permission(
            PermissionType.ADMIN_ACCESS,
            PermissionType.ANALYTICS_VIEW
        )
    )
):
    # User needs at least ONE of these permissions
    pass
```

### Multiple Permissions (ALL)

```python
from src.auth.dependencies import require_all_permissions

@router.post("/strict-access")
async def strict_endpoint(
    current_user: User = Depends(
        require_all_permissions(
            PermissionType.SYSTEM_CONFIGURE,
            PermissionType.ADMIN_CONFIGURE
        )
    )
):
    # User needs ALL these permissions
    pass
```

## API Endpoints

### User Permission Management

```bash
# Get user's permissions
GET /api/admin/rbac/users/{user_id}/permissions

# Grant permission
POST /api/admin/rbac/users/permissions/grant
{
    "user_id": 123,
    "permission_id": 5,
    "reason": "Temporary access",
    "expires_at": "2025-12-31T23:59:59"
}

# Revoke permission
POST /api/admin/rbac/users/permissions/revoke
{
    "user_id": 123,
    "permission_id": 5
}
```

### Role Management

```bash
# Update user role (SUPERADMIN only)
PUT /api/admin/rbac/users/role
{
    "user_id": 123,
    "new_role": "admin",
    "reason": "Promotion"
}

# Get all roles
GET /api/admin/rbac/roles

# Get role permissions
GET /api/admin/rbac/roles/{role}/permissions
```

### Audit Logs

```bash
# Get all logs
GET /api/admin/rbac/audit-logs?skip=0&limit=100

# Filter by user
GET /api/admin/rbac/audit-logs?user_id=123

# Filter by severity
GET /api/admin/rbac/audit-logs?severity=critical

# Get unauthorized attempts
GET /api/admin/rbac/audit-logs/unauthorized
```

## Setup Commands

```bash
# Run migration
cd src
alembic upgrade head

# Seed permissions
python scripts/seed_rbac_permissions.py

# Verify
# Check database tables: permissions, role_permissions, user_permissions, audit_logs
```

## Testing

```python
import pytest
from src.models.user import User, UserRole
from src.auth.rbac_service import RBACService

async def test_permission_check():
    user = User(role=UserRole.PREMIUM_USER)
    has_perm = await RBACService.has_permission(
        user,
        PermissionType.SCRAPER_START,
        db
    )
    assert has_perm == True
```

## Troubleshooting

### 403 Forbidden Error

1. Check user's role: `user.role`
2. Check user's permissions: `GET /api/admin/rbac/users/{id}/permissions`
3. Check endpoint's required permission in code
4. Verify role has the permission: `GET /api/admin/rbac/roles/{role}/permissions`

### Permission Not Working After Grant

- Permission grants are immediate
- User may need to refresh JWT token (re-login)
- Check if user has a custom permission that denies access

### Audit Logs Not Appearing

- Ensure `AuditLogger.log_action()` is called AFTER successful action
- Check database connection
- Verify `audit_logs` table exists

## Best Practices

1. ✅ Always use permission decorators on endpoints
2. ✅ Log all privilege escalations and role changes
3. ✅ Use `require_permission` for feature-based access
4. ✅ Use `require_role` only when role-specific logic is needed
5. ✅ Include `reason` when granting/revoking permissions
6. ✅ Set `expires_at` for temporary permissions
7. ❌ Never bypass permission checks in production
8. ❌ Don't hardcode role names in business logic

## Common Mistakes

```python
# ❌ WRONG - No permission check
@router.post("/sensitive-action")
async def bad_endpoint(db: AsyncSession = Depends(get_db)):
    pass

# ✅ CORRECT - With permission check
@router.post("/sensitive-action")
async def good_endpoint(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionType.ADMIN_ACCESS))
):
    pass
```

```python
# ❌ WRONG - Manual role check in business logic
if user.role == UserRole.ADMIN:
    # do something

# ✅ CORRECT - Use permission check
has_access = await RBACService.has_permission(user, PermissionType.ADMIN_ACCESS, db)
if has_access:
    # do something
```

---

**Need more details?** See [RBAC_SYSTEM.md](./RBAC_SYSTEM.md)
