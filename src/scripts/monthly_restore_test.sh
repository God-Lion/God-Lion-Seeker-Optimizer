#!/bin/bash
#
# Monthly Restore Test Script
# Implements monthly restore drills as required by disaster recovery plan
#
# Usage: ./monthly_restore_test.sh
# Schedule: Run monthly via cron
# Cron: 0 3 1 * * /path/to/monthly_restore_test.sh >> /var/log/backups/restore_test.log 2>&1

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/backups/restore_test_$(date +%Y%m).log"
PYTHON_BIN="${PYTHON_BIN:-python3}"
APP_ROOT="${APP_ROOT:-/app}"
REPORT_EMAIL="${REPORT_EMAIL:-admin@company.com}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Send test report
send_test_report() {
    local subject=$1
    local report_file=$2
    
    if command -v mail &> /dev/null; then
        cat "$report_file" | mail -s "$subject" "$REPORT_EMAIL"
    fi
}

# Main test execution
main() {
    log "=========================================="
    log "MONTHLY RESTORE DRILL"
    log "=========================================="
    log "Date: $(date)"
    log "=========================================="
    
    # Get latest full backup
    cd "$APP_ROOT"
    
    LATEST_BACKUP=$("$PYTHON_BIN" -c "
import asyncio
from src.services.backup_service import BackupService

async def get_latest():
    service = BackupService()
    backups = await service.list_backups(backup_type='full')
    
    if backups:
        print(backups[0].backup_id)
    else:
        print('NONE')

asyncio.run(get_latest())
    ")
    
    if [ "$LATEST_BACKUP" == "NONE" ]; then
        log "ERROR: No backups found to test"
        exit 1
    fi
    
    log "Testing restore for backup: $LATEST_BACKUP"
    
    # Execute restore test
    "$PYTHON_BIN" -c "
import asyncio
import json
from src.services.restore_service import RestoreService

async def test_restore():
    service = RestoreService()
    
    results = await service.test_restore('$LATEST_BACKUP')
    
    print('========================================')
    print('RESTORE TEST RESULTS')
    print('========================================')
    print(f'Backup ID: {results[\"backup_id\"]}')
    print(f'Success: {results[\"success\"]}')
    print(f'Duration: {results[\"duration_minutes\"]} minutes')
    print(f'RTO Compliant: {results[\"rto_compliant\"]}')
    print(f'Components Tested: {results[\"components_tested\"]}')
    
    if results['errors']:
        print(f'Errors: {results[\"errors\"]}')
    
    print('========================================')
    
    # Save report
    with open('/tmp/restore_test_report.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    return results

results = asyncio.run(test_restore())
exit(0 if results['success'] else 1)
    " | tee -a "$LOG_FILE"
    
    EXIT_CODE=${PIPESTATUS[0]}
    
    # Generate report
    REPORT_FILE="/tmp/restore_test_report_$(date +%Y%m).txt"
    
    cat > "$REPORT_FILE" <<EOF
========================================
MONTHLY RESTORE DRILL REPORT
========================================
Date: $(date)
Backup Tested: $LATEST_BACKUP
Result: $([ $EXIT_CODE -eq 0 ] && echo "SUCCESS" || echo "FAILED")

Test Duration: See detailed log
RTO Target: 4 hours (240 minutes)

Detailed Log: $LOG_FILE

Next Steps:
1. Review test results
2. Update restore procedures if needed
3. Document lessons learned
4. Schedule next monthly test

========================================
EOF
    
    # Send report
    if [ $EXIT_CODE -eq 0 ]; then
        log "Restore test completed successfully"
        send_test_report "Monthly Restore Test - SUCCESS" "$REPORT_FILE"
    else
        log "ERROR: Restore test failed"
        send_test_report "Monthly Restore Test - FAILED" "$REPORT_FILE"
        exit $EXIT_CODE
    fi
}

# Execute main function
main
