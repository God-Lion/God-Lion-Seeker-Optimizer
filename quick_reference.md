# Load Balancing Quick Reference

## 🚀 Quick Start

```bash
# 1. Navigate to project directory
cd "E:\AI Point\Automated search job project\God Lion Seeker Optimizer"

# 2. Build and start all services
docker-compose -f docker-compose.loadbalanced.yml up -d --build

# 3. Check status
docker-compose -f docker-compose.loadbalanced.yml ps

# 4. Test load balancer
curl http://localhost/api/health
```

## 📁 File Structure

```
God Lion Seeker Optimizer/
├── docker-compose.loadbalanced.yml    # Main compose file
├── Dockerfile                         # Your existing Dockerfile
├── nginx/
│   ├── nginx.conf                     # Main NGINX config
│   └── conf.d/
│       └── default.conf               # Site configuration
├── monitoring/
│   └── prometheus.yml                 # Prometheus config
└── src/                               # Your application code
```

## 🐳 Docker Commands

### Start/Stop Services

```bash
# Start all services
docker-compose -f docker-compose.loadbalanced.yml up -d

# Stop all services
docker-compose -f docker-compose.loadbalanced.yml down

# Restart services
docker-compose -f docker-compose.loadbalanced.yml restart

# Restart specific service
docker-compose -f docker-compose.loadbalanced.yml restart nginx
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.loadbalanced.yml logs -f

# Specific service
docker-compose -f docker-compose.loadbalanced.yml logs -f nginx
docker-compose -f docker-compose.loadbalanced.yml logs -f api-1

# Last 50 lines
docker-compose -f docker-compose.loadbalanced.yml logs --tail=50
```

### Check Status

```bash
# List all containers
docker-compose -f docker-compose.loadbalanced.yml ps

# Check container health
docker-compose -f docker-compose.loadbalanced.yml ps | grep "healthy"

# Detailed info
docker inspect godlionseeker-nginx
```

### Scale Services

```bash
# Scale to 5 instances
docker-compose -f docker-compose.loadbalanced.yml up -d --scale api-1=5 --scale api-2=5 --scale api-3=5

# Check running instances
docker ps --filter "name=godlionseeker-api"
```

## 🧪 Testing Commands

### Test Load Balancing

```bash
# Single request
curl -I http://localhost/api/health

# Multiple requests (Windows)
for ($i=1; $i -le 10; $i++) { curl -I http://localhost/api/health | Select-String "X-Instance-ID" }

# Multiple requests (Linux/Mac)
for i in {1..10}; do curl -I http://localhost/api/health | grep X-Instance-ID; done
```

### Test Endpoints

```bash
# Health check
curl http://localhost/health

# API health
curl http://localhost/api/health

# API documentation
curl http://localhost/docs
```

### Performance Testing

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost/api/health

# Using wrk
wrk -t4 -c100 -d30s http://localhost/api/health
```

## 🔧 Troubleshooting Commands

### Check Container Health

```bash
# Health status
docker inspect godlionseeker-nginx --format='{{.State.Health.Status}}'
docker inspect godlionseeker-api-1 --format='{{.State.Health.Status}}'

# Last health check
docker inspect godlionseeker-api-1 --format='{{json .State.Health}}' | jq
```

### Debug NGINX

```bash
# Test NGINX configuration
docker exec godlionseeker-nginx nginx -t

# Reload NGINX
docker exec godlionseeker-nginx nginx -s reload

# View NGINX error log
docker exec godlionseeker-nginx tail -f /var/log/nginx/error.log

# View NGINX access log
docker exec godlionseeker-nginx tail -f /var/log/nginx/access.log
```

### Debug API Instances

```bash
# Execute command in container
docker exec godlionseeker-api-1 ps aux

# Check API health internally
docker exec godlionseeker-api-1 curl http://localhost:8000/api/health

# View environment variables
docker exec godlionseeker-api-1 env
```

### Database Operations

```bash
# Connect to PostgreSQL
docker exec -it godlionseeker-db psql -U scraper_user -d godlionseeker

# Run SQL query
docker exec godlionseeker-db psql -U scraper_user -d godlionseeker -c "SELECT version();"

# Backup database
docker exec godlionseeker-db pg_dump -U scraper_user godlionseeker > backup.sql
```

### Redis Operations

```bash
# Connect to Redis
docker exec -it godlionseeker-redis redis-cli

# Check Redis info
docker exec godlionseeker-redis redis-cli INFO

# Monitor Redis commands
docker exec godlionseeker-redis redis-cli MONITOR
```

## 📊 Monitoring

### Access Monitoring Tools

```bash
# Prometheus
Start-Process "http://localhost:9090"

# Grafana
Start-Process "http://localhost:3000"
```

### Prometheus Queries

```
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m])

# Response time (95th percentile)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

## 🧹 Cleanup Commands

```bash
# Stop services
docker-compose -f docker-compose.loadbalanced.yml down

# Remove volumes (WARNING: deletes data)
docker-compose -f docker-compose.loadbalanced.yml down -v

# Remove images
docker-compose -f docker-compose.loadbalanced.yml down --rmi all

# Complete cleanup
docker-compose -f docker-compose.loadbalanced.yml down -v --rmi all --remove-orphans
```

## 🔍 Useful Inspection Commands

```bash
# Network inspection
docker network ls
docker network inspect god-lion-seeker-optimizer_scraper-network

# Volume inspection
docker volume ls
docker volume inspect god-lion-seeker-optimizer_postgres_data

# Container stats
docker stats godlionseeker-api-1 godlionseeker-api-2 godlionseeker-api-3

# Resource usage
docker system df
```

## 🚨 Emergency Commands

```bash
# Force restart unhealthy