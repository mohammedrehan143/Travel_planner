# UI Designer Specification: TripPilot AI Voice Interface

## 1. Visual Direction & Design Tokens
In harmony with TripPilot's design system:
- **Primary Color**: TripPilot Ocean Blue (`#1E60FF`, hover `#0052FF`, active `#164bcc`)
- **Accent**: Cyan & Emerald (`#06B6D4`, `#10B981`)
- **Backgrounds**: Slate & White (`#FFFFFF`, `#F8FAFC`, `#F3F4F6`), selective dark contrast sections (`#171717`)
- **Typography**: Plus Jakarta Sans / system sans-serif font stack
- **Card Styling**: Rounded corners (`rounded-2xl` to `rounded-3xl`), subtle glassmorphism (`backdrop-blur-md`), refined drop shadows (`shadow-card`, `shadow-xl`)

---

## 2. Component Architecture: Dual Mode Chat Drawer

The drawer retains its current footprint while providing a top tab toggle:
```
+-------------------------------------------------------------+
| [Avatar] TripPilot Pilot          [ 💬 Chat | 🎙️ Voice ] [X] |
+-------------------------------------------------------------+
| Language: [ 🌐 English v ]   Status: [ 🟢 Ready ]           |
+-------------------------------------------------------------+
|                                                             |
|                       [ VOICE MODE ]                        |
|                                                             |
|                 +-----------------------+                   |
|                 |   Pilot Robot Mascot  |                   |
|                 +-----------------------+                   |
|                                                             |
|                 +-----------------------+                   |
|                 |  Large Animated Orb / |                   |
|                 |   Waveform Visualizer |                   |
|                 +-----------------------+                   |
|                                                             |
|                 "How can I help you today?"                 |
|                                                             |
|                 Live Transcript:                            |
|                 "Plan a 3-day trip to Coorg under ₹10,000"  |
|                                                             |
|                 [ Active Trip Card Preview if planned ]     |
|                                                             |
+-------------------------------------------------------------+
| Controls:                                                   |
|   [ ❌ Cancel ]      [ 🎙️ Mic (Big Orb) ]     [ ⏹️ Stop ]    |
|   [ 🔊 Replay ]                                [ 💬 Type ]  |
+-------------------------------------------------------------+
```

---

## 3. The 6 Voice Interaction States

| State | Orb Visual | Mascot Expression | Status Label | Action Controls |
|---|---|---|---|---|
| **`idle`** | Gentle breathing pulse (scale 1.0 -> 1.05), soft blue glow | Friendly alert posture | "Ready to listen" | Large blue microphone button |
| **`listening`** | Concentric expanding rings modulated by live microphone volume (Web Audio RMS) | Attentive listening posture | "Listening to you..." | Red stop/finish button, live volume ripple |
| **`processing`** | Continuous spinning dual-gradient orbital ring | Thinking / head tilt | "Pilot is planning..." | Disabled buttons with subtle shimmer |
| **`speaking`** | Equalizer soundbars + pulsing cyan/blue core | Expressive smiling posture | "Pilot is speaking..." | Interrupt / Stop / Pause / Resume controls |
| **`interrupted`**| Instant gentle amber ripple fading out | Neutral re-centering | "Interrupted" | Quick restart listening |
| **`error`** | Soft rose/amber ring alert | Helpful caring posture | Error message | Retry mic button + Switch to text |

---

## 4. Accessibility & Mobile Responsiveness
- **Accessible Names**: All audio controls have explicit `aria-label` tags (`"Start listening"`, `"Stop speaking"`, `"Mute assistant"`).
- **Keyboard Navigation**: Spacebar or Enter toggles listening when mic button is focused. Esc key closes voice mode or interrupts playback.
- **Mobile Friendly**: Touch targets are >= 48px x 48px. Microphone orb is centered within comfortable thumb-reach at bottom.
- **Visual Feedback**: Audio level is represented visually for deaf or hard-of-hearing users via live soundwave bars.
- **Dual Representation**: Spoken responses are synchronously printed to the transcript and preserved in the shared message history.
