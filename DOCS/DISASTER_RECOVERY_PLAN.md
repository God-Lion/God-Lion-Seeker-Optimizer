# Disaster Recovery Plan (DRP)
## God Lion Seeker Optimizer

**Version:** 1.0  
**Last Updated:** January 2025  
**Owner:** IT Operations & Security Team  
**Review Frequency:** Quarterly

---

## 1. Executive Summary

This Disaster Recovery Plan (DRP) provides comprehensive procedures for recovering the God Lion Seeker Optimizer application in the event of system failure, data loss, or disaster. The plan ensures business continuity with defined Recovery Point Objective (RPO) and Recovery Time Objective (RTO).

### Key Objectives
- **RPO (Recovery Point Objective):** 24 hours - Maximum acceptable data loss
- **RTO (Recovery Time Objective):** 4 hours - Maximum acceptable downtime

---

## 2. Recovery Objectives

### 2.1 RPO (Recovery Point Objective): 24 Hours

**Implementation:**
- **Daily Full Backups:** Automated daily at 2:00 AM
- **Hourly Transaction Logs:** PostgreSQL WAL backups every hour
- **Incremental Backups:** Every 6 hours for changed data
- **Maximum Data Loss:** Up to 24 hours of data

### 2.2 RTO (Recovery Time Objective): 4 Hours

**Implementation:**
- Documented restore procedures (this document)
- Tested monthly restore drills
- Emergency contact list with priority levels
- Automated restore scripts
- Pre-configured cloud infrastructure

---

## 3. Backup Strategy

### 3.1 Backup Types

#### Full Backup
- **Frequency:** Daily at 2:00 AM
- **Retention:** 7 days local, 90 days cloud, 7 years cold storage
- **Components:**
  - PostgreSQL database (full dump)
  - Redis data
  - Application configuration files
  - SSL certificates
  - User-uploaded files (resumes, documents)
  - Application logs (last 30 days)

#### Incremental Backup
- **Frequency:** Every 6 hours
- **Retention:** 7 days local
- **Components:**
  - Database changes since last backup
  - Modified/new uploaded files
  - Recent logs

#### Transaction Log Backup
- **Frequency:** Hourly
- **Retention:** 7 days local
- **Components:**
  - PostgreSQL Write-Ahead Logs (WAL)
  - Enables point-in-time recovery

### 3.2 Backup Locations

#### Primary Storage: Local (7 Days)
- **Location:** `/var/backups/god-lion-seeker/local/`
- **Purpose:** Fast recovery for recent failures
- **Retention:** 7 days
- **Monitoring:** Daily verification

#### Secondary Storage: Cloud (90 Days)
- **Provider:** AWS S3 / Azure Blob Storage
- **Location:** Configured bucket (configurable region)
- **Purpose:** Off-site disaster recovery
- **Retention:** 90 days
- **Features:**
  - Automated upload after backup creation
  - Lifecycle policies for automatic cleanup
  - Versioning enabled
  - Encryption at rest

#### Tertiary Storage: Cold Storage (7 Years)
- **Provider:** AWS Glacier / Azure Archive
- **Purpose:** Compliance and long-term archival
- **Retention:** 7 years
- **Use Cases:**
  - Legal compliance (GDPR, CCPA)
  - Audit requirements
  - Historical data preservation

### 3.3 What is Backed Up

✅ **Database:**
- PostgreSQL full database dump
- All tables, indexes, constraints
- User accounts and permissions
- Database configurations

✅ **Redis Data:**
- Session data (if persistence enabled)
- Cache data
- Queue data

✅ **Configuration Files:**
- `.env` files (encrypted)
- Application settings
- Database connection strings
- API keys and secrets (encrypted)

✅ **SSL Certificates:**
- SSL/TLS certificates
- Private keys (encrypted)
- Certificate chains

✅ **User Data:**
- Resume files (PDF, DOCX)
- Uploaded documents
- Profile images
- Job application attachments

✅ **Application Logs:**
- Last 30 days of logs
- Error logs
- Access logs
- Audit logs

---

## 4. Backup Automation

