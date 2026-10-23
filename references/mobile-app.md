# Access For Seniors — Mobile App

## Platform

- React Native + Expo (iOS + Android)
- Target users: Family members (primary), residents (secondary)

## Key Screens

| Screen | Users | Purpose |
|--------|-------|---------|
| Home | Family | Connection status summary, recent activity |
| Resident Profile | Family | Photo, bio, interests |
| Connection History | Family | Recent conversation themes (no transcripts) |
| Send a Message | Family | Prompt to call/text/visit |
| Notifications | Family | Alert inbox (never shows `abuse_disclosure` alerts) |
| Conversation (resident) | Resident | Text-based chat with AI companion |

## Auth

- Clerk Expo SDK: `@clerk/clerk-expo`
- Biometric login supported (Expo LocalAuthentication)

## Notifications

- Expo Push Notifications → AWS SNS → APNs/FCM
- Deep link: `accessforseniors://alert/{alertId}`

## Accessibility

- Dynamic type support
- VoiceOver / TalkBack compatible
- Minimum tap target: 44pt

## Offline Handling

- Read-only cache of last resident summary (AsyncStorage, 24h TTL)
- Queue outgoing caregiver notes for sync on reconnect
