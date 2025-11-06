# Rate Limiting Implementation Guide

## ⚠️ CRITICAL SECURITY NOTE

**Client-side rate limiting is NOT secure and can be easily bypassed!**

The client-side implementation in `auth-security.service.ts` is for **UX purposes only**:
- Provides immediate feedback to users
- Reduces unnecessary API calls
- Improves user experience

**Backend rate limiting is MANDATORY for security:**
- Cannot be bypassed by clients
- Protects against brute force attacks
- Prevents credential stuffing
- Defends against DDoS attacks

## Client-Side Implementation (UX Only)

### Progressive Rate Limiting

```typescript
const RATE_LIMITS = {
  attempts: [3, 5, 10],          // Threshold for each lockout level
  lockouts: [15, 60, 1440],      // Duration in minutes: 15min, 1hr, 24hrs
  captchaThreshold: 2,            // Show CAPTCHA after 2 attempts
  alertThreshold: 5,              // Send alert after 5 attempts
  resetWindow: 60 * 60 * 1000    // Reset after 1 hour of inactivity
}
```

### Lockout Levels

| Level | Failed Attempts | Lockout Duration | Purpose |
|-------|----------------|------------------|---------|
| **Level 1** | 3-4 attempts | 15 minutes | Prevent typos from locking out user |
| **Level 2** | 5-9 attempts | 1 hour | Deter casual brute force |
| **Level 3** | 10+ attempts | 24 hours | Block persistent attacks |

### Usage Example

```typescript
import { authSecurityService } from '@/services/auth-security.service'

// On login attempt
try {
  const result = await loginAPI(email, password)
  authSecurityService.recordSuccessfulLogin(email)
} catch (error) {
  const security = authSecurityService.recordFailedAttempt(email, {
    userAgent: navigator.userAgent
  })
  
  if (security.lockedUntil) {
    const remaining = authSecurityService.getLockoutTimeRemaining(email)
    showError(`Account locked for ${remaining}`)
  } else if (security.requiresCaptcha) {
    showCaptcha()
  } else {
    const status = authSecurityService.getSecurityStatus(email)
    showError(`Invalid credentials. ${status.nextLockoutThreshold - status.attempts} attempts remaining`)
  }
}
```

### Security Status API

```typescript
const status = authSecurityService.getSecurityStatus(email)

console.log(status)
// {
//   attempts: 4,
//   isLocked: false,
//   requiresCaptcha: true,
//   lockoutLevel: 1,
//   remainingTime: "",
//   nextLockoutThreshold: 5
// }
```

## Backend Implementation (REQUIRED)

### 1. IP-Based Rate Limiting

**Using Redis (Recommended):**

```python
# src/services/rate_limiter.py
from datetime import timedelta
import redis
from fastapi import HTTPException, status

redis_client = redis.Redis(host='localhost', port=6379, db=0)

class RateLimiter:
    def __init__(self):
        self.limits = {
            'login': {'attempts': 5, 'window': 900},  # 5 attempts per 15 min
            'password_reset': {'attempts': 3, 'window': 3600},  # 3 per hour
            'api': {'attempts': 100, 'window': 60}  # 100 per minute
        }
    
    def check_rate_limit(self, identifier: str, action: str = 'login'):
        key = f"rate_limit:{action}:{identifier}"
        limit_config = self.limits.get(action)
        
        if not limit_config:
            return True
        
        # Get current attempt count
        attempts = redis_client.get(key)
        
        if attempts is None:
            # First attempt
            redis_client.setex(key, limit_config['window'], 1)
            return True
        
        attempts = int(attempts)
        
        if attempts >= limit_config['attempts']:
            ttl = redis_client.ttl(key)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many attempts. Try again in {ttl} seconds"
            )
        
        # Increment attempt count
        redis_client.incr(key)
        return True
    
    def reset_limit(self, identifier: str, action: str = 'login'):
        key = f"rate_limit:{action}:{identifier}"
        redis_client.delete(key)

rate_limiter = RateLimiter()
```

**Usage in FastAPI:**

```python
# src/api/routes/auth.py
from fastapi import APIRouter, Request, Depends
from src.services.rate_limiter import rate_limiter

router = APIRouter()

@router.post("/login")
async def login(request: Request, credentials: LoginCredentials):
    # Get IP address
    ip_address = request.client.host
    
    # Check rate limit by IP
    rate_limiter.check_rate_limit(ip_address, action='login')
    
    # Check rate limit by email
    rate_limiter.check_rate_limit(credentials.email, action='login')
    
    # Attempt login
    try:
        user = await authenticate_user(credentials.email, credentials.password)
        
        # Reset rate limits on successful login
        rate_limiter.reset_limit(ip_address, action='login')
        rate_limiter.reset_limit(credentials.email, action='login')
        
        return {"access_token": create_token(user)}
    except AuthenticationError:
        # Don't reset on failure - let rate limit accumulate
        raise HTTPException(status_code=401, detail="Invalid credentials")
```

