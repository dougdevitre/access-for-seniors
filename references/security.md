# Access For Seniors — Security & Compliance

## HIPAA Alignment

Access For Seniors handles Protected Health Information (PHI) including resident health-related behavioral data, engagement scores that may inform care decisions, and conversation content. Apply HIPAA Security Rule controls.

### Administrative Safeguards
- **Risk assessment:** Annual; document in `docs/risk-assessment.md`
- **Workforce training:** All staff with PHI access complete HIPAA training (Module 25)
- **Access management:** Role-based; minimum necessary; quarterly access reviews
- **Incident response:** Documented runbook; 72-hour breach notification to HHS; state notification per applicable law
- **BAA requirements:** Execute BAA with every sub-processor: AWS, Stripe, Anthropic, Twilio, ElevenLabs, Clerk, any analytics vendor

### Technical Safeguards
- **Encryption at rest:** AES-256 via AWS KMS (DynamoDB, RDS, S3, EBS)
- **Encryption in transit:** TLS 1.2+ enforced on all endpoints; HSTS headers
- **Access control:** JWT validation on every API call; tenant context from token claims; no cross-tenant data access
- **Audit logging:** CloudTrail (API-level), application audit log (PHI access), Clerk audit log (auth events)
- **Session management:** Token expiration (1 hour access, 30-day refresh); forced re-auth for admin actions
- **MFA:** Required for Admin and Operator roles; recommended for Caregiver; optional for Family

### Physical Safeguards
- **AWS infrastructure:** SOC 2 Type II, HIPAA-eligible services only
- **No local storage:** PHI never persisted on client devices (mobile cache is summary-only, 24h TTL, non-PHI)

---

## Data Classification

| Classification | Examples | Controls |
|---------------|----------|----------|
| PHI | Resident name, DOB, health indicators, engagement scores, conversation content | Encrypted, access-logged, BAA-covered, minimum necessary |
| PII | Family member contact info, caregiver names | Encrypted, access-logged |
| Sensitive Config | API keys, DB credentials, Stripe keys | SSM SecureString; never in code or .env |
| Business Data | Tenant config, billing, analytics aggregates | Standard access controls |
| Public | Marketing content, documentation | No special controls |

---

## RBAC Model

| Role | Dashboard | Resident Data | Alerts | Billing | Tenant Config | API |
|------|-----------|--------------|--------|---------|---------------|-----|
| Resident | — | Own profile only | — | — | — | — |
| Family | Mobile/Web | Linked resident (themes, not transcripts) | Receive | — | — | — |
| Caregiver | Full | Assigned residents | Manage | — | — | — |
| Admin | Full | All facility residents | Manage | View/Manage | Manage | API key |
| Operator | Full | Cross-facility (aggregated) | View all | View all | View all | Full API |

---

## AI Safety Controls

- **Content filter:** All Claude outputs pass through safety filter before delivery to resident
- **Distress detection:** Keywords and sentiment patterns trigger immediate caregiver alert
- **No medical/legal advice:** System prompt enforces; post-generation filter catches violations
- **No diagnosis language:** Engagement scores framed as "connection signals" — never clinical terms
- **Human escalation:** Any conversation flagged for distress pauses AI and alerts caregiver
- **Prompt injection defense:** Resident input sanitized; system prompt instructs to ignore embedded instructions
- **Model output logging:** All Claude API responses logged (encrypted) for audit and safety review
- **Bias monitoring:** Quarterly review of engagement scoring across demographics

---

## Consent Management

| Consent Type | When Captured | Required for | Revocable |
|-------------|--------------|-------------|-----------|
| AI Conversation | Onboarding | Module 2, 3, 4 | Yes — disables AI, enables human-only check-ins |
| Voice Recording | Before first voice call | Module 8 | Yes — disables recording, voice still works |
| Family Data Sharing | Onboarding | Module 7, 9, 26 | Yes — family loses access to engagement data |
| Photo Use | Profile setup | Module 1, 10 | Yes |
| Research Participation | Separate consent flow | Module 24 | Yes |

All consent records stored with timestamp, capturer ID, and version of consent language.

---

## Data Retention & Deletion

| Data Type | Default Retention | Configurable | Deletion Method |
|-----------|-------------------|-------------|----------------|
| Conversations | 7 years | Yes (per tenant) | Soft delete → hard delete after 90 days |
| Memory Items | Episodic: 90 days; Biographical: indefinite | Yes | TTL (episodic); manual (biographical) |
| Alerts | 7 years | Yes | Soft delete |
| Audit Logs | 7 years | No (minimum) | Immutable |
| Voice Recordings | 1 year | Yes | S3 lifecycle policy |
| Analytics (RDS) | 3 years | Yes | Partition drop |

### Right to Deletion
- Resident or authorized representative can request deletion
- 30-day processing window; audit trail of deletion request retained
- De-identified research data (Module 24) not subject to deletion if properly anonymized
