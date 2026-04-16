# Access For Seniors — Voice Interface

## Architecture

```
Resident dials facility number or dedicated Access For Seniors number
    ↓
Twilio Voice receives call → webhook to API Gateway
    ↓
Lambda: greeting TTS (ElevenLabs) → "Hi {residentName}, it's {personaName}!"
    ↓
Loop:
  Resident speaks → Twilio streams audio → ElevenLabs STT → text
      ↓
  Text → Claude API (with conversation engine context)
      ↓
  Claude response → ElevenLabs TTS → audio stream back to Twilio
      ↓
  Play audio to resident
    ↓
Call ends → post-conversation processing (memory extraction, scoring, logging)
```

## Voice Persona

- ElevenLabs voice cloned or selected from library
- Configurable per tenant (voice, speaking rate, warmth)
- Default: warm, medium pace, American English

## Safety

- Same content and distress filters as text conversation
- Voice distress detection: keywords + tone analysis (if available)
- Call recording: configurable per tenant; consent prompt at start if enabled
- Max call duration: 30 minutes (configurable); gentle close at limit

## Accessibility

- Support for hearing-impaired: real-time transcript option (WebSocket to family/caregiver app)
- Support for speech difficulties: patience parameters in Claude prompt; longer silence thresholds