### 4.1 Cron Schedule

```bash
# Daily Full Backup - 2:00 AM
0 2 * * * /app/src/scripts/daily_backup.sh

# Hourly Transaction Log Backup
0 * * * * /app/src/scripts/hourly_txlog_backup.sh

# Incremental Backup - Every 6 hours
0 */6 * * * /app/src/scripts/incremental_backup.sh

# Monthly Restore Test - 1st of month at 3:00 AM
0 3 1 * * /app/src/scripts/monthly_restore_test.sh

# Weekly Cleanup - Sunday at 4:00 AM
0 4 * * 0 /app/src/scripts/cleanup_backups.sh
```

### 4.2 Backup Scripts

| Script | Location | Purpose |
|--------|----------|---------|
| `daily_backup.sh` | `/app/src/scripts/` | Full daily backup |
| `hourly_txlog_backup.sh` | `/app/src/scripts/` | Transaction log backup |
| `incremental_backup.sh` | `/app/src/scripts/` | Incremental backup |
| `monthly_restore_test.sh` | `/app/src/scripts/` | Monthly restore drill |
| `emergency_restore.sh` | `/app/src/scripts/` | Emergency disaster recovery |

### 4.3 Monitoring

**Systemd Service:**
```bash
sudo systemctl start backup-monitor
sudo systemctl enable backup-monitor
sudo systemctl status backup-monitor
```

**Monitoring Checks:**
- ✅ RPO compliance (24-hour threshold)
- ✅ Backup success/failure
- ✅ Disk space availability
- ✅ Cloud storage health
- ✅ Backup verification status
- ✅ Restore testing compliance

**Alerts:**
- Critical: Email + Syslog
- Warning: Email
- Info: Log file

---

## 5. Restore Procedures

### 5.1 Full System Restore (Emergency)

**Use Case:** Complete system failure, data corruption, ransomware attack

**Estimated Time:** 2-4 hours

**Prerequisites:**
1. Access to backup storage
2. Root/sudo access to server
3. Emergency contact list
4. Database credentials

**Step-by-Step Procedure:**

#### Step 1: Identify Latest Backup (5 minutes)

```bash
# List available backups
cd /app
python3 -c "
import asyncio
from src.services.backup_service import BackupService

async def list_backups():
    service = BackupService()
    backups = await service.list_backups(backup_type='full')
    
    for backup in backups[:10]:
        print(f'{backup.backup_id} - {backup.timestamp} - {backup.size_bytes / 1024 / 1024:.2f} MB')

asyncio.run(list_backups())
"
```

#### Step 2: Execute Emergency Restore (120-180 minutes)

```bash
# Run emergency restore script
sudo /app/src/scripts/emergency_restore.sh <backup_id>

# Example:
sudo /app/src/scripts/emergency_restore.sh full_20250105_020000
```

**The script will:**
1. ✅ Display emergency contacts
2. ✅ Verify prerequisites
3. ✅ Confirm operation (requires typing "YES")
4. ✅ Create safety backup of current state
5. ✅ Stop application services
6. ✅ Verify backup integrity
7. ✅ Extract backup archive
8. ✅ Restore database
9. ✅ Restore Redis data
10. ✅ Restore configuration files
11. ✅ Restore SSL certificates
12. ✅ Restore user files
13. ✅ Restart services
14. ✅ Verify system health

#### Step 3: Post-Restore Verification (30-60 minutes)

```bash
# 1. Check service status
sudo systemctl status god-lion-seeker-api
sudo systemctl status god-lion-seeker-worker

# 2. Test database connectivity
psql -h localhost -U god_lion_user -d god_lion_seeker -c "SELECT COUNT(*) FROM users;"

# 3. Test application login
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}'

# 4. Check application logs
tail -f /var/log/god-lion-seeker/app.log

# 5. Verify file access
ls -la /var/uploads/

# 6. Test API endpoints
curl https://your-domain.com/api/health
```

#### Step 4: Notify Users (10 minutes)

- Send email notification to all users
- Update status page
- Post on social media (if applicable)
- Document incident in incident log

