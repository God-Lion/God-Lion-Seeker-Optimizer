# Data Breach Incident Response Plan

**GDPR Article 33 & 34 Compliance**

**Organization**: [Company Name]  
**Version**: 1.0  
**Effective Date**: [Date]  
**Review Date**: [Date + 1 year]  
**Owner**: Data Protection Officer

---

## Executive Summary

This Incident Response Plan establishes procedures for detecting, responding to, and reporting personal data breaches in compliance with GDPR Articles 33 and 34.

**Key Requirements**:
- **72-Hour Rule**: Notify supervisory authority within 72 hours of discovery
- **User Notification**: Notify affected individuals if high risk to rights/freedoms
- **Documentation**: Maintain records of all breaches

---

## 1. Incident Response Team

### 1.1 Core Team Members

| Role | Name | Contact | Responsibilities |
|------|------|---------|------------------|
| **Incident Manager** | [Name] | [Email/Phone] | Overall incident coordination |
| **Data Protection Officer** | [Name] | [Email/Phone] | GDPR compliance, notifications |
| **Security Lead** | [Name] | [Email/Phone] | Technical investigation, containment |
| **Legal Counsel** | [Name] | [Email/Phone] | Legal advice, liability assessment |
| **Communications Lead** | [Name] | [Email/Phone] | Internal/external communications |
| **IT Manager** | [Name] | [Email/Phone] | Systems, infrastructure |

### 1.2 Extended Team

| Role | Name | Contact | When to Involve |
|------|------|---------|-----------------|
| CEO/Management | [Name] | [Email/Phone] | High/critical severity |
| PR/Media Relations | [Name] | [Email/Phone] | Public-facing incidents |
| Customer Support | [Name] | [Email/Phone] | User communications |
| External Security Firm | [Name] | [Email/Phone] | Complex investigations |

### 1.3 Contact Information

**24/7 Emergency Hotline**: [Phone Number]  
**Incident Email**: incident-response@yourcompany.com  
**DPO Direct Line**: [Phone Number]

---

## 2. Incident Classification

### 2.1 Severity Levels

| Level | Definition | Response Time | Notification Required |
|-------|------------|---------------|----------------------|
| **Critical** | Mass data exposure, sensitive data breach | Immediate | Authority + Users |
| **High** | Significant PII breach, >1000 users affected | 1 hour | Authority + Users (likely) |
| **Medium** | Limited PII breach, <1000 users | 4 hours | Authority (likely) |
| **Low** | Single user, non-sensitive data | 24 hours | May not require notification |

### 2.2 Breach Types

- **Confidentiality Breach**: Unauthorized access or disclosure
- **Integrity Breach**: Unauthorized alteration of data
- **Availability Breach**: Loss or destruction of data

### 2.3 Examples

**Critical**:
- Database dump exposed publicly
- Ransomware encryption of user data
- Mass credential theft

**High**:
- Unauthorized access to resume database
- Email list exposed
- Insider theft of data

**Medium**:
- Limited unauthorized access
- Accidental email to wrong recipients (small number)
- Laptop theft with encrypted data

**Low**:
- Single account compromise
- Accidental exposure of non-sensitive data
- Minor system misconfiguration quickly fixed

---

## 3. Incident Response Phases

### Phase 1: Detection and Reporting (0-15 minutes)

**Objective**: Identify and report potential breach

**Detection Methods**:
- Security monitoring alerts
- Intrusion detection systems
- Employee reports
- User reports
- Third-party notifications
- Media reports

**Actions**:
1. **Receive Report**
   - Document date/time of discovery
   - Record source of report
   - Gather initial information

2. **Initial Assessment**
   - Is this a confirmed data breach?
   - What data is potentially affected?
   - Initial severity estimate

3. **Activate Response Team**
   - Notify Incident Manager
   - Notify DPO
   - Assemble core team

4. **Start Incident Log**
   - Create incident ID
   - Begin detailed timeline
   - Use incident tracking system

**Tools**:
- Incident response platform: [Tool Name]
- Communication channel: [Slack/Teams channel]
- Incident log template

**Reporting Hotline**: incident-response@yourcompany.com or [Phone]

---

### Phase 2: Assessment and Containment (15 minutes - 4 hours)

**Objective**: Understand scope and stop the breach

**Actions**:

1. **Detailed Assessment** (30 minutes)
   - What data was accessed/disclosed?
   - How many individuals affected?
   - What is the root cause?
   - Is breach ongoing?
   - Severity classification

