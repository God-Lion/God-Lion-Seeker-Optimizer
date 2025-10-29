# 🚀 Deployment Guide

Complete guide for deploying God Lion Seeker Optimizer to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Configuration](#configuration)
- [Security Checklist](#security-checklist)
- [Monitoring](#monitoring)
- [Backup & Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **CPU**: 2+ cores (4+ recommended)
- **RAM**: 4GB minimum (8GB+ recommended)
- **Storage**: 20GB+ available space
- **OS**: Linux (Ubuntu 20.04+), Windows Server, or macOS

### Software Requirements

- Docker 20.10+ and Docker Compose 2.0+
- MySQL 8.0+ or PostgreSQL 13+
- Redis 6.0+ (optional but recommended)
- Python 3.11+ (for non-Docker deployments)
- Nginx or Apache (for reverse proxy)

---

## Deployment Options

### 1. Docker Compose (Recommended)
Best for: Quick deployment, development, small-to-medium scale

### 2. Kubernetes
Best for: Large scale, high availability, auto-scaling

### 3. Cloud Platforms
Best for: Managed infrastructure, easy scaling
- AWS (ECS, EKS, Elastic Beanstalk)
- Google Cloud (GKE, Cloud Run)
- Azure (AKS, Container Instances)
- DigitalOcean (App Platform, Kubernetes)
- Heroku

### 4. Traditional VPS
Best for: Full control, custom configurations

---

## Docker Deployment

### Quick Start

1. **Clone repository**
```bash
git clone git@github.com:God-Lion/God-Lion-Seeker-Optimizer.git
cd God-Lion-Seeker-Optimizer
```

2. **Configure environment**
```bash
cp .env.example .env
nano .env  # Edit with production values
```

3. **Start services**
```bash
docker-compose up -d
```

4. **Verify deployment**
```bash
docker-compose ps
curl http://localhost:8000/api/health
```

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  api:
    image: godlionseeker:latest
    restart: always
    environment:
      - ENVIRONMENT=production
      - DEBUG=false
    ports:
      - "8000:8000"
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
    depends_on:
      - db
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  db:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
    volumes:
      - db_data:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api

volumes:
  db_data:
  redis_data:
```

### Build Production Image

```bash
docker build -t godlionseeker:latest -f Dockerfile .
docker tag godlionseeker:latest your-registry/godlionseeker:1.0.0
docker push your-registry/godlionseeker:1.0.0
```

---

## Cloud Deployment

### AWS Deployment

#### Option 1: ECS (Elastic Container Service)

1. **Create ECR repository**
```bash
aws ecr create-repository --repository-name godlionseeker
```

2. **Build and push image**
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker build -t godlionseeker .
docker tag godlionseeker:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/godlionseeker:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/godlionseeker:latest
```

3. **Create task definition** (`task-definition.json`)
```json
{
  "family": "godlionseeker",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/godlionseeker:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "ENVIRONMENT", "value": "production"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/godlionseeker",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

4. **Create ECS service**
```bash
aws ecs create-service \
  --cluster godlionseeker-cluster \
  --service-name godlionseeker-service \
  --task-definition godlionseeker \
  --desired-count 2 \
  --launch-type FARGATE
```

#### Option 2: Elastic Beanstalk

1. **Install EB CLI**
```bash
pip install awsebcli
```

2. **Initialize application**
```bash
eb init -p docker godlionseeker
```

3. **Create environment**
```bash
eb create godlionseeker-prod
```

4. **Deploy**
```bash
eb deploy
```

### Google Cloud Platform

#### Cloud Run Deployment

1. **Build and push to GCR**
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/godlionseeker
```

2. **Deploy to Cloud Run**
```bash
gcloud run deploy godlionseeker \
  --image gcr.io/PROJECT_ID/godlionseeker \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### DigitalOcean

#### App Platform Deployment

1. **Create `app.yaml`**
```yaml
name: godlionseeker
services:
  - name: api
    github:
      repo: God-Lion/God-Lion-Seeker-Optimizer
      branch: main
    dockerfile_path: Dockerfile
    http_port: 8000
    instance_count: 2
    instance_size_slug: professional-xs
    envs:
      - key: ENVIRONMENT
        value: production
databases:
  - name: db
    engine: MYSQL
    version: "8"
```

2. **Deploy**
```bash
doctl apps create --spec app.yaml
```

---

## Configuration

### Environment Variables

#### Required Variables

```bash
# Application
APP_NAME="God Lion Seeker Optimizer"
ENVIRONMENT=production
DEBUG=false

# Database
DB_HOST=your-db-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=godlionseeker_db

# Security
SECRET_KEY=your-very-long-random-secret-key
JWT_SECRET_KEY=another-very-long-random-secret
```

#### Optional Variables

```bash
# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Email
EMAIL_ENABLED=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=noreply@yourdomain.com
SENDER_PASSWORD=your-app-password

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=INFO
```

### Nginx Configuration

Create `/etc/nginx/sites-available/godlionseeker`:

```nginx
upstream api {
    server localhost:8000;
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    location / {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /api/docs {
        auth_basic "Restricted";
        auth_basic_user_file /etc/nginx/.htpasswd;
        proxy_pass http://api;
    }
}
```

### SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Security Checklist

### Pre-Deployment

- [ ] Change all default passwords
- [ ] Generate strong SECRET_KEY and JWT_SECRET_KEY
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Review and update .env file
- [ ] Remove debug endpoints in production
- [ ] Set DEBUG=false

### Post-Deployment

- [ ] Test all critical endpoints
- [ ] Verify authentication works
- [ ] Check database connections
- [ ] Test email notifications
- [ ] Review application logs
- [ ] Set up monitoring alerts
- [ ] Configure log rotation
- [ ] Test backup restoration
- [ ] Perform security scan
- [ ] Update documentation

### Ongoing Security

- [ ] Regular security updates
- [ ] Monitor for vulnerabilities
- [ ] Review access logs
- [ ] Rotate credentials quarterly
- [ ] Audit user permissions
- [ ] Test disaster recovery
- [ ] Update dependencies
- [ ] Security penetration testing

---

## Monitoring

### Application Monitoring

**Prometheus + Grafana** (included in docker-compose)

Access dashboards:
- Prometheus: http://your-domain:9090
- Grafana: http://your-domain:3000

### Log Management

**Centralized Logging**

```bash
# Using ELK Stack
docker run -d --name elasticsearch elasticsearch:7.17.0
docker run -d --name kibana --link elasticsearch:elasticsearch kibana:7.17.0
docker run -d --name logstash --link elasticsearch:elasticsearch logstash:7.17.0
```

**Log Rotation**

Create `/etc/logrotate.d/godlionseeker`:

```
/var/log/godlionseeker/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload godlionseeker
    endscript
}
```

### Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- StatusCake
- Better Uptime

---

## Backup & Recovery

### Database Backup

**Automated Daily Backup**

```bash
#!/bin/bash
# /usr/local/bin/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mysql"
DB_NAME="godlionseeker_db"

mysqldump -u root -p${DB_PASSWORD} ${DB_NAME} | gzip > ${BACKUP_DIR}/backup_${DATE}.sql.gz

# Keep only last 30 days
find ${BACKUP_DIR} -name "backup_*.sql.gz" -mtime +30 -delete
```

**Cron Job**

```bash
0 2 * * * /usr/local/bin/backup-db.sh
```

### Application Backup

```bash
#!/bin/bash
# Backup application data

tar -czf /backups/app/godlionseeker_$(date +%Y%m%d).tar.gz \
  /app/data \
  /app/logs \
  /app/.env
```

### Restore Procedure

```bash
# Restore database
gunzip < backup_20241025.sql.gz | mysql -u root -p godlionseeker_db

# Restore application data
tar -xzf godlionseeker_20241025.tar.gz -C /
```

---

## Troubleshooting

### Common Issues

#### Application won't start

```bash
# Check logs
docker-compose logs api

# Verify environment variables
docker-compose config

# Check database connection
docker-compose exec api python -c "from config.database import test_connection; test_connection()"
```

#### High memory usage

```bash
# Check container stats
docker stats

# Restart services
docker-compose restart api

# Scale down workers
# Edit docker-compose.yml and reduce worker count
```

#### Database connection errors

```bash
# Test connection
mysql -h DB_HOST -u DB_USER -p

# Check network
docker network inspect godlionseeker_network

# Verify credentials in .env
```

### Performance Optimization

1. **Enable Redis caching**
2. **Optimize database queries**
3. **Use CDN for static assets**
4. **Enable gzip compression**
5. **Implement connection pooling**
6. **Scale horizontally with load balancer**

---

## Scaling

### Horizontal Scaling

**Load Balancer Configuration**

```nginx
upstream api_backend {
    least_conn;
    server api1:8000 weight=1;
    server api2:8000 weight=1;
    server api3:8000 weight=1;
}
```

### Auto-Scaling (Kubernetes)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: godlionseeker-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: godlionseeker
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## Support

For deployment support:
- Documentation: [README.md](README.md)
- Issues: https://github.com/God-Lion/God-Lion-Seeker-Optimizer/issues
- Security: [SECURITY.md](SECURITY.md)

---

**Happy Deploying! 🚀**
