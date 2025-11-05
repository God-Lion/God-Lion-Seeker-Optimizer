# God Lion Seeker Optimizer - Deployment Suite

> Complete Docker Desktop deployment solution for Windows

## 🎯 Quick Start (3 Steps)

1. **Start Docker Desktop** ✓
2. **Double-click `deploy.bat`** ✓
3. **Select option 1** ✓

That's it! Your application will be running in minutes.

---

## 📦 What's Included

This deployment suite provides everything you need to run God Lion Seeker Optimizer on Docker Desktop:

### ⚡ One-Click Deployment Scripts
- **deploy.bat** - Interactive menu (START HERE!)
- **deploy-simple.bat** - Quick testing deployment
- **deploy-loadbalanced.bat** - Production deployment (3 API instances)
- **deploy-dev.bat** - Development environment with tools

### 🛠️ Management Tools
- **health-check.bat** - Comprehensive diagnostics
- **status.bat** - Service monitoring
- **view-logs.bat** - Log viewer
- **stop-all.bat** - Stop all services
- **backup-database.bat** - Database backup
- **clean-deploy.bat** - Fresh installation

### 📚 Documentation
- **GETTING-STARTED.md** - Start here for first-time users
- **DEPLOYMENT-README.md** - Complete deployment guide
- **QUICK-REFERENCE.md** - Command reference card
- **FILES-SUMMARY.md** - All files overview
- **PRE-DEPLOYMENT-CHECKLIST.md** - Pre-flight checklist

---

## 🚀 Deployment Options

### Option 1: Simple Deployment (Recommended for Testing)
Perfect for quick testing and demos.

**What you get:**
- 1 API instance
- PostgreSQL database
- Redis cache
- React client
- Grafana monitoring

**Access:**
- API: http://localhost:8000
- Client: http://localhost:8080
- Grafana: http://localhost:3000

**Start:**
```batch
deploy-simple.bat
```

---

### Option 2: Load Balanced Deployment (Production Ready)
High-availability setup with load balancing.

**What you get:**
- 3 API instances
- NGINX load balancer
- Automatic failover
- Rate limiting
- All services from Simple +

**Access:**
- Everything: http://localhost
- Grafana: http://localhost:3000

**Start:**
```batch
deploy-loadbalanced.bat
```

---

### Option 3: Development Deployment (For Developers)
Full development environment with hot-reload.

**What you get:**
- All Simple services +
- Hot-reload for code changes
- PgAdmin (database UI)
- Redis Commander
- Mailhog (email testing)

**Access:**
- API: http://localhost:8000
- Client: http://localhost:8080
- PgAdmin: http://localhost:5050
- Redis UI: http://localhost:8081
- Mailhog: http://localhost:8025

**Start:**
```batch
deploy-dev.bat
```

---

## 📋 First-Time Setup Guide

### Prerequisites
1. Install Docker Desktop from https://www.docker.com/products/docker-desktop
2. Ensure you have:
   - Windows 10/11
   - 4GB+ RAM
   - 20GB+ disk space

### Step-by-Step

1. **Start Docker Desktop**
   - Open Docker Desktop
   - Wait for green icon in system tray

2. **Navigate to Project**
   ```
   cd "E:\AI Point\Automated search job project\God Lion Seeker Optimizer"
   ```

3. **Run Deployment Menu**
   ```batch
   deploy.bat
   ```

4. **Choose Deployment**
   - Press `1` for Simple (recommended first time)
   - Press `2` for Load Balanced (production)
   - Press `3` for Development (coding)

5. **Wait for Completion**
   - Script will build images (~5 minutes first time)
   - Start all services
   - Run health checks

6. **Verify Deployment**
   ```batch
   health-check.bat
   ```

7. **Access Your Application**
   - Open browser
   - Go to http://localhost:8000 (Simple/Dev)
   - Or http://localhost (Load Balanced)

---

## 🎛️ Management Dashboard (deploy.bat)

Run `deploy.bat` to access the interactive menu:

```
============================================================================
         GOD LION SEEKER OPTIMIZER - DEPLOYMENT MANAGER
============================================================================

   DEPLOYMENT OPTIONS:
   -------------------
   1. Simple Deployment        (Single instance, quick start)
   2. Load Balanced Deployment (3 API instances + NGINX)
   3. Development Deployment   (With dev tools and hot-reload)

   MANAGEMENT OPTIONS:
   -------------------
   4. Health Check (Comprehensive test)
   5. View Service Status
   6. View Logs
   7. Stop All Services
   8. Backup Database
   9. Clean Install (Remove everything)

   0. Exit
```

---

## 📊 What Gets Deployed

### All Deployments Include:
- ✅ FastAPI backend application
- ✅ React frontend application
- ✅ PostgreSQL 15 database
- ✅ Redis 7 cache
- ✅ Prometheus monitoring
- ✅ Grafana dashboards
- ✅ Health checks
- ✅ Automatic restarts
- ✅ Logging

### Load Balanced Adds:
- ✅ NGINX load balancer
- ✅ 3 API instances (scalable)
- ✅ Automatic failover
- ✅ Rate limiting
- ✅ Production optimizations

### Development Adds:
- ✅ Hot-reload for code changes
- ✅ PgAdmin database manager
- ✅ Redis Commander
- ✅ Mailhog email testing
- ✅ Exposed database ports
- ✅ Debug mode enabled

---

## 🔑 Default Credentials

### Grafana
```
URL:      http://localhost:3000
Username: admin
Password: gr@f@n@!sS3cur3N0w
```