2. **Immediate Containment** (1-2 hours)
   - Isolate affected systems
   - Revoke compromised credentials
   - Block malicious IP addresses
   - Disable affected accounts
   - Preserve evidence

3. **Evidence Collection**
   - System logs
   - Access logs
   - Network traffic
   - Screenshots
   - Email communications
   - **DO NOT MODIFY** original evidence

4. **Impact Analysis**
   - Number of affected individuals
   - Types of personal data
   - Potential consequences
   - Likelihood of harm

**Containment Checklist**:
- [ ] Affected systems identified
- [ ] Systems isolated/secured
- [ ] Unauthorized access blocked
- [ ] Credentials rotated
- [ ] Evidence preserved
- [ ] Vulnerability identified
- [ ] Patch/fix applied (if applicable)
- [ ] Monitoring increased

**Documentation**:
- Incident ID: INC-[Date]-[ID]
- Affected systems: [List]
- Affected data: [Categories]
- Affected users: [Count]
- Root cause: [Description]
- Containment actions: [List]

---

### Phase 3: Notification (Within 72 hours of discovery)

**Objective**: Comply with GDPR notification requirements

#### 3.1 Supervisory Authority Notification (Article 33)

**Required When**: 
- Breach likely to result in risk to rights and freedoms
- Unless breach unlikely to result in risk

**Timeline**: Within 72 hours of discovery

**Process**:
1. **Prepare Notification** (DPO lead)
   - Nature of breach
   - Categories and number of data subjects
   - Categories and number of records
   - Contact point (DPO)
   - Likely consequences
   - Measures taken/proposed

2. **Management Approval**
   - CEO sign-off
   - Legal review

3. **Submit to Authority**
   - Use official reporting channel
   - Keep proof of submission
   - Document submission date/time

**Supervisory Authority**:
- Name: [Authority Name]
- Contact: [Email/Phone]
- Online Portal: [URL]

**Notification Template**: See Appendix A

#### 3.2 Data Subject Notification (Article 34)

**Required When**:
- Breach likely to result in high risk to rights and freedoms

**Not Required If**:
- Appropriate technical/organizational protection measures (e.g., encryption)
- Subsequent measures ensure high risk no longer likely
- Would involve disproportionate effort (can use public communication)

**Timeline**: Without undue delay

**Process**:
1. **Determine Notification Requirement**
   - Assess level of risk
   - Consult with DPO and Legal

2. **Prepare Communication**
   - Clear, plain language
   - Nature of breach
   - Contact point (DPO)
   - Likely consequences
   - Measures taken
   - Recommendations for individuals

3. **Notify Affected Users**
   - Email to affected users
   - In-app notification
   - Website banner (if large-scale)
   - Media announcement (if required)

4. **Document Notifications**
   - Who was notified
   - When they were notified
   - What they were told

**User Notification Template**: See Appendix B

#### 3.3 Notification Decision Tree

```
Is this a personal data breach?
├─ NO → Document reasoning, no notification required
└─ YES → Likely to result in risk to rights/freedoms?
    ├─ NO → Document only, no notification required
    ├─ UNCERTAIN → Consult DPO, lean toward notification
    └─ YES → Notify supervisory authority within 72 hours
        └─ Likely to result in HIGH risk?
            ├─ NO → Authority notification only
            └─ YES → Notify authority + affected individuals
```

---

### Phase 4: Investigation and Remediation (Days - Weeks)

**Objective**: Root cause analysis and prevention

**Actions**:

1. **Detailed Investigation**
   - Forensic analysis
   - Timeline reconstruction
   - Attack vector analysis
   - Scope verification
   - Third-party involvement (if needed)

2. **Root Cause Analysis**
   - Technical vulnerabilities
   - Process failures
   - Human error
   - Third-party issues

3. **Remediation**
   - Patch vulnerabilities
   - Update security controls
   - Improve monitoring
   - Staff training
   - Process improvements

4. **Validation**
   - Verify fixes effective
   - Penetration testing
   - Security audit

**Investigation Checklist**:
- [ ] Complete system forensics
- [ ] Attack vector identified
- [ ] All affected systems found
- [ ] Root cause determined
- [ ] Vulnerabilities patched
- [ ] Security controls enhanced
- [ ] Monitoring improved
- [ ] Similar risks assessed

---