### 5.2 Point-in-Time Recovery (PITR)

**Use Case:** Need to restore to specific point in time (e.g., before data corruption)

**Estimated Time:** 2-3 hours

```bash
# Using API
curl -X POST https://your-domain.com/api/backup/restore/pitr \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_timestamp": "2025-01-05T14:30:00Z",
    "verify_before_restore": true
  }'

# Using Python
python3 -c "
import asyncio
from datetime import datetime
from src.services.restore_service import RestoreService

async def pitr():
    service = RestoreService()
    
    target_time = datetime(2025, 1, 5, 14, 30, 0)
    
    restore_op = await service.restore_point_in_time(
        target_timestamp=target_time,
        verify_before_restore=True
    )
    
    print(f'Restore completed: {restore_op.status}')
    print(f'Duration: {restore_op.duration_minutes():.2f} minutes')

asyncio.run(pitr())
"
```

### 5.3 Selective Component Restore

**Use Case:** Restore only specific components (database, files, config)

**Database Only:**

```bash
# Extract backup
cd /var/backups/god-lion-seeker/local/
tar -xzf full_20250105_020000.tar.gz

# Restore database
cd full_20250105_020000/full_20250105_020000/
pg_restore -h localhost -U god_lion_user -d god_lion_seeker \
  --clean --if-exists database_full_20250105_020000.sql
```

**User Files Only:**

```bash
# Extract backup
tar -xzf full_20250105_020000.tar.gz

# Restore files
cp -r full_20250105_020000/full_20250105_020000/uploads/* /var/uploads/
```

**Configuration Files Only:**

```bash
# Extract backup
tar -xzf full_20250105_020000.tar.gz

# Restore config
cp -r full_20250105_020000/full_20250105_020000/config/* /app/config/
```

---

## 6. Backup Testing

### 6.1 Monthly Restore Drill

**Schedule:** 1st of every month at 3:00 AM

**Automated Test:**

```bash
# Run automated test
/app/src/scripts/monthly_restore_test.sh
```

**Manual Test:**

```bash
# Test specific backup
python3 -c "
import asyncio
from src.services.restore_service import RestoreService

async def test():
    service = RestoreService()
    results = await service.test_restore('full_20250105_020000')
    
    print(f'Test Result: {results[\"success\"]}')
    print(f'Duration: {results[\"duration_minutes\"]} minutes')
    print(f'RTO Compliant: {results[\"rto_compliant\"]}')
    print(f'Components Tested: {results[\"components_tested\"]}')

asyncio.run(test())
"
```

### 6.2 Test Metrics

**What to Measure:**
- ✅ Restore time (must be < 240 minutes for RTO)
- ✅ Data integrity verification
- ✅ Application functionality post-restore
- ✅ Database connectivity
- ✅ File accessibility

**Success Criteria:**
- Restore completes without errors
- All components restored successfully
- Application functions normally
- Restore time < 4 hours (RTO)
- No data corruption

### 6.3 Documentation

After each test, document:
1. Test date and time
2. Backup tested
3. Restore duration
4. Issues encountered
5. Lessons learned
6. Procedure updates needed

**Test Log Location:** `/var/log/backups/restore_test.log`

---

## 7. Emergency Contacts

### 7.1 Primary Contacts (Priority 1)

**Database Administrator**
- **Name:** [DBA_NAME]
- **Email:** dba@company.com
- **Phone:** +1-XXX-XXX-XXXX
- **Responsibility:** Database restore, verification

**System Administrator**
- **Name:** [SYSADMIN_NAME]
- **Email:** sysadmin@company.com
- **Phone:** +1-XXX-XXX-XXXX
- **Responsibility:** Infrastructure, services

### 7.2 Secondary Contacts (Priority 2)

**Security Team**
- **Email:** security@company.com
- **Phone:** +1-XXX-XXX-XXXX
- **Responsibility:** Security incidents, data breaches

**Development Lead**
- **Email:** dev-lead@company.com
- **Responsibility:** Application issues, configuration

### 7.3 Escalation Process

