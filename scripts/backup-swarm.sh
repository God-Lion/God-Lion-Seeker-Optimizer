#!/bin/bash
# Swarm Backup Script

BACKUP_DIR="/mnt/backups/swarm-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup Swarm configuration
docker swarm ca --rotate --cert-expiry 720h > "$BACKUP_DIR/swarm-ca.log"
docker node ls -q | xargs -I {} docker node inspect {} > "$BACKUP_DIR/nodes.json"
docker service ls -q | xargs -I {} docker service inspect {} > "$BACKUP_DIR/services.json"
docker network ls -q | xargs -I {} docker network inspect {} > "$BACKUP_DIR/networks.json"
docker secret ls -q | xargs -I {} docker secret inspect {} > "$BACKUP_DIR/secrets.json"
docker config ls -q | xargs -I {} docker config inspect {} > "$BACKUP_DIR/configs.json"

# Backup PostgreSQL
docker exec $(docker ps -q -f name=godlionseeker_postgres) \
  pg_dump -U scraper_user godlionseeker > "$BACKUP_DIR/postgres.sql"

# Backup volumes
tar czf "$BACKUP_DIR/postgres-data.tar.gz" /mnt/swarm-storage/postgres
tar czf "$BACKUP_DIR/redis-data.tar.gz" /mnt/swarm-storage/redis
tar czf "$BACKUP_DIR/grafana-data.tar.gz" /mnt/swarm-storage/grafana

# Upload to S3 (optional)
# aws s3 cp "$BACKUP_DIR" s3://your-bucket/swarm-backups/ --recursive

echo "Backup completed: $BACKUP_DIR"
