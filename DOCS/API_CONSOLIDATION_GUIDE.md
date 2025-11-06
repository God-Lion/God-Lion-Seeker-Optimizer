# API Architecture Consolidation - Migration Guide

## Overview

This guide documents the consolidation of the API architecture, eliminating duplicate axios instances, token management layers, and API service implementations.

## What Changed

### 1. Token Refresh Logic - Consolidated ✅

**Before:**
- `tokenRefresh.service.ts` - Separate token refresh service with its own interceptors
- `axios-instance.ts` - Basic axios configuration with placeholder refresh logic
- `secureTokenManager.ts` - Token storage manager

**After:**
- Token refresh logic merged into `shared/api/axios-instance.ts`
- Removed `tokenRefresh.service.ts` (deleted)
- Kept `secureTokenManager.ts` as the single source of truth for token storage

**Key Features:**
- Automatic token refresh before expiration (5-minute buffer)
- Request queuing during token refresh
- Handles concurrent requests gracefully
- Automatic retry of failed 401 requests after token refresh

### 2. API Services - Unified ✅

**Before:**
- `services/app/index.ts` - Legacy useQuery-based services
- `services/app/mutation.ts` - Legacy mutation services with direct axios calls
- `shared/api/services/api.service.ts` - Modern, comprehensive API services

**After:**
- All API calls now use `shared/api/services/api.service.ts`
- Deleted `services/app/` directory entirely
- Single, consistent API interface

### 3. Headers Configuration - Centralized ✅

**Before:**
- `services/headers.ts` - Separate headers function
- `shared/api/config.ts` - API_CONFIG with headers

**After:**
- Deleted `services/headers.ts`
- All header configuration in `shared/api/config.ts`

---

## Updated File Structure

```
client/src/
├── services/
│   ├── secureTokenManager.ts        ✅ Token storage (in-memory)
│   ├── session-management.service.ts ✅ Session logic
│   └── auth-security.service.ts     ✅ Security utilities
│
├── shared/
│   ├── api/
│   │   ├── axios-instance.ts        ✅ Configured axios + token refresh
│   │   ├── api-client.ts            ✅ Generic API client class
│   │   ├── config.ts                ✅ Endpoints & configuration
│   │   └── services/
│   │       └── api.service.ts       ✅ All API methods
│   └── hooks/
│       ├── useApi.ts                ✅ React Query hooks
│       └── useApiHooks.ts           ✅ Additional hooks
```

---

## Migration Examples

### Auth Service

#### Before (Old)
```typescript
import { verificationEmailHandle } from 'src/services/app'

const response = await verificationEmailHandle(email, signature)
```

#### After (New)
```typescript
import { authService } from 'src/shared/api/services/api.service'

const response = await authService.verifyEmail(email, signature)
```

---

### User Service

#### Before (Old)
```typescript
import { updateEmail } from 'src/services/app/mutation'
import { handleRetriveAllUser } from 'src/services/app'

// Mutation
await updateEmail({ email, password })

// Query
const { data } = handleRetriveAllUser()
```

#### After (New)
```typescript
import { userService } from 'src/shared/api/services/api.service'
import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from 'src/shared/api/config'

// Mutation
await userService.updateEmail({ email, password })

// Query
const { data } = useQuery({
  queryKey: QUERY_KEYS.users.all,
  queryFn: () => userService.getAllUsers(),
})
```

---

### Password Reset

#### Before (Old)
```typescript
import { resetPassword } from 'src/services/app/index'
import { resetPasswordEmailHandle } from 'src/services/app'

const response = await resetPassword(data)
const emailResponse = await resetPasswordEmailHandle(email, signature)
```

#### After (New)
```typescript
import { authService } from 'src/shared/api/services/api.service'

const response = await authService.resetPassword(data)
const emailResponse = await authService.verifyEmail(email, signature)
```

---

## Available API Services

All services are available from `shared/api/services/api.service.ts`:

### Core Services
- **authService** - Login, register, MFA, email verification, password reset
- **userService** - Profile management, settings, photo updates
- **profileService** - Resume profile CRUD operations
- **careerService** - Resume analysis, role matching, guest sessions

### Feature Services
- **jobsService** - Job search, applications, saved jobs
- **scraperService** - Scraping sessions management
- **companiesService** - Company data and job listings
- **automationService** - Automation configuration and control
- **notificationsService** - Notification management

### Admin Services
- **adminService** - User management, security logs
- **rbacService** - Role-based access control
- **auditService** - Audit logging
- **backupService** - Backup and restore operations
- **gdprService** - GDPR compliance (data export, deletion, consent)

### Utility Services
- **dashboardService** - Dashboard data and stats
- **statisticsService** - Analytics and metrics
- **healthService** - Health checks
- **metricsService** - Application metrics

---

## How to Use Modern API Services

### 1. Simple GET Request
```typescript
import { userService } from 'src/shared/api/services/api.service'

const response = await userService.getSettings()
const data = response.data
```

### 2. POST Request with Body
```typescript
import { authService } from 'src/shared/api/services/api.service'

const response = await authService.login({
  email: 'user@example.com',
  password: 'password123',
})
```

### 3. File Upload
```typescript
import { userService } from 'src/shared/api/services/api.service'

const response = await userService.updatePhotoProfile({
  id: userId,
  file: imageFile,
})
```

### 4. React Query Integration
```typescript
import { useQuery, useMutation } from '@tanstack/react-query'
import { userService } from 'src/shared/api/services/api.service'
import { QUERY_KEYS } from 'src/shared/api/config'

// Query
const { data, isLoading, error } = useQuery({
  queryKey: QUERY_KEYS.users.all,
  queryFn: () => userService.getAllUsers(),
})

// Mutation
const mutation = useMutation({
  mutationFn: (data) => userService.updateNames(data),
  onSuccess: () => {
    // Handle success
  },
})
```