### PostgreSQL (Dev deployment only)
```
Host:     localhost:5432
Database: godlionseeker
Username: scraper_user
Password: scraper_password
```

### PgAdmin (Dev deployment only)
```
URL:      http://localhost:5050
Email:    admin@godlionseeker.local
Password: admin
```

⚠️ **IMPORTANT:** Change these passwords in production!

---

## 🛠️ Common Tasks

### Check if Everything is Working
```batch
health-check.bat
```

### View Service Status
```batch
status.bat
```

### View Logs
```batch
view-logs.bat
```

### Stop All Services
```batch
stop-all.bat
```

### Backup Database
```batch
backup-database.bat
```
Backups saved to: `backups/`

### Fresh Installation
```batch
clean-deploy.bat
```
⚠️ This removes all data!

### Restart a Service
```batch
docker-compose restart api
```

### Access Container Shell
```batch
docker exec -it godlionseeker-api /bin/sh
```

---

## 📖 Documentation Guide

Start with these documents in order:

1. **PRE-DEPLOYMENT-CHECKLIST.md** - Before you begin
2. **GETTING-STARTED.md** - Quick start guide  
3. **DEPLOYMENT-README.md** - Complete documentation
4. **QUICK-REFERENCE.md** - Quick command reference
5. **FILES-SUMMARY.md** - All files explained

---

## 🐛 Troubleshooting

### Docker Desktop Not Running
**Error:** "Cannot connect to Docker daemon"

**Fix:**
1. Start Docker Desktop
2. Wait for green icon
3. Try again

### Port Already in Use
**Error:** "Port 8000 is already allocated"

**Fix:**
```batch
stop-all.bat
# Then deploy again
```

### Services Not Healthy
**Error:** Health checks failing

**Fix:**
1. Wait 30-60 seconds
2. Run `health-check.bat`
3. Check logs: `view-logs.bat`
4. Try: `clean-deploy.bat`

### Build Failures
**Error:** Image build failed

**Fix:**
```batch
clean-deploy.bat
# Then deploy again
```

### Need More Help?
1. Run `health-check.bat` for diagnostics
2. Check logs with `view-logs.bat`
3. Read DEPLOYMENT-README.md
4. Try `clean-deploy.bat` for fresh start

---

## 🎯 Workflow Examples

### Daily Development
```batch
# Start development environment
deploy-dev.bat

# Make code changes (hot-reload automatic)

# Check status
status.bat

# View logs if needed
view-logs.bat

# Stop when done
stop-all.bat
```

### Production Deployment
```batch
# Start load balanced deployment
deploy-loadbalanced.bat

# Verify health
health-check.bat

# Monitor services
status.bat

# Backup database
backup-database.bat
```

### Testing & Demos
```batch
# Quick start
deploy-simple.bat

# Verify
health-check.bat

# Access application
# http://localhost:8000
```

---

## 📈 Monitoring & Metrics

### Access Grafana
1. Go to http://localhost:3000
2. Login with admin/gr@f@n@!sS3cur3N0w
3. View pre-configured dashboards
4. Monitor API performance, database, Redis

### View Metrics
- API metrics: http://localhost:9090/metrics (Simple)
- Prometheus: http://localhost:9090 (Simple)

---

## 🔒 Security Best Practices

### For Production:
- [ ] Change all default passwords
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Limit exposed ports
- [ ] Set up automated backups
- [ ] Enable Docker security scanning
- [ ] Review NGINX security settings
- [ ] Configure monitoring alerts
- [ ] Regular security updates

---

## 🆘 Getting Help

### Quick Diagnostics
```batch
health-check.bat
```

### Detailed Status
```batch
status.bat
```

### View All Logs
```batch
view-logs.bat
```

### Check Documentation
- GETTING-STARTED.md
- DEPLOYMENT-README.md
- QUICK-REFERENCE.md

---

## 📦 Project Structure

```
God Lion Seeker Optimizer/
├── deploy.bat                      ⭐ START HERE
├── deploy-simple.bat               🚀 Quick deployment
├── deploy-loadbalanced.bat         🏭 Production deployment
├── deploy-dev.bat                  💻 Development deployment
├── health-check.bat                ✓ Diagnostics
├── status.bat                      📊 Status monitor
├── view-logs.bat                   📜 Log viewer
├── stop-all.bat                    ⏹️ Stop services
├── backup-database.bat             💾 Backup tool
├── clean-deploy.bat                🧹 Fresh start
├── GETTING-STARTED.md              📖 Quick start
├── DEPLOYMENT-README.md            📚 Full docs
├── QUICK-REFERENCE.md              📋 Commands
├── FILES-SUMMARY.md                📝 File list
├── PRE-DEPLOYMENT-CHECKLIST.md     ✅ Checklist
├── docker-compose.yml              🐳 Simple config
├── docker-compose.loadbalanced.yml 🐳 Load balanced config
├── docker-compose.override.yml     🐳 Dev overrides
└── backups/                        💾 Database backups
```

---

## ✨ Features

- ✅ One-click deployment
- ✅ Interactive menu system
- ✅ Comprehensive health checks
- ✅ Automatic database backups
- ✅ Hot-reload for development
- ✅ Load balancing for production
- ✅ Complete monitoring stack
- ✅ Detailed logging
- ✅ Easy troubleshooting
- ✅ Full documentation

---

## 🎉 You're Ready!

Everything is set up and ready to go. Just run:

```batch
deploy.bat
```

Select your deployment option and you're live!

**Need help?** Read GETTING-STARTED.md

**Happy deploying! 🚀**

---

*Last updated: November 2025*
*For Docker Desktop on Windows 10/11*
