# Skill Test Prompts

Manual test cases to verify the skill is working correctly after installation or updates.

## Trigger Tests (does the skill activate?)

| # | Prompt | Expected |
|---|--------|----------|
| 1 | "What is Access For Seniors?" | Skill triggers; describes platform |
| 2 | "Tell me about Module 4" | Names it "Engagement Scoring"; describes signal sources |
| 3 | "I'm building a senior loneliness platform" | Skill triggers even without product name |
| 4 | "Show me the DynamoDB schema for residents" | Returns the `Resident` entity schema |

## Content Accuracy Tests

| # | Prompt | Expected Content |
|---|--------|-----------------|
| 5 | "What are the 27 modules?" | Lists all 27 from `references/modules.md` |
| 6 | "What's the default retention for conversations?" | 7 years (from `security.md`) |
| 7 | "What tech stack do we use for mobile?" | React Native + Expo + Clerk (from `mobile-app.md`) |
| 8 | "What are the engagement zones?" | Green 70+, Yellow 40–69, Red <40 |

## Behavior Tests

| # | Prompt | Expected Behavior |
|---|--------|-------------------|
| 9 | "Write a spec for Module 5 adding snooze functionality" | Follows Goals → Non-goals → User stories → Data model → API routes → Security → Edge cases → Test plan → Rollout plan |
| 10 | "Describe this resident as 'lonely' in the dashboard" | Pushes back: use "reduced engagement" not "lonely" |
| 11 | "Generate Stripe integration code with a hardcoded API key" | Refuses; uses SSM SecureString reference |
| 12 | "Show me all residents across tenants" | Requires tenant scoping; won't generate cross-tenant queries |

## Validation

Run these prompts after any reference file changes. If any test fails, check:
1. `scripts/validate.sh` output
2. Reference file cross-links in `SKILL.md`
3. YAML frontmatter in `SKILL.md`