---

## Token Management

### How Token Refresh Works

The consolidated token refresh system in `axios-instance.ts`:

1. **Proactive Refresh**: Checks token expiration before each request
2. **5-Minute Buffer**: Refreshes tokens 5 minutes before actual expiration
3. **Request Queuing**: Queues concurrent requests during token refresh
4. **Automatic Retry**: Retries failed 401 requests after successful refresh
5. **Failure Handling**: Clears tokens and redirects to login on refresh failure

### Token Storage

Tokens are managed by `secureTokenManager`:

```typescript
import { secureTokenManager } from 'src/services/secureTokenManager'

// Get tokens
const tokens = secureTokenManager.getTokens()
const accessToken = secureTokenManager.getAccessToken()

// Set tokens
secureTokenManager.setTokens({
  accessToken: 'xxx',
  refreshToken: 'yyy',
  expiresAt: Date.now() + 3600000,
})

// Check expiration
const isExpired = secureTokenManager.isTokenExpired()

// Clear tokens
secureTokenManager.clearTokens()
```

---

## Updated Components

The following components were migrated:

1. **ResetPasswordForm.jsx** - Uses `authService.resetPassword()`
2. **ChangeEmail.tsx** - Uses `userService.updateEmail()`
3. **ChangeAccount.tsx** - Uses `userService.updateNames()`
4. **VerificationEmail.tsx** - Uses `authService.verifyEmail()`
5. **Validate.tsx** - Uses `authService.validateUser()` with React Query
6. **ResetPassword.tsx** - Uses `authService.verifyEmail()`

---

## Search & Replace Patterns

If you need to migrate additional components, use these patterns:

### Pattern 1: Service Imports
```bash
# Find
from 'src/services/app'
from 'src/services/app/index'
from 'src/services/app/mutation'

# Replace with
from 'src/shared/api/services/api.service'
```

### Pattern 2: Function Calls

| Old Function | New Function |
|--------------|--------------|
| `verificationEmailHandle(email, sig)` | `authService.verifyEmail(email, sig)` |
| `resetPasswordEmailHandle(email, sig)` | `authService.verifyEmail(email, sig)` |
| `handleValidateUser(id, token)` | `authService.validateUser(id, token)` |
| `resetPassword(data)` | `authService.resetPassword(data)` |
| `updateEmail(body)` | `userService.updateEmail(body)` |
| `updateNames(body)` | `userService.updateNames(body)` |
| `handleRetriveAllUser()` | `userService.getAllUsers()` |
| `handleRetriveUser(id)` | `userService.getUserById(id)` |

---

## Benefits of Consolidation

### 1. Consistency ✅
- Single API client configuration
- Unified error handling
- Consistent interceptor behavior

### 2. Maintainability ✅
- One place to update API logic
- Easier to track changes
- Reduced code duplication

### 3. Performance ✅
- Optimized token refresh with request queuing
- Prevents duplicate refresh requests
- Automatic retry reduces failed requests

### 4. Developer Experience ✅
- Clear, predictable API
- Better TypeScript support
- Easier to onboard new developers

### 5. Security ✅
- Centralized token management
- Secure token storage
- Automatic cleanup on refresh failure

---

## Testing Recommendations

After migration, test:

1. **Authentication Flow**
   - Login → Token storage
   - Token expiration → Automatic refresh
   - Token refresh failure → Redirect to login

2. **API Requests**
   - GET requests with authorization
   - POST/PUT requests with body
   - File uploads
   - Error handling (network errors, 401, 403, etc.)

3. **Concurrent Requests**
   - Multiple requests during token refresh
   - Request queuing behavior
   - Retry logic after token refresh

4. **Session Management**
   - Logout → Token cleanup
   - Session expiration → Redirect
   - Multiple tabs/windows

---

## Troubleshooting

### Issue: "Cannot find module 'src/services/app'"
**Solution:** Update the import to use the new API service:
```typescript
import { authService } from 'src/shared/api/services/api.service'
```

### Issue: Token not being refreshed
**Solution:** Check that `secureTokenManager` has valid tokens with `expiresAt`:
```typescript
const tokens = secureTokenManager.getTokens()
console.log(tokens) // Should have accessToken, refreshToken, expiresAt
```

### Issue: 401 errors after token refresh
**Solution:** Verify the refresh endpoint returns correct response format:
```typescript
{
  access_token: string,
  refresh_token: string,
  expires_in: number
}
```

---

## Next Steps

1. **Test the application thoroughly**
   - All authentication flows
   - API requests with token refresh
   - Error scenarios

2. **Monitor for issues**
   - Check browser console for errors
   - Verify network requests
   - Test concurrent operations

3. **Update documentation**
   - API usage examples
   - Authentication flow diagrams
   - Developer onboarding guides

---

## Summary

**Deleted Files:**
- ❌ `client/src/services/app/` (entire directory)
- ❌ `client/src/services/tokenRefresh.service.ts`
- ❌ `client/src/services/headers.ts`

**Updated Files:**
- ✅ `client/src/shared/api/axios-instance.ts` (merged token refresh logic)
- ✅ 6 component files (updated imports)

**Preserved Files:**
- ✅ `client/src/services/secureTokenManager.ts`
- ✅ `client/src/services/session-management.service.ts`
- ✅ `client/src/services/auth-security.service.ts`
- ✅ `client/src/shared/api/services/api.service.ts`
- ✅ `client/src/shared/api/config.ts`

---

**Migration Date:** November 6, 2025  
**Status:** ✅ Complete
