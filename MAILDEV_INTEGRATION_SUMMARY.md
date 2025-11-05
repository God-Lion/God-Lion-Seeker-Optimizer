# MailDev Integration Summary

## Overview
Successfully integrated **MailDev** as the email testing solution for development environment.

---

## What Was Done

### 1. ✅ Updated Docker Compose Configuration
**File:** `docker-compose.override.yml`

**Changes:**
- Replaced Mailhog with MailDev
- Configured ports: 1025 (SMTP), 1080 (Web UI)
- Added to scraper-network
- Set auto-restart policy

**Before:**
```yaml
mailhog:
  image: mailhog/mailhog:latest
  ports:
    - "1025:1025"
    - "8025:8025"
```

**After:**
```yaml
maildev:
  image: maildev/maildev:latest
  ports:
    - "1025:1025"  # SMTP server
    - "1080:1080"  # Web UI
  command: --hide-extensions STARTTLS
```

---

### 2. ✅ Created Development Environment Configuration
**File:** `.env.development`

**Configuration:**
- MailDev SMTP settings
- PostgreSQL connection
- Redis configuration
- Email templates settings
- All development tool URLs

**Key Settings:**
```env
EMAIL_ENABLED=true
SMTP_SERVER=maildev
SMTP_PORT=1025
SMTP_USE_TLS=false
SENDER_EMAIL=noreply@godlionseeker.local
```

---

### 3. ✅ Created Comprehensive Documentation
**File:** `DOCS/MAILDEV_SETUP.md`

**Contents:**
- Quick start guide
- MailDev features overview
- Email testing workflow
- Service integration details
- Troubleshooting guide
- Best practices
- Production vs development comparison

---

### 4. ✅ Created Quick Reference Guide
**File:** `MAILDEV_QUICK_REFERENCE.md`

**Contents:**
- Quick start commands
- Configuration snippets
- Common commands
- Troubleshooting tips
- API usage examples

---

### 5. ✅ Created Development Scripts

#### dev-start.bat
- Checks Docker status
- Creates .env from .env.development
- Starts all development services
- Verifies service health
- Shows access URLs

#### dev-stop.bat
- Stops all development services
- Clean shutdown

#### maildev-start.bat
- Runs MailDev standalone
- Opens web UI in browser
- Shows logs

#### maildev-stop.bat
- Stops standalone MailDev

---

## File Summary

### New Files Created (7)
1. `.env.development` - Development environment variables
2. `DOCS/MAILDEV_SETUP.md` - Comprehensive setup guide
3. `MAILDEV_QUICK_REFERENCE.md` - Quick reference card
4. `dev-start.bat` - Start development environment
5. `dev-stop.bat` - Stop development environment
6. `maildev-start.bat` - Start MailDev standalone
7. `maildev-stop.bat` - Stop MailDev standalone

### Modified Files (1)
1. `docker-compose.override.yml` - Replaced Mailhog with MailDev

---

## How to Use

### Quick Start (Recommended)
```bash
# 1. Start everything
dev-start.bat

# 2. Access services
# - Frontend: http://localhost:8080
# - MailDev:  http://localhost:1080
# - API:      http://localhost:8000

# 3. Stop when done
dev-stop.bat
```

### MailDev Only
```bash
# Start MailDev standalone
maildev-start.bat

# Configure app to use localhost:1025

# Stop when done
maildev-stop.bat
```

### Manual Docker Command
```bash
docker run -p 1080:1080 -p 1025:1025 maildev/maildev
```

---

## MailDev Features

### ✅ Benefits Over Mailhog

| Feature | MailDev | Mailhog |
|---------|---------|---------|
| Modern UI | ✅ Beautiful | ⚠️ Basic |
| Active Development | ✅ Yes | ❌ Archived |
| REST API | ✅ Full API | ⚠️ Limited |
| Mobile Friendly | ✅ Yes | ❌ No |
| Auto-Refresh | ✅ Yes | ❌ No |
| Docker Image Size | ✅ Smaller | ⚠️ Larger |
| Email Search | ✅ Yes | ❌ No |
| Attachment Preview | ✅ Yes | ⚠️ Basic |

### Key Features
- **Modern Web Interface** - Beautiful, responsive UI
- **HTML & Plain Text Preview** - View emails in both formats
- **Attachment Support** - Download and view attachments
- **REST API** - Programmatic access to emails
- **Auto-Refresh** - Real-time email updates
- **Email Search** - Find emails quickly
- **Mobile Friendly** - Works on all devices
- **Lightweight** - Fast and efficient

---

## Testing Workflow

### 1. User Registration Flow
```
1. User registers → http://localhost:8080/auth/signup
2. API sends email → SMTP to localhost:1025
3. MailDev receives → Email appears in http://localhost:1080
4. User clicks link → Verification completes
```