### Phase 5: Recovery and Lessons Learned (Weeks - Months)

**Objective**: Return to normal operations and improve

**Actions**:

1. **Recovery**
   - Restore normal operations
   - Monitor for recurrence
   - Validate data integrity
   - Rebuild trust with users

2. **Post-Incident Review**
   - What happened?
   - What went well?
   - What could be improved?
   - Recommendations

3. **Documentation**
   - Final incident report
   - Lessons learned
   - Process improvements
   - Training needs

4. **Follow-Up Actions**
   - Implement improvements
   - Update policies/procedures
   - Staff training
   - Technology upgrades

**Post-Incident Report Template**: See Appendix C

---

## 4. Communication Protocols

### 4.1 Internal Communication

**DO**:
- Use secure channels
- Need-to-know basis
- Factual information only
- Document all communications

**DON'T**:
- Speculate
- Assign blame prematurely
- Use unsecured channels
- Overshare externally

### 4.2 External Communication

**Media Inquiries**:
- Direct to Communications Lead
- Use approved statements only
- Coordinate with Legal

**User Inquiries**:
- Prepare FAQ
- Train support staff
- Consistent messaging
- Empathy and transparency

### 4.3 Communication Templates

**Initial Holding Statement**:
"We are aware of a potential security incident and are investigating. The security and privacy of our users is our top priority. We will provide updates as more information becomes available."

**Breach Confirmation**:
"We have identified a data security incident affecting [number] users. We have [contained/are containing] the incident and are working with authorities. Affected users will be notified directly."

---

## 5. Roles and Responsibilities

### Incident Manager
- Overall incident coordination
- Decision-making authority
- Resource allocation
- Stakeholder updates

### Data Protection Officer
- GDPR compliance assessment
- Supervisory authority notification
- User notification decisions
- Breach documentation

### Security Lead
- Technical investigation
- Containment execution
- Evidence collection
- Forensic analysis

### Legal Counsel
- Legal liability assessment
- Regulatory compliance
- Notification review
- Litigation risk

### Communications Lead
- Media relations
- User communications
- Internal messaging
- Reputation management

---

## 6. Tools and Resources

### Incident Response Tools
- **Incident Tracking**: [System/Platform]
- **Communication**: [Slack/Teams Channel]
- **Documentation**: [SharePoint/Drive]
- **Forensics**: [Tools]
- **Monitoring**: [Security Platform]

### Contact Lists
- **Emergency Contacts**: See Appendix D
- **Vendor Contacts**: See Appendix E
- **Authority Contacts**: See Appendix F

### Templates and Checklists
- Incident Response Checklist
- Authority Notification Template
- User Notification Template
- Post-Incident Report Template
- Evidence Collection Guide

---

## 7. Testing and Training

### Regular Drills
- **Frequency**: Quarterly
- **Scenarios**: Various breach types
- **Participants**: Full response team
- **Documentation**: Lessons learned

### Training
- **New Employees**: Incident reporting
- **Response Team**: Annual training
- **All Staff**: Security awareness

### Tabletop Exercises
- **Frequency**: Biannually
- **Scenarios**: Realistic breach scenarios
- **Attendees**: Response team + management

---

## 8. Compliance and Documentation

### Breach Register
Maintain a register of all breaches (GDPR Article 33(5)):
- Nature of breach
- Facts and effects
- Remedial action

**Location**: [Database/System]  
**Access**: DPO, Legal, Incident Manager

### Records Retention
- Incident logs: 7 years
- Breach notifications: Permanent
- Investigation reports: 7 years
- Correspondence: 7 years

---

## Appendices

### Appendix A: Authority Notification Template
[Detailed template for supervisory authority notification]

### Appendix B: User Notification Template
[Template for notifying affected individuals]

### Appendix C: Post-Incident Report Template
[Template for final incident report]

### Appendix D: Emergency Contacts
[24/7 contact information for team]

### Appendix E: Vendor Contacts
[Third-party incident support contacts]

### Appendix F: Authority Contacts
[Supervisory authority contact details]

---

## Version Control

| Version | Date | Changes | Approved By |
|---------|------|---------|-------------|
| 1.0 | [Date] | Initial plan | [DPO] |

**Next Review Date**: [Date]

---

**Acknowledgment**:

I have read and understood this Incident Response Plan and agree to follow these procedures.

| Name | Role | Signature | Date |
|------|------|-----------|------|
| | | | |

