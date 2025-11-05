# God Lion Seeker Optimizer - Docker Deployment Guide

## 🚀 Quick Start

### Prerequisites
1. **Docker Desktop** must be installed and running
   - Download from: https://www.docker.com/products/docker-desktop
   - Minimum requirements: 4GB RAM, 20GB disk space
   - Make sure Docker Desktop is running before deployment

### One-Click Deployment
Simply double-click `deploy.bat` to open the interactive deployment menu.

---

## 📋 Deployment Options

### 1. Simple Deployment (`deploy-simple.bat`)
**Best for:** Quick testing, development, single-machine deployment

**Runs:**
- 1 API instance
- PostgreSQL database
- Redis cache
- React client
- Prometheus (monitoring)
- Grafana (visualization)

**Access Points:**
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Client: http://localhost:8080
- Grafana: http://localhost:3000

**Command:**
```batch
deploy-simple.bat
```

---

### 2. Load Balanced Deployment (`deploy-loadbalanced.bat`)
**Best for:** Production, high-availability, load testing

**Runs:**
- 3 API instances (load balanced)
- NGINX load balancer
- PostgreSQL database
- Redis cache
- React client
- Prometheus (monitoring)
- Grafana (visualization)

**Access Points:**
- All services via NGINX: http://localhost
- API: http://localhost/api
- Client: http://localhost
- Grafana: http://localhost:3000

**Features:**
- Automatic load balancing across 3 API instances
- Health checks and automatic failover
- Better performance and reliability
- Production-ready configuration

**Command:**
```batch
deploy-loadbalanced.bat
```

---

### 3. Development Deployment (`deploy-dev.bat`)
**Best for:** Local development, debugging, testing

**Runs:**
- All services from Simple Deployment
- PgAdmin (database management)
- Redis Commander (Redis UI)
- Mailhog (email testing)
- Hot-reload enabled
- Debug mode enabled

**Access Points:**
- API: http://localhost:8000 (with hot-reload)
- Client: http://localhost:8080
- PgAdmin: http://localhost:5050
- Redis Commander: http://localhost:8081
- Mailhog: http://localhost:8025
- PostgreSQL: localhost:5432
- Redis: localhost:6379

**Credentials:**
- **PgAdmin:**
  - Email: admin@godlionseeker.local
  - Password: admin
  
- **PostgreSQL:**
  - Host: localhost:5432
  - Database: godlionseeker
  - Username: scraper_user
  - Password: scraper_password

**Command:**
```batch
deploy-dev.bat
```

---

## 🛠️ Management Scripts

### Status Check (`status.bat`)
Check the health and status of all running services.

Shows:
- Running containers
- Health check status
- Resource usage (CPU, Memory)
- Network ports
- Docker volumes

```batch
status.bat
```

---

### View Logs (`view-logs.bat`)
Interactive log viewer for all deployments.

Options:
1. View simple deployment logs
2. View load balanced deployment logs
3. View development deployment logs
4. View specific service logs

```batch
view-logs.bat
```

---

### Stop All Services (`stop-all.bat`)
Safely stop all running services from any deployment type.

```batch
stop-all.bat
```

---

### Backup Database (`backup-database.bat`)
Create a timestamped backup of the PostgreSQL database.

Backups are saved to: `backups/godlionseeker_backup_YYYYMMDD-HHMMSS.sql`

```batch
backup-database.bat
```

**To restore a backup:**
```batch
docker exec -i godlionseeker-db psql -U scraper_user godlionseeker < backups\your_backup.sql
```

---

### Clean Installation (`clean-deploy.bat`)
⚠️ **WARNING:** This removes everything!

Removes:
- All containers
- All volumes (DATABASE WILL BE DELETED!)
- All images
- All build cache

Use this for:
- Fresh start
- Troubleshooting issues
- Complete cleanup

```batch
clean-deploy.bat
```

---

## 📊 Monitoring & Observability

### Grafana
Access: http://localhost:3000

**Default Credentials:**
- Username: `admin`
- Password: `gr@f@n@!sS3cur3N0w`

**Features:**
- Real-time metrics visualization
- Custom dashboards
- Alerting (configure as needed)

### Prometheus
Internal access for metrics collection
- Metrics endpoint: http://localhost:9090 (Simple deployment)
- Automatically scrapes API metrics

---

## 🔧 Common Commands

### Docker Compose Commands

**View running containers:**
```batch
docker ps
```

**View all containers (including stopped):**
```batch
docker ps -a
```

**Restart a specific service:**
```batch
docker-compose restart [service_name]
```

**Scale API instances (Load Balanced only):**
```batch
docker-compose -f docker-compose.loadbalanced.yml up -d --scale api-1=5 --scale api-2=5 --scale api-3=5
```

**Access container shell:**
```batch
docker exec -it godlionseeker-api /bin/sh
```

**View resource usage:**
```batch
docker stats
```

---

## 🐛 Troubleshooting

### Docker Desktop not running
**Error:** "Cannot connect to Docker daemon"

**Solution:**
1. Start Docker Desktop
2. Wait for it to fully initialize (green icon in system tray)
3. Run deployment script again

---

### Port already in use
**Error:** "Port 8000 is already allocated"

