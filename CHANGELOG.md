# Changelog

All notable changes to Access For Seniors will be documented in this file.

## [Unreleased]

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
