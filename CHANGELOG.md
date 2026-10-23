# Changelog

All notable changes to Access For Seniors will be documented in this file.

## [Unreleased]

### Fixed (QA should-fix, 2026-10-23)
- Stripe is no longer listed as a BAA vendor. PHI stays out of Stripe metadata and descriptions; HHS guidance treats card processing by a financial institution as outside the business-associate rules. Confirm BAA availability on each vendor's own site.
- Engagement Scoring no longer claims to "detect loneliness"; SKILL.md and Module 4 now say it surfaces reduced-engagement signals, matching `engagement-scoring.md`.
- Language rule for the companion and for navigation: reply in the person's language, including the fixed safety replies. Spanish crisis support: call 988 and press 2, or text AYUDA to 988.
- Aging services: the Initial Enrollment Period is described as a 7-month window; the Medicare Advantage Open Enrollment Period (Jan 1 – Mar 31) is added; GoGoGrandparent is labelled as a paid service; the Missouri section is labelled "Missouri only".
- `security.md` no longer points to an unshipped `docs/risk-assessment.md`.
- Content checks for each of the above.

### Fixed (Eldercare Locator hours, 2026-10-23)
- Every Eldercare Locator mention now gives its hours with the number: 1-800-677-1116, Mon–Fri, 8am–9pm ET (eldercare.acl.gov contact page).
- Content check fails if a line naming 1-800-677-1116 in SKILL.md, `references/` or `docs/` has no hours on it or the next line.

### Changed (retired AWS service and Claude model)
- Amazon Pinpoint replaced with AWS End User Messaging SMS for SMS/voice across SKILL.md, notifications, modules, the AWS deployment guide and the architecture diagram. AWS ends support for Pinpoint on 2026-10-30. Email stays on SES; push stays on Expo/APNs/FCM (SNS).
- `references/aws-deployment.md` has a new Messaging Stack section: `AWS::SMSVOICE::*` resources, `@aws-sdk/client-pinpoint-sms-voice-v2`, `sms-voice:SendTextMessage` scoped to phone number/pool ARNs, opt-out lists, and secrets in SSM SecureString.
- Model selection uses `claude-sonnet-5-5` in place of `claude-sonnet-4-20250514`, which was retired on 2026-06-15.
- Content checks fail if Pinpoint returns as a provider or the retired model ID reappears.

### Fixed (companion crisis routing)
- The AI companion now points residents to 911 and 988 instead of only saying "someone will check in". Emergency words ("fell", "can't breathe", "chest pain", "help me") get "Please call 911 now, or press your call button"; self-harm words get "You can call or text 988 right now — I can stay here with you". Both raise a Tier 3 alert. The companion stays non-clinical: it points to 911, 988 and staff and does not counsel.
- Tier 3 is now "Urgent": on-duty team + supervisor + facility admin, 5-minute default target (configurable 2–15 minutes) for emergency, self-harm and abuse alerts. It no longer goes to all family.
- New `abuse_disclosure` alert type. It goes to the designated reporter(s) and supervisor only, never to family or emergency contacts, and holds family Conversation Highlights for that resident until staff clear the hold. The companion gives 911 for immediate danger and the state Adult Protective Services line (Missouri 1-800-392-0210, daily 7am–8pm, online 24/7; other states via the Eldercare Locator, 1-800-677-1116).
- `distress_keyword` split into `emergency_keyword`, `self_harm_keyword`, `abuse_disclosure` and `distress_sentiment` across the data model, MCP `send_alert` schema, notifications, dashboard, mobile app and docs.
- Content checks and manual companion safety tests for each trigger group.

### Added (second iteration)
- `tests/content-checks.sh` — 29 automated grep assertions covering the module catalogue, data model invariants, engagement scoring zones, HIPAA-aligned retention defaults, tech-stack anchors, MCP tool surface, and aging-services citations. Wired into the CI workflow so regressions get caught on PR.
- `docs/README.md` — landing page for the docs folder with a reading-map mermaid and tips.
- `references/mcp-tools.md` — end-to-end example showing a `get_resident` call and response envelope, an error envelope, and a note on cross-tenant safety; plus a call-sequence mermaid of the MCP → authorizer → API → DDB path.
- `references/aws-deployment.md` — CDK stack dependency mermaid and deploy-order guidance.
- Note at the top of `tests/manual-tests.md` pointing at the automated version as the source of truth.