### 2. Password Reset Flow
```
1. User requests reset → http://localhost:8080/auth/forgot-password
2. API sends email → SMTP to localhost:1025
3. User checks MailDev → http://localhost:1080
4. User clicks link → Password reset page opens
5. User sets new password → Account updated
```

### 3. Job Notification Flow
```
1. Job scraper runs → Finds matching jobs
2. API sends notification → SMTP to localhost:1025
3. Email in MailDev → http://localhost:1080
4. User views jobs → Clicks through to apply
```

---

## Access URLs

When running `dev-start.bat`, you get:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:8080 | React application |
| **API Docs** | http://localhost:8000/docs | OpenAPI documentation |
| **MailDev** | http://localhost:1080 | Email testing UI |
| **PgAdmin** | http://localhost:5050 | Database management |
| **Redis Commander** | http://localhost:8081 | Redis management |
| **Prometheus** | http://localhost:9090 | Metrics |
| **Grafana** | http://localhost:3000 | Dashboards |

---

## Configuration Reference

### Email Service Configuration
The application's email service (`src/notifications/email_service.py`) reads from environment variables:

```python
SMTP_SERVER = os.getenv('SMTP_SERVER', 'localhost')
SMTP_PORT = int(os.getenv('SMTP_PORT', '1025'))
SMTP_USE_TLS = os.getenv('SMTP_USE_TLS', 'false').lower() == 'true'
SENDER_EMAIL = os.getenv('SENDER_EMAIL', 'noreply@godlionseeker.local')
```

### Docker Network
MailDev is on the `scraper-network`, allowing API container to reach it:

```yaml
networks:
  scraper-network:
    driver: bridge
```

From API container:
- Hostname: `maildev`
- Port: `1025`

From host machine:
- Hostname: `localhost`
- Port: `1025`

---

## Troubleshooting Quick Fix

### Problem: Emails not appearing
**Solution:**
```bash
# 1. Check MailDev is running
docker ps | grep maildev

# 2. Restart MailDev
docker-compose restart maildev

# 3. Check API logs
docker logs godlionseeker-api | findstr email
```

### Problem: MailDev UI not loading
**Solution:**
```bash
# 1. Check port binding
docker ps | findstr 1080

# 2. Try different browser

# 3. Restart MailDev
docker-compose restart maildev
```

### Problem: SMTP connection failed
**Solution:**
```env
# Verify .env settings
EMAIL_ENABLED=true
SMTP_SERVER=maildev  # Must match container name in docker-compose
SMTP_PORT=1025
SMTP_USE_TLS=false
```

---

## Development vs Production

### Development (MailDev)
```env
EMAIL_ENABLED=true
SMTP_SERVER=maildev
SMTP_PORT=1025
SMTP_USE_TLS=false
SENDER_EMAIL=noreply@godlionseeker.local
SENDER_PASSWORD=
```

### Production (Gmail/SendGrid/etc.)
```env
EMAIL_ENABLED=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USE_TLS=true
SENDER_EMAIL=your-email@gmail.com
SENDER_PASSWORD=your-app-password
```

⚠️ **Never commit production credentials to git!**

---

## Next Steps

### For Development
1. Run `dev-start.bat`
2. Register a user at http://localhost:8080
3. Check email in MailDev at http://localhost:1080
4. Verify the account
5. Start developing!

### For Testing Email Templates
1. Modify email templates in `src/notifications/email_templates.py`
2. Trigger email sending (register, reset password, etc.)
3. Check MailDev to preview the email
4. Iterate until perfect

### For API Integration
1. Use email service in your routes:
   ```python
   from src.notifications.email_service import email_service
   
   await email_service.send_verification_email(
       to_email=user.email,
       verification_token=token,
       user_name=user.full_name
   )
   ```

2. Check MailDev to verify email was sent

---

## Resources

### Documentation
- Full Setup Guide: `DOCS/MAILDEV_SETUP.md`
- Quick Reference: `MAILDEV_QUICK_REFERENCE.md`
- Email Service: `src/notifications/email_service.py`
- Email Templates: `src/notifications/email_templates.py`

### External Links
- MailDev GitHub: https://github.com/maildev/maildev
- Docker Image: https://hub.docker.com/r/maildev/maildev
- Email Testing Best Practices: https://github.com/maildev/maildev/wiki

---

## Summary

✅ **MailDev integrated** - Replaces Mailhog  
✅ **Scripts created** - Easy start/stop  
✅ **Documentation complete** - Full guides available  
✅ **Development ready** - All services configured  
✅ **Testing enabled** - Email flows ready to test  

**You can now run `dev-start.bat` and start developing with full email testing capabilities! 🚀**

---

**Integration Date:** 2025-01-05  
**Status:** ✅ Complete and Ready  
**MailDev Version:** Latest (from Docker Hub)
