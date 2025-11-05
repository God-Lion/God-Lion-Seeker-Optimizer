# Development Environment Setup with MailDev

This guide will help you set up the complete development environment with MailDev for email testing.

## Quick Start

### Option 1: Use Docker Compose (Recommended)

The project includes MailDev in `docker-compose.override.yml` for automatic setup:

```bash
# 1. Copy development environment variables
copy .env.development .env

# 2. Start all services (API, Database, Redis, MailDev, etc.)
docker-compose up -d

# 3. Access the services
# - API: http://localhost:8000
# - Frontend: http://localhost:8080
# - MailDev Web UI: http://localhost:1080
# - PgAdmin: http://localhost:5050
# - Redis Commander: http://localhost:8081
```

### Option 2: Run MailDev Standalone

If you want to run MailDev separately:

```bash
# Run MailDev container
docker run -p 1080:1080 -p 1025:1025 maildev/maildev

# Access MailDev Web UI
# http://localhost:1080
```

---

## MailDev Configuration

### What is MailDev?

MailDev is a simple SMTP server with a web UI for viewing and testing emails during development. It's perfect for:
- Testing email verification flows
- Previewing email templates
- Debugging email content
- Testing without sending real emails

### Ports

- **1025**: SMTP server (for sending emails)
- **1080**: Web UI (for viewing emails)

### Features

✅ **Modern Web Interface** - Beautiful UI for viewing emails  
✅ **HTML & Plain Text Preview** - View emails in both formats  
✅ **Attachment Support** - Download and view email attachments  
✅ **REST API** - Programmatically access emails  
✅ **Auto-Refresh** - Automatically updates when new emails arrive  
✅ **Mobile Friendly** - Responsive design  

---

## Email Testing Workflow

### 1. Configure Application

The `.env.development` file is pre-configured:

```env
# MailDev SMTP Configuration
EMAIL_ENABLED=true
SMTP_SERVER=maildev
SMTP_PORT=1025
SMTP_USE_TLS=false
SMTP_USE_SSL=false
SENDER_EMAIL=noreply@godlionseeker.local
```

### 2. Start Services

```bash
# Using Docker Compose (includes MailDev)
docker-compose up -d

# Or standalone MailDev
docker run -p 1080:1080 -p 1025:1025 maildev/maildev
```

### 3. Test Email Features

#### A. Email Verification
```bash
# 1. Register a new user via API or frontend
# 2. Open MailDev: http://localhost:1080
# 3. Click on the verification email
# 4. Copy the verification link
# 5. Open in browser to verify
```

#### B. Password Reset
```bash
# 1. Request password reset
# 2. Check MailDev for reset email
# 3. Click reset link
# 4. Set new password
```

#### C. Job Notifications
```bash
# 1. Enable job notifications in user settings
# 2. Run job scraper
# 3. Check MailDev for notification emails
# 4. Verify email content and formatting
```

### 4. View Emails in MailDev

Open your browser to: **http://localhost:1080**

You'll see:
- List of all sent emails
- Email preview (HTML and plain text)
- Email headers
- Attachments (if any)
- Source code

---

## API Email Service Integration

The application's email service (`src/notifications/email_service.py`) automatically uses the SMTP settings from `.env`:

```python
# Example: Sending verification email
from src.notifications.email_service import email_service

await email_service.send_verification_email(
    to_email="user@example.com",
    verification_token="abc123",
    user_name="John Doe"
)

# Email will appear in MailDev at http://localhost:1080
```

---

## Development Services Overview

When using `docker-compose up -d`, you get:

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **API** | 8000 | http://localhost:8000 | FastAPI backend |
| **Frontend** | 8080 | http://localhost:8080 | React application |
| **MailDev UI** | 1080 | http://localhost:1080 | Email viewer |
| **MailDev SMTP** | 1025 | localhost:1025 | SMTP server |
| **PostgreSQL** | 5432 | localhost:5432 | Database |
| **Redis** | 6379 | localhost:6379 | Cache |
| **PgAdmin** | 5050 | http://localhost:5050 | DB management |
| **Redis Commander** | 8081 | http://localhost:8081 | Redis management |
| **Prometheus** | 9090 | http://localhost:9090 | Metrics |
| **Grafana** | 3000 | http://localhost:3000 | Dashboards |

---

## Email Template Testing

### Available Email Templates

The application includes these email templates:

1. **Email Verification** (`email_templates.py:EmailVerificationTemplate`)
   - Beautiful HTML template
   - Verification button
   - Fallback plain text

2. **Password Reset** (`email_templates.py:PasswordResetTemplate`)
   - Secure reset link
   - Expiration notice
   - Security tips

3. **Job Notification** (`email_templates.py:JobNotificationTemplate`)
   - Job matches
   - Company details
   - Apply button

4. **Application Status** (`email_templates.py:ApplicationStatusTemplate`)
   - Status updates
   - Next steps
   - Contact info

### Testing Templates

```python
# Test verification email
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "full_name": "Test User"
  }'

# Check MailDev: http://localhost:1080
```

---

## MailDev API

MailDev provides a REST API for automation:

### Get All Emails
```bash
curl http://localhost:1080/email
```

### Get Specific Email
```bash
curl http://localhost:1080/email/{id}
```

