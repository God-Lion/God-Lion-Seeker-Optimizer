# Security Headers Implementation Guide

## Overview

This document outlines the comprehensive security headers implemented to protect the God Lion Seeker Optimizer application from common web vulnerabilities.

## Implemented Security Headers

### 1. Content Security Policy (CSP)

**Purpose**: Prevents Cross-Site Scripting (XSS) attacks by controlling which resources can be loaded.

**Implementation**:
```
Content-Security-Policy: default-src 'self'; 
  script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: https:; 
  font-src 'self' data:; 
  connect-src 'self' https://api.godlionseeker.com; 
  frame-ancestors 'none'; 
  base-uri 'self'; 
  form-action 'self';
```

**What it does**:
- `default-src 'self'` - Only load resources from the same origin
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'` - Allow scripts from same origin, inline scripts, and eval (required for React)
- `style-src 'self' 'unsafe-inline'` - Allow styles from same origin and inline styles
- `img-src 'self' data: https:` - Allow images from same origin, data URIs, and HTTPS
- `font-src 'self' data:` - Allow fonts from same origin and data URIs
- `connect-src 'self' https://api.godlionseeker.com` - Allow API calls to specified domains
- `frame-ancestors 'none'` - Prevent the page from being framed (prevents clickjacking)
- `base-uri 'self'` - Restrict base tag to same origin
- `form-action 'self'` - Forms can only submit to same origin

**Notes**:
- `'unsafe-inline'` and `'unsafe-eval'` are necessary for React/Vite builds
- For stricter security, consider using nonces or hashes for scripts
- Update `connect-src` to include all legitimate API endpoints

### 2. HTTP Strict Transport Security (HSTS)

**Purpose**: Forces browsers to only communicate via HTTPS.

**Implementation**:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**What it does**:
- `max-age=31536000` - Browser remembers to use HTTPS for 1 year
- `includeSubDomains` - Apply to all subdomains
- `preload` - Allow inclusion in browser HSTS preload lists

**Important**: Only enable when you have a valid SSL certificate!

### 3. X-Frame-Options

**Purpose**: Prevents clickjacking attacks by controlling if the page can be embedded in frames.

**Implementation**:
```
X-Frame-Options: DENY
```

**What it does**:
- `DENY` - Page cannot be displayed in a frame/iframe at all
- Alternative: `SAMEORIGIN` - Only allow framing from same origin

### 4. X-Content-Type-Options

**Purpose**: Prevents MIME type sniffing.

**Implementation**:
```
X-Content-Type-Options: nosniff
```

**What it does**:
- Forces browser to respect declared Content-Type
- Prevents execution of files with incorrect MIME types

### 5. X-XSS-Protection

**Purpose**: Enables browser's XSS filtering.

**Implementation**:
```
X-XSS-Protection: 1; mode=block
```

**What it does**:
- `1` - Enable XSS filtering
- `mode=block` - Block the page if XSS attack is detected

**Note**: This header is deprecated in favor of CSP, but still useful for older browsers.

### 6. Referrer-Policy

**Purpose**: Controls how much referrer information is sent with requests.

**Implementation**:
```
Referrer-Policy: strict-origin-when-cross-origin
```

**What it does**:
- Sends full URL for same-origin requests
- Sends only origin for cross-origin requests over HTTPS
- Sends nothing when downgrading from HTTPS to HTTP

### 7. Permissions-Policy

**Purpose**: Controls which browser features can be used.

**Implementation**:
```
Permissions-Policy: geolocation=(), microphone=(), camera=(), 
  payment=(), usb=(), magnetometer=(), gyroscope=(), 
  accelerometer=(), autoplay=(), encrypted-media=(), 
  picture-in-picture=()
```

**What it does**:
- Disables unnecessary browser features that could be exploited
- `()` means no origins are allowed to use these features

## Configuration Files

### Development: `client/nginx.conf`
- Basic security headers
- HSTS commented out (no SSL in development)
- Suitable for local development

### Production: `client/nginx.production.conf`
- Full security headers including HSTS
- SSL/TLS configuration
- HTTP to HTTPS redirect
- Optimized caching and compression

### Reusable: `nginx/security-headers.conf`
- Include file for consistent headers across server blocks
- Can be imported with: `include /etc/nginx/security-headers.conf;`

## Deployment Checklist

### Before Going to Production:

1. **SSL Certificate**
   - [ ] Obtain valid SSL certificate
   - [ ] Configure certificate paths in nginx
   - [ ] Test SSL configuration

2. **Update CSP Directives**
   - [ ] Update `connect-src` with production API URL
   - [ ] Review and tighten other directives if possible
   - [ ] Test application thoroughly

3. **Enable HSTS**
   - [ ] Uncomment HSTS header in production config
   - [ ] Start with shorter `max-age` (e.g., 86400 = 1 day)
   - [ ] Gradually increase after confirming everything works

4. **Test Security Headers**
   - [ ] Use [securityheaders.com](https://securityheaders.com)
   - [ ] Use browser DevTools to check for CSP violations
   - [ ] Test all application features

5. **Configure Environment Variables**
   - [ ] Set `VITE_API_URL` to production HTTPS endpoint
   - [ ] Verify all API calls use HTTPS

## Testing Security Headers

### Using curl:
```bash
curl -I https://godlionseeker.com
```

### Using browser DevTools:
1. Open Network tab
2. Select the main document
3. Check Response Headers

### Online Tools:
- [Security Headers](https://securityheaders.com)
- [Mozilla Observatory](https://observatory.mozilla.org)
- [SSL Labs](https://www.ssllabs.com/ssltest/)

## Common Issues and Solutions

### Issue: CSP Violations in Console

**Symptoms**: Console errors about blocked resources

**Solutions**:
1. Identify the blocked resource in DevTools
2. Add appropriate directive to CSP
3. For third-party resources, add domain to relevant directive

### Issue: Application Broken After Enabling CSP

**Symptoms**: JavaScript not executing, styles not loading

**Solutions**:
1. Check for inline scripts/styles
2. Temporarily use `'unsafe-inline'` and `'unsafe-eval'`
3. For production, implement nonces or move inline code to files

### Issue: HSTS Causing Issues

**Symptoms**: Can't access site after disabling SSL

**Solutions**:
1. Clear browser HSTS cache
2. Chrome: `chrome://net-internals/#hsts`
3. Use shorter `max-age` during testing

## Monitoring and Maintenance

### Regular Checks:
- Monitor CSP violation reports
- Review security header scores monthly
- Keep up with security best practices
- Update directives as application evolves

### CSP Reporting:
To enable CSP violation reporting, add:
```
Content-Security-Policy: ... ; report-uri /csp-report
```

## Resources

- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [Security Headers Quick Reference](https://securityheaders.com)

## Contact

For security concerns or questions, contact the development team.
