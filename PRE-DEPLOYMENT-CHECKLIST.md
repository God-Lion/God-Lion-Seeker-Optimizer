# ✅ Pre-Deployment Checklist

Use this checklist before deploying your application.

## System Requirements

- [ ] Windows 10 or Windows 11
- [ ] At least 4GB RAM available (8GB recommended)
- [ ] At least 20GB free disk space
- [ ] Internet connection (for first-time image downloads)

## Docker Desktop

- [ ] Docker Desktop is installed
- [ ] Docker Desktop is running (green icon in system tray)
- [ ] Docker Desktop has sufficient resources allocated:
  - [ ] CPU: 2+ cores (4+ recommended)
  - [ ] Memory: 4GB+ (8GB recommended)
  - [ ] Disk: 20GB+

To check Docker Desktop resources:
1. Open Docker Desktop
2. Go to Settings → Resources
3. Adjust if needed

## Project Files

- [ ] All deployment scripts are in the project folder
- [ ] docker-compose.yml exists
- [ ] docker-compose.loadbalanced.yml exists
- [ ] docker-compose.override.yml exists
- [ ] Dockerfile exists
- [ ] client/Dockerfile exists
- [ ] nginx configuration files exist

## Port Availability

Make sure these ports are not already in use:

### Simple Deployment
- [ ] Port 8000 (API)
- [ ] Port 8080 (Client)
- [ ] Port 3000 (Grafana)
- [ ] Port 9090 (Prometheus)
- [ ] Port 5432 (PostgreSQL - internal)
- [ ] Port 6379 (Redis - internal)

### Load Balanced Deployment
- [ ] Port 80 (NGINX)
- [ ] Port 443 (NGINX HTTPS)
- [ ] Port 3000 (Grafana)

### Development Deployment
- [ ] Port 8000 (API)
- [ ] Port 8080 (Client)
- [ ] Port 3000 (Grafana)
- [ ] Port 5050 (PgAdmin)
- [ ] Port 8081 (Redis Commander)
- [ ] Port 8025 (Mailhog)
- [ ] Port 5432 (PostgreSQL - exposed)
- [ ] Port 6379 (Redis - exposed)

To check if a port is in use:
```batch
netstat -ano | findstr :8000
```

## Environment Files

- [ ] .env.example file exists
- [ ] Environment variables are configured (if needed)

## Before First Deployment

- [ ] Read GETTING-STARTED.md
- [ ] Understand which deployment type you need
- [ ] Know the default credentials
- [ ] Backup any existing data (if upgrading)

## Deployment Choice

Choose the right deployment for your needs:

### Choose Simple Deployment if:
- [ ] You're testing the application
- [ ] You're doing a quick demo
- [ ] You have limited resources
- [ ] You don't need high availability

### Choose Load Balanced Deployment if:
- [ ] You're deploying to production
- [ ] You need high availability
- [ ] You expect high traffic
- [ ] You want automatic failover

### Choose Development Deployment if:
- [ ] You're actively developing
- [ ] You need hot-reload
- [ ] You need database management tools
- [ ] You want to test emails

## Post-Deployment Checks

After running deploy.bat:

- [ ] All containers are running (check with status.bat)
- [ ] All services are healthy (run health-check.bat)
- [ ] API is accessible (http://localhost:8000 or http://localhost)
- [ ] Client is accessible (http://localhost:8080 or http://localhost)
- [ ] Grafana is accessible (http://localhost:3000)
- [ ] No error messages in logs (view-logs.bat)

## Security Checklist (Before Production)

- [ ] Change default Grafana password
- [ ] Change default PostgreSQL password
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Limit exposed ports
- [ ] Enable Docker security scanning
- [ ] Review NGINX security settings
- [ ] Set up automated backups
- [ ] Configure monitoring alerts

## Backup Strategy

- [ ] Understand how to backup database (backup-database.bat)
- [ ] Know where backups are stored (backups/ folder)
- [ ] Test restore process
- [ ] Plan regular backup schedule

## Monitoring Setup

- [ ] Access Grafana dashboard
- [ ] Configure data sources
- [ ] Import dashboard templates
- [ ] Set up alerts (if needed)
- [ ] Test metric collection

## Troubleshooting Preparation

- [ ] Know how to view logs (view-logs.bat)
- [ ] Know how to check status (status.bat)
- [ ] Know how to run health checks (health-check.bat)
- [ ] Know how to stop services (stop-all.bat)
- [ ] Know how to do clean install (clean-deploy.bat)

## Documentation Review

- [ ] Read GETTING-STARTED.md
- [ ] Skim DEPLOYMENT-README.md
- [ ] Bookmark QUICK-REFERENCE.md
- [ ] Understand FILES-SUMMARY.md

## Final Pre-Deployment Check

- [ ] Docker Desktop is running
- [ ] All required ports are available
- [ ] Sufficient disk space available
- [ ] Internet connection is stable
- [ ] You know which deployment type to use
- [ ] You have this checklist handy

## Ready to Deploy? 🚀

If all items above are checked:

1. Open Command Prompt
2. Navigate to project folder
3. Run: `deploy.bat`
4. Choose your deployment option
5. Wait for completion
6. Run: `health-check.bat`
7. Access your application!

---

## Quick Command Reference

After deployment:

```batch
# Check everything is working
health-check.bat

# View status
status.bat

# View logs
view-logs.bat

# Access services
# Simple: http://localhost:8000
# Load Balanced: http://localhost
# Grafana: http://localhost:3000
```

---

**Good luck with your deployment! 🎉**
