# Docker Swarm Deployment Guide

## Production-Grade Docker Swarm Setup for God Lion Seeker Optimizer

This guide provides comprehensive instructions for deploying the God Lion Seeker Optimizer application on Docker Swarm with high availability, auto-scaling, and monitoring.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Swarm Initialization](#swarm-initialization)
3. [Storage Setup](#storage-setup)
4. [Secrets Management](#secrets-management)
5. [Deployment](#deployment)
6. [Monitoring](#monitoring)
7. [Scaling](#scaling)
8. [Backup and Recovery](#backup-and-recovery)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Manager Nodes**: 3+ nodes for high availability
- **Worker Nodes**: 2+ nodes for workload distribution
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **Docker**: Version 20.10+
- **RAM**: 8GB+ per node
- **CPU**: 4+ cores per node
- **Storage**: 100GB+ per node

### Network Requirements

- Open ports: 2377 (cluster management), 7946 (node communication), 4789 (overlay network)
- Stable network connectivity between all nodes
- Static IP addresses recommended for manager nodes

---

## Swarm Initialization

### Initialize Swarm on Manager Node

```bash
# On the first manager node
docker swarm init --advertise-addr <MANAGER_IP>

# Save the join tokens
docker swarm join-token manager  # For additional managers
docker swarm join-token worker   # For workers
```

### Add Additional Nodes

```bash
# On manager nodes (for HA)
docker swarm join --token <MANAGER_TOKEN> <MANAGER_IP>:2377

# On worker nodes
docker swarm join --token <WORKER_TOKEN> <MANAGER_IP>:2377
```

### Verify Swarm Status

```bash
docker node ls
docker info | grep Swarm
```

---

## Storage Setup

### Create Storage Directories

```bash
# On all manager nodes (or NFS-mounted storage)
sudo mkdir -p /mnt/swarm-storage/{postgres,redis,prometheus,grafana}
sudo chown -R 999:999 /mnt/swarm-storage/postgres
sudo chown -R 999:999 /mnt/swarm-storage/redis
sudo chown -R 65534:65534 /mnt/swarm-storage/prometheus
sudo chown -R 472:472 /mnt/swarm-storage/grafana
```

### Optional: Setup NFS for Shared Storage

```bash
# On NFS server
sudo apt-get install nfs-kernel-server
sudo mkdir -p /mnt/nfs/swarm-storage
sudo chown -R nobody:nogroup /mnt/nfs/swarm-storage

# Configure exports
echo "/mnt/nfs/swarm-storage *(rw,sync,no_subtree_check,no_root_squash)" | \
    sudo tee -a /etc/exports
sudo exportfs -ra

# On all Swarm nodes
sudo apt-get install nfs-common
sudo mount -t nfs <NFS_SERVER_IP>:/mnt/nfs/swarm-storage /mnt/swarm-storage
```

---

## Secrets Management

### Create Secrets Directory

```bash
cd ~/godlionseeker-deploy
mkdir -p secrets
chmod 700 secrets
```

### Generate Strong Passwords

```bash
# Generate random passwords
openssl rand -base64 32 > secrets/postgres_password.txt
openssl rand -base64 32 > secrets/mysql_root_password.txt
openssl rand -base64 32 > secrets/mysql_password.txt
openssl rand -base64 32 > secrets/redis_password.txt
openssl rand -base64 32 > secrets/grafana_admin_password.txt

# Secure the files
chmod 600 secrets/*.txt
```

### Create Docker Secrets

```bash
# Create secrets in Swarm
docker secret create postgres_password secrets/postgres_password.txt
docker secret create mysql_root_password secrets/mysql_root_password.txt
docker secret create mysql_password secrets/mysql_password.txt
docker secret create redis_password secrets/redis_password.txt
docker secret create grafana_admin_password secrets/grafana_admin_password.txt

# Verify secrets
docker secret ls

# Clean up local files (they're now in Swarm)
shred -u secrets/*.txt
```

### Create Docker Configs

```bash
# Create Nginx configurations
docker config create nginx_config nginx/nginx-swarm.conf
docker config create nginx_default_conf nginx/conf.d/default.conf

# Create Prometheus configuration
docker config create prometheus_config prometheus/prometheus.yml

# Verify configs
docker config ls
```

---

## Deployment

### Deploy the Stack

```bash
# Pull latest images
docker pull ${DOCKER_USERNAME}/godlionseeker-api:latest
docker pull ${DOCKER_USERNAME}/godlionseeker-client:latest

# Deploy stack
docker stack deploy -c docker-compose.swarm.yml godlionseeker --with-registry-auth

# Monitor deployment
watch -n 2 'docker stack ps godlionseeker'
```

### Verify Deployment

```bash
# Check services
docker stack services godlionseeker

# Check tasks
docker stack ps godlionseeker --no-trunc

# Check logs
docker service logs godlionseeker_api
docker service logs godlionseeker_nginx
```

### Access the Application

```bash
# Find the manager node IP
MANAGER_IP=$(docker node inspect self --format '{{ .Status.Addr }}')

# Application is accessible at:
echo "Application: http://$MANAGER_IP"
echo "Grafana: http://$MANAGER_IP:3000"
```

---

## Monitoring

### Start Monitoring Dashboard

```bash
# Real-time monitoring
./scripts/monitor-swarm.sh

# Or specify custom stack name and refresh interval
STACK_NAME=godlionseeker REFRESH_INTERVAL=10 ./scripts/monitor-swarm.sh
```

### Access Monitoring Tools

- **Grafana**: http://`<manager-ip>`:3000
  - Default username: admin
  - Password: (from grafana_admin_password secret)

- **Prometheus**: http://`<manager-ip>`:9090 (internal network only)

### View Service Logs

```bash
# View logs for specific service
docker service logs -f godlionseeker_api

# View logs with timestamps
docker service logs -f --since 1h godlionseeker_api

# View logs from all replicas
docker service logs --tail 100 godlionseeker_api
```

---

## Scaling

### Manual Scaling

```bash
# Scale API service
docker service scale godlionseeker_api=5

# Scale client service
docker service scale godlionseeker_client=3

# Verify scaling
docker service ls
```

### Auto-Scaling Setup

The `autoscaler/scaling-rules.yml` file defines auto-scaling rules. To enable auto-scaling:

1. Deploy an auto-scaler service (e.g., [orbiter](https://github.com/gianarb/orbiter))
2. Configure it to read `autoscaler/scaling-rules.yml`
3. Integrate with Prometheus for metrics

```bash
# Example: Deploy Orbiter autoscaler
docker service create --name orbiter \
  --mount type=bind,source=/var/run/docker.sock,destination=/var/run/docker.sock \
  --mount type=bind,source=$(pwd)/autoscaler/scaling-rules.yml,destination=/config/rules.yml \
  gianarb/orbiter:latest --config /config/rules.yml
```

### Update Services

```bash
# Update with new image
docker service update --image ${DOCKER_USERNAME}/godlionseeker-api:v2.0 godlionseeker_api

# Update with rolling update
docker service update \
  --update-parallelism 1 \
  --update-delay 30s \
  --image ${DOCKER_USERNAME}/godlionseeker-api:v2.0 \
  godlionseeker_api

# Rollback if needed
docker service update --rollback godlionseeker_api
```

---

## Backup and Recovery

### Automated Backups

```bash
# Run backup script
./scripts/backup-swarm.sh

# Setup automated backups with cron
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/scripts/backup-swarm.sh >> /var/log/swarm-backup.log 2>&1
```

### Backup with S3

```bash
# Enable S3 upload in backup script
export S3_BUCKET=my-swarm-backups
export S3_REGION=us-east-1
export ENABLE_S3_UPLOAD=true

# Run backup
./scripts/backup-swarm.sh
```

### Restore from Backup

```bash
# Extract backup
cd /mnt/backups
tar xzf swarm-20250105-143000.tar.gz

# Restore PostgreSQL
cat swarm-20250105-143000/databases/postgres-all.sql.gz | \
  gunzip | \
  docker exec -i $(docker ps -q -f name=godlionseeker_postgres) \
  psql -U scraper_user

# Restore Redis
docker exec -i $(docker ps -q -f name=godlionseeker_redis) \
  cat < swarm-20250105-143000/databases/redis-dump.rdb > /data/dump.rdb

# Restart services
docker service update --force godlionseeker_postgres
docker service update --force godlionseeker_redis
```

---

## Troubleshooting

### Service Not Starting

```bash
# Check service status
docker service ps godlionseeker_api --no-trunc

# View detailed logs
docker service logs godlionseeker_api

# Inspect service configuration
docker service inspect godlionseeker_api --pretty
```

### Network Issues

```bash
# List overlay networks
docker network ls --filter driver=overlay

# Inspect network
docker network inspect godlionseeker_backend

# Test connectivity between services
docker exec $(docker ps -q -f name=godlionseeker_api) \
  ping -c 3 postgres
```

### Resource Constraints

```bash
# Check node resources
docker node inspect <node-id> --format '{{ .Description.Resources }}'

# View resource usage
docker stats --no-stream

# Update service resource limits
docker service update \
  --limit-memory 2G \
  --limit-cpu 2.0 \
  godlionseeker_api
```

### Secrets Not Accessible

```bash
# List secrets
docker secret ls

# Inspect secret (metadata only)
docker secret inspect postgres_password

# Recreate secret if corrupted
docker secret rm postgres_password
docker secret create postgres_password secrets/postgres_password.txt
docker service update --secret-rm postgres_password godlionseeker_api
docker service update --secret-add postgres_password godlionseeker_api
```

### Rolling Update Failed

```bash
# Check update status
docker service ps godlionseeker_api

# Rollback to previous version
docker service update --rollback godlionseeker_api

# Force update (skip health checks)
docker service update --force godlionseeker_api
```

---

## Advanced Configuration

### Enable TLS for Swarm Communication

```bash
# Initialize Swarm with auto-lock
docker swarm init --autolock

# Rotate CA certificates
docker swarm ca --rotate
```

### Configure Placement Constraints

```bash
# Update service with node constraints
docker service update \
  --constraint-add "node.labels.tier==frontend" \
  godlionseeker_nginx

# Add label to nodes
docker node update --label-add tier=frontend <node-id>
```

### Setup Load Balancer (External)

For production, use an external load balancer (e.g., HAProxy, AWS ELB) pointing to manager nodes on ports 80/443.

Example HAProxy configuration:

```haproxy
frontend http_front
    bind *:80
    default_backend http_back

backend http_back
    balance roundrobin
    server manager1 192.168.1.10:80 check
    server manager2 192.168.1.11:80 check
    server manager3 192.168.1.12:80 check
```

---

## Security Best Practices

1. **Use Docker Secrets** for all sensitive data
2. **Enable encrypted overlay networks** (already configured)
3. **Rotate secrets regularly** (every 90 days)
4. **Limit network exposure** (use internal networks)
5. **Enable Docker Content Trust** for image verification
6. **Regular security scans** with Trivy or Clair
7. **Keep Docker updated** to latest stable version
8. **Use non-root users** in containers
9. **Enable audit logging** for Swarm events
10. **Implement network segmentation**

---

## Maintenance

### Update Configs

```bash
# Remove old config
docker config rm nginx_config

# Create new config
docker config create nginx_config nginx/nginx-swarm.conf

# Update service
docker service update --config-rm nginx_config godlionseeker_nginx
docker service update --config-add source=nginx_config,target=/etc/nginx/nginx.conf godlionseeker_nginx
```

### Drain Node for Maintenance

```bash
# Drain node (move tasks to other nodes)
docker node update --availability drain <node-id>

# Perform maintenance...

# Activate node again
docker node update --availability active <node-id>
```

### Clean Up Unused Resources

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# System-wide cleanup
docker system prune --volumes
```

---

## CI/CD Integration

The deployment workflow is configured in `.github/workflows/deploy.yml` and supports:

- Automated builds on push to main
- Multi-architecture builds (amd64, arm64)
- Automated testing before deployment
- Rolling updates with health checks
- Automatic rollback on failure
- Slack/Discord notifications

### Required GitHub Secrets

- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub password
- `SWARM_SSH_KEY`: SSH private key for Swarm manager
- `SWARM_MANAGER_HOST`: Swarm manager IP/hostname
- `SWARM_SSH_USER`: SSH user for Swarm manager
- `POSTGRES_PASSWORD`: PostgreSQL password
- `MYSQL_ROOT_PASSWORD`: MySQL root password
- `MYSQL_PASSWORD`: MySQL user password
- `REDIS_PASSWORD`: Redis password
- `GRAFANA_ADMIN_PASSWORD`: Grafana admin password

---

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: [Wiki](https://github.com/your-repo/wiki)
- Community: [Discussions](https://github.com/your-repo/discussions)

---

## License

[Your License Here]
