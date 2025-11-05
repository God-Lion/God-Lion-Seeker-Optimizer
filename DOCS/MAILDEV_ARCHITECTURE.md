# MailDev Development Architecture

## System Architecture with MailDev

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Development Environment                          │
│                                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Browser    │    │   Browser    │    │   Browser    │          │
│  │              │    │              │    │              │          │
│  │  Frontend    │    │   MailDev    │    │   PgAdmin    │          │
│  │  :8080       │    │   :1080      │    │   :5050      │          │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘          │
│         │                   │                    │                   │
│         │                   │                    │                   │
│         ▼                   ▼                    ▼                   │
│  ┌──────────────────────────────────────────────────────┐          │
│  │                  Docker Network                       │          │
│  │             (scraper-network)                         │          │
│  │                                                        │          │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │          │
│  │  │  React   │  │ MailDev  │  │ PgAdmin  │           │          │
│  │  │  Client  │  │          │  │          │           │          │
│  │  │  :8080   │  │  :1080   │  │  :5050   │           │          │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘           │          │
│  │       │             │             │                   │          │
│  │       │             │             │                   │          │
│  │       ▼             │             ▼                   │          │
│  │  ┌──────────┐      │        ┌──────────┐            │          │
│  │  │ FastAPI  │◄─────┘        │PostgreSQL│            │          │
│  │  │   API    │───────────────►│   DB     │            │          │
│  │  │  :8000   │  SMTP :1025   │  :5432   │            │          │
│  │  └────┬─────┘               └──────────┘            │          │
│  │       │                                               │          │
│  │       │                                               │          │
│  │       ▼                                               │          │
│  │  ┌──────────┐                                        │          │
│  │  │  Redis   │                                        │          │
│  │  │  Cache   │                                        │          │
│  │  │  :6379   │                                        │          │
│  │  └──────────┘                                        │          │
│  │                                                        │          │
│  └────────────────────────────────────────────────────────┘          │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Email Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Email Testing Flow                            │
└─────────────────────────────────────────────────────────────────────┘

1. USER REGISTRATION
   ┌──────────┐
   │  User    │
   │ Registers│
   └────┬─────┘
        │
        ▼
   ┌──────────────────┐
   │  Frontend (React)│
   │  :8080          │
   └────┬─────────────┘
        │ POST /api/auth/register
        ▼
   ┌──────────────────┐
   │  Backend (API)   │
   │  :8000          │
   └────┬─────────────┘
        │
        │ 1. Create user in DB
        │ 2. Generate verification token
        │ 3. Send email via SMTP
        │
        ▼
   ┌──────────────────┐
   │    MailDev       │
   │  SMTP Server     │
   │  :1025          │
   └────┬─────────────┘
        │
        │ Email stored in memory
        │
        ▼
   ┌──────────────────┐
   │    MailDev       │
   │    Web UI        │
   │  :1080          │
   └────┬─────────────┘
        │
        ▼
   ┌──────────────────┐
   │  Developer       │
   │  Views Email     │
   └──────────────────┘
        │
        │ Click verification link
        │
        ▼
   ┌──────────────────┐
   │  Frontend        │
   │  /verify-email   │
   └────┬─────────────┘
        │
        ▼
   ┌──────────────────┐
   │  Backend         │
   │  Verifies Token  │
   └────┬─────────────┘
        │
        ▼
   ┌──────────────────┐
   │  User Activated! │
   └──────────────────┘
```

---

## Port Mapping

```
Host Machine                Docker Container
─────────────────────────────────────────────────────

localhost:8080     ─────►   client:80           (React Frontend)
localhost:8000     ─────►   api:8000            (FastAPI Backend)
localhost:1080     ─────►   maildev:1080        (MailDev Web UI)
localhost:1025     ─────►   maildev:1025        (MailDev SMTP)
localhost:5432     ─────►   postgres:5432       (PostgreSQL)
localhost:6379     ─────►   redis:6379          (Redis)
localhost:5050     ─────►   pgadmin:80          (PgAdmin)
localhost:8081     ─────►   redis-commander:8081(Redis Commander)
localhost:9090     ─────►   prometheus:9090     (Prometheus)
localhost:3000     ─────►   grafana:3000        (Grafana)
```

---

## SMTP Email Path

```
┌────────────────────────────────────────────────────────────┐
│  Email Sending Flow (Development)                          │
└────────────────────────────────────────────────────────────┘

Application Code
(src/notifications/email_service.py)
        │
        │ 1. Create email message
        │    - To: user@example.com
        │    - Subject: Verify your email
        │    - HTML body with template
        │
        ▼
┌──────────────────────┐
│  SMTP Client         │
│  smtplib.SMTP()      │
└──────────────────────┘
        │
        │ 2. Connect to SMTP server
        │    - Host: maildev (in Docker) or localhost
        │    - Port: 1025
        │    - TLS: False (dev only)
        │
        ▼
┌──────────────────────┐
│  MailDev SMTP Server │
│  :1025               │
└──────────────────────┘
        │
        │ 3. Store email in memory
        │    - No actual sending
        │    - No external SMTP needed
        │    - Safe for testing
        │
        ▼
┌──────────────────────┐
│  MailDev Storage     │
│  (In-Memory)         │
└──────────────────────┘
        │
        │ 4. Available via API
        │
        ▼
