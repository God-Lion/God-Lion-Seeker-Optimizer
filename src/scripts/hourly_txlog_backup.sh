#!/bin/bash
#
# Hourly Transaction Log Backup Script
# Implements RPO (24 hours) - Hourly transaction log backups
#
# Usage: ./hourly_txlog_backup.sh
# Schedule: Run hourly via cron
# Cron: 0 * * * * /path/to/hourly_txlog_backup.sh >> /var/log/backups/txlog_backup.log 2>&1

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/backups/txlog_backup_$(date +%Y%m%d).log"
PYTHON_BIN="${PYTHON_BIN:-python3}"
APP_ROOT="${APP_ROOT:-/app}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Error handler
error_handler() {
    log "ERROR: Transaction log backup failed at line $1"
    exit 1
}

trap 'error_handler $LINENO' ERR

# Main backup execution
main() {
    log "Starting hourly transaction log backup"
    
    cd "$APP_ROOT"
    
    "$PYTHON_BIN" -c "
import asyncio
from src.services.backup_service import BackupService

async def backup():
    service = BackupService()
    metadata = await service.create_transaction_log_backup()
    print(f'Transaction log backup completed: {metadata.backup_id}')
    print(f'Size: {metadata.size_bytes / 1024:.2f} KB')

asyncio.run(backup())
    " | tee -a "$LOG_FILE"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log "Transaction log backup completed successfully"
    else
        log "ERROR: Transaction log backup failed"
        exit 1
    fi
}

# Execute main function
main
