# Docker Swarm Quick Reference Card

## 🚀 Quick Start (Single Command)

```bash
# Make deploy script executable
chmod +x scripts/deploy-swarm.sh

# Deploy everything
./scripts/deploy-swarm.sh deploy
```

---

## 📋 Essential Commands

### Swarm Management
```bash
# Initialize Swarm
docker swarm init --advertise-addr <IP>

# Join as worker
docker swarm join --token <TOKEN> <MANAGER_IP>:2377

# List nodes
docker node ls

# Inspect node
docker node inspect <node-id>

# Promote worker to manager
docker node promote <node-id>

# Drain node (maintenance)
docker node update --availability drain <node-id>

# Activate node
docker node update --availability active <node-id>
```

### Stack Management
```bash
# Deploy stack
docker stack deploy -c docker-compose.swarm.yml godlionseeker

# List stacks
docker stack ls

# List stack services
docker stack services godlionseeker

# List stack tasks
docker stack ps godlionseeker

# Remove stack
docker stack rm godlionseeker
```

### Service Management
```bash
# List services
docker service ls

# Inspect service
docker service inspect godlionseeker_api

# View service logs
docker service logs -f godlionseeker_api

# Scale service
docker service scale godlionseeker_api=5

# Update service image
docker service update --image user/app:v2 godlionseeker_api

# Force update (recreate)
docker service update --force godlionseeker_api

# Rollback service
docker service update --rollback godlionseeker_api
```

### Secrets Management
```bash
# Create secret from file
docker secret create my_secret ./secret.txt

# Create secret from stdin
echo "mypassword" | docker secret create my_secret -

# List secrets
docker secret ls

# Inspect secret (metadata only)
docker secret inspect my_secret

# Remove secret
docker secret rm my_secret
```

### Configs Management
```bash
# Create config
docker config create nginx_conf ./nginx.conf

# List configs
docker config ls

# Inspect config
docker config inspect nginx_conf

# Remove config
docker config rm nginx_conf
```

### Network Management
```bash
# List networks
docker network ls

# Create overlay network
docker network create --driver overlay my_network

# Inspect network
docker network inspect my_network

# Remove network
docker network rm my_network
```

---

## 🔍 Monitoring Commands

```bash
# Real-time monitoring dashboard
./scripts/monitor-swarm.sh

# Service stats
docker stats $(docker ps -q)

# Node resource usage
docker node inspect <node-id> --format '{{ .Description.Resources }}'

# Check service health
docker service ps godlionseeker_api --filter "desired-state=running"

# View service events
docker service ps godlionseeker_api --no-trunc
```

---

## 💾 Backup Commands

```bash
# Run manual backup
./scripts/backup-swarm.sh

# Backup with S3 upload
S3_BUCKET=my-bucket ENABLE_S3_UPLOAD=true ./scripts/backup-swarm.sh

# List backups
ls -lh /mnt/backups/

# Verify backup
tar tzf /mnt/backups/swarm-20250105-120000.tar.gz
```

---

## 🔧 Troubleshooting Commands

```bash
# Check Swarm status
docker info | grep Swarm

# View service errors
docker service ps godlionseeker_api --filter "desired-state=running"

# Inspect failed tasks
docker service ps godlionseeker_api --no-trunc | grep -i failed

# View detailed logs
docker service logs --since 30m --tail 100 godlionseeker_api

# Test service connectivity
docker exec $(docker ps -q -f name=godlionseeker_api | head -1) ping postgres

# Check DNS resolution
docker exec $(docker ps -q -f name=godlionseeker_api | head -1) nslookup postgres

# Restart service (rolling)
docker service update --force godlionseeker_api

# Remove failed tasks
docker service ps godlionseeker_api --filter "desired-state=shutdown" -q | \
  xargs docker task rm
```

---

## 📊 Scaling Commands

```bash
# Scale API to 5 replicas
docker service scale godlionseeker_api=5

# Scale multiple services
docker service scale godlionseeker_api=5 godlionseeker_client=3

# Check current replicas
docker service ls

# Auto-scale based on CPU (external tool required)
# See autoscaler/scaling-rules.yml
```

