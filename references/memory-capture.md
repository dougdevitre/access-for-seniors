# Access For Seniors — Memory Capture

## Memory Types

| Type | Definition | TTL | Example |
|------|-----------|-----|---------|
| Biographical | Stable life facts | None | "Was a teacher for 30 years" |
| Preference | Likes/dislikes, communication style | None | "Loves jazz, especially Miles Davis" |
| Episodic | Recent events, things mentioned | 90 days | "Granddaughter visited last Tuesday" |
| Relational | People who matter and their significance | None | "Daughter Sarah in Denver, calls weekly" |

## Extraction Pipeline

```mermaid
flowchart TD
    End["Conversation ends"]
    Lambda["Post-conversation Lambda"]
    Extract["Claude extracts<br/>memory candidates (JSON)"]
    Dedup["Dedup vs existing<br/>(semantic similarity)"]
    Store["Store in DynamoDB<br/>RESIDENT#id / MEM#memId"]
    TTL{"Memory type?"}
    Episodic["Episodic<br/>TTL 90 days"]
    Stable["Biographical / Preference / Relational<br/>no TTL"]

    End --> Lambda --> Extract --> Dedup --> Store --> TTL
    TTL -->|episodic| Episodic
    TTL -->|other| Stable
```

## Extraction Prompt

```
Given this conversation, extract any new facts about the resident.
Return JSON array of memory items:
[
  { "type": "biographical|preference|episodic|relational", "content": "..." , "confidence": 0.0-1.0 }
]
Only extract facts clearly stated or strongly implied. Do not infer emotions or diagnoses.
If no new facts, return empty array.
```

## Conflict Resolution

- If new memory contradicts existing: keep both, flag for caregiver review
- Caregiver can mark memories as "confirmed", "disputed", or "deleted"
- Deleted memories are soft-deleted (audit trail retained)
