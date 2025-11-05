# 🚀 Quick Reference Card

## One-Line Deployment
```batch
deploy.bat
```

## Deployment Scripts

| Script | Purpose | Best For |
|--------|---------|----------|
| `deploy.bat` | Interactive menu | Everything |
| `deploy-simple.bat` | Single instance | Quick testing |
| `deploy-loadbalanced.bat` | 3 API instances + NGINX | Production |
| `deploy-dev.bat` | With dev tools | Development |

## Management Scripts

| Script | What it does |
|--------|--------------|
| `status.bat` | Show service health & status |
| `view-logs.bat` | View logs (interactive) |
| `stop-all.bat` | Stop all services |
| `backup-database.bat` | Backup database |
| `clean-deploy.bat` | Remove everything & fresh start |

## Common Access Points

### Simple Deployment
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Client: http://localhost:8080
- Grafana: http://localhost:3000

### Load Balanced Deployment
- All services: http://localhost
- API: http://localhost/api
- Grafana: http://localhost:3000

### Development Deployment
- API: http://localhost:8000
- Client: http://localhost:8080
- PgAdmin: http://localhost:5050
- Redis UI: http://localhost:8081
- Mailhog: http://localhost:8025

## Default Credentials

**Grafana:**
- User: `admin`
- Pass: `gr@f@n@!sS3cur3N0w`

**Database:**
- Host: `localhost:5432`
- DB: `godlionseeker`
- User: `scraper_user`
- Pass: `scraper_password`

## Quick Commands

```batch
# Check status
status.bat

# View logs
view-logs.bat

# Stop everything
stop-all.bat

# Backup database
backup-database.bat

# Clean install
clean-deploy.bat

# Restart service
docker-compose restart api

# View containers
docker ps

# View resource usage
docker stats
```

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Docker not running | Start Docker Desktop |
| Port in use | `stop-all.bat` first |
| Service unhealthy | Wait 30-60 seconds |
| Build failed | `clean-deploy.bat` |
| Out of space | `docker system prune -a` |

## Emergency Commands

```batch
# Stop everything immediately
docker stop $(docker ps -aq)

# Remove all containers
docker rm -f $(docker ps -aq)

# Remove all volumes (DATA LOSS!)
docker volume prune -f

# Clean everything (NUCLEAR OPTION!)
docker system prune -a --volumes -f
```

---

**Need more help?** Read `DEPLOYMENT-README.md`
