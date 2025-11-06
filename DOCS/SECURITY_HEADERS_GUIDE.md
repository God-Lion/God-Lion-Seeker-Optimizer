# Security Headers Implementation Guide

**God Lion Seeker Optimizer - Security Headers & Policies**

**Implementation Date**: 2025-11-05  
**Version**: 1.0  
**Status**: ✅ **COMPLETE**

---

## Overview

This document describes the security headers implementation for the God Lion Seeker Optimizer application, including HSTS, CSP, CORS, and other critical security headers.

---

## Table of Contents

1. [HSTS (HTTP Strict Transport Security)](#1-hsts-http-strict-transport-security)
2. [Content Security Policy (CSP)](#2-content-security-policy-csp)
3. [Additional Security Headers](#3-additional-security-headers)
4. [CORS Configuration](#4-cors-configuration)
5. [Implementation](#5-implementation)
6. [Testing](#6-testing)
7. [Monitoring](#7-monitoring)

---

## 1. HSTS (HTTP Strict Transport Security)

### Priority: **CRITICAL**

### What it Does
- Forces all connections to use HTTPS
- Prevents protocol downgrade attacks
- Prevents man-in-the-middle attacks
- Protects against SSL stripping

### Configuration

```python
{
    "hsts_enabled": True,
    "hsts_max_age": 31536000,  # 1 year in seconds
    "hsts_include_subdomains": True,
    "hsts_preload": True
}
```

### Header Example
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| `max-age` | 31536000 | Duration to remember HTTPS (1 year) |
| `includeSubDomains` | Yes | Apply to all subdomains |
| `preload` | Yes | Eligible for browser preload list |

### HSTS Preload List

To add your domain to the HSTS preload list:

1. **Requirements**:
   - Serve valid HTTPS certificate
   - Redirect HTTP to HTTPS (same host)
   - Serve HSTS header on all pages
   - max-age >= 31536000 (1 year)
   - includeSubDomains directive
   - preload directive

2. **Submit**: https://hstspreload.org/

3. **Verification**:
   ```bash
   curl -I https://yourcompany.com
   # Check for Strict-Transport-Security header
   ```

### Implementation Timeline

1. **Phase 1** (Development/Staging): 
   - `max-age=86400` (1 day)
   - Test thoroughly

2. **Phase 2** (Production - Initial):
   - `max-age=2592000` (30 days)
   - Monitor for issues

3. **Phase 3** (Production - Final):
   - `max-age=31536000` (1 year)
   - `includeSubDomains; preload`
   - Submit to preload list

### Rollback

If you need to disable HSTS:

```
Strict-Transport-Security: max-age=0
```

**WARNING**: Rollback is difficult after preload submission!

---

## 2. Content Security Policy (CSP)

### Priority: **HIGH**

### What it Does
- Prevents Cross-Site Scripting (XSS) attacks
- Controls which resources can be loaded
- Reports violations to monitoring endpoint
- Mitigates code injection attacks

### Default Policy

```python
{
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "img-src": ["'self'", "data:", "https:", "blob:"],
    "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
    "connect-src": ["'self'"],
    "media-src": ["'self'"],
    "object-src": ["'none'"],
    "frame-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "form-action": ["'self'"],
    "base-uri": ["'self'"],
    "upgrade-insecure-requests": "",
    "block-all-mixed-content": ""
}
```

### CSP Directives Explained

| Directive | Value | Purpose |
|-----------|-------|---------|
| `default-src` | 'self' | Default policy for all resources |
| `script-src` | 'self', 'unsafe-inline' | JavaScript sources |
| `style-src` | 'self', 'unsafe-inline' | CSS sources |
| `img-src` | 'self', data:, https: | Image sources |
| `font-src` | 'self', fonts.gstatic.com | Font sources |
| `connect-src` | 'self' | AJAX, WebSocket, etc. |
| `media-src` | 'self' | Audio/video sources |
| `object-src` | 'none' | Block plugins (Flash, etc.) |
| `frame-src` | 'none' | Block iframes |
| `frame-ancestors` | 'none' | Prevent embedding |
| `form-action` | 'self' | Form submission targets |
| `base-uri` | 'self' | Restrict `<base>` tag |
| `upgrade-insecure-requests` | - | Auto-upgrade HTTP to HTTPS |
| `block-all-mixed-content` | - | Block HTTP on HTTPS pages |

### Production CSP (Recommended)

Replace `'unsafe-inline'` with nonces:

```python
# Enable CSP Nonce Middleware
app.add_middleware(CSPNonceMiddleware)

# In templates, use nonce:
<script nonce="{{ request.state.csp_nonce }}">
    // Your inline script
</script>

<style nonce="{{ request.state.csp_nonce }}">
    /* Your inline styles */
</style>
```

### CSP Reporting

Set up violation reporting:

```python
{
    "csp_report_uri": "https://yourcompany.com/api/security/csp-report"
}
```

Violations are logged at:
- **Endpoint**: `POST /api/security/csp-report`
- **Log Level**: WARNING
- **Storage**: Optional database storage

### CSP Testing

1. **Report-Only Mode** (Development):
   ```
   Content-Security-Policy-Report-Only: ...
   ```
   Violations are reported but not enforced

2. **Enforcement Mode** (Production):
   ```
   Content-Security-Policy: ...
   ```
   Violations are blocked and reported

### Common CSP Issues

**Issue**: Inline scripts blocked
**Solution**: Use nonces or move scripts to external files

**Issue**: Third-party scripts blocked
**Solution**: Add domain to `script-src`:
```python
"script-src": ["'self'", "https://trusted-cdn.com"]
```

**Issue**: Eval() blocked
**Solution**: Avoid eval(), or add `'unsafe-eval'` (not recommended)

---

## 3. Additional Security Headers

### Priority: **MEDIUM**

### X-Content-Type-Options

**Header**: `X-Content-Type-Options: nosniff`

**Purpose**: Prevents MIME type sniffing

**Protection**: Stops browsers from interpreting files as different MIME types

---

### X-Frame-Options

**Header**: `X-Frame-Options: DENY`

**Purpose**: Prevents clickjacking

**Options**:
- `DENY` - Cannot be embedded in any frame
- `SAMEORIGIN` - Can only be embedded on same origin
- `ALLOW-FROM uri` - Can be embedded from specific URI

---

### X-XSS-Protection

**Header**: `X-XSS-Protection: 1; mode=block`

**Purpose**: Legacy XSS protection (for older browsers)

**Note**: Modern browsers rely on CSP instead

---

### Referrer-Policy

**Header**: `Referrer-Policy: strict-origin-when-cross-origin`

**Purpose**: Controls referrer information sent with requests

**Options**:
- `no-referrer` - Never send referrer
- `same-origin` - Send for same origin only
- `strict-origin-when-cross-origin` - Send full URL for same origin, origin only for cross-origin HTTPS

---

### Permissions-Policy (Feature-Policy)

**Header**:
```
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()
```

**Purpose**: Controls browser features and APIs

**Configured Restrictions**:
- ❌ Geolocation
- ❌ Microphone
- ❌ Camera
- ❌ Payment APIs
- ❌ USB
- ❌ Magnetometer, Gyroscope, Accelerometer
- ✅ Fullscreen (same origin only)

---

### Cross-Origin-Embedder-Policy (COEP)

**Header**: `Cross-Origin-Embedder-Policy: require-corp`

**Purpose**: Prevents loading cross-origin resources without explicit permission

**Use Case**: Required for SharedArrayBuffer and high-resolution timers

---

### Cross-Origin-Opener-Policy (COOP)

**Header**: `Cross-Origin-Opener-Policy: same-origin`

**Purpose**: Isolates browsing context from cross-origin windows

**Protection**: Prevents cross-origin attacks via window references

---

### Cross-Origin-Resource-Policy (CORP)

**Header**: `Cross-Origin-Resource-Policy: same-origin`

**Purpose**: Prevents other origins from reading the response

**Options**:
- `same-origin` - Only same origin
- `same-site` - Same site (includes subdomains)
- `cross-origin` - Allow cross-origin

---

### X-Permitted-Cross-Domain-Policies

**Header**: `X-Permitted-Cross-Domain-Policies: none`

**Purpose**: Restricts Adobe Flash and PDF cross-domain policies

**Options**:
- `none` - No policy files allowed
- `master-only` - Only master policy file
- `by-content-type` - By HTTP Content-Type
- `all` - All policy files allowed

---

### X-DNS-Prefetch-Control

**Header**: `X-DNS-Prefetch-Control: off`

**Purpose**: Controls DNS prefetching

**Note**: Disabled for privacy; enable if performance is critical

---

### X-Download-Options

**Header**: `X-Download-Options: noopen`

**Purpose**: Prevents IE from executing downloads in site's context

**Protection**: IE-specific protection against download attacks

---

## 4. CORS Configuration

### CORS Security Middleware

Enhanced CORS with security controls:

```python
app.add_middleware(
    CORSSecurityMiddleware,
    allowed_origins=[
        "http://localhost:3000",      # Development
        "https://yourcompany.com",     # Production
    ],
    allowed_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowed_headers=["*"],
    expose_headers=["Content-Length", "Content-Type"],
    allow_credentials=True,
    max_age=3600
)
```

### CORS Headers

```
Access-Control-Allow-Origin: https://yourcompany.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: *
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
```

### CORS Best Practices

1. **Never use `*` for allowed_origins in production**
2. **Whitelist specific origins**
3. **Use credentials only when necessary**
4. **Set appropriate max-age for preflight caching**

---

## 5. Implementation

### Step 1: Add Middleware to Application

```python
# src/api/main.py

from src.middleware.security_headers import (
    SecurityHeadersMiddleware,
    get_security_middleware_config
)

# Get configuration based on environment
environment = os.getenv("ENVIRONMENT", "production")
security_config = get_security_middleware_config(environment)

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware, **security_config)
```

### Step 2: Configure CSP Reporting

```python
# Include security routes
from src.api.routes import security
app.include_router(security.router)
```

### Step 3: Environment-Specific Configuration

**.env.production**:
```bash
ENVIRONMENT=production
HSTS_ENABLED=true
HSTS_MAX_AGE=31536000
CSP_ENABLED=true
CSP_REPORT_URI=https://yourcompany.com/api/security/csp-report
```

**.env.development**:
```bash
ENVIRONMENT=development
HSTS_ENABLED=false  # Allow HTTP in dev
CSP_ENABLED=true
CSP_REPORT_URI=
```

---

## 6. Testing

### Test HSTS

```bash
# Check HSTS header
curl -I https://yourcompany.com

# Expected:
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### Test CSP

```bash
# Check CSP header
curl -I https://yourcompany.com

# Expected:
Content-Security-Policy: default-src 'self'; script-src 'self' ...
```

### Test All Headers

```bash
# Use the test endpoint
curl https://yourcompany.com/api/security/security-headers-test
```

### Browser Testing

1. **Open Developer Tools** (F12)
2. **Navigate to Network tab**
3. **Reload page**
4. **Click on any request**
5. **Check Response Headers**

Expected headers:
- ✅ Strict-Transport-Security
- ✅ Content-Security-Policy
- ✅ X-Content-Type-Options
- ✅ X-Frame-Options
- ✅ X-XSS-Protection
- ✅ Referrer-Policy
- ✅ Permissions-Policy
- ✅ Cross-Origin-Embedder-Policy
- ✅ Cross-Origin-Opener-Policy
- ✅ Cross-Origin-Resource-Policy

### Online Testing Tools

- **Security Headers**: https://securityheaders.com/
- **Mozilla Observatory**: https://observatory.mozilla.org/
- **SSL Labs**: https://www.ssllabs.com/ssltest/
- **HSTS Preload**: https://hstspreload.org/

---

## 7. Monitoring

### CSP Violation Monitoring

Violations are logged to:
- **Logs**: Application logs (WARNING level)
- **Endpoint**: `POST /api/security/csp-report`
- **Format**: JSON

Example violation:
```json
{
  "csp-report": {
    "document-uri": "https://yourcompany.com/dashboard",
    "violated-directive": "script-src 'self'",
    "blocked-uri": "https://malicious-site.com/script.js",
    "disposition": "enforce"
  }
}
```

### Setting Up Monitoring

1. **Log to Database** (optional):
   ```python
   # Store violations for analysis
   await store_csp_violation(violation_report)
   ```

2. **Alert on Critical Violations**:
   ```python
   if violation_severity == "critical":
       await send_security_alert(violation)
   ```

3. **Dashboard Metrics**:
   - Violations per day
   - Most common violations
   - Blocked domains
   - Affected pages

### Security Metrics

Monitor:
- HSTS adoption rate
- CSP violation rate
- Failed CORS requests
- Blocked XSS attempts
- Clickjacking attempts

---

## 8. Troubleshooting

### Issue: HSTS Not Working

**Symptoms**: HSTS header not present

**Causes**:
1. HTTP connection (HSTS only on HTTPS)
2. Middleware not added
3. HSTS disabled in config

**Solution**:
```python
# Verify HTTPS
request.url.scheme == "https"

# Check middleware order
app.add_middleware(SecurityHeadersMiddleware, ...)  # Add FIRST

# Check config
hsts_enabled = True
```

---

### Issue: CSP Blocking Legitimate Resources

**Symptoms**: Resources not loading, console errors

**Causes**:
1. Too restrictive CSP
2. Missing domain in whitelist

**Solution**:
```python
# Add domain to CSP
"script-src": ["'self'", "https://trusted-domain.com"]

# Or use report-only mode first
Content-Security-Policy-Report-Only: ...
```

---

### Issue: CORS Errors

**Symptoms**: Cross-origin requests blocked

**Causes**:
1. Origin not in allowed list
2. Credentials without specific origin
3. Preflight not handled

**Solution**:
```python
# Add origin to whitelist
allowed_origins = ["https://frontend.com"]

# Don't use * with credentials
allow_credentials = True  # Requires specific origins
```

---

## 9. Best Practices

### Security Headers Checklist

- ✅ HSTS with preload (production)
- ✅ CSP with nonces (not unsafe-inline)
- ✅ CORS whitelisting (no wildcards)
- ✅ All additional headers enabled
- ✅ CSP violation monitoring
- ✅ Regular security audits
- ✅ HTTPS everywhere
- ✅ Certificate validation

### Deployment Checklist

- [ ] Test in staging with production config
- [ ] Verify all headers present
- [ ] Test frontend compatibility
- [ ] Monitor CSP violations (report-only)
- [ ] Enable enforcement mode
- [ ] Submit to HSTS preload list
- [ ] Document header policies
- [ ] Train team on CSP/CORS

---

## 10. Summary

**All security headers have been implemented:**

✅ **HSTS** - Forces HTTPS, prevents downgrade attacks  
✅ **CSP** - Prevents XSS, controls resource loading  
✅ **X-Content-Type-Options** - Prevents MIME sniffing  
✅ **X-Frame-Options** - Prevents clickjacking  
✅ **X-XSS-Protection** - Legacy XSS protection  
✅ **Referrer-Policy** - Controls referrer info  
✅ **Permissions-Policy** - Controls browser features  
✅ **Cross-Origin Policies** - COEP, COOP, CORP  
✅ **Additional Headers** - X-Permitted-Cross-Domain-Policies, etc.  
✅ **CORS Security** - Whitelisted origins, secure configuration  

**The application now has enterprise-grade security headers protection!**

---

**Last Updated**: 2025-11-05  
**Version**: 1.0  
**Maintained By**: Security Team
