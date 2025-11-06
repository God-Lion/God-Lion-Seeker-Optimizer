#!/bin/bash
#
# Daily Full Backup Script
# Implements RPO (24 hours) - Daily automated backups
#
# Usage: ./daily_backup.sh
# Schedule: Run daily at 2:00 AM via cron
# Cron: 0 2 * * * /path/to/daily_backup.sh >> /var/log/backups/daily_backup.log 2>&1

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/backups/daily_backup_$(date +%Y%m%d).log"
BACKUP_ROOT="${BACKUP_ROOT_PATH:-/var/backups/god-lion-seeker}"
PYTHON_BIN="${PYTHON_BIN:-python3}"
APP_ROOT="${APP_ROOT:-/app}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Error handler
error_handler() {
    log "ERROR: Backup failed at line $1"
    send_alert "Daily backup failed" "Line: $1"
    exit 1
}

trap 'error_handler $LINENO' ERR

# Send alert function
send_alert() {
    local subject=$1
    local message=$2
    
    # Send email alert (configure mail server)
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "$subject" "${BACKUP_ALERT_EMAIL:-admin@company.com}"
    fi
    
    # Log to syslog
    logger -t backup-daily -p user.error "$subject: $message"
}

# Main backup execution
main() {
    log "=========================================="
    log "Starting daily full backup"
    log "=========================================="
    
    # Check disk space
    AVAILABLE_SPACE=$(df -BG "$BACKUP_ROOT" | tail -1 | awk '{print $4}' | sed 's/G//')
    log "Available disk space: ${AVAILABLE_SPACE}GB"
    
    if [ "$AVAILABLE_SPACE" -lt 10 ]; then
        log "WARNING: Low disk space (${AVAILABLE_SPACE}GB). Cleaning old backups..."
        "$PYTHON_BIN" -c "
import asyncio
from src.services.backup_service import BackupService

async def cleanup():
    service = BackupService()
    await service.cleanup_old_backups()

asyncio.run(cleanup())
        "
    fi
    
    # Execute backup via Python service
    log "Executing full backup..."
    
    cd "$APP_ROOT"
    
    "$PYTHON_BIN" -c "
import asyncio
from src.services.backup_service import BackupService

async def backup():
    service = BackupService()
    metadata = await service.create_full_backup()
    print(f'Backup completed: {metadata.backup_id}')
    print(f'Size: {metadata.size_bytes / 1024 / 1024:.2f} MB')
    print(f'Checksum: {metadata.checksum}')
    
    # Verify backup
    verified = await service.verify_backup(metadata.backup_id)
    print(f'Verification: {'PASSED' if verified else 'FAILED'}')
    
    return metadata

metadata = asyncio.run(backup())
    " | tee -a "$LOG_FILE"
    
    EXIT_CODE=${PIPESTATUS[0]}
    
    if [ $EXIT_CODE -eq 0 ]; then
        log "Daily full backup completed successfully"
        
        # Check RPO compliance
        log "Checking RPO compliance..."
        "$PYTHON_BIN" -c "
import asyncio
from src.services.backup_service import BackupService

async def check_rpo():
    service = BackupService()
    status = await service.check_rpo_compliance()
    
    print(f'RPO Compliant: {status[\"compliant\"]}')
    print(f'Hours since last backup: {status[\"hours_since_last_backup\"]}')
    print(f'Recommendation: {status[\"recommendation\"]}')

asyncio.run(check_rpo())
        " | tee -a "$LOG_FILE"
        
        log "=========================================="
        log "Daily backup process completed"
        log "=========================================="
    else
        log "ERROR: Daily backup failed with exit code $EXIT_CODE"
        send_alert "Daily backup failed" "Exit code: $EXIT_CODE"
        exit $EXIT_CODE
    fi
}

# Execute main function
main
