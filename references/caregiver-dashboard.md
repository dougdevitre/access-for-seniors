# Access For Seniors — Caregiver Dashboard

## Tech Stack

- React 18 + Vite + TypeScript
- Clerk auth (`@clerk/react`)
- Tailwind CSS
- React Query for data fetching
- WebSocket or polling for real-time alert badges

## Key Views

| View | Purpose |
|------|---------|
| Resident List | Sortable/filterable by engagement score, zone, name, last contact |
| Resident Detail | Profile, engagement trend chart, memory items, conversation themes, alert history |
| Alert Inbox | Open alerts with severity indicators; acknowledge/resolve actions. `abuse_disclosure` alerts appear only for designated reporters and supervisors, with a control to clear the family outreach hold |
| Shift Notes | Per-resident structured observations (mood, sociability, appetite, mobility, sleep) |
| Reports | Facility-level engagement trends, alert metrics, family engagement |
| Settings | Personal notification preferences |

## Accessibility

- Target: WCAG 2.1 AA
- Keyboard navigation for all actions
- Screen reader compatible (ARIA labels)
- Color-blind safe palette for engagement zones (use icons + color)
- Minimum tap target: 44px

## Real-Time Updates

- Alert badges update via WebSocket (or 30-second polling fallback)
- Engagement scores refresh on page load (not real-time — daily recalculation)
- Shift notes auto-save (debounced, 2-second delay)
