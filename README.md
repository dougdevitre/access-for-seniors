# Access For Seniors

> AI-powered platform for senior connection, loneliness mitigation, and aging-services navigation.
> Part of the **[Access To](https://dougdevitre.github.io/access-projects)** civic tech initiative.

Access For Seniors helps senior living communities, home health agencies, health systems, and AAAs detect isolation early, keep families connected, and route older adults to the programs and benefits they've earned.

## The Access To Family

| Project | Focus |
|---------|-------|
| Access To Health | Public health, SDOH, APHA-grounded |
| Access To Jobs | Workforce, WIOA-grounded |
| Access To Housing | Fair Housing-compliant housing navigation |
| Access To Education | Special-needs advocacy, IEP, educational equity |
| Access To Safety | Trauma-informed safety planning |
| Access To Services | SDOH intake, social services navigation |
| Access To Peace | Mediation, AFCC/ABA standards |
| Access To Business | Startup/entrepreneurship support |
| **Access For Seniors** | **Senior connection + aging services navigation** |

**Shared values:** Equity, trauma-informed design, community-grounded, evidence-based, plain language.

## What It Does

- **AI Companion** — Memory-aware conversations with seniors via text and voice (Anthropic Claude)
- **Engagement Signals** — Multi-signal detection of reduced social connection (not diagnoses — connection signals)
- **Caregiver Dashboard** — Real-time alerts, resident profiles, shift notes, and reporting
- **Family Outreach** — AI-generated, warm, personalized messages that encourage family connection
- **Aging-Services Navigation** — Match needs to OAA, Medicare, Medicaid, AAA, Meals on Wheels, caregiver respite
- **Multi-Tenant SaaS** — Single facilities, multi-site orgs, and health system enterprises

## Architecture

```
Senior (Voice/Text) → Conversation Engine (Claude API) → Memory Capture → Engagement Scoring
                                                                              ↓
Family (Mobile App) ← Outreach Messages ← Message Generator        Alert Engine → Caregiver Dashboard
                                                                              ↓
                                                                   Aging-Services Navigation
                                                                   (OAA / Medicare / AAA / etc.)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Mobile | React Native + Expo |
| Auth | Clerk (staff/consumer) + Amazon Cognito (enterprise SSO/SAML) |
| Backend | Node.js + Express (TypeScript), AWS Lambda |
| AI/LLM | Anthropic Claude API |
| Voice | Twilio Voice + ElevenLabs STT/TTS |
| Database | DynamoDB (primary) + RDS Aurora (analytics) |
| Storage | S3 (audio, exports, assets) |
| Billing | Stripe (subscriptions, metering) |
| Infrastructure | AWS CDK (TypeScript), GitHub Actions CI/CD |
| MCP | Custom MCP server (7 tool schemas) |

## 28 Modules

| # | Module | # | Module | # | Module |
|---|--------|---|--------|---|--------|
| 1 | Resident Onboarding | 11 | Notifications | 21 | Enterprise Admin Portal |
| 2 | AI Conversation Core | 12 | Analytics & Reporting | 22 | API & MCP Tools |
| 3 | Memory & Context | 13 | Multi-Tenant Core | 23 | Integrations Hub |
| 4 | Engagement Scoring | 14 | Auth & SSO | 24 | Research & Outcomes |
| 5 | Alert Engine | 15 | Billing & Subscriptions | 25 | Training & Certification |
| 6 | Caregiver Dashboard | 16 | AWS Infrastructure | 26 | Family Portal (Web) |
| 7 | Family Mobile App | 17 | CI/CD | 27 | Predictive Wellness |
| 8 | Voice Interface | 18 | Security & Compliance | **28** | **Aging-Services Navigation** |
| 9 | Family Outreach | 19 | Data Export & Portability | | |
| 10 | Community Features | 20 | White-Label Config | | |

## Using as a Claude Skill

This repo is structured as a Claude skill. Install the `.skill` package or point your Claude skill directory to this repo.

```
access-for-seniors/
├── SKILL.md                          ← Skill entry point
├── references/                       ← Loaded on demand by topic
│   ├── modules.md                    ← All 28 module specs
│   ├── data-models.md                ← DynamoDB + RDS schemas
│   ├── security.md                   ← HIPAA controls, RBAC, consent
│   ├── conversation-engine.md        ← LLM orchestration, prompts, safety
│   ├── engagement-scoring.md         ← Connection signal algorithm
│   ├── aging-services.md             ← OAA, Medicare, AAA, Meals on Wheels
│   ├── mcp-tools.md                  ← MCP server tool schemas
│   ├── auth.md                       ← Clerk + Cognito setup
│   ├── billing.md                    ← Stripe integration
│   ├── multi-tenant.md               ← Tenant isolation architecture
│   ├── aws-deployment.md             ← CDK stacks, IAM, environments
│   ├── cicd.md                       ← GitHub Actions pipeline
│   ├── mobile-app.md                 ← React Native / Expo
│   ├── gtm.md                        ← Positioning, ICP, messaging
│   └── [9 more reference files]
├── docs/                             ← Guides and onboarding
├── tests/                            ← Skill validation tests
└── scripts/                          ← Build and packaging scripts
```

## Security & Compliance

- HIPAA-aligned defaults (encryption, audit logging, tenant isolation, BAAs)
- Engagement scores are **connection signals**, not clinical diagnoses
- Consent-first: AI features require explicit resident/guardian consent
- Role-based access control across 6 roles (Resident, Family, Caregiver, Admin, Operator, AAA/Community Worker)
- Elder abuse mandatory reporting support (state-dependent)
- See [`references/security.md`](references/security.md) for full controls

## Brand Voice

Calm, professional, empathetic. Practical over poetic. No hype. No fear-based messaging. Person-first language ("older adult" not "elderly"). Plain over bureaucratic ("help with meals" not "Title III-C nutrition services" — unless the program uses that term).

## Contact

Doug Devitre — [dougdevitre@gmail.com](mailto:dougdevitre@gmail.com) — [cotrackpro.com](https://cotrackpro.com)

## License

MIT — see [LICENSE](LICENSE.md). Part of the open-source Access To initiative.