### Changed (second iteration)
- `.github/workflows/validate.yml` — now runs `tests/content-checks.sh` after validation; build step uses `--skip-validate` since validation already ran.

### Fixed
- Module count now consistently 28 across `SKILL.md`, `README.md`, `docs/`, `references/modules.md`, and `tests/manual-tests.md` (Aging-Services Navigation was added as Module 28 in 1.0.0 but several files still said 27).
- `references/data-models.md` DynamoDB table name corrected from pre-rebrand `ConnectionOS` to `AccessForSeniors`.
- `docs/installation.md` broken paths and clone URL (left over from the rename) fixed.
- `docs/quick-start.md` removed stale "Enterprise" product name.
- `scripts/validate.sh`: fixed format-string bug (`printf "$BROKEN"`) and a counter that only incremented once regardless of how many links were broken.

### Added
- Mermaid diagrams replacing ASCII across `README.md`, `conversation-engine.md`, `voice-interface.md` (sequence diagram), `memory-capture.md`, `alerts-system.md` (state diagram), `multi-tenant.md`, `cicd.md`, `analytics.md`, `billing.md`, `engagement-scoring.md`, `auth.md`, plus a new ER diagram in `data-models.md` and a module-grouping diagram in `modules.md`.
- `docs/architecture.md` — contributor-facing system overview with request path, tenant isolation, and module→reference map.
- `docs/glossary.md` — OAA/AAA/ADRC/LTSS/HCBS/PHI/BAA/SHIP/etc. plus voice guardrails.
- `.github/ISSUE_TEMPLATE/` (bug, feature, reference update) and `.github/PULL_REQUEST_TEMPLATE.md` — fulfilling the reference in `CONTRIBUTING.md`.
- `.github/workflows/validate.yml` — GitHub Actions workflow that runs `validate.sh` + `build-skill.sh` on push/PR and uploads the packaged skill.
- `.gitignore` with `dist/` and `*.skill`.
- Linkified primary-source URLs in `references/aging-services.md`.
- Troubleshooting section in `docs/installation.md` keyed to real validator error strings; "First five minutes" tour in `docs/quick-start.md`.

### Changed
- `SKILL.md` description compressed from an 18-line trigger-phrase dump into a focused paragraph (better for skill selection).
- `scripts/build-skill.sh` now validates before building, uses `mktemp -d`, guards on missing `zip`, and emits both `access-for-seniors.skill` and a version-stamped `access-for-seniors-<version>.skill` derived from `CHANGELOG.md`.
- `scripts/validate.sh` now cross-checks links in every reference file, asserts the module count matches `references/modules.md`, and flags stray "27 modules" phrasing.
- Removed committed build artifact `access-for-seniors.skill` from the repo root; `build-skill.sh` writes to `dist/`.

## [1.0.0] - 2026-04-15

### Rebranded from Connection OS Enterprise
- Skill name: `connection-os` → `access-for-seniors`
- Aligned with "Access To" civic tech initiative family
- License changed from proprietary to MIT (matching Access To family)
- Added AAA / Community Worker as a supported role
- Added Module 28: Aging-Services Navigation
- Added `references/aging-services.md` covering OAA, Medicare, Medicaid, AAA
- Renamed `loneliness-detection.md` → `engagement-scoring.md`
- Added elder abuse mandatory reporting support note
- Updated brand voice guidance (person-first, plain language)

### Added (from Connection OS v1.0)
- Complete skill with 23 reference files
- 28 enterprise module specifications
- DynamoDB single-table design + RDS analytics schemas
- HIPAA-aligned security and compliance reference
- Conversation engine with distress detection and memory injection
- Engagement scoring algorithm (6 signal sources, 3 zones)
- MCP server tool schemas (7 tools)
- Clerk + Cognito dual auth architecture
- Stripe billing integration patterns
- Multi-tenant isolation architecture
- Go-to-market positioning and messaging framework
- GitHub repo infrastructure (CI, issue templates, docs)
- Skill packaging script
