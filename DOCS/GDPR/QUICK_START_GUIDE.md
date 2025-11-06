# GDPR Compliance Quick Start Guide

**God Lion Seeker Optimizer - GDPR Implementation**

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Run Database Migration
```bash
alembic upgrade head
```

This creates all GDPR compliance tables:
- `user_consents`
- `data_processing_records`
- `data_breach_incidents`
- `data_deletion_requests`
- `data_access_requests`

### Step 2: Update Privacy Policy
Edit `DOCS/GDPR/PRIVACY_POLICY_TEMPLATE.md`:
- Replace `[Company Name]` with your company name
- Add DPO contact information
- Add your address and legal details
- List your third-party service providers

### Step 3: Appoint Data Protection Officer
Update configuration with DPO details:
- Name
- Email
- Phone number
- Registration with supervisory authority (if required)

---

## 📋 User Rights Implementation

### Right to Access (Article 15)
**User Request**: "I want all my data"

**Response**:
```bash
# User visits account settings
GET /api/gdpr/data-export?format=json

# System creates export request
# Background job processes data
# User receives download link (valid 7 days)

GET /api/gdpr/data-export/{export_id}/download
```

**Timeline**: Within 30 days (usually immediate)

---

### Right to Erasure (Article 17)
**User Request**: "Delete my account"

**Response**:
```bash
# User requests deletion
DELETE /api/gdpr/account
{
  "anonymize": false,  # true for anonymization
  "reason": "No longer need the service"
}

# System sends verification email
# User clicks verification link

POST /api/gdpr/account/delete/verify/{request_id}
{
  "verification_code": "..."
}

# Background job processes deletion
```

**Timeline**: Immediate verification, deletion within 24 hours

---

### Right to Portability (Article 20)
**User Request**: "Give me my data in a format I can use elsewhere"

**Response**:
```bash
# User requests portable data
GET /api/gdpr/data-portability?format=json

# Returns machine-readable JSON/CSV
# Includes only user-generated content
```

**Timeline**: Immediate

---

### Consent Management (Article 7)
**User Action**: Manage privacy preferences

**Implementation**:
```bash
# Record consent
POST /api/gdpr/consent
{
  "consent_type": "marketing",
  "consent_given": true,
  "consent_version": "1.0"
}

# View consents
GET /api/gdpr/consent

# Withdraw consent
DELETE /api/gdpr/consent/marketing
```

---

## 🔒 Data Breach Response (72-Hour Rule)

### If a Breach Occurs:

**Immediate Actions (0-15 minutes)**:
1. Document discovery time ⏰
2. Notify Incident Manager
3. Notify DPO
4. Create incident record

```python
from src.services.incident_response_service import IncidentResponseService

incident = await incident_service.create_incident(
    incident_type="unauthorized_access",
    severity="high",
    description="Unauthorized access to user database",
    affected_systems=["user_database"],
    affected_data_types=["email", "resume_data"],
    reported_by="Security Team"
)
```

**Containment (1-4 hours)**:
2. Isolate affected systems
3. Block unauthorized access
4. Assess impact
5. Count affected users

**Notification (Within 72 hours)**:
6. Notify supervisory authority

```python
await incident_service.notify_authority(
    incident_id="INC-20251105-ABC123",
    authority_name="ICO",  # UK example
    notification_details="Full breach report"
)
```

7. Notify affected users (if high risk)

```python
await incident_service.notify_affected_users(
    incident_id="INC-20251105-ABC123",
    user_ids=[1, 2, 3, ...]
)
```

---

## 📊 Data Retention & Cleanup

### Automatic Data Retention
Run periodically (e.g., daily cron job):

```python
from src.services.gdpr_service import GDPRService

# Check and enforce retention policies
results = await gdpr_service.check_data_retention()

# Deletes:
# - Security logs older than 2 years
# - Read notifications older than 90 days
# - Audit logs older than 3 years
```

**Setup Cron Job**:
```bash
# Run daily at 2 AM
0 2 * * * python -m src.scripts.gdpr_retention_cleanup
```

---

## 📝 Documentation Checklist

### Required Documents:
- ✅ **Privacy Policy** - Template in `DOCS/GDPR/PRIVACY_POLICY_TEMPLATE.md`
- ✅ **ROPA** - Complete in `DOCS/GDPR/RECORDS_OF_PROCESSING_ACTIVITIES.md`
- ✅ **DPIA** - Complete in `DOCS/GDPR/DATA_PROTECTION_IMPACT_ASSESSMENT.md`
- ✅ **Incident Plan** - Complete in `DOCS/GDPR/INCIDENT_RESPONSE_PLAN.md`

### Actions Needed:
1. Customize Privacy Policy with your details
2. Review and approve DPIA
3. Train staff on Incident Response Plan
4. Update ROPA when you add third-party services

---

## 🎯 Common User Requests

