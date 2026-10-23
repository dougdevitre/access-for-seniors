# Glossary

Domain and acronym reference for anyone working on Access For Seniors. Citations point to primary sources where applicable.

## Aging services & programs

| Term | Full name | What it is |
|------|-----------|------------|
| **OAA** | Older Americans Act | Federal law authorizing core aging-services funding (Title III-B, III-C, III-D, III-E, VII). acl.gov |
| **AAA** | Area Agency on Aging | Regional hub that coordinates OAA programs locally. Find one via Eldercare Locator (1-800-677-1116 or eldercare.acl.gov). |
| **ADRC** | Aging and Disability Resource Center | Single-entry-point program covering both aging and disability services ("no wrong door"). |
| **ACL** | Administration for Community Living | HHS agency that oversees OAA and disability programs. acl.gov |
| **APS** | Adult Protective Services | State-run hotlines and investigators for elder abuse in the community. |
| **Ombudsman** | Long-Term Care Ombudsman | OAA Title VII advocate for residents of nursing homes and assisted living. |
| **CCRC** | Continuing Care Retirement Community | Campus offering independent → assisted → skilled care progression. |
| **HCBS** | Home and Community-Based Services | Medicaid waiver category funding in-home care as an alternative to nursing facilities. |
| **LTSS** | Long-Term Services and Supports | Umbrella for ongoing care needs (Medicaid LTSS covers HCBS + nursing facility). |
| **NEMT** | Non-Emergency Medical Transportation | Medicaid benefit covering rides to medical appointments. |
| **SHIP** | State Health Insurance Assistance Program | Free Medicare counseling in every state. shiphelp.org |
| **SPAP** | State Pharmaceutical Assistance Program | State-level Rx help, layered with Medicare Part D. |
| **CSFP** | Commodity Supplemental Food Program | Monthly food package for low-income seniors 60+. |
| **LIHEAP** | Low-Income Home Energy Assistance Program | Utility-bill assistance. |
| **WAP** | Weatherization Assistance Program | Home energy-efficiency retrofits. |
| **PAP** | Patient Assistance Program | Manufacturer-sponsored free or low-cost medication. |
| **Medigap** | Medicare Supplement Insurance | Private policy that fills Original Medicare (Part A + B) cost-sharing gaps. |
| **AEP** | Annual Election Period (Medicare) | Oct 15 – Dec 7; window to change Medicare Advantage or Part D. |

## Healthcare & compliance

| Term | Meaning |
|------|---------|
| **PHI** | Protected Health Information under HIPAA — any individually identifiable health information. |
| **PII** | Personally Identifiable Information — broader than PHI. |
| **HIPAA** | Health Insurance Portability and Accountability Act. AFS operates under HIPAA-aligned defaults. |
| **BAA** | Business Associate Agreement — contract required with every sub-processor handling PHI (AWS, Anthropic, Stripe, Twilio, ElevenLabs, Clerk). |
| **RBAC** | Role-based access control. |
| **Minimum necessary** | HIPAA principle: only access the least PHI required to do the job. |
| **Safe Harbor** | HIPAA method for de-identification (removes 18 identifier categories). |
| **Breach notification** | HIPAA rule: 72-hour HHS notification for incidents affecting 500+ individuals; state law may apply earlier. |

## Platform terms

| Term | Meaning |
|------|---------|
| **Engagement score** | 0–100 index computed from six signal sources. A **connection signal**, never a diagnosis. |
| **Engagement zone** | Green (70–100), Yellow (40–69), Red (0–39). |
| **Distress detection** | Keyword + sentiment check. Emergency words get a 911 / call-button reply, self-harm words a 988 reply, abuse disclosures 911 plus the state APS line; each raises an urgent staff alert. |
| **Tier 1 / 2 / 3 alerts** | Escalation levels with 24h / 4h / 5-minute (configurable) response targets (see [`alerts-system.md`](../references/alerts-system.md)). |
| **Memory item** | Typed (biographical, preference, episodic, relational) fact stored per resident. |
| **Persona name** | The configurable name the AI goes by for a given tenant (e.g., "Clara", "Sam"). |
| **Tenant** | A billing + isolation boundary — typically a facility, sometimes an organization or enterprise. |
| **Warm referral** | Handing a senior to a service with a real conversation, not just a phone number. |

## Infrastructure & tooling

| Term | Meaning |
|------|---------|
| **MCP** | Model Context Protocol — the standard AFS uses to expose tools to Claude. |
| **SSM SecureString** | AWS Systems Manager Parameter Store type used for encrypted secrets. Preferred over `.env`. |
| **CDK** | AWS Cloud Development Kit — TypeScript infrastructure-as-code. |
| **SSE** | Server-Sent Events. The MCP server uses SSE transport. |
| **STT / TTS** | Speech-to-text / text-to-speech (ElevenLabs). |
| **SAST / DAST** | Static / Dynamic Application Security Testing — run in CI. |
| **Dunning** | Automated retry + email sequence after a failed Stripe payment. |

## Voice guardrails (things to say and not say)

| Say | Don't say |
|-----|-----------|
| older adult, senior | elderly (unless the program uses that term) |
| reduced engagement, connection signal | lonely, isolated, depressed |
| help with meals | Title III-C nutrition services (unless program-specific) |
| "Mom mentioned she enjoyed the garden this week" | "Your mother's engagement score dropped 12 points" |

See [`references/engagement-scoring.md`](../references/engagement-scoring.md) and [`references/aging-services.md`](../references/aging-services.md) for the language rules in full.
