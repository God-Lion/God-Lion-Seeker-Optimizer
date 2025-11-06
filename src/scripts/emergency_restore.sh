#!/bin/bash
#
# Emergency Restore Script
# Implements RTO (4 hours) - Emergency disaster recovery
#
# Usage: ./emergency_restore.sh <backup_id>
# Example: ./emergency_restore.sh full_20250105_020000
#
# This script should be used in emergency situations to restore
# the system from a backup as quickly as possible.

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/backups/emergency_restore_$(date +%Y%m%d_%H%M%S).log"
PYTHON_BIN="${PYTHON_BIN:-python3}"
APP_ROOT="${APP_ROOT:-/app}"

# Emergency contact list
DBA_EMAIL="${DBA_EMAIL:-dba@company.com}"
DBA_PHONE="${DBA_PHONE:-+1-XXX-XXX-XXXX}"
SYSADMIN_EMAIL="${SYSADMIN_EMAIL:-sysadmin@company.com}"
SECURITY_EMAIL="${SECURITY_EMAIL:-security@company.com}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $*${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $*${NC}" | tee -a "$LOG_FILE"
}

# Send emergency alert
send_emergency_alert() {
    local subject=$1
    local message=$2
    
    log "Sending emergency alert: $subject"
    
    # Send email to all emergency contacts
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "[EMERGENCY] $subject" "$DBA_EMAIL,$SYSADMIN_EMAIL,$SECURITY_EMAIL"
    fi
    
    # Log to syslog with emergency priority
    logger -t emergency-restore -p user.emerg "$subject: $message"
    
    # Send SMS (if configured)
    # ./send_sms.sh "$DBA_PHONE" "$subject: $message"
}

# Verify prerequisites
verify_prerequisites() {
    log "Verifying prerequisites..."
    
    # Check if running as root or with sudo
    if [ "$EUID" -ne 0 ]; then 
        log_error "This script must be run as root or with sudo"
        exit 1
    fi
    
    # Check required tools
    local required_tools=("pg_restore" "psql" "python3" "systemctl")
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "Required tool not found: $tool"
            exit 1
        fi
    done
    
    # Check disk space
    local available_space=$(df -BG / | tail -1 | awk '{print $4}' | sed 's/G//')
    log "Available disk space: ${available_space}GB"
    
    if [ "$available_space" -lt 20 ]; then
        log_warning "Low disk space: ${available_space}GB"
    fi
    
    log_success "Prerequisites verified"
}

# Display emergency contacts
display_emergency_contacts() {
    log "=========================================="
    log "EMERGENCY CONTACTS"
    log "=========================================="
    log "Database Admin: $DBA_EMAIL / $DBA_PHONE"
    log "System Admin: $SYSADMIN_EMAIL"
    log "Security Team: $SECURITY_EMAIL"
    log "=========================================="
}

# Confirm restore operation
confirm_restore() {
    local backup_id=$1
    
    log_warning "=========================================="
    log_warning "EMERGENCY RESTORE OPERATION"
    log_warning "=========================================="
    log_warning "This will:"
    log_warning "1. Stop all application services"
    log_warning "2. Create a safety backup of current state"
    log_warning "3. Restore from backup: $backup_id"
    log_warning "4. Overwrite current database and files"
    log_warning "=========================================="
    
    read -p "Are you sure you want to proceed? (type 'YES' to continue): " confirmation
    
    if [ "$confirmation" != "YES" ]; then
        log "Restore operation cancelled by user"
        exit 0
    fi
    
    log "Restore operation confirmed"
}

# Main restore execution
main() {
    local backup_id=${1:-}
    
    if [ -z "$backup_id" ]; then
        log_error "Usage: $0 <backup_id>"
        log_error "Example: $0 full_20250105_020000"
        exit 1
    fi
    
    local start_time=$(date +%s)
    
    log "=========================================="
    log "EMERGENCY DISASTER RECOVERY"
    log "=========================================="
    log "Backup ID: $backup_id"
    log "Started at: $(date)"
    log "RTO Target: 4 hours (240 minutes)"
    log "=========================================="
    
    # Send initial alert
    send_emergency_alert "Emergency restore started" "Restoring from backup: $backup_id"
    
    # Display emergency contacts
    display_emergency_contacts
    
    # Verify prerequisites
    verify_prerequisites
    
    # Confirm operation
    confirm_restore "$backup_id"
    
    # Execute restore
    log "Starting restore process..."
    
    cd "$APP_ROOT"
    
    "$PYTHON_BIN" -c "
import asyncio
from src.services.restore_service import RestoreService

async def restore():
    service = RestoreService()
    
    restore_op = await service.restore_full_backup(
        backup_id='$backup_id',
        verify_before_restore=True,
        create_backup_before_restore=True
    )
    
    print(f'Restore ID: {restore_op.restore_id}')
    print(f'Status: {restore_op.status}')
    print(f'Components restored: {restore_op.components_restored}')
    print(f'Duration: {restore_op.duration_minutes():.2f} minutes')
    
    if restore_op.errors:
        print(f'Errors: {restore_op.errors}')
        exit(1)
    
    return restore_op

asyncio.run(restore())
    " | tee -a "$LOG_FILE"
    
    local exit_code=${PIPESTATUS[0]}
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local duration_minutes=$((duration / 60))
    
    if [ $exit_code -eq 0 ]; then
        log_success "=========================================="
        log_success "EMERGENCY RESTORE COMPLETED"
        log_success "=========================================="
        log_success "Backup ID: $backup_id"
        log_success "Duration: $duration_minutes minutes"
        
        # Check RTO compliance
        if [ $duration_minutes -le 240 ]; then
            log_success "RTO COMPLIANT: Restore completed within 4 hours"
        else
            log_warning "RTO VIOLATION: Restore took $duration_minutes minutes (target: 240 minutes)"
        fi
        
        log_success "=========================================="
        
        # Send success alert
        send_emergency_alert "Emergency restore successful" "Backup $backup_id restored in $duration_minutes minutes"
        
        # Verify system health
        log "Verifying system health..."
        sleep 30  # Wait for services to stabilize
        
        # Check if services are running
        if systemctl is-active --quiet god-lion-seeker-api; then
            log_success "API service is running"
        else
            log_error "API service is not running"
        fi
        
        # Display post-restore instructions
        log ""
        log "=========================================="
        log "POST-RESTORE VERIFICATION STEPS"
        log "=========================================="
        log "1. Test application login"
        log "2. Verify database connectivity"
        log "3. Check recent data integrity"
        log "4. Review application logs"
        log "5. Monitor system performance"
        log "6. Notify users of service restoration"
        log "=========================================="
        
    else
        log_error "=========================================="
        log_error "EMERGENCY RESTORE FAILED"
        log_error "=========================================="
        log_error "Backup ID: $backup_id"
        log_error "Exit code: $exit_code"
        log_error "Duration: $duration_minutes minutes"
        log_error "=========================================="
        
        # Send failure alert
        send_emergency_alert "Emergency restore FAILED" "Backup $backup_id failed with exit code $exit_code. Contact emergency team immediately."
        
        log_error "IMMEDIATE ACTIONS REQUIRED:"
        log_error "1. Contact emergency team immediately"
        log_error "2. Review restore log: $LOG_FILE"
        log_error "3. Check system resources"
        log_error "4. Consider restoring from alternate backup"
        log_error "5. Document the failure for post-incident review"
        
        exit $exit_code
    fi
}

# Handle script interruption
trap 'log_error "Script interrupted"; send_emergency_alert "Restore interrupted" "Emergency restore was interrupted"; exit 130' INT TERM

# Execute main function
main "$@"