**Solution:**
1. Stop the conflicting service
2. Or change the port in `docker-compose.yml`
3. Or use `stop-all.bat` to stop all services first

---

### Services not healthy
**Error:** Health checks failing

**Solution:**
1. Check logs: `view-logs.bat`
2. Wait longer - services may take 30-60 seconds to start
3. Check Docker Desktop has sufficient resources (4GB+ RAM)
4. Try clean install: `clean-deploy.bat`

---

### Database connection errors
**Error:** "Could not connect to database"

**Solution:**
1. Ensure PostgreSQL container is running: `docker ps`
2. Check logs: `docker logs godlionseeker-db`
3. Wait for database to initialize (first run takes longer)
4. Verify environment variables in `docker-compose.yml`

---

### Build failures
**Error:** Image build failed

**Solution:**
1. Check Docker Desktop disk space
2. Clean old images: `docker system prune -a`
3. Try clean install: `clean-deploy.bat`
4. Check Dockerfile syntax

---

## 📁 Project Structure

```
God Lion Seeker Optimizer/
├── deploy.bat                      # Main deployment menu
├── deploy-simple.bat               # Simple deployment
├── deploy-loadbalanced.bat         # Load balanced deployment
├── deploy-dev.bat                  # Development deployment
├── status.bat                      # Status checker
├── view-logs.bat                   # Log viewer
├── stop-all.bat                    # Stop all services
├── backup-database.bat             # Database backup
├── clean-deploy.bat                # Clean installation
├── docker-compose.yml              # Main compose file
├── docker-compose.loadbalanced.yml # Load balanced config
├── docker-compose.override.yml     # Development overrides
├── Dockerfile                      # API Dockerfile
├── client/
│   └── Dockerfile                  # Client Dockerfile
├── nginx/
│   ├── nginx.conf                  # NGINX main config
│   └── conf.d/
│       └── default.conf            # NGINX site config
└── backups/                        # Database backups (created automatically)
```

---

## 🔐 Security Notes

### Default Credentials (CHANGE IN PRODUCTION!)

**Grafana:**
- Username: `admin`
- Password: `gr@f@n@!sS3cur3N0w`

**PostgreSQL:**
- Username: `scraper_user`
- Password: `scraper_password`

**PgAdmin (Dev only):**
- Email: `admin@godlionseeker.local`
- Password: `admin`

### Production Deployment Checklist
- [ ] Change all default passwords
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Configure firewall rules
- [ ] Set up backup automation
- [ ] Configure monitoring alerts
- [ ] Review NGINX security settings
- [ ] Limit exposed ports
- [ ] Enable Docker security scanning

---

## 📈 Performance Tips

### For Better Performance:

1. **Increase Docker Resources:**
   - Go to Docker Desktop → Settings → Resources
   - Allocate more CPU cores (4+)
   - Allocate more RAM (8GB+)

2. **Use Load Balanced Deployment:**
   - Distributes load across multiple API instances
   - Better handles concurrent requests
   - Automatic failover

3. **Enable Redis Caching:**
   - Already configured in all deployments
   - Reduces database load
   - Faster response times

4. **Monitor Resources:**
   - Use `status.bat` regularly
   - Check Grafana dashboards
   - Watch for memory leaks

---

## 🆘 Support

### Getting Help

1. Check this README
2. Review logs: `view-logs.bat`
3. Check service status: `status.bat`
4. Try clean install: `clean-deploy.bat`

### Useful Docker Commands

```batch
# View all logs
docker-compose logs -f

# View specific service logs
docker logs godlionseeker-api -f

# Restart specific service
docker restart godlionseeker-api

# Access database
docker exec -it godlionseeker-db psql -U scraper_user godlionseeker

# Clean everything
docker system prune -a --volumes
```

---

## 📝 Version Information

- **Docker Compose Version:** 3.8
- **PostgreSQL:** 15-alpine
- **Redis:** 7-alpine
- **Python:** 3.11-slim
- **Node:** 20-alpine
- **NGINX:** alpine

---

## ✅ Deployment Checklist

### First Time Setup
- [ ] Install Docker Desktop
- [ ] Start Docker Desktop
- [ ] Clone/download project
- [ ] Open Command Prompt in project folder
- [ ] Run `deploy.bat`
- [ ] Select deployment option
- [ ] Wait for deployment to complete
- [ ] Access services via browser

### Regular Deployment
- [ ] Ensure Docker Desktop is running
- [ ] Run desired deployment script
- [ ] Verify all services are healthy
- [ ] Access your application

### Before Shutting Down
- [ ] Backup database if needed: `backup-database.bat`
- [ ] Stop services: `stop-all.bat`

---

## 🎯 Next Steps

1. **After Deployment:**
   - Access API docs: http://localhost:8000/docs
   - Explore the client interface
   - Check Grafana dashboards

2. **Development:**
   - Use `deploy-dev.bat` for development
   - Code changes auto-reload
   - Use PgAdmin for database management

3. **Production:**
   - Use `deploy-loadbalanced.bat`
   - Set up SSL/TLS certificates
   - Configure domain and DNS
   - Set up automated backups

---

**Happy Deploying! 🚀**
