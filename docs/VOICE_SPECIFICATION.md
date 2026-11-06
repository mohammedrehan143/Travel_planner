# Software Engineer Specification: TripPilot AI Voice Assistant Integration (STT + TTS)

## 1. Executive Summary & Architecture Boundary
This specification defines the architectural extension of TripPilot AI to support multimodal voice interaction (Speech-to-Text and Text-to-Speech) while strictly preserving the single AI brain, shared trip context, agent orchestrator, and security guardrails.

```
+-----------------------------------------------------------------------------------+
|                                 USER INTERFACE                                    |
|   +----------------------------+                 +----------------------------+   |
|   |         Chat Mode          |                 |         Voice Mode         |   |
|   | (Text input, chips, list)  |                 | (Orb/Waveform, Mic, Mascot)|   |
|   +--------------+-------------+                 +--------------+-------------+   |
|                  |                                              |                 |
+------------------|----------------------------------------------|-----------------+
                   |                                              |
                   |                               Audio capture  v
                   |                               +----------------------------+
                   |                               |    MediaRecorder + STT     |
                   |                               |   (/api/voice/stt or web)  |
                   |                               +--------------+-------------+
                   |                                              |
                   | Text prompt                                  | Recognized text
                   v                                              v
+-----------------------------------------------------------------------------------+
|                        SINGLE SHARED AGENT CONVERSATION API                       |
|                             POST /api/agent/chat                                  |
|               (Context: active trip ID, selected day, budget, currency)           |
+-----------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                           AI ORCHESTRATOR & AGENT ENGINE                          |
|         (Gemini / Groq / OpenAI LLM + Tool Registry + Destination Catalogs)       |
+-----------------------------------------------------------------------------------+
                                           |
                                           v
                               { status, message, createdTrip, new_activity }
                                           |
                  +------------------------+------------------------+
                  |                                                 |
                  v                                                 v
      Render to Chat Thread & UI                       POST /api/voice/tts
   (Message Bubble, Trip Action Card)                 (Clean Text -> Audio Stream)
                                                                    |
                                                                    v
                                                          Audio Playback Engine
                                                      (Auto-play, Waveform, Interrupt)
```

---

## 2. API Contracts & Boundary Definitions

### 2.1 STT Endpoint: `POST /api/voice/stt`
- **Authentication**: `requireAuth` (supports JWT access token and development `x-user-id` bypass).
- **Rate Limiting**: `chatRateLimiter` (100 req / 15 min).
- **Payload (JSON with Base64 audio)**:
  ```json
  {
    "audio": "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQ8USA...",
    "format": "webm",
    "language": "en"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "text": "Plan a 3-day trip to Coorg under 10000 rupees",
    "language": "en",
    "provider": "openai"
  }
  ```
- **Error Response (`400 Bad Request` or `500 Internal Error`)**:
  ```json
  {
    "error": "STT_PROCESSING_FAILED",
    "message": "Audio stream could not be decoded or no speech was detected."
  }
  ```

### 2.2 TTS Endpoint: `POST /api/voice/tts`
- **Authentication**: `requireAuth`
- **Rate Limiting**: `chatRateLimiter`
- **Payload**:
  ```json
  {
    "text": "I have planned an exciting 3-day trip to Coorg featuring Abbey Falls and coffee estate tours.",
    "voice": "alloy",
    "language": "en",
    "speed": 1.0
  }
  ```
- **Response (`200 OK`)**:
  - `Content-Type: audio/mpeg`
  - Audio binary stream / buffer or JSON with base64 audio when requested.
- **Text Preprocessing Rules for Speech**:
  - Strips markdown symbols (`*`, `#`, `_`, backticks, bullet symbols).
  - Removes raw JSON snippets, coordinates, or internal object references.
  - Translates bullet items to flowing conversational phrases.
  - Caps spoken text to first 300 words for low latency and high clarity.

### 2.3 Shared Conversation Engine: `POST /api/agent/chat`
- Used directly without duplication: both Chat Mode and Voice Mode invoke this identical endpoint with the active trip context.
- Returns identical actions (`plan_new_trip`, `chat`, `add_activity`) ensuring complete parity between modes.

---

## 3. Supported Languages & Extensibility
- **English (`en`)**: Full STT & TTS support.
- **Hindi (`hi`)**: Supported via Whisper transcription with prompt hinting and multilingual TTS (OpenAI TTS model natively supports Hindi).
- **Kannada (`kn`)**: Supported via Whisper transcription with Kannada language token (`kn`) and multilingual TTS synthesis.
- **Extensibility**: Defined in a centralized language map `SUPPORTED_VOICE_LANGUAGES = [{ code: 'en', label: 'English' }, { code: 'hi', label: 'हिन्दी (Hindi)' }, { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' }]`. Adding new languages requires only a single registry entry.

---

## 4. Local Development & Fallback Guarantee
- In local development without `OPENAI_API_KEY`, the system must not fail:
  - STT: Client gracefully leverages the browser's native `webkitSpeechRecognition` / `SpeechRecognition` API.
  - TTS: Client gracefully leverages `window.speechSynthesis` with matching language locales (`en-US`, `hi-IN`, `kn-IN`).
  - When API keys are configured in backend `.env`, server-grade Whisper STT and OpenAI TTS take precedence with studio audio quality.

---

## 5. Security & Secret Protection
1. No OpenAI, Deepgram, or ElevenLabs keys exposed to browser clients.
2. Audio uploads capped at 20MB.
3. Temporary audio buffers cleaned immediately from memory.
4. Input sanitization applied before LLM consumption (`sanitizeUserInput`).
