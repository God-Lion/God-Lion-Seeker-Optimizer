#!/bin/bash
#
# Backup Monitoring Script
# Runs continuous health checks and sends alerts
#
# Usage: ./backup_monitor.sh
# This script should run as a systemd service

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/backups/monitor.log"
PYTHON_BIN="${PYTHON_BIN:-python3}"
APP_ROOT="${APP_ROOT:-/app}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Main monitoring loop
main() {
    log "Starting backup monitoring service..."
    
    cd "$APP_ROOT"
    
    # Run continuous monitoring
    "$PYTHON_BIN" -m src.services.backup_monitor
}

# Execute main function
main