### 2. Account-Based Rate Limiting

```python
# src/models/user.py
from sqlalchemy import Column, Integer, DateTime, Boolean
from datetime import datetime, timedelta

class User(Base):
    __tablename__ = "users"
    
    failed_login_attempts = Column(Integer, default=0)
    last_failed_login = Column(DateTime, nullable=True)
    locked_until = Column(DateTime, nullable=True)
    lockout_level = Column(Integer, default=0)
    
    def record_failed_login(self):
        now = datetime.utcnow()
        
        # Reset if last attempt was over 1 hour ago
        if self.last_failed_login and (now - self.last_failed_login) > timedelta(hours=1):
            self.failed_login_attempts = 0
            self.lockout_level = 0
        
        self.failed_login_attempts += 1
        self.last_failed_login = now
        
        # Progressive lockouts
        if self.failed_login_attempts >= 10:
            self.locked_until = now + timedelta(days=1)
            self.lockout_level = 2
        elif self.failed_login_attempts >= 5:
            self.locked_until = now + timedelta(hours=1)
            self.lockout_level = 1
        elif self.failed_login_attempts >= 3:
            self.locked_until = now + timedelta(minutes=15)
            self.lockout_level = 0
    
    def is_locked(self) -> bool:
        if self.locked_until and datetime.utcnow() < self.locked_until:
            return True
        return False
    
    def reset_failed_attempts(self):
        self.failed_login_attempts = 0
        self.locked_until = None
        self.lockout_level = 0
        self.last_failed_login = None
```

### 3. CAPTCHA Integration

**Using hCaptcha or reCAPTCHA:**

```python
# src/services/captcha_service.py
import requests
from typing import Optional

class CaptchaService:
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
        self.verify_url = "https://hcaptcha.com/siteverify"
    
    def verify(self, token: str, ip_address: str) -> bool:
        data = {
            'secret': self.secret_key,
            'response': token,
            'remoteip': ip_address
        }
        
        response = requests.post(self.verify_url, data=data)
        result = response.json()
        
        return result.get('success', False)

captcha_service = CaptchaService(secret_key=settings.HCAPTCHA_SECRET)
```

**In login endpoint:**

```python
@router.post("/login")
async def login(
    request: Request,
    credentials: LoginCredentials,
    captcha_token: Optional[str] = None
):
    ip_address = request.client.host
    
    # Check if user requires CAPTCHA
    user = await get_user_by_email(credentials.email)
    if user and user.failed_login_attempts >= 2:
        if not captcha_token:
            raise HTTPException(
                status_code=400,
                detail="CAPTCHA required"
            )
        
        if not captcha_service.verify(captcha_token, ip_address):
            raise HTTPException(
                status_code=400,
                detail="Invalid CAPTCHA"
            )
    
    # Continue with login...
```

### 4. Email Notifications

```python
# src/services/security_alerts.py
from datetime import datetime, timedelta
from src.services.email_service import send_email

class SecurityAlertService:
    def __init__(self):
        self.alert_cache = {}  # Prevent spam
    
    async def send_failed_login_alert(self, user_email: str, attempts: int, ip_address: str):
        # Check if we've already sent an alert recently
        cache_key = f"{user_email}:failed_login"
        last_alert = self.alert_cache.get(cache_key)
        
        if last_alert and (datetime.utcnow() - last_alert) < timedelta(hours=1):
            return  # Don't spam alerts
        
        await send_email(
            to=user_email,
            subject="Security Alert: Failed Login Attempts",
            template="security_alert",
            context={
                'attempts': attempts,
                'ip_address': ip_address,
                'timestamp': datetime.utcnow(),
                'action_url': f"{settings.FRONTEND_URL}/security/sessions"
            }
        )
        
        self.alert_cache[cache_key] = datetime.utcnow()

security_alerts = SecurityAlertService()
```

### 5. Nginx Rate Limiting

**Additional layer at web server level:**

```nginx
# nginx.conf
http {
    # Define rate limit zones
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
    
    server {
        # Login endpoint - 5 requests per minute
        location /api/auth/login {
            limit_req zone=login_limit burst=3 nodelay;
            limit_req_status 429;
            
            proxy_pass http://backend;
        }
        
        # General API - 100 requests per second
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            limit_req_status 429;
            
            proxy_pass http://backend;
        }
    }
}
```

## Complete Security Stack