---

## 🔄 Update Strategies

```bash
# Rolling update (default)
docker service update \
  --update-parallelism 2 \
  --update-delay 10s \
  --image user/app:v2 \
  godlionseeker_api

# Blue-green deployment
docker service create --name api-v2 ...
# Switch traffic in load balancer
docker service rm api-v1

# Canary deployment
docker service scale godlionseeker_api=9 api-v2=1
# Monitor metrics, then scale up v2
```

---

## 🔐 Security Commands

```bash
# Rotate CA certificate
docker swarm ca --rotate

# Enable autolock
docker swarm update --autolock=true

# Unlock Swarm after restart
docker swarm unlock

# Update join tokens
docker swarm join-token --rotate worker
docker swarm join-token --rotate manager

# View TLS info
openssl s_client -connect <manager-ip>:2377 -showcerts
```

---

## 📈 Performance Tuning

```bash
# Update resource limits
docker service update \
  --limit-cpu 2.0 \
  --limit-memory 2G \
  --reserve-cpu 1.0 \
  --reserve-memory 1G \
  godlionseeker_api

# Update placement constraints
docker service update \
  --constraint-add "node.labels.type==compute" \
  godlionseeker_api

# Add node labels
docker node update --label-add type=compute <node-id>
```

---

## 🧹 Cleanup Commands

```bash
# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Full system cleanup
docker system prune --all --volumes

# Remove specific stack volumes
docker volume rm $(docker volume ls -q -f name=godlionseeker)
```

---

## 📝 Useful One-Liners

```bash
# Get all service IPs
docker service ls --format "{{.Name}}: {{.Ports}}"

# Count running tasks per service
docker service ls --format "table {{.Name}}\t{{.Replicas}}"

# Find services with failed tasks
docker stack ps godlionseeker --filter "desired-state=running" | grep -i failed

# Get logs from all API replicas
docker service ps godlionseeker_api -q | \
  xargs -I {} docker logs {}

# Export service config
docker service inspect godlionseeker_api --pretty > api-config.txt

# Tail logs from multiple services
docker service logs -f godlionseeker_api godlionseeker_nginx

# Count containers per node
docker node ls -q | while read node; do \
  echo "$node: $(docker node ps $node -q | wc -l)"; \
done

# Get resource usage by service
docker stats --no-stream --format \
  "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | \
  grep godlionseeker
```

---

## 🆘 Emergency Procedures

### Service Not Responding
```bash
# 1. Check service status
docker service ps godlionseeker_api

# 2. View recent logs
docker service logs --tail 50 godlionseeker_api

# 3. Force restart
docker service update --force godlionseeker_api

# 4. Rollback if needed
docker service update --rollback godlionseeker_api
```

### Node Failure
```bash
# 1. Check node status
docker node ls

# 2. Drain failed node
docker node update --availability drain <failed-node-id>

# 3. Services will automatically reschedule

# 4. Remove node if permanently down
docker node rm <failed-node-id>
```

### Database Recovery
```bash
# 1. Stop applications
docker service scale godlionseeker_api=0

# 2. Restore database
cat backup.sql | docker exec -i $(docker ps -q -f name=postgres) \
  psql -U scraper_user godlionseeker

# 3. Restart applications
docker service scale godlionseeker_api=3
```

---

## 🌐 Access URLs

```bash
# Get manager IP
MANAGER_IP=$(docker node inspect self --format '{{ .Status.Addr }}')

# Application
echo "http://$MANAGER_IP"

# Grafana
echo "http://$MANAGER_IP:3000"

# Prometheus (if exposed)
echo "http://$MANAGER_IP:9090"
```

---

## 📞 Support

- Documentation: `SWARM_DEPLOYMENT.md`
- Update Summary: `SWARM_UPDATE_SUMMARY.md`
- Scripts: `scripts/` directory
- Docker Docs: https://docs.docker.com/engine/swarm/

---

**Pro Tip**: Bookmark this file for quick reference during operations! 🔖
