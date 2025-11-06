# Encryption & Security Scripts

This directory contains scripts for managing encryption keys and encrypting existing data.

## Scripts Overview

### 1. `generate_encryption_keys.py`
Generates secure encryption keys for the application.

**Usage**:
```bash
python -m src.scripts.generate_encryption_keys
```

**Generates**:
- `ENCRYPTION_KEY` - For PII field encryption (Fernet/AES-256)
- `FILE_ENCRYPTION_KEY` - For file encryption (AES-256)
- `REDIS_PASSWORD` - For Redis authentication
- `JWT_SECRET_KEY` - For JWT tokens (optional)

**Output**: Keys displayed on screen with option to save to file

⚠️ **Warning**: Store keys securely! Never commit to version control.

---

### 2. `encrypt_existing_data.py`
Encrypts existing PII data in the database.

**Usage**:
```bash
python -m src.scripts.encrypt_existing_data
```

**What it does**:
- Encrypts all user PII (email, name, google_id)
- Encrypts resume data (resume_text, parsed_data)
- Encrypts security logs (ip_address, user_agent, location)
- Marks records as encrypted
- Creates audit log entries

**Prerequisites**:
- `ENCRYPTION_KEY` environment variable must be set
- Database migration must be applied (`alembic upgrade head`)
- Database backup recommended

**Safety**:
- Prompts for confirmation before running
- Processes in batches with progress logging
- Commits after every 100 records
- Logs errors without stopping

⚠️ **Warning**: This is a one-way operation. Backup your database first!

---

### 3. `encrypt_existing_files.py`
Encrypts existing resume files in the uploads directory.

**Usage**:
```bash
python -m src.scripts.encrypt_existing_files
```

**What it does**:
- Scans `uploads/` directory for resume files
- Encrypts files with AES-256-CBC
- Adds `.enc` extension to encrypted files
- Updates database paths to point to encrypted files
- Deletes original unencrypted files

**Prerequisites**:
- `FILE_ENCRYPTION_KEY` environment variable must be set
- File backup recommended

**Safety**:
- Prompts for confirmation before running
- Skips already encrypted files (*.enc)
- Logs all operations
- Continues on individual file failures

⚠️ **Warning**: This is a one-way operation. Backup your files first!

---

## Quick Start Guide

### Step 1: Generate Keys
```bash
# Generate encryption keys
python -m src.scripts.generate_encryption_keys

# Save output to secure location
```

### Step 2: Configure Environment
```bash
# Add to .env file
echo "ENCRYPTION_KEY=<your-key>" >> .env
echo "FILE_ENCRYPTION_KEY=<your-key>" >> .env
```

### Step 3: Run Migration
```bash
# Apply database schema changes
alembic upgrade head
```

### Step 4: Backup Data
```bash
# PostgreSQL
pg_dump -U postgres -d godlionseeker_db > backup.sql

# MySQL
mysqldump -u root -p godlionseeker_db > backup.sql

# Files
tar -czf uploads_backup.tar.gz uploads/
```

### Step 5: Encrypt Data
```bash
# Encrypt database records
python -m src.scripts.encrypt_existing_data

# Encrypt files
python -m src.scripts.encrypt_existing_files
```

### Step 6: Verify
```bash
# Check database
python -c "
from src.config.database import get_sync_session
from src.models.user import User
session = get_sync_session()
user = session.query(User).first()
print(f'Email encrypted: {user.is_encrypted}')
print(f'Email value: {user.email}')  # Should be encrypted
session.close()
"

# Check files
ls -la uploads/resumes/*/  # Should see *.enc files
```

---

## Environment Variables Required

```bash
# Required for all scripts
ENCRYPTION_KEY=<fernet-key>           # From generate_encryption_keys.py
FILE_ENCRYPTION_KEY=<hex-key>        # From generate_encryption_keys.py

# Database connection (should already be set)
DATABASE_URL=<db-connection-string>
# or
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<password>
DB_NAME=godlionseeker_db
```

---

## Troubleshooting

### Error: "Encryption key not provided"
**Solution**: Set the `ENCRYPTION_KEY` environment variable
```bash
export ENCRYPTION_KEY=<your-key>
# or add to .env file
```

### Error: "Invalid encryption key format"
**Solution**: Regenerate the key
```bash
python -m src.scripts.generate_encryption_keys
```

### Error: "Database migration not applied"
**Solution**: Run the migration
```bash
alembic upgrade head
```

### Error: "File already encrypted"
**Solution**: This is normal - script skips already encrypted files

### Error: "Permission denied"
**Solution**: Check file/directory permissions
```bash
chmod 755 uploads/
chmod 644 uploads/resumes/*
```

---

## Safety Features

### Confirmation Prompts
All scripts prompt for confirmation before making changes:
```
WARNING: This script will encrypt all existing PII data in the database.
Do you want to continue? (yes/no):
```

### Batch Processing
Database encryption processes in batches with progress updates:
```
Encrypted 100 users...
Encrypted 200 users...
Encrypted 50 resume profiles...
```

### Error Handling
Scripts continue on errors and log them:
```
ERROR: Failed to encrypt user 123: Invalid data format
INFO: Continuing with next record...
```

### Audit Logging
All encryption operations logged to `encryption_audit_log` table:
```sql
SELECT * FROM encryption_audit_log 
WHERE performed_at > NOW() - INTERVAL '1 day'
ORDER BY performed_at DESC;
```

---

## Performance

### Expected Runtime

| Operation | Records | Time (est.) |
|-----------|---------|-------------|
| Users | 1,000 | ~30 seconds |
| Users | 10,000 | ~5 minutes |
| Users | 100,000 | ~30 minutes |
| Resume files | 1,000 | ~2 minutes |
| Resume files | 10,000 | ~20 minutes |

**Note**: Times vary based on hardware and record size

### Optimization Tips
1. Run during low-traffic periods
2. Close other database connections
3. Ensure sufficient disk space (files double in size temporarily)
4. Monitor CPU and memory usage
5. Use SSD for better I/O performance

---

## Rollback Procedure

If you need to rollback encryption:

### 1. Restore from Backup
```bash
# PostgreSQL
psql -U postgres -d godlionseeker_db < backup.sql

# MySQL
mysql -u root -p godlionseeker_db < backup.sql

# Files
tar -xzf uploads_backup.tar.gz
```

### 2. Downgrade Migration (optional)
```bash
alembic downgrade -1
```

### 3. Verify Data
```bash
# Check a few records to ensure data is restored correctly
```

---

## Best Practices

1. ✅ **Always backup before encrypting**
2. ✅ **Test on development/staging first**
3. ✅ **Store encryption keys securely**
4. ✅ **Use different keys for each environment**
5. ✅ **Document key rotation dates**
6. ✅ **Monitor encryption audit logs**
7. ✅ **Test decryption after encryption**
8. ✅ **Keep backup of encryption keys**
9. ✅ **Plan for key rotation**
10. ✅ **Review security regularly**

---

## Related Documentation

- **Full Security Guide**: `DOCS/ENCRYPTION_SECURITY_GUIDE.md`
- **Quick Start**: `DOCS/SECURITY_QUICK_START.md`
- **Implementation Summary**: `DOCS/SECURITY_IMPLEMENTATION_SUMMARY.md`
- **Environment Template**: `.env.encryption.template`

---

## Support

For issues or questions:
1. Check this README
2. Review `DOCS/ENCRYPTION_SECURITY_GUIDE.md`
3. Check encryption audit logs
4. Review application logs

---

**Last Updated**: 2025-11-05  
**Version**: 1.0
