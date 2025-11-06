# Security Implementation Quick Reference

## ⚠️ CRITICAL - Complete These Steps Immediately

### 1. Generate Encryption Keys (5 minutes)

```bash
python -m src.scripts.generate_encryption_keys
```

Save the output securely! You'll need:
- `ENCRYPTION_KEY` - For PII encryption
- `FILE_ENCRYPTION_KEY` - For file encryption
- `REDIS_PASSWORD` - For Redis authentication

### 2. Add to Environment (.env file)

```bash
# Add these to your .env file
ENCRYPTION_KEY=<your-generated-key>
FILE_ENCRYPTION_KEY=<your-generated-key>
ENCRYPTION_ENABLED=true
REDIS_PASSWORD=<your-generated-password>
REDIS_USE_TLS=false  # Set true in production
```

### 3. Run Database Migration

```bash
alembic upgrade head
```

### 4. Encrypt Existing Data

```bash
# Backup your database first!
python -m src.scripts.encrypt_existing_data
python -m src.scripts.encrypt_existing_files
```

---

## 📋 What Was Implemented

### ✅ Field-Level Encryption (CRITICAL)
- **Location**: `src/services/encryption_service.py`
- **Algorithm**: AES-256 (Fernet)
- **Encrypted Fields**:
  - User: email, first_name, last_name, google_id
  - Resume: resume_text, parsed_data
  - Security logs: ip_address, user_agent, location
  - Applications: cover_letter

### ✅ File Encryption (HIGH PRIORITY)
- **Location**: `src/services/file_encryption_service.py`
- **Algorithm**: AES-256-CBC
- **Encrypts**: All resume files (PDF, DOCX, TXT)
- **Storage**: `uploads/resumes/{user_id}/*.enc`

### ✅ Log Sanitization (MEDIUM PRIORITY)
- **Location**: `src/middleware/log_sanitization.py`
- **Removes**: Emails, phones, SSN, IPs, passwords from logs
- **Masks**: All PII before logging

### ✅ Redis Security (MEDIUM PRIORITY)
- **Location**: `src/config/redis_secure.py`
- **Features**: AUTH password, TLS/SSL support
- **Config**: REDIS_PASSWORD, REDIS_USE_TLS

### ✅ Database Migration
- **Location**: `src/alembic/versions/20251105_add_encryption_support.py`
- **Changes**: Extended columns, encryption tracking, audit log

---

## 🔧 Quick Usage Examples

### Encrypt User Data

```python
from src.services.encryption_service import get_pii_encryption_service

pii = get_pii_encryption_service()

# Encrypt
user_data = {'email': 'user@example.com', 'first_name': 'John'}
encrypted = pii.encrypt_user_pii(user_data)

# Decrypt
decrypted = pii.decrypt_user_pii(encrypted)
```

### Encrypt Files

```python
from src.services.file_encryption_service import get_file_encryption_service

file_enc = get_file_encryption_service()

# Encrypt
encrypted_path = file_enc.encrypt_file('resume.pdf')

# Decrypt
decrypted_path = file_enc.decrypt_file('resume.pdf.enc')
```

### Use Secure Redis

```python
from src.config.redis_secure import get_redis_client

redis = get_redis_client()
redis.set('key', 'value')  # Automatically uses AUTH and TLS if configured
```

### Enable Log Sanitization

```python
from src.middleware.log_sanitization import setup_sanitized_logging

# In main.py or app startup
setup_sanitized_logging(log_level="INFO")
```

---

## 🔐 Production Deployment Checklist

### Before Deploying to Production

- [ ] **Generate production encryption keys** (separate from dev!)
- [ ] **Store keys in secrets manager** (AWS Secrets Manager, Vault, etc.)
- [ ] **Enable Redis TLS** (`REDIS_USE_TLS=true`)
- [ ] **Set Redis password** (`REDIS_PASSWORD`)
- [ ] **Enable database TDE** (PostgreSQL/MySQL encryption at rest)
- [ ] **Use HTTPS only** for all API endpoints
- [ ] **Enable log sanitization** (`LOG_SANITIZATION_ENABLED=true`)
- [ ] **Backup encryption keys** securely
- [ ] **Test encryption/decryption** end-to-end
- [ ] **Review access controls** for encryption keys
- [ ] **Set up monitoring** for encryption operations
- [ ] **Document key rotation** procedure
- [ ] **Train team** on security procedures

### PostgreSQL TDE Options

**Option 1: AWS RDS Encryption**
```bash
aws rds create-db-instance --storage-encrypted --kms-key-id <key>
```

**Option 2: Disk-level Encryption**
- LUKS for Linux
- BitLocker for Windows
- Cloud provider disk encryption

**Option 3: pgcrypto Extension**
```sql
CREATE EXTENSION pgcrypto;
```

### Redis TLS Configuration

```bash
# Environment variables
REDIS_USE_TLS=true
REDIS_SSL_CERT_REQS=required
REDIS_SSL_CA_CERTS=/path/to/ca.crt
REDIS_SSL_CERTFILE=/path/to/client.crt
REDIS_SSL_KEYFILE=/path/to/client.key
```

---

## 📊 Security Compliance

### What This Implements

| Standard | Requirement | Implementation |
|----------|-------------|----------------|
| **GDPR** | Personal data protection | ✅ PII field encryption |
| **GDPR** | Right to be forgotten | ✅ Secure deletion support |
| **HIPAA** | PHI encryption at rest | ✅ AES-256 encryption |
| **PCI DSS** | Cardholder data protection | ✅ Field-level encryption |
| **SOC 2** | Data encryption | ✅ Files + DB encryption |
| **SOC 2** | Audit logging | ✅ Encryption audit log |

---

## ⚠️ Security Warnings

### DO NOT:
- ❌ Commit encryption keys to Git
- ❌ Use same keys for dev/staging/prod
- ❌ Log decrypted PII data
- ❌ Store keys in code
- ❌ Share keys via email/Slack

### DO:
- ✅ Use secrets manager for keys
- ✅ Rotate keys every 90 days
- ✅ Backup keys securely
- ✅ Monitor encryption operations
- ✅ Test disaster recovery

---

## 🆘 Troubleshooting

### "Encryption key not provided"
```bash
export ENCRYPTION_KEY=<your-key>
# or add to .env file
```

### "Decryption failed"
- Check if using correct encryption key
- Verify encryption version matches
- Ensure data was encrypted with same key

### Performance Issues
- Cache decrypted data (in memory, short TTL)
- Batch encrypt/decrypt operations
- Use async for large files

---

## 📚 Documentation

- **Full Guide**: `DOCS/ENCRYPTION_SECURITY_GUIDE.md`
- **Environment Template**: `.env.encryption.template`
- **Migration Scripts**: `src/scripts/`

---

## 🔄 Key Rotation Procedure

1. Generate new encryption keys
2. Update encryption version
3. Re-encrypt all data with new keys
4. Update environment variables
5. Deploy to production
6. Verify all encryption operations
7. Archive old keys securely
8. Document rotation date

---

## 📞 Support

For security issues:
- Review `DOCS/ENCRYPTION_SECURITY_GUIDE.md`
- Check encryption audit logs
- Contact security team

**Last Updated**: 2025-11-05