1. **Initial Detection:** Automated monitoring alerts
2. **First Contact:** System Administrator (within 15 minutes)
3. **Escalation 1:** Database Administrator (if DB-related)
4. **Escalation 2:** Security Team (if security incident)
5. **Management:** CTO/VP Engineering (for major incidents)

**Emergency Hotline:** +1-XXX-XXX-XXXX (24/7)

---

## 8. Disaster Scenarios

### 8.1 Complete Server Failure

**Scenario:** Physical server failure, cannot boot

**Recovery Steps:**
1. Provision new server (cloud or physical)
2. Install OS and dependencies
3. Clone application repository
4. Configure database
5. Run emergency restore script
6. Update DNS if IP changed
7. Verify functionality
8. Notify users

**Estimated Time:** 3-4 hours

### 8.2 Database Corruption

**Scenario:** Database corruption, cannot start PostgreSQL

**Recovery Steps:**
1. Stop PostgreSQL service
2. Move corrupted database files to backup location
3. Create new database instance
4. Restore from latest backup
5. Apply transaction logs (if PITR needed)
6. Verify data integrity
7. Restart services

**Estimated Time:** 1-2 hours

### 8.3 Ransomware Attack

**Scenario:** Files encrypted by ransomware

**Recovery Steps:**
1. **Immediately isolate** infected systems
2. **DO NOT pay ransom**
3. Contact security team and law enforcement
4. Identify infection time
5. Select backup from before infection
6. Restore to clean infrastructure
7. Scan all systems before going live
8. Implement additional security measures

**Estimated Time:** 4-8 hours

### 8.4 Accidental Data Deletion

**Scenario:** User or admin accidentally deleted data

**Recovery Steps:**
1. Determine deletion timestamp
2. Use point-in-time recovery (PITR)
3. Restore to temporary database
4. Export deleted data
5. Import into production database
6. Verify data integrity

**Estimated Time:** 1-2 hours

### 8.5 Cloud Provider Outage

**Scenario:** AWS/Azure region outage

**Recovery Steps:**
1. Check cloud provider status page
2. If extended outage, switch to alternate region
3. Restore from cloud backup to new region
4. Update DNS to new region
5. Verify functionality
6. Monitor for stability

**Estimated Time:** 2-3 hours

---

## 9. Post-Disaster Activities

### 9.1 Incident Documentation

**Required Documentation:**
1. Incident timeline
2. Root cause analysis
3. Recovery actions taken
4. Restore duration
5. Data loss assessment
6. Issues encountered
7. Lessons learned

**Template Location:** `/app/docs/incident_report_template.md`

### 9.2 Post-Mortem Meeting

**Within 48 hours of incident:**
- Review incident timeline
- Discuss what went well
- Identify improvements
- Update procedures
- Assign action items

**Attendees:**
- System Administrator
- Database Administrator
- Security Team
- Development Lead
- Management

### 9.3 Procedure Updates

Based on lessons learned:
1. Update restore procedures
2. Improve monitoring
3. Enhance automation
4. Update training materials
5. Schedule additional drills

### 9.4 User Communication

**During Incident:**
- Status page updates every 30 minutes
- Email updates every hour
- Social media updates

**Post-Recovery:**
- Incident summary email to all users
- Root cause explanation (if appropriate)
- Steps taken to prevent recurrence
- Apology and appreciation for patience

---

## 10. Monitoring and Alerts

### 10.1 Automated Monitoring

**Backup Health Checks:**
- RPO compliance (every hour)
- Backup success/failure (real-time)
- Disk space (every hour)
- Cloud storage connectivity (every 6 hours)
- Verification status (daily)

**Alert Levels:**

| Level | Condition | Action | Notification |
|-------|-----------|--------|--------------|
| **Critical** | RPO violation (>24h) | Create backup immediately | Email + SMS + Syslog |
| **Critical** | Disk space >90% | Clean up old backups | Email + SMS |
| **Critical** | Backup failed 3x | Manual intervention | Email + SMS |
| **Warning** | RPO approaching (>20h) | Schedule backup | Email |
| **Warning** | Disk space >80% | Monitor closely | Email |
| **Warning** | Backup not verified | Verify backups | Email |
| **Info** | Backup completed | None | Log only |

