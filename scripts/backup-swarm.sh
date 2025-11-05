#!/bin/bash
# Docker Swarm Backup Script - Production Grade
# Backs up Swarm configuration, secrets, configs, and service data

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Configuration
BACKUP_ROOT="/mnt/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/swarm-$TIMESTAMP"
RETENTION_DAYS=30
LOG_FILE="$BACKUP_ROOT/backup.log"
STACK_NAME="godlionseeker"

# S3 Configuration (optional)
S3_BUCKET="${S3_BUCKET:-}"
S3_REGION="${S3_REGION:-us-east-1}"
ENABLE_S3_UPLOAD="${ENABLE_S3_UPLOAD:-false}"

# Telegram/Slack Notification (optional)
NOTIFICATION_WEBHOOK="${NOTIFICATION_WEBHOOK:-}"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Error handler
error_exit() {
    log "ERROR: $1"
    send_notification "❌ Backup Failed: $1"
    exit 1
}

# Send notification
send_notification() {
    if [ -n "$NOTIFICATION_WEBHOOK" ]; then
        curl -s -X POST "$NOTIFICATION_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \"$1\"}" || true
    fi
}

# Check if running on Swarm manager
check_swarm_manager() {
    if ! docker info --format '{{.Swarm.ControlAvailable}}' 2>/dev/null | grep -q true; then
        error_exit "This script must run on a Swarm manager node"
    fi
}

# Create backup directory
create_backup_dir() {
    log "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"/{swarm,volumes,databases} || error_exit "Failed to create backup directory"
}

# Backup Swarm configuration
backup_swarm_config() {
    log "Backing up Swarm configuration..."
    
    # Node information
    docker node ls --format "{{json .}}" > "$BACKUP_DIR/swarm/nodes.json" || true
    docker node ls -q | while read -r node; do
        docker node inspect "$node" > "$BACKUP_DIR/swarm/node-$node.json" 2>/dev/null || true
    done
    
    # Service information
    docker service ls --format "{{json .}}" > "$BACKUP_DIR/swarm/services.json" || true
    docker service ls -q | while read -r service; do
        docker service inspect "$service" > "$BACKUP_DIR/swarm/service-$service.json" 2>/dev/null || true
    done
    
    # Stack information
    if docker stack ls | grep -q "$STACK_NAME"; then
        docker stack ps "$STACK_NAME" --format "{{json .}}" > "$BACKUP_DIR/swarm/stack-tasks.json" || true
        docker stack services "$STACK_NAME" --format "{{json .}}" > "$BACKUP_DIR/swarm/stack-services.json" || true
    fi
    
    # Network information
    docker network ls --format "{{json .}}" > "$BACKUP_DIR/swarm/networks.json" || true
    docker network ls -q | while read -r network; do
        docker network inspect "$network" > "$BACKUP_DIR/swarm/network-$network.json" 2>/dev/null || true
    done
    
    # Secret information (metadata only, not values)
    docker secret ls --format "{{json .}}" > "$BACKUP_DIR/swarm/secrets.json" || true
    
    # Config information (metadata only)
    docker config ls --format "{{json .}}" > "$BACKUP_DIR/swarm/configs.json" || true
    
    log "Swarm configuration backup completed"
}

# Backup PostgreSQL database
backup_postgres() {
    log "Backing up PostgreSQL database..."
    
    local container
    container=$(docker ps -q -f name="${STACK_NAME}_postgres" | head -n 1)
    
    if [ -n "$container" ]; then
        docker exec "$container" pg_dumpall -U scraper_user | \
            gzip > "$BACKUP_DIR/databases/postgres-all.sql.gz" || \
            log "WARNING: PostgreSQL backup failed"
        
        # Backup specific database
        docker exec "$container" pg_dump -U scraper_user godlionseeker | \
            gzip > "$BACKUP_DIR/databases/postgres-godlionseeker.sql.gz" || \
            log "WARNING: PostgreSQL database backup failed"
        
        log "PostgreSQL backup completed"
    else
        log "WARNING: PostgreSQL container not found"
    fi
}

# Backup Redis data
backup_redis() {
    log "Backing up Redis data..."
    
    local container
    container=$(docker ps -q -f name="${STACK_NAME}_redis" | head -n 1)
    
    if [ -n "$container" ]; then
        # Trigger Redis save
        docker exec "$container" redis-cli --no-auth-warning SAVE || \
            log "WARNING: Redis SAVE failed"
        
        # Copy RDB file
        docker exec "$container" cat /data/dump.rdb > "$BACKUP_DIR/databases/redis-dump.rdb" 2>/dev/null || \
            log "WARNING: Redis dump copy failed"
        
        log "Redis backup completed"
    else
        log "WARNING: Redis container not found"
    fi
}

