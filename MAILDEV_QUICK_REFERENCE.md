# MailDev Quick Reference

## Quick Start

### Option 1: Full Development Stack
```bash
dev-start.bat
```
Access MailDev at: **http://localhost:1080**

### Option 2: MailDev Only
```bash
maildev-start.bat
```

### Option 3: Docker Command
```bash
docker run -p 1080:1080 -p 1025:1025 maildev/maildev
```

---

## Configuration

### Application Settings (.env)
```env
EMAIL_ENABLED=true
SMTP_SERVER=localhost
SMTP_PORT=1025
SMTP_USE_TLS=false
SMTP_USE_SSL=false
SENDER_EMAIL=noreply@godlionseeker.local
```

### Docker Compose (Integrated)
```yaml
maildev:
  image: maildev/maildev:latest
  ports:
    - "1025:1025"  # SMTP
    - "1080:1080"  # Web UI
```

---

## Testing Email Flows

### 1. User Registration
1. Register at http://localhost:8080/auth/signup
2. Check MailDev: http://localhost:1080
3. Click verification email
4. Copy verification link
5. Verify account

### 2. Password Reset
1. Request reset at http://localhost:8080/auth/forgot-password
2. Check MailDev for reset email
3. Click reset link
4. Set new password

### 3. Job Notifications
1. Enable notifications in settings
2. Run job scraper
3. Check MailDev for notification emails

---

## Common Commands

### View Emails
```bash
# Web UI
http://localhost:1080

# API - Get all emails
curl http://localhost:1080/email

# API - Get specific email
curl http://localhost:1080/email/{id}

# API - Delete all emails
curl -X DELETE http://localhost:1080/email/all
```

### Container Management
```bash
# Check status
docker ps | grep maildev

# View logs
docker logs godlionseeker-maildev -f

# Restart
docker-compose restart maildev

# Stop
docker-compose stop maildev
```

---

## Troubleshooting

### Emails Not Appearing
1. Check MailDev is running:
   ```bash
   docker ps | grep maildev
   ```

2. Verify SMTP settings in `.env`:
   ```env
   EMAIL_ENABLED=true
   SMTP_SERVER=maildev  # or localhost
   SMTP_PORT=1025
   ```

3. Check API logs:
   ```bash
   docker logs godlionseeker-api | grep -i email
   ```

### MailDev UI Not Loading
1. Check port is open:
   ```bash
   netstat -an | findstr 1080
   ```

2. Try different browser or incognito mode

3. Restart MailDev:
   ```bash
   docker-compose restart maildev
   ```

### SMTP Connection Failed
1. Verify network connectivity:
   ```bash
   # From API container
   docker exec godlionseeker-api ping maildev
   ```

2. Check firewall settings

3. Ensure MailDev is on same Docker network

---

## Ports Reference

| Port | Service | URL |
|------|---------|-----|
| 1025 | SMTP Server | `smtp://localhost:1025` |
| 1080 | Web UI | http://localhost:1080 |

---

## Advanced Usage

### Send Test Email via Python
```python
import smtplib
from email.mime.text import MIMEText

msg = MIMEText('Test email body')
msg['Subject'] = 'Test Email'
msg['From'] = 'test@example.com'
msg['To'] = 'user@example.com'

server = smtplib.SMTP('localhost', 1025)
server.send_message(msg)
server.quit()

# Check http://localhost:1080
```

### Send Test Email via cURL
```bash
curl -X POST http://localhost:1080/email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@example.com",
    "to": "user@example.com",
    "subject": "Test Email",
    "text": "This is a test email"
  }'
```

### MailDev REST API
```javascript
// Get all emails
fetch('http://localhost:1080/email')
  .then(res => res.json())
  .then(emails => console.log(emails))

// Get latest email
fetch('http://localhost:1080/email')
  .then(res => res.json())
  .then(emails => emails[0])

// Delete all emails
fetch('http://localhost:1080/email/all', { method: 'DELETE' })
```

---

## Email Templates Available

1. **Email Verification** - Account activation
2. **Password Reset** - Secure password reset
3. **Job Notification** - New job matches
4. **Application Status** - Application updates
5. **Daily Summary** - Daily digest email

All templates support:
- HTML rendering
- Plain text fallback
- Responsive design
- Personalization

---

## Production vs Development

| Setting | Development | Production |
|---------|-------------|------------|
| SMTP Server | localhost/maildev | smtp.gmail.com |
| Port | 1025 | 587 |
| TLS | false | true |
| Authentication | none | required |
| Web UI | http://localhost:1080 | N/A |

---

## Resources

- MailDev GitHub: https://github.com/maildev/maildev
- Documentation: `DOCS/MAILDEV_SETUP.md`
- Email Service: `src/notifications/email_service.py`
- Email Templates: `src/notifications/email_templates.py`

---

**Need more help? Check the full documentation in `DOCS/MAILDEV_SETUP.md`**
