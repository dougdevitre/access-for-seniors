# Access For Seniors — Data Models

## DynamoDB: Single-Table Design

**Table name:** `ConnectionOS`

### Access Patterns & Key Design

| Access Pattern | PK | SK | GSI1PK | GSI1SK |
|---------------|----|----|--------|--------|
| Get tenant | `TENANT#<tenantId>` | `METADATA` | — | — |
| List residents for tenant | `TENANT#<tenantId>` | `RESIDENT#<residentId>` | `TENANT#<tenantId>` | `SCORE#<engagementScore>` |
| Get resident detail | `TENANT#<tenantId>` | `RESIDENT#<residentId>` | — | — |
| List conversations for resident | `RESIDENT#<residentId>` | `CONV#<timestamp>` | `TENANT#<tenantId>` | `CONV#<timestamp>` |
| List memory items for resident | `RESIDENT#<residentId>` | `MEM#<memoryId>` | — | — |
| List alerts for tenant | `TENANT#<tenantId>` | `ALERT#<timestamp>` | `ALERT_STATUS#<status>` | `<timestamp>` |
| Get alert detail | `TENANT#<tenantId>` | `ALERT#<alertId>` | — | — |
| List family for resident | `RESIDENT#<residentId>` | `FAMILY#<familyId>` | `FAMILY#<familyId>` | `RESIDENT#<residentId>` |
| List caregivers for tenant | `TENANT#<tenantId>` | `CAREGIVER#<caregiverId>` | — | — |
| Audit log | `AUDIT#<tenantId>` | `<timestamp>#<eventId>` | — | — |

### Entity Schemas

#### Tenant
```typescript
interface Tenant {
  PK: `TENANT#${string}`;
  SK: 'METADATA';
  tenantId: string;
  name: string;
  type: 'single_facility' | 'multi_facility' | 'enterprise';
  stripeCustomerId: string;
  cognitoPoolId?: string;
  config: TenantConfig;
  status: 'active' | 'suspended' | 'onboarding';
  createdAt: string; // ISO 8601
  updatedAt: string;
}

interface TenantConfig {
  branding: { logo?: string; primaryColor?: string; facilityName: string };
  alerts: { tier1Threshold: number; tier2Threshold: number; tier3Threshold: number };
  notifications: { channels: ('push' | 'sms' | 'email')[]; quietHoursStart?: string; quietHoursEnd?: string };
  consent: { requireAIConsent: boolean; requireVoiceRecording: boolean; requireFamilySharing: boolean };
  dataRetention: { conversationDays: number; alertDays: number; auditDays: number };
  aiPersonaName: string; // e.g., "Clara", "Sam"
}
```

#### Resident
```typescript
interface Resident {
  PK: `TENANT#${string}`;
  SK: `RESIDENT#${string}`;
  GSI1PK: `TENANT#${string}`;
  GSI1SK: `SCORE#${string}`; // zero-padded engagement score for sorting
  tenantId: string;
  residentId: string;
  firstName: string; // encrypted
  lastName: string;  // encrypted
  dateOfBirth?: string; // encrypted
  photo?: string; // S3 key
  interests: string[];
  biography?: string;
  engagementScore: number; // 0–100
  engagementTrend: 'improving' | 'stable' | 'declining';
  lastConversationAt?: string;
  lastAlertAt?: string;
  consentFlags: ConsentFlags;
  status: 'active' | 'inactive' | 'discharged';
  assignedCaregivers: string[]; // caregiverId[]
  emergencyContact: { name: string; phone: string; relationship: string }; // encrypted
  createdAt: string;
  updatedAt: string;
}