### "What data do you have on me?"
→ Direct to: `GET /api/gdpr/data-export`

### "Delete my account"
→ Direct to: `DELETE /api/gdpr/account`

### "I want my data to take elsewhere"
→ Direct to: `GET /api/gdpr/data-portability`

### "I don't want marketing emails"
→ Direct to: `DELETE /api/gdpr/consent/marketing`

### "Update my email"
→ Account settings (Right to Rectification)

---

## ⚠️ Important Deadlines

| Action | Deadline |
|--------|----------|
| Respond to data request | 30 days (can extend to 60) |
| Notify authority of breach | 72 hours from discovery |
| Notify users of breach | Without undue delay |
| Review DPIA | Annually |
| Update ROPA | When processing changes |

---

## 🔍 Testing Your Implementation

### Test Data Export
```bash
# As a logged-in user
curl -X GET http://localhost:8000/api/gdpr/data-export \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return export request ID
# Check export status
curl -X GET http://localhost:8000/api/gdpr/data-export/{id}/download \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Consent Recording
```bash
curl -X POST http://localhost:8000/api/gdpr/consent \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "consent_type": "privacy_policy",
    "consent_given": true,
    "consent_version": "1.0"
  }'
```

### Test Data Deletion
```bash
curl -X DELETE http://localhost:8000/api/gdpr/account \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "anonymize": false,
    "reason": "Testing deletion"
  }'
```

---

## 📞 Who to Contact

### For User Requests:
- **Email**: privacy@yourcompany.com
- **Response Time**: Within 30 days
- **DPO**: dpo@yourcompany.com

### For Breaches:
- **Emergency**: incident-response@yourcompany.com
- **Phone**: [24/7 Hotline]
- **Incident Manager**: [Name]
- **DPO**: [Name]

### Supervisory Authority:
- **UK (ICO)**: https://ico.org.uk/
- **EU**: Find your authority: https://edpb.europa.eu/

---

## 🛠️ Developer Integration

### Using GDPR Service

```python
from src.services.gdpr_service import GDPRService
from src.config.database import get_session

async with get_session() as db:
    gdpr_service = GDPRService(db)
    
    # Export user data
    data = await gdpr_service.export_user_data(
        user_id=123,
        format="json"
    )
    
    # Delete user data
    results = await gdpr_service.delete_user_data(
        user_id=123,
        anonymize=False,  # or True for anonymization
        retain_audit=True  # Keep audit logs
    )
```

### Using Consent Service

```python
from src.services.gdpr_service import ConsentService

async with get_session() as db:
    consent_service = ConsentService(db)
    
    # Record consent
    await consent_service.record_consent(
        user_id=123,
        consent_type="marketing",
        consent_given=True,
        consent_text="User agreed to marketing emails",
        consent_version="1.0"
    )
    
    # Get user consents
    consents = await consent_service.get_user_consents(user_id=123)
```

---

## ✅ Pre-Launch Checklist

Before going live with GDPR compliance:

- [ ] Database migration completed
- [ ] Privacy Policy customized and published
- [ ] DPO appointed and registered
- [ ] Staff trained on user rights
- [ ] Incident response team identified
- [ ] Testing completed (all endpoints)
- [ ] Data retention policies configured
- [ ] Third-party DPAs signed
- [ ] DPIA reviewed and approved
- [ ] ROPA documented and up-to-date
- [ ] Cookie consent implemented
- [ ] User consent flow tested
- [ ] Breach notification process tested

---

## 📚 Additional Resources

### Documentation
- Full Implementation: `DOCS/GDPR/IMPLEMENTATION_SUMMARY.md`
- Privacy Policy Template: `DOCS/GDPR/PRIVACY_POLICY_TEMPLATE.md`
- DPIA: `DOCS/GDPR/DATA_PROTECTION_IMPACT_ASSESSMENT.md`
- ROPA: `DOCS/GDPR/RECORDS_OF_PROCESSING_ACTIVITIES.md`
- Incident Plan: `DOCS/GDPR/INCIDENT_RESPONSE_PLAN.md`

### Code
- GDPR Service: `src/services/gdpr_service.py`
- Incident Service: `src/services/incident_response_service.py`
- API Routes: `src/api/routes/gdpr.py`
- Models: `src/models/gdpr.py`

### External Resources
- GDPR Full Text: https://gdpr.eu/
- ICO Guidance: https://ico.org.uk/for-organisations/guide-to-data-protection/
- EDPB Guidelines: https://edpb.europa.eu/

---

## 🎉 You're GDPR Compliant!

Your implementation includes:
- ✅ All user rights (Articles 15-21)
- ✅ Consent management (Article 7)
- ✅ Data protection documentation (Article 30)
- ✅ Breach notification (Articles 33-34)
- ✅ Security measures (Article 32)
- ✅ DPIA (Article 35)

**Next Step**: Customize the Privacy Policy and publish it!

---

*Last Updated: 2025-11-05*
