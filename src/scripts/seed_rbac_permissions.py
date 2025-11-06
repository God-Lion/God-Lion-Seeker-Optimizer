"""Seed default permissions and role-permission mappings"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from src.config.database import get_async_session
from src.models.user import UserRole
from src.models.permission import Permission, PermissionType, RolePermission


async def seed_permissions(db: AsyncSession):
    """Create all permission entries in the database"""
    
    permissions_data = [
        {"name": "Read Jobs", "type": PermissionType.JOBS_READ, "resource": "jobs", "action": "read", 
         "description": "View job listings and details"},
        {"name": "Create Jobs", "type": PermissionType.JOBS_CREATE, "resource": "jobs", "action": "create",
         "description": "Create new job listings"},
        {"name": "Update Jobs", "type": PermissionType.JOBS_UPDATE, "resource": "jobs", "action": "update",
         "description": "Modify existing job listings"},
        {"name": "Delete Jobs", "type": PermissionType.JOBS_DELETE, "resource": "jobs", "action": "delete",
         "description": "Remove job listings"},
        
        {"name": "Start Scraper", "type": PermissionType.SCRAPER_START, "resource": "scraper", "action": "start",
         "description": "Start job scraping sessions"},
        {"name": "Stop Scraper", "type": PermissionType.SCRAPER_STOP, "resource": "scraper", "action": "stop",
         "description": "Stop active scraping sessions"},
        {"name": "Configure Scraper", "type": PermissionType.SCRAPER_CONFIGURE, "resource": "scraper", "action": "configure",
         "description": "Configure scraper settings and parameters"},
        
        {"name": "Read Users", "type": PermissionType.USERS_READ, "resource": "users", "action": "read",
         "description": "View user information"},
        {"name": "Create Users", "type": PermissionType.USERS_CREATE, "resource": "users", "action": "create",
         "description": "Create new user accounts"},
        {"name": "Update Users", "type": PermissionType.USERS_UPDATE, "resource": "users", "action": "update",
         "description": "Modify user accounts and settings"},
        {"name": "Delete Users", "type": PermissionType.USERS_DELETE, "resource": "users", "action": "delete",
         "description": "Delete user accounts"},
        
        {"name": "Admin Access", "type": PermissionType.ADMIN_ACCESS, "resource": "admin", "action": "access",
         "description": "Access admin dashboard"},
        {"name": "Admin Configure", "type": PermissionType.ADMIN_CONFIGURE, "resource": "admin", "action": "configure",
         "description": "Configure system settings"},
        
        {"name": "View Reports", "type": PermissionType.REPORTS_VIEW, "resource": "reports", "action": "view",
         "description": "View analytics and reports"},
        {"name": "Export Reports", "type": PermissionType.REPORTS_EXPORT, "resource": "reports", "action": "export",
         "description": "Export reports to various formats"},
        
        {"name": "Read Profiles", "type": PermissionType.PROFILES_READ, "resource": "profiles", "action": "read",
         "description": "View resume profiles"},
        {"name": "Create Profiles", "type": PermissionType.PROFILES_CREATE, "resource": "profiles", "action": "create",
         "description": "Create new resume profiles"},
        {"name": "Update Profiles", "type": PermissionType.PROFILES_UPDATE, "resource": "profiles", "action": "update",
         "description": "Modify resume profiles"},
        {"name": "Delete Profiles", "type": PermissionType.PROFILES_DELETE, "resource": "profiles", "action": "delete",
         "description": "Delete resume profiles"},
        
        {"name": "Read Applications", "type": PermissionType.APPLICATIONS_READ, "resource": "applications", "action": "read",
         "description": "View job applications"},
        {"name": "Create Applications", "type": PermissionType.APPLICATIONS_CREATE, "resource": "applications", "action": "create",
         "description": "Submit job applications"},
        {"name": "Update Applications", "type": PermissionType.APPLICATIONS_UPDATE, "resource": "applications", "action": "update",
         "description": "Update application status"},
        {"name": "Delete Applications", "type": PermissionType.APPLICATIONS_DELETE, "resource": "applications", "action": "delete",
         "description": "Remove job applications"},
        
        {"name": "Read Notifications", "type": PermissionType.NOTIFICATIONS_READ, "resource": "notifications", "action": "read",
         "description": "View notifications"},
        {"name": "Manage Notifications", "type": PermissionType.NOTIFICATIONS_MANAGE, "resource": "notifications", "action": "manage",
         "description": "Manage notification settings"},
        
        {"name": "View Analytics", "type": PermissionType.ANALYTICS_VIEW, "resource": "analytics", "action": "view",
         "description": "View analytics dashboards"},
        {"name": "Manage Analytics", "type": PermissionType.ANALYTICS_MANAGE, "resource": "analytics", "action": "manage",
         "description": "Configure analytics settings"},
        
        {"name": "Configure System", "type": PermissionType.SYSTEM_CONFIGURE, "resource": "system", "action": "configure",
         "description": "Configure system-wide settings"},
        {"name": "Monitor System", "type": PermissionType.SYSTEM_MONITOR, "resource": "system", "action": "monitor",
         "description": "Monitor system health and performance"},
    ]
    
    permission_map = {}
    for perm_data in permissions_data:
        permission = Permission(
            name=perm_data["name"],
            permission_type=perm_data["type"],
            resource=perm_data["resource"],
            action=perm_data["action"],
            description=perm_data["description"]
        )
        db.add(permission)
        await db.flush()
        permission_map[perm_data["type"]] = permission.id
    
    await db.commit()
    print(f"✓ Created {len(permissions_data)} permissions")
    return permission_map


async def seed_role_permissions(db: AsyncSession, permission_map: dict):
    """Assign permissions to roles based on hierarchy"""
    
    role_permissions = {
        UserRole.GUEST: [
            PermissionType.JOBS_READ,
        ],
        
        UserRole.BASIC_USER: [
            PermissionType.JOBS_READ,
            PermissionType.PROFILES_READ,
            PermissionType.PROFILES_CREATE,
            PermissionType.PROFILES_UPDATE,
            PermissionType.APPLICATIONS_READ,
            PermissionType.APPLICATIONS_CREATE,
            PermissionType.NOTIFICATIONS_READ,
        ],
        
        UserRole.PREMIUM_USER: [
            PermissionType.JOBS_READ,
            PermissionType.SCRAPER_START,
            PermissionType.SCRAPER_STOP,
            PermissionType.SCRAPER_CONFIGURE,
            PermissionType.PROFILES_READ,
            PermissionType.PROFILES_CREATE,
            PermissionType.PROFILES_UPDATE,
            PermissionType.PROFILES_DELETE,
            PermissionType.APPLICATIONS_READ,
            PermissionType.APPLICATIONS_CREATE,
            PermissionType.APPLICATIONS_UPDATE,
            PermissionType.APPLICATIONS_DELETE,
            PermissionType.NOTIFICATIONS_READ,
            PermissionType.NOTIFICATIONS_MANAGE,
            PermissionType.REPORTS_VIEW,
            PermissionType.REPORTS_EXPORT,
            PermissionType.ANALYTICS_VIEW,
        ],
        
        UserRole.MANAGER: [
            PermissionType.JOBS_READ,
            PermissionType.JOBS_CREATE,
            PermissionType.JOBS_UPDATE,
            PermissionType.SCRAPER_START,
            PermissionType.SCRAPER_STOP,
            PermissionType.SCRAPER_CONFIGURE,
            PermissionType.USERS_READ,
            PermissionType.PROFILES_READ,
            PermissionType.PROFILES_CREATE,
            PermissionType.PROFILES_UPDATE,
            PermissionType.PROFILES_DELETE,
            PermissionType.APPLICATIONS_READ,
            PermissionType.APPLICATIONS_CREATE,
            PermissionType.APPLICATIONS_UPDATE,
            PermissionType.APPLICATIONS_DELETE,
            PermissionType.NOTIFICATIONS_READ,
            PermissionType.NOTIFICATIONS_MANAGE,
            PermissionType.REPORTS_VIEW,
            PermissionType.REPORTS_EXPORT,
            PermissionType.ANALYTICS_VIEW,
            PermissionType.ANALYTICS_MANAGE,
        ],
        
        UserRole.ADMIN: [
            PermissionType.JOBS_READ,
            PermissionType.JOBS_CREATE,
            PermissionType.JOBS_UPDATE,
            PermissionType.JOBS_DELETE,
            PermissionType.SCRAPER_START,
            PermissionType.SCRAPER_STOP,
            PermissionType.SCRAPER_CONFIGURE,
            PermissionType.USERS_READ,
            PermissionType.USERS_CREATE,
            PermissionType.USERS_UPDATE,
            PermissionType.USERS_DELETE,
            PermissionType.ADMIN_ACCESS,
            PermissionType.ADMIN_CONFIGURE,
            PermissionType.PROFILES_READ,
            PermissionType.PROFILES_CREATE,
            PermissionType.PROFILES_UPDATE,
            PermissionType.PROFILES_DELETE,
            PermissionType.APPLICATIONS_READ,
            PermissionType.APPLICATIONS_CREATE,
            PermissionType.APPLICATIONS_UPDATE,
            PermissionType.APPLICATIONS_DELETE,
            PermissionType.NOTIFICATIONS_READ,
            PermissionType.NOTIFICATIONS_MANAGE,
            PermissionType.REPORTS_VIEW,
            PermissionType.REPORTS_EXPORT,
            PermissionType.ANALYTICS_VIEW,
            PermissionType.ANALYTICS_MANAGE,
            PermissionType.SYSTEM_MONITOR,
        ],
        
        UserRole.SUPERADMIN: [
            PermissionType.JOBS_READ,
            PermissionType.JOBS_CREATE,
            PermissionType.JOBS_UPDATE,
            PermissionType.JOBS_DELETE,
            PermissionType.SCRAPER_START,
            PermissionType.SCRAPER_STOP,
            PermissionType.SCRAPER_CONFIGURE,
            PermissionType.USERS_READ,
            PermissionType.USERS_CREATE,
            PermissionType.USERS_UPDATE,
            PermissionType.USERS_DELETE,
            PermissionType.ADMIN_ACCESS,
            PermissionType.ADMIN_CONFIGURE,
            PermissionType.PROFILES_READ,
            PermissionType.PROFILES_CREATE,
            PermissionType.PROFILES_UPDATE,
            PermissionType.PROFILES_DELETE,
            PermissionType.APPLICATIONS_READ,
            PermissionType.APPLICATIONS_CREATE,
            PermissionType.APPLICATIONS_UPDATE,
            PermissionType.APPLICATIONS_DELETE,
            PermissionType.NOTIFICATIONS_READ,
            PermissionType.NOTIFICATIONS_MANAGE,
            PermissionType.REPORTS_VIEW,
            PermissionType.REPORTS_EXPORT,
            PermissionType.ANALYTICS_VIEW,
            PermissionType.ANALYTICS_MANAGE,
            PermissionType.SYSTEM_CONFIGURE,
            PermissionType.SYSTEM_MONITOR,
        ],
    }
    
    count = 0
    for role, permissions in role_permissions.items():
        for perm_type in permissions:
            if perm_type in permission_map:
                role_perm = RolePermission(
                    role=role.value,
                    permission_id=permission_map[perm_type],
                    is_granted=True
                )
                db.add(role_perm)
                count += 1
    
    await db.commit()
    print(f"✓ Created {count} role-permission mappings")


async def main():
    """Main seeding function"""
    print("Starting RBAC permission seeding...")
    
    async for db in get_async_session():
        permission_map = await seed_permissions(db)
        await seed_role_permissions(db, permission_map)
        print("✓ RBAC seeding completed successfully!")
        break


if __name__ == "__main__":
    asyncio.run(main())