# Backup Docker volumes
backup_volumes() {
    log "Backing up Docker volumes..."
    
    local volumes=(
        "postgres_data"
        "redis_data"
        "prometheus_data"
        "grafana_data"
    )
    
    for volume in "${volumes[@]}"; do
        local vol_name="${STACK_NAME}_${volume}"
        if docker volume ls -q | grep -q "^${vol_name}$"; then
            log "Backing up volume: $vol_name"
            docker run --rm \
                -v "${vol_name}:/data:ro" \
                -v "$BACKUP_DIR/volumes:/backup" \
                alpine tar czf "/backup/${volume}.tar.gz" -C /data . || \
                log "WARNING: Failed to backup volume $vol_name"
        else
            log "WARNING: Volume $vol_name not found"
        fi
    done
    
    log "Volume backup completed"
}

# Backup mounted storage (if using bind mounts)
backup_mounted_storage() {
    log "Backing up mounted storage..."
    
    local storage_paths=(
        "/mnt/swarm-storage/postgres"
        "/mnt/swarm-storage/redis"
        "/mnt/swarm-storage/prometheus"
        "/mnt/swarm-storage/grafana"
    )
    
    for path in "${storage_paths[@]}"; do
        if [ -d "$path" ]; then
            local basename
            basename=$(basename "$path")
            log "Backing up: $path"
            tar czf "$BACKUP_DIR/volumes/${basename}-storage.tar.gz" -C "$(dirname "$path")" "$basename" 2>/dev/null || \
                log "WARNING: Failed to backup $path"
        fi
    done
    
    log "Mounted storage backup completed"
}

# Create backup manifest
create_manifest() {
    log "Creating backup manifest..."
    
    cat > "$BACKUP_DIR/manifest.txt" <<EOF
Backup Manifest
===============
Timestamp: $TIMESTAMP
Stack Name: $STACK_NAME
Backup Directory: $BACKUP_DIR
Hostname: $(hostname)
Docker Version: $(docker version --format '{{.Server.Version}}')
Swarm Status: $(docker info --format '{{.Swarm.LocalNodeState}}')

Backup Contents:
- Swarm Configuration
- PostgreSQL Database
- Redis Data
- Docker Volumes
- Mounted Storage

File Sizes:
$(du -sh "$BACKUP_DIR"/* | sed 's/^/  /')

Total Backup Size: $(du -sh "$BACKUP_DIR" | cut -f1)
EOF
    
    log "Manifest created"
}

# Compress backup
compress_backup() {
    log "Compressing backup..."
    
    cd "$BACKUP_ROOT"
    tar czf "swarm-$TIMESTAMP.tar.gz" "swarm-$TIMESTAMP/" || error_exit "Compression failed"
    
    # Calculate checksum
    sha256sum "swarm-$TIMESTAMP.tar.gz" > "swarm-$TIMESTAMP.tar.gz.sha256"
    
    log "Backup compressed: swarm-$TIMESTAMP.tar.gz"
}

# Upload to S3
upload_to_s3() {
    if [ "$ENABLE_S3_UPLOAD" = "true" ] && [ -n "$S3_BUCKET" ]; then
        log "Uploading backup to S3..."
        
        aws s3 cp "$BACKUP_ROOT/swarm-$TIMESTAMP.tar.gz" \
            "s3://$S3_BUCKET/swarm-backups/" \
            --region "$S3_REGION" \
            --storage-class STANDARD_IA || \
            log "WARNING: S3 upload failed"
        
        aws s3 cp "$BACKUP_ROOT/swarm-$TIMESTAMP.tar.gz.sha256" \
            "s3://$S3_BUCKET/swarm-backups/" \
            --region "$S3_REGION" || true
        
        log "S3 upload completed"
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    find "$BACKUP_ROOT" -name "swarm-*.tar.gz" -mtime +$RETENTION_DAYS -delete || true
    find "$BACKUP_ROOT" -name "swarm-*.tar.gz.sha256" -mtime +$RETENTION_DAYS -delete || true
    find "$BACKUP_ROOT" -type d -name "swarm-*" -mtime +$RETENTION_DAYS -exec rm -rf {} + 2>/dev/null || true
    
    log "Cleanup completed"
}

# Main execution
main() {
    log "========== Starting Swarm Backup =========="
    
    check_swarm_manager
    create_backup_dir
    
    backup_swarm_config
    backup_postgres
    backup_redis
    backup_volumes
    backup_mounted_storage
    
    create_manifest
    compress_backup
    upload_to_s3
    cleanup_old_backups
    
    # Cleanup uncompressed backup directory
    rm -rf "$BACKUP_DIR"
    
    local backup_size
    backup_size=$(du -sh "$BACKUP_ROOT/swarm-$TIMESTAMP.tar.gz" | cut -f1)
    
    log "========== Backup Completed Successfully =========="
    log "Backup file: $BACKUP_ROOT/swarm-$TIMESTAMP.tar.gz"
    log "Backup size: $backup_size"
    
    send_notification "✅ Swarm Backup Completed Successfully\nSize: $backup_size\nLocation: swarm-$TIMESTAMP.tar.gz"
}

# Run main function
main "$@"
