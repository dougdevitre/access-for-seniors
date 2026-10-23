# Architecture Overview

A contributor-facing map of how Access For Seniors fits together. For detailed specs on any subsystem, see the [reference files](../references/).

## System at a glance

```mermaid
flowchart TB
    subgraph Edges["Client edges"]
        Senior["Senior<br/>voice · text · mobile"]
        Family["Family<br/>mobile app · web"]
        Staff["Caregiver / Admin<br/>dashboard"]
        Nav["AAA / Community Worker<br/>navigator portal"]
    end

    subgraph Auth["Auth layer"]
        Clerk["Clerk<br/>staff · consumer"]
        Cognito["Amazon Cognito<br/>enterprise SSO / SAML"]
    end

    subgraph API["API tier"]
        Gateway["API Gateway<br/>+ Lambda authorizer"]
        Lambdas["Lambda functions<br/>conversation · alerts · billing · MCP"]
    end

    subgraph AI["AI tier"]
        Claude["Claude API<br/>conversation · memory extraction · outreach"]
        Voice["Twilio Voice<br/>+ ElevenLabs STT/TTS"]
    end

    subgraph Data["Data tier"]
        DDB[("DynamoDB<br/>single-table")]
        Aurora[("RDS Aurora<br/>analytics")]
        S3[("S3<br/>audio · transcripts · exports")]
        SSM[("SSM SecureString<br/>secrets")]
    end

    subgraph Ext["External"]
        Stripe["Stripe<br/>billing"]
        Messaging["End User Messaging SMS / SES / SNS<br/>notifications"]
    end

    Senior --> Gateway
    Family --> Clerk --> Gateway
    Staff --> Clerk
    Nav --> Cognito --> Gateway
    Staff --> Gateway

    Gateway --> Lambdas
    Lambdas --> Claude
    Lambdas --> Voice
    Lambdas --> DDB
    Lambdas --> S3
    Lambdas --> SSM

    DDB -- "streams" --> Aurora
    Lambdas --> Stripe
    Lambdas --> Messaging
    Messaging --> Family
    Messaging --> Staff
```

## Request path: a resident conversation

```mermaid
sequenceDiagram
    actor R as Resident
    participant V as Voice / Text Edge
    participant API as API Gateway
    participant CE as Conversation Lambda
    participant M as Memory Store (DDB)
    participant C as Claude API
    participant S as Safety Filter
    participant P as Post-processor
    participant A as Alert Engine

    R->>V: speaks or types
    V->>API: request (JWT)
    API->>CE: authorized call
    CE->>M: load memory + history
    CE->>C: prompt + context
    C-->>CE: response
    CE->>S: safety pass
    alt distress detected
        S->>A: raise alert
    end
    S-->>V: delivered reply
    V-->>R: response
    CE->>P: async post-processing
    P->>M: extract new memories
    P->>M: update engagement signals
```

## Tenant isolation

```mermaid
flowchart LR
    JWT["JWT (Clerk or Cognito)"]
    Authz["Lambda authorizer<br/>extracts tenantId"]
    DDB["DynamoDB query<br/>PK = TENANT#{tenantId}"]
    RDS["RDS<br/>RLS policy on tenant_id"]
    S3["S3 prefix<br/>s3://bucket/{tenantId}/..."]

    JWT --> Authz
    Authz --> DDB
    Authz --> RDS
    Authz --> S3
```

Every downstream call carries the resolved `tenantId`. Middleware rejects any request whose resource tenant disagrees with the token claim. See [`multi-tenant.md`](../references/multi-tenant.md) and [`security.md`](../references/security.md).

## Alert escalation

```mermaid
flowchart TD
    Trigger["Signal<br/>score drop · sentiment · missed check-in · family request"]
    Urgent["Emergency or self-harm words<br/>(companion gives 911 / 988)"]
    Abuse["Abuse disclosure<br/>(companion gives 911 + APS)"]
    Reporter["Designated reporter + supervisor only<br/>never family · holds family highlights<br/>5-min target"]
    Tier1["Tier 1<br/>assigned caregiver<br/>24h target"]
    Tier2["Tier 2<br/>caregiver + supervisor + emergency family<br/>4h target · overrides quiet hours"]
    Tier3["Tier 3 Urgent<br/>on-duty team + supervisor + facility admin<br/>5-min target (configurable)"]
    Resolved(["Acknowledged → Resolved"])

    Trigger --> Tier1
    Tier1 -->|ack| Resolved
    Tier1 -->|no ack in 24h| Tier2
    Tier2 -->|ack| Resolved
    Tier2 -->|no ack in 4h| Tier3
    Tier3 --> Resolved
    Urgent --> Tier3
    Abuse --> Reporter
    Reporter --> Resolved
```

## Module ↔ reference file map

| Layer | Modules | Key reference files |
|-------|---------|---------------------|
| Engagement | 2, 3, 4 | `conversation-engine.md`, `memory-capture.md`, `engagement-scoring.md` |
| Outreach | 5, 9, 11 | `alerts-system.md`, `family-outreach.md`, `message-generator.md`, `notifications.md` |
| Surfaces | 6, 7, 26, 8, 10 | `caregiver-dashboard.md`, `mobile-app.md`, `voice-interface.md`, `community-features.md` |
| Platform | 13, 14, 15, 16, 17, 18 | `multi-tenant.md`, `auth.md`, `billing.md`, `aws-deployment.md`, `cicd.md`, `security.md` |
| Data & APIs | 12, 19, 22 | `data-models.md`, `analytics.md`, `mcp-tools.md` |
| Navigation | 28 | `aging-services.md` |

## Where to start if you're…

- **New engineer:** read this file, then `references/data-models.md`, then the reference(s) for the module you're working on.
- **Designing a feature:** follow §4 "Core Workflows" in [`SKILL.md`](../SKILL.md).
- **Doing security review:** start at [`references/security.md`](../references/security.md), then [`references/multi-tenant.md`](../references/multi-tenant.md).
- **Writing outreach copy:** [`references/family-outreach.md`](../references/family-outreach.md) + [`references/gtm.md`](../references/gtm.md) for voice.
- **Researching a program:** [`references/aging-services.md`](../references/aging-services.md) + [glossary](glossary.md).
