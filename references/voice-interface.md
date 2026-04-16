# Access For Seniors — Voice Interface

## Architecture

```mermaid
sequenceDiagram
    actor R as Resident
    participant T as Twilio Voice
    participant L as Voice Lambda
    participant STT as ElevenLabs STT
    participant C as Claude API
    participant TTS as ElevenLabs TTS
    participant P as Post-Processing

    R->>T: dials facility / AFS number
    T->>L: webhook (API Gateway)
    L->>TTS: greeting prompt
    TTS-->>T: greeting audio
    T-->>R: "Hi {resident}, it's {persona}!"

    loop Each turn
        R->>T: speaks
        T->>STT: stream audio
        STT->>L: transcript
        L->>C: prompt + conversation context
        C-->>L: response text
        L->>TTS: synthesize
        TTS-->>T: audio stream
        T-->>R: persona reply
    end

    R->>T: hangs up
    T->>P: call ended event
    P->>P: memory extraction, scoring, logging
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
