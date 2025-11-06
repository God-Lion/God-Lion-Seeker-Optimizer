# Backup and Disaster Recovery - Quick Reference

## Emergency Restore (< 5 Minutes to Start)

```bash
# 1. Find latest backup
cd /app
python3 -c "from src.services.backup_service import BackupService; import asyncio; asyncio.run(BackupService().list_backups())"

# 2. Execute emergency restore
sudo /app/src/scripts/emergency_restore.sh <backup_id>

# Example:
sudo /app/src/scripts/emergency_restore.sh full_20250105_020000
```

## Quick Status Checks

```bash
# Check RPO compliance (24-hour requirement)
curl -H "Authorization: Bearer $TOKEN" https://api.example.com/api/backup/status/rpo

# Check backup health
curl -H "Authorization: Bearer $TOKEN" https://api.example.com/api/backup/health

# List recent backups
curl -H "Authorization: Bearer $TOKEN" https://api.example.com/api/backup/list?limit=10
```

## Emergency Contacts (Priority Order)

1. **DBA:** dba@company.com / +1-XXX-XXX-XXXX
2. **SysAdmin:** sysadmin@company.com / +1-XXX-XXX-XXXX
3. **Security:** security@company.com / +1-XXX-XXX-XXXX

## Key Metrics

- **RPO:** 24 hours (maximum data loss)
- **RTO:** 4 hours (maximum downtime)
- **Full Backup:** Daily at 2:00 AM
- **Transaction Logs:** Hourly
- **Incremental:** Every 6 hours
- **Restore Test:** Monthly (1st of month)

## Backup Locations

- **Local:** `/var/backups/god-lion-seeker/local/` (7 days)
- **Cloud:** S3/Azure bucket (90 days)
- **Cold Storage:** Glacier/Archive (7 years)

## Common Restore Scenarios

### Full System Restore
```bash
sudo /app/src/scripts/emergency_restore.sh <backup_id>
# Estimated time: 2-4 hours
```

### Database Only
```bash
cd /var/backups/god-lion-seeker/local/
tar -xzf <backup_id>.tar.gz
cd <backup_id>/<backup_id>/
pg_restore -h localhost -U god_lion_user -d god_lion_seeker --clean database_*.sql
# Estimated time: 30-60 minutes
```

### Point-in-Time Recovery
```bash
curl -X POST https://api.example.com/api/backup/restore/pitr \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"target_timestamp": "2025-01-05T14:30:00Z"}'
# Estimated time: 2-3 hours
```

## Manual Backup Creation

```bash
# Full backup
curl -X POST https://api.example.com/api/backup/create \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"backup_type": "full", "verify_after_creation": true}'

# Or via Python
python3 -c "from src.services.backup_service import BackupService; import asyncio; asyncio.run(BackupService().create_full_backup())"
```

## Verify Backup

```bash
curl -X POST https://api.example.com/api/backup/verify/<backup_id> \
  -H "Authorization: Bearer $TOKEN"
```

## Monitoring Logs

```bash
# Daily backup log
tail -f /var/log/backups/daily_backup.log

# Monitor service log
tail -f /var/log/backups/monitor.log

# Restore test log
tail -f /var/log/backups/restore_test.log
```

## Service Management

```bash
# Start backup monitoring
sudo systemctl start backup-monitor

# Check monitoring status
sudo systemctl status backup-monitor

# View recent backup jobs
sudo journalctl -u backup-monitor -f
```

## Troubleshooting

### Backup Failed
1. Check disk space: `df -h /var/backups`
2. Check logs: `tail -100 /var/log/backups/daily_backup.log`
3. Verify database connectivity: `psql -h localhost -U god_lion_user -l`

### Restore Failed
1. Check backup integrity: Verify checksum
2. Ensure sufficient disk space
3. Check database permissions
4. Review error logs

### RPO Violation
1. Immediately create manual backup
2. Check why scheduled backup failed
3. Verify cron is running: `systemctl status cron`

## Cron Schedule

```
Daily Backup:        0 2 * * *   (2:00 AM daily)
Hourly Txlog:        0 * * * *   (Every hour)
Incremental:         0 */6 * * * (Every 6 hours)
Monthly Test:        0 3 1 * *   (1st day of month, 3:00 AM)
Weekly Cleanup:      0 4 * * 0   (Sunday, 4:00 AM)
```

## Quick Health Check Script

```bash
#!/bin/bash
echo "=== Backup System Health ==="
echo "Last backup:"
ls -lth /var/backups/god-lion-seeker/local/ | head -n 2

echo -e "\nDisk space:"
df -h /var/backups/god-lion-seeker

echo -e "\nRPO status:"
curl -s -H "Authorization: Bearer $TOKEN" https://api.example.com/api/backup/status/rpo | jq .

echo -e "\nRecent backups:"
ls -lt /var/backups/god-lion-seeker/local/*.tar.gz | head -n 5
```

## Post-Restore Verification Checklist

- [ ] Services running: `systemctl status god-lion-seeker-api`
- [ ] Database accessible: `psql -h localhost -U god_lion_user -d god_lion_seeker -c "SELECT 1;"`
- [ ] API responding: `curl https://api.example.com/api/health`
- [ ] Login working: Test user login
- [ ] Files accessible: Check `/var/uploads/`
- [ ] No errors in logs: `tail -100 /var/log/god-lion-seeker/app.log`
- [ ] Notify users: Send recovery notification email

---

**For detailed procedures, see:** [DISASTER_RECOVERY_PLAN.md](./DISASTER_RECOVERY_PLAN.md)