┌──────────────────────┐
│  MailDev Web UI      │
│  :1080               │
└──────────────────────┘
        │
        ▼
  Developer views email
```

---

## Network Configuration

```
Docker Network: scraper-network (bridge)
────────────────────────────────────────

Containers on Network:
├── api              (godlionseeker-api)
├── client           (godlionseeker-client)
├── postgres         (godlionseeker-postgres)
├── redis            (godlionseeker-redis)
├── maildev          (godlionseeker-maildev)      ◄── NEW
├── pgadmin          (godlionseeker-pgadmin)
├── redis-commander  (godlionseeker-redis-commander)
├── prometheus       (godlionseeker-prometheus)
└── grafana          (godlionseeker-grafana)

Inter-container Communication:
─────────────────────────────
api → postgres       (postgresql://postgres:5432)
api → redis          (redis://redis:6379)
api → maildev        (smtp://maildev:1025)       ◄── Email sending
pgadmin → postgres   (postgres:5432)
redis-commander → redis (redis:6379)
prometheus → api     (api:8000/metrics)
grafana → prometheus (prometheus:9090)
```

---

## Service Dependencies

```
Startup Order (docker-compose depends_on):
───────────────────────────────────────────

1. postgres  ──┐
               ├──► api  ──┐
2. redis    ──┘           ├──► client
                          │
3. maildev  ─────────────┘

4. pgadmin  ──► depends on postgres
5. redis-commander ──► depends on redis
6. prometheus ──► depends on api
7. grafana ──► depends on prometheus

MailDev is independent and can start anytime!
```

---

## Configuration Flow

```
.env File
─────────
EMAIL_ENABLED=true
SMTP_SERVER=maildev
SMTP_PORT=1025
        │
        │ Read at startup
        ▼
Settings Class
(src/config/settings.py)
        │
        │ Inject into services
        ▼
Email Service
(src/notifications/email_service.py)
        │
        │ Use SMTP settings
        ▼
Send Email
        │
        ▼
MailDev SMTP
:1025
```

---

## Development Workflow

```
Day 1: Setup
─────────────
1. dev-start.bat                    ◄── One command!
   ├── Check Docker
   ├── Create .env
   ├── Start all services
   └── Open MailDev in browser

2. Access services
   ├── Frontend: http://localhost:8080
   ├── API Docs: http://localhost:8000/docs
   └── MailDev:  http://localhost:1080

3. Test email flow
   ├── Register user
   ├── Check MailDev
   └── Verify account


Day 2+: Development
───────────────────
1. Start services
   └── dev-start.bat

2. Code changes
   ├── Edit email templates
   ├── Modify email logic
   └── Update email settings

3. Test immediately
   ├── Trigger email
   ├── Check MailDev
   └── Iterate

4. Stop when done
   └── dev-stop.bat


Standalone Testing
──────────────────
1. maildev-start.bat               ◄── MailDev only
2. Configure app to use localhost:1025
3. Test emails
4. maildev-stop.bat
```

---

## File Structure

```
God Lion Seeker Optimizer/
│
├── docker-compose.yml             ◄── Base configuration
├── docker-compose.override.yml    ◄── MailDev configured here
│
├── .env                          ◄── Active environment (gitignored)
├── .env.development              ◄── Development template
├── .env.example                  ◄── Production template
│
├── dev-start.bat                 ◄── Start all services
├── dev-stop.bat                  ◄── Stop all services
├── maildev-start.bat             ◄── MailDev standalone
├── maildev-stop.bat              ◄── Stop MailDev
│
├── MAILDEV_INTEGRATION_SUMMARY.md
├── MAILDEV_QUICK_REFERENCE.md
│
├── DOCS/
│   └── MAILDEV_SETUP.md          ◄── Full documentation
│
└── src/
    ├── config/
    │   └── settings.py           ◄── Email config loaded here
    │
    └── notifications/
        ├── email_service.py      ◄── SMTP client
        └── email_templates.py    ◄── Email templates
```

---

## Quick Commands Reference

```bash
# STARTUP
dev-start.bat                    # Full development environment
maildev-start.bat                # MailDev only

# ACCESS
http://localhost:1080            # MailDev Web UI
http://localhost:8000/docs       # API Documentation
http://localhost:8080            # Frontend Application

# MONITORING
docker ps                        # Check all containers
docker logs godlionseeker-maildev -f    # MailDev logs
docker logs godlionseeker-api -f        # API logs

# TROUBLESHOOTING
docker-compose restart maildev   # Restart MailDev
docker-compose down              # Stop everything
docker-compose up -d             # Start everything

# CLEANUP
curl -X DELETE http://localhost:1080/email/all   # Delete all emails
docker-compose down --volumes    # Remove volumes
```

---

## Security Notes

```
Development (MailDev)
─────────────────────
✓ No credentials needed
✓ No external SMTP
✓ All emails captured locally
✓ Safe for testing
✓ No data leaves your machine

Production (Real SMTP)
──────────────────────
⚠ Requires credentials
⚠ Use app-specific passwords
⚠ Enable 2FA
⚠ Use environment variables
⚠ Never commit credentials to git
```

---

**This architecture allows you to test all email flows locally without sending any real emails! 🚀**
