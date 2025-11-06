#!/bin/bash
#
# Incremental Backup Script
# Creates incremental backups between full backups
#
# Usage: ./incremental_backup.sh
# Schedule: Run every 6 hours via cron
# Cron: 0 */6 * * * /path/to/incremental_backup.sh >> /var/log/backups/incremental_backup.log 2>&1

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/backups/incremental_backup_$(date +%Y%m%d).log"
PYTHON_BIN="${PYTHON_BIN:-python3}"
APP_ROOT="${APP_ROOT:-/app}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Error handler
error_handler() {
    log "ERROR: Incremental backup failed at line $1"
    exit 1
}

trap 'error_handler $LINENO' ERR

# Main backup execution
main() {
    log "Starting incremental backup"
    
    cd "$APP_ROOT"
    
    "$PYTHON_BIN" -c "
import asyncio
from datetime import datetime, timedelta
from src.services.backup_service import BackupService

async def backup():
    service = BackupService()
    
    # Get last full backup
    backups = await service.list_backups(backup_type='full')
    
    if not backups:
        print('ERROR: No full backup found. Run daily backup first.')
        exit(1)
    
    last_backup = backups[0]
    
    # Create incremental backup
    metadata = await service.create_incremental_backup(last_backup.timestamp)
    print(f'Incremental backup completed: {metadata.backup_id}')
    print(f'Size: {metadata.size_bytes / 1024 / 1024:.2f} MB')
    print(f'Since: {last_backup.timestamp}')

asyncio.run(backup())
    " | tee -a "$LOG_FILE"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log "Incremental backup completed successfully"
    else
        log "ERROR: Incremental backup failed"
        exit 1
    fi
}

# Execute main function
main