interface ConsentFlags {
  aiConversation: boolean;
  voiceRecording: boolean;
  familyDataSharing: boolean;
  photoUse: boolean;
  researchParticipation: boolean;
  consentCapturedAt: string;
  consentCapturedBy: string; // userId who captured consent
}
```

#### Conversation
```typescript
interface Conversation {
  PK: `RESIDENT#${string}`;
  SK: `CONV#${string}`; // ISO timestamp
  GSI1PK: `TENANT#${string}`;
  GSI1SK: `CONV#${string}`;
  tenantId: string;
  residentId: string;
  conversationId: string;
  channel: 'text' | 'voice' | 'mobile';
  startedAt: string;
  endedAt?: string;
  turnCount: number;
  topics: string[]; // extracted themes
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  distressDetected: boolean;
  memoryItemsExtracted: number;
  durationSeconds?: number;
  // Raw transcript stored in S3, not in DynamoDB
  transcriptS3Key?: string; // encrypted
}
```

#### Memory Item
```typescript
interface MemoryItem {
  PK: `RESIDENT#${string}`;
  SK: `MEM#${string}`;
  tenantId: string;
  residentId: string;
  memoryId: string;
  type: 'biographical' | 'preference' | 'episodic' | 'relational';
  content: string; // e.g., "Daughter named Sarah lives in Denver"
  source: 'conversation' | 'caregiver_note' | 'family_input' | 'intake';
  confidence: number; // 0–1
  createdAt: string;
  updatedAt: string;
  expiresAt?: number; // TTL for episodic items (Unix epoch)
}
```

#### Alert
```typescript
interface Alert {
  PK: `TENANT#${string}`;
  SK: `ALERT#${string}`;
  GSI1PK: `ALERT_STATUS#${string}`;
  GSI1SK: string; // timestamp
  tenantId: string;
  alertId: string;
  residentId: string;
  type: 'score_drop' | 'distress_keyword' | 'missed_checkin' | 'family_request' | 'predictive';
  severity: 'tier1' | 'tier2' | 'tier3';
  status: 'open' | 'acknowledged' | 'resolved' | 'escalated';
  title: string;
  description: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
  notificationsSent: { channel: string; recipient: string; sentAt: string }[];
}
```

#### Family Member
```typescript
interface FamilyMember {
  PK: `RESIDENT#${string}`;
  SK: `FAMILY#${string}`;
  GSI1PK: `FAMILY#${string}`;
  GSI1SK: `RESIDENT#${string}`;
  tenantId: string;
  residentId: string;
  familyId: string;
  firstName: string; // encrypted
  lastName: string;  // encrypted
  email?: string;    // encrypted
  phone?: string;    // encrypted
  relationship: string;
  notificationPreferences: { channels: ('push' | 'sms' | 'email')[]; frequency: 'daily' | 'weekly' | 'immediate_alerts_only' };
  clerkUserId?: string;
  lastContactAt?: string;
  status: 'active' | 'invited' | 'inactive';
}
```

---

## RDS Aurora (Analytics Warehouse)

Used for reporting queries that don't fit DynamoDB's access patterns.
Data flows via DynamoDB Streams → Lambda → RDS.

### Key Tables

```sql
CREATE TABLE engagement_daily (
  tenant_id VARCHAR(64) NOT NULL,
  resident_id VARCHAR(64) NOT NULL,
  date DATE NOT NULL,
  engagement_score INT NOT NULL,
  conversation_count INT DEFAULT 0,
  total_turns INT DEFAULT 0,
  avg_sentiment DECIMAL(3,2),
  alert_count INT DEFAULT 0,
  family_contact_count INT DEFAULT 0,
  PRIMARY KEY (tenant_id, resident_id, date)
);

CREATE TABLE facility_summary (
  tenant_id VARCHAR(64) NOT NULL,
  date DATE NOT NULL,
  total_residents INT NOT NULL,
  active_residents INT NOT NULL,
  avg_engagement_score DECIMAL(5,2),
  residents_green INT DEFAULT 0,
  residents_yellow INT DEFAULT 0,
  residents_red INT DEFAULT 0,
  total_alerts INT DEFAULT 0,
  avg_response_time_minutes DECIMAL(8,2),
  family_engagement_rate DECIMAL(5,4),
  PRIMARY KEY (tenant_id, date)
);

CREATE TABLE alert_metrics (
  tenant_id VARCHAR(64) NOT NULL,
  alert_id VARCHAR(64) NOT NULL,
  resident_id VARCHAR(64) NOT NULL,
  type VARCHAR(32) NOT NULL,
  severity VARCHAR(8) NOT NULL,
  triggered_at TIMESTAMP NOT NULL,
  acknowledged_at TIMESTAMP,
  resolved_at TIMESTAMP,
  response_time_minutes DECIMAL(8,2),
  PRIMARY KEY (tenant_id, alert_id)
);
```
