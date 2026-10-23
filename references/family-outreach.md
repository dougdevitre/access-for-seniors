# Access For Seniors — Family Outreach

## Message Types

| Type | Purpose | Frequency |
|------|---------|-----------|
| Connection Reminder | Encourage family to call/visit | 1/week (default) |
| Conversation Highlight | Share anonymized theme from recent conversation | After meaningful conversations (held while an abuse-disclosure hold is active; see Privacy Rules) |
| Activity Suggestion | Suggest activity family could do with/for resident | Bi-weekly |
| Milestone | Birthday, anniversary, achievement | Event-driven |

## Tone Guidelines

- Warm, never guilt-inducing
- Specific to the resident ("Mom mentioned she enjoyed the garden this week"), unless an abuse-disclosure hold is active (see Privacy Rules)
- Never clinical ("Your mother's score dropped")
- Action-oriented ("A quick call about the garden would mean a lot")
- Respect boundaries — if family reduces frequency, respect it

## Privacy Rules

- Family receives conversation THEMES, never transcripts
- Family never sees raw engagement scores
- Family sees: "Mom's been more engaged this week" not "Score: 72 (+5)"
- Outreach messages reviewed by Claude with safety filter before send
- Never draw a theme from a conversation that raised an emergency, self-harm,
  or abuse-disclosure alert
- **Abuse-disclosure hold:** when a resident discloses abuse (`abuse_disclosure`
  alert, see `alerts-system.md`), the person they fear may be a family member.
  From that moment until a designated reporter clears the hold, the system sends
  that resident's family no Conversation Highlight and no other content drawn
  from conversations or memory items, including in Activity Suggestions.
  Connection Reminders and Milestones may continue unchanged, so the family sees
  nothing that signals a report. The hold, and the alert, are never visible to
  family. Clearing the hold is logged with who cleared it and why
