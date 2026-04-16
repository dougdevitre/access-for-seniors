# Quick Start

## What This Skill Does

When installed, this skill guides Claude through any work related to Access For Seniors Enterprise — a multi-tenant SaaS platform for AI-powered senior connection and loneliness mitigation.

## Example Prompts

### Product & Engineering
- "Design a feature for Module 5 Alert Engine that lets caregivers snooze alerts"
- "Write the DynamoDB access pattern for listing alerts by severity across a tenant"
- "Draft an API endpoint for family members to request a wellness check"
- "What's the data model for the Conversation entity?"
- "Write the TypeScript types for a Resident record"

### Security & Compliance
- "Review this Lambda for HIPAA compliance issues"
- "What consent flags do we need before enabling voice recording?"
- "Design the audit logging strategy for PHI access"

### AI/LLM Work
- "Write the system prompt for the conversation engine"
- "Design the memory extraction prompt for post-conversation processing"
- "How should we handle distress detection in voice calls?"

### Infrastructure
- "Write the CDK stack for the API layer"
- "Design the GitHub Actions deploy workflow for staging"
- "What IAM policy does the conversation Lambda need?"

### Go-to-Market
- "Draft a cold email to an Executive Director at a CCRC"
- "Write positioning copy for the Activities Director persona"
- "What's our differentiation vs. social robots like ElliQ?"

## What to Expect

Claude will:
- Reference specific modules by number (1–28)
- Use the canonical tech stack (React/Vite, Node/TS, DynamoDB, AWS Lambda, Claude API)
- Apply HIPAA-aligned security defaults automatically
- Frame engagement data as "connection signals" not diagnoses
- Follow your output format preferences (spec structure, file tree + code blocks)

## When to Update Reference Files

Update a reference file when:
- You add a new module or change an existing one
- Tech stack components change
- Security or compliance requirements change
- GTM positioning or messaging evolves

After updates, run `./scripts/validate.sh` to confirm the skill structure is intact.
