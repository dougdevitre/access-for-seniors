# Access For Seniors — Notifications

## Channels

| Channel | Provider | Use Case |
|---------|----------|----------|
| Push | Expo Push / APNs / FCM | Mobile app alerts (family, caregiver) |
| SMS | AWS End User Messaging SMS or Twilio | Alert escalation, family outreach |
| Email | Amazon SES | Reports, digests, admin notifications |
| In-App | WebSocket / polling | Dashboard badges, real-time alerts |

## Delivery Logic

1. Check recipient notification preferences (channel + frequency + quiet hours)
2. If quiet hours active AND severity < tier2 → queue for delivery after quiet hours
3. If tier2+ → override quiet hours (configurable per tenant)
   - tier3 → send on every channel at once, not just the preferred one
   - `abuse_disclosure` → resolve recipients from the designated-reporter and
     supervisor roles only; drop any family or emergency-contact recipient before send
4. Send via preferred channel(s); log delivery status
5. Retry failed deliveries (3 attempts, exponential backoff)
6. Dead-letter queue for persistent failures → admin notification

## Templates

Handlebars-based templates stored in S3 per tenant. Fallback to system defaults.

```
s3://access-for-seniors-templates/{tenantId}/email/alert.hbs
s3://access-for-seniors-templates/{tenantId}/sms/alert.hbs
s3://access-for-seniors-templates/defaults/email/alert.hbs
```

## Preferences Schema

```typescript
interface NotificationPreferences {
  channels: ('push' | 'sms' | 'email')[];
  frequency: 'immediate' | 'daily_digest' | 'weekly_digest';
  quietHoursStart?: string; // "22:00"
  quietHoursEnd?: string;   // "07:00"
  quietHoursTimezone: string;
}
```
