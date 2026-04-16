# Access For Seniors — Message Generator

## Purpose

Generates short-form copy for family outreach, caregiver prompts, and activity suggestions
using Claude API.

## Generation Pipeline

1. Load resident context (memory items, recent conversation themes)
2. Load recipient context (family member relationship, preferences)
3. Select message template based on type
4. Call Claude with system prompt + context + template
5. Apply safety filter (no clinical language, no guilt, no PHI leakage)
6. Return generated message for review (if caregiver approval required) or direct send

## System Prompt for Generation

```
Generate a warm, personalized message for {familyMemberFirstName} about their
{relationship} {residentFirstName}.

Rules:
- Be warm and specific — reference actual interests or recent themes
- Never use clinical or diagnostic language
- Never guilt-trip or pressure
- Keep it to 2–3 sentences
- End with a gentle, specific suggestion for connection
- Never include engagement scores or internal data
```