### Delete All Emails
```bash
curl -X DELETE http://localhost:1080/email/all
```

### Example: Automated Testing
```python
import requests

# Get latest email
response = requests.get('http://localhost:1080/email')
emails = response.json()
latest_email = emails[0] if emails else None

# Extract verification link
if latest_email:
    html = latest_email['html']
    # Parse verification link from HTML
```

---

## Troubleshooting

### Emails Not Appearing in MailDev

**Check 1: MailDev is running**
```bash
docker ps | grep maildev
# Should show: godlionseeker-maildev
```

**Check 2: SMTP configuration in .env**
```env
EMAIL_ENABLED=true
SMTP_SERVER=maildev  # Must match container name
SMTP_PORT=1025
```

**Check 3: Network connectivity**
```bash
# From API container
docker exec godlionseeker-api ping maildev
# Should succeed
```

**Check 4: API logs**
```bash
docker logs godlionseeker-api | grep -i email
# Look for SMTP errors
```

### MailDev UI Not Accessible

**Check 1: Port binding**
```bash
docker ps | grep 1080
# Port 1080 should be mapped
```

**Check 2: Firewall**
- Ensure Windows Firewall allows port 1080
- Check antivirus software

**Check 3: Container status**
```bash
docker logs godlionseeker-maildev
# Should show: MailDev webapp running at http://0.0.0.0:1080
```

### Emails Slow to Send

**Check 1: SMTP connection**
```python
# In Python console
import smtplib
server = smtplib.SMTP('localhost', 1025)
server.set_debuglevel(1)
server.sendmail('test@test.com', ['user@test.com'], 'Test')
server.quit()
```

**Check 2: Email service logs**
```bash
docker logs godlionseeker-api -f
# Watch for email sending
```

---

## Best Practices

### 1. Clear Emails Regularly
```bash
# Delete all emails via MailDev UI
# Or via API
curl -X DELETE http://localhost:1080/email/all
```

### 2. Test All Email Flows
- [ ] User registration verification
- [ ] Password reset
- [ ] Job match notifications
- [ ] Application status updates
- [ ] Daily summary emails

### 3. Verify Email Content
- [ ] Subject line is correct
- [ ] Recipient email is correct
- [ ] HTML rendering is proper
- [ ] Links work correctly
- [ ] Images load (if any)
- [ ] Plain text fallback exists

### 4. Test Error Handling
- [ ] Invalid email addresses
- [ ] SMTP connection failures
- [ ] Template rendering errors
- [ ] Missing variables

---

## Production vs Development

| Setting | Development (MailDev) | Production |
|---------|----------------------|------------|
| SMTP_SERVER | maildev | smtp.gmail.com |
| SMTP_PORT | 1025 | 587 |
| SMTP_USE_TLS | false | true |
| EMAIL_ENABLED | true | true |
| SENDER_EMAIL | noreply@local | real@domain.com |
| SENDER_PASSWORD | (empty) | (real password) |

⚠️ **Never commit production credentials to git!**

---

## Advanced Configuration

### Custom MailDev Settings

Edit `docker-compose.override.yml`:

```yaml
maildev:
  image: maildev/maildev:latest
  ports:
    - "1025:1025"
    - "1080:1080"
  command: >
    --hide-extensions STARTTLS
    --web-user admin
    --web-pass secret123
    --auto-relay
```

### Environment Variables

MailDev supports these environment variables:

```yaml
environment:
  - MAILDEV_SMTP_PORT=1025
  - MAILDEV_WEB_PORT=1080
  - MAILDEV_INCOMING_USER=smtp_user
  - MAILDEV_INCOMING_PASS=smtp_pass
```

### Auto-Relay to Real Email

For testing with real email delivery:

```yaml
command: >
  --auto-relay
  --auto-relay-host smtp.gmail.com
  --auto-relay-port 587
  --auto-relay-user your@gmail.com
  --auto-relay-pass yourpassword
```

---

## Integration with Frontend

### Testing Email Verification Flow

1. **Register User**
   ```bash
   # Via frontend
   http://localhost:8080/auth/signup
   
   # Enter email: test@example.com
   ```

2. **Check MailDev**
   ```bash
   # Open http://localhost:1080
   # Click verification email
   ```

3. **Copy Verification Link**
   ```
   http://localhost:8080/auth/verify-email/abc123...
   ```

4. **Verify Account**
   - Paste link in browser
   - Account activated

### Testing Password Reset

1. **Request Reset**
   ```bash
   http://localhost:8080/auth/forgot-password
   ```

2. **Check MailDev**
   ```bash
   http://localhost:1080
   ```

3. **Click Reset Link**
   ```bash
   http://localhost:8080/auth/reset-password/xyz789...
   ```

---

## Summary

✅ **MailDev is configured** in `docker-compose.override.yml`  
✅ **Environment ready** with `.env.development`  
✅ **Ports configured** - SMTP: 1025, Web UI: 1080  
✅ **Email templates** pre-built and tested  
✅ **Integration complete** with notification service  

### Quick Commands

```bash
# Start everything
docker-compose up -d

# View MailDev
http://localhost:1080

# Check API logs
docker logs godlionseeker-api -f

# Stop everything
docker-compose down

# Restart just MailDev
docker-compose restart maildev
```

---

**You're ready to develop with full email testing capabilities! 🚀**