### Defense in Depth

1. **Nginx Rate Limiting** (First line of defense)
   - Protects against DDoS
   - Minimal resource usage
   - Fast rejection of excessive requests

2. **IP-Based Rate Limiting** (Application level)
   - Tracks attempts per IP
   - Prevents distributed brute force
   - Redis-backed for performance

3. **Account-Based Rate Limiting** (User level)
   - Tracks attempts per account
   - Progressive lockouts
   - Persisted in database

4. **CAPTCHA** (Human verification)
   - Required after threshold
   - Prevents automated attacks
   - User-friendly challenge

5. **Email Alerts** (Monitoring)
   - Notify users of suspicious activity
   - Enable quick response
   - Audit trail

6. **Client-Side UX** (User experience)
   - Immediate feedback
   - Clear error messages
   - Reduced server load

## Monitoring and Analytics

### Track Failed Login Attempts

```python
# src/services/security_analytics.py
from datetime import datetime, timedelta
from sqlalchemy import func

class SecurityAnalytics:
    async def get_failed_login_stats(self, hours: int = 24):
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        
        stats = await db.query(
            func.count(FailedLoginAttempt.id).label('total'),
            func.count(func.distinct(FailedLoginAttempt.email)).label('unique_accounts'),
            func.count(func.distinct(FailedLoginAttempt.ip_address)).label('unique_ips')
        ).filter(FailedLoginAttempt.timestamp > cutoff).first()
        
        return {
            'total_attempts': stats.total,
            'unique_accounts': stats.unique_accounts,
            'unique_ips': stats.unique_ips,
            'period_hours': hours
        }
    
    async def get_top_targeted_accounts(self, limit: int = 10):
        cutoff = datetime.utcnow() - timedelta(hours=24)
        
        results = await db.query(
            FailedLoginAttempt.email,
            func.count(FailedLoginAttempt.id).label('attempts')
        ).filter(
            FailedLoginAttempt.timestamp > cutoff
        ).group_by(
            FailedLoginAttempt.email
        ).order_by(
            func.count(FailedLoginAttempt.id).desc()
        ).limit(limit).all()
        
        return [{'email': r.email, 'attempts': r.attempts} for r in results]
```

## Testing Rate Limiting

### Manual Testing

```bash
# Test login rate limit
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo "Attempt $i"
  sleep 1
done

# Expected:
# Attempts 1-3: 401 Unauthorized
# Attempts 4-5: 401 + CAPTCHA required warning
# Attempts 6+: 429 Too Many Requests
```

### Automated Testing

```python
# tests/test_rate_limiting.py
import pytest
from fastapi.testclient import TestClient

def test_progressive_rate_limiting(client: TestClient):
    # Level 1: 3 attempts -> 15 min lockout
    for _ in range(3):
        response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "wrong"
        })
        assert response.status_code == 401
    
    # 4th attempt should be locked
    response = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "wrong"
    })
    assert response.status_code == 429
    assert "locked" in response.json()["detail"].lower()
```

## Configuration

### Environment Variables

```bash
# .env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_LOGIN_ATTEMPTS=5
RATE_LIMIT_LOGIN_WINDOW=900  # 15 minutes

RATE_LIMIT_API_REQUESTS=100
RATE_LIMIT_API_WINDOW=60  # 1 minute

CAPTCHA_ENABLED=true
CAPTCHA_THRESHOLD=2
HCAPTCHA_SITE_KEY=your_site_key
HCAPTCHA_SECRET=your_secret_key

SECURITY_ALERTS_ENABLED=true
SECURITY_ALERT_THRESHOLD=5
```

## Best Practices

1. **Never rely solely on client-side rate limiting**
2. **Implement multiple layers of defense**
3. **Log all failed attempts for analysis**
4. **Send alerts for suspicious activity**
5. **Use progressive lockouts (not just one threshold)**
6. **Combine IP-based and account-based limits**
7. **Implement CAPTCHA after reasonable attempts**
8. **Monitor and analyze patterns**
9. **Provide clear feedback to users**
10. **Have a process for unlocking legitimate users**

## Security Considerations

### Attack Vectors

1. **Distributed Brute Force**
   - **Mitigation:** IP-based + Account-based limits

2. **Credential Stuffing**
   - **Mitigation:** CAPTCHA, anomaly detection

3. **Account Enumeration**
   - **Mitigation:** Same response for valid/invalid emails

4. **Rate Limit Bypass**
   - **Mitigation:** Backend enforcement, multiple layers

## References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)
- [FastAPI Rate Limiting](https://github.com/laurentS/slowapi)
- [Redis Rate Limiting](https://redis.io/topics/patterns/rate-limiting)