### 10.2 Health Check API

```bash
# Check backup system health
curl https://your-domain.com/api/backup/health \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Response:**
```json
{
  "overall_status": "healthy",
  "rpo_compliant": true,
  "recent_backups_count": 7,
  "last_backup": "full_20250105_020000",
  "last_backup_timestamp": "2025-01-05T02:00:00Z",
  "disk_space": {
    "total_gb": 500,
    "used_gb": 120,
    "free_gb": 380,
    "percent_used": 24
  },
  "recommendations": []
}
```

---

## 11. Compliance and Audit

### 11.1 Compliance Requirements

**GDPR:**
- Backups encrypted at rest
- Access logs maintained
- Data retention policies enforced
- Right to be forgotten (backup purging)

**CCPA:**
- User data inventory
- Backup documentation
- Data deletion procedures

**SOC 2:**
- Regular backup testing
- Documented procedures
- Audit trail maintenance

### 11.2 Audit Trail

**What is Logged:**
- All backup operations
- All restore operations
- Backup verification results
- Backup deletions
- Access to backup systems
- Configuration changes

**Audit Log Location:** `/var/log/backups/audit.log`

**Retention:** 7 years

---

## 12. Training and Drills

### 12.1 Required Training

**All IT Staff:**
- Backup system overview
- How to check backup status
- How to contact emergency team

**System Administrators:**
- Full restore procedure
- Emergency restore script usage
- Backup verification
- Monitoring dashboard

**Database Administrators:**
- Database restore procedures
- Point-in-time recovery
- Transaction log management
- Data integrity verification

### 12.2 Drill Schedule

| Drill Type | Frequency | Participants |
|------------|-----------|--------------|
| Full restore test | Monthly | DBA, SysAdmin |
| Tabletop exercise | Quarterly | All IT staff |
| Emergency simulation | Bi-annually | All staff + Management |
| Documentation review | Quarterly | DBA, SysAdmin |

---

## 13. Continuous Improvement

### 13.1 Quarterly Review

**Review Items:**
- Backup success rate
- Restore test results
- RTO/RPO compliance
- Procedure effectiveness
- Technology updates

### 13.2 Annual Updates

**Update Based On:**
- New technologies
- Lessons from incidents
- Regulatory changes
- Business growth
- Infrastructure changes

---

## 14. Appendices

### Appendix A: Command Reference

```bash
# List backups
python3 -m src.services.backup_service list

# Create full backup
python3 -m src.services.backup_service create --type full

# Verify backup
python3 -m src.services.backup_service verify <backup_id>

# Emergency restore
sudo /app/src/scripts/emergency_restore.sh <backup_id>

# Check RPO status
curl https://your-domain.com/api/backup/status/rpo

# Health check
curl https://your-domain.com/api/backup/health
```

### Appendix B: Configuration Files

**Backup Configuration:** `/app/.env`

```bash
BACKUP_ROOT_PATH=/var/backups/god-lion-seeker
CLOUD_STORAGE_TYPE=s3  # or azure
CLOUD_BACKUP_BUCKET=god-lion-seeker-backups
CLOUD_REGION=us-east-1
BACKUP_ALERT_EMAIL=admin@company.com
```

**Emergency Contacts:** `/app/config/emergency_contacts.json`

### Appendix C: Troubleshooting

**Problem:** Restore script fails with "disk space" error  
**Solution:** Clean up old backups or provision more disk space

**Problem:** Database restore fails with permission error  
**Solution:** Ensure restore script runs with correct database user credentials

**Problem:** Cloud upload fails  
**Solution:** Check AWS/Azure credentials and network connectivity

**Problem:** Restore takes longer than 4 hours  
**Solution:** Consider upgrading hardware or optimizing backup size

---

## Document Control

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Next Review Date:** April 2025  
**Owner:** IT Operations Team  
**Approved By:** CTO/VP Engineering  

**Change Log:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2025 | IT Ops | Initial version |

---

**END OF DISASTER RECOVERY PLAN**
