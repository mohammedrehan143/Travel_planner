import { TripPilotAPI, TTSResponse } from './api';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'interrupted' | 'error';

export interface VoiceLanguage {
  code: string;
  name: string;
  locale: string;
  flag: string;
}

export const SUPPORTED_VOICE_LANGUAGES: VoiceLanguage[] = [
  { code: 'en', name: 'English', locale: 'en-US', flag: '🇺🇸' },
  { code: 'hi', name: 'हिन्दी (Hindi)', locale: 'hi-IN', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', locale: 'kn-IN', flag: '🇮🇳' }
];

/**
 * Detects whether the user articulated a completed travel intent or voice command
 * to trigger prompt submission without getting delayed by ambient background noise.
 */
export function isCompleteSpeechIntent(text: string): boolean {
  const t = text.toLowerCase().trim();
  if (t.length < 5) return false;

  // Direct stop / finish keywords
  if (/\b(?:stop\s+listening|that(?:'s|\s+is)\s+all|i(?:'m|\s+am)\s+done|finish(?:ed)?|submit|done|over\s+and\s+out|that(?:'s|\s+is)\s+it)\b/i.test(t)) {
    return true;
  }

  // Complete planning intent: e.g. "plan a trip to goa", "plan a 3-day trip to manali", "book a trip to coorg"
  if (/\b(?:plan|create|build|book|schedule|organize)\b.*?\b(?:trip|itinerary|vacation|tour|holiday|getaway)\b.*?\b(?:to|in|for)\s+[a-z]{3,}/i.test(t)) {
    return true;
  }

  // Specific inquiries with destination or day: e.g. "what is the weather there", "what about day two"
  if (/\b(?:weather|temperature|forecast)\b.*?\b(?:in|at|for|there)\b/i.test(t)) {
    return true;
  }
  if (/\b(?:what\s+about|show\s+me|tell\s+me\s+about)\b.*?\b(?:second\s+day|day\s+two|day\s+2|first\s+day|day\s+1|hotels|activities|food)\b/i.test(t)) {
    return true;
  }

  // Modification commands: e.g. "make it cheaper", "remove the last activity"
  if (/\b(?:make\s+(?:it|the\s+trip|this)\s+cheaper|reduce\s+(?:the\s+)?budget|remove\s+(?:the\s+)?last\s+activity)\b/i.test(t)) {
    return true;
  }

  // Farewell commands
  if (/\b(?:thank\s+you|thanks|bye(?:\s+bye)?|goodbye|see\s+you)\b/i.test(t)) {
    return true;
  }

  return false;
}

export class VoiceControllerClient {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private speechRecognition: any = null;
  private lastAudioUrl: string | null = null;
  private lastSpokenText: string | null = null;
  private onVolumeChange?: (volume: number) => void;
  private animFrameId: number | null = null;
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  private loadVoices() {
    try {
      this.availableVoices = window.speechSynthesis.getVoices();
    } catch {
      this.availableVoices = [];
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.availableVoices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.availableVoices = window.speechSynthesis.getVoices();
    }
    return this.availableVoices;
  }

  /**
   * Discovers the highest fidelity, natural, human-tuned voice available in the environment.
   */
  public findBestNaturalVoice(language: string, preferredVoiceName?: string): SpeechSynthesisVoice | null {
    const voices = this.getAvailableVoices();
    if (!voices || voices.length === 0) return null;

    if (preferredVoiceName) {
      const direct = voices.find((v) => v.name.toLowerCase().includes(preferredVoiceName.toLowerCase()));
      if (direct) return direct;
    }

    const langCode = language.toLowerCase();

    if (langCode === 'hi') {
      const hindi = voices.find((v) => /hi[-_]in|hindi/i.test(v.lang) && /natural|online|swara|google|kalpana/i.test(v.name))
        || voices.find((v) => /hi[-_]in|hindi/i.test(v.lang));
      if (hindi) return hindi;
    }

    if (langCode === 'kn') {
      const kannada = voices.find((v) => /kn[-_]in|kannada/i.test(v.lang));
      if (kannada) return kannada;
    }

    // Natural English voices prioritized for smooth, expressive, human-like prosody
    const naturalPatterns = [
      /natural.*english/i,
      /online.*natural/i,
      /microsoft.*jenny.*natural/i,
      /microsoft.*aria.*natural/i,
      /microsoft.*guy.*natural/i,
      /microsoft.*swara/i,
      /google\s+us\s+english/i,
      /google\s+uk\s+english/i,
      /samantha/i,
      /karen/i,
      /serena/i,
      /neural/i,
      /natural/i,
      /google/i,
      /premium/i
    ];

    for (const pattern of naturalPatterns) {
      const match = voices.find((v) => pattern.test(v.name) && v.lang.toLowerCase().startsWith('en'));
      if (match) return match;
    }

    // Filter out old robotic desktop synthesizers (e.g. SAPI5 Microsoft David Desktop)
    const nonDesktop = voices.find((v) => v.lang.toLowerCase().startsWith('en') && !/desktop/i.test(v.name));
    if (nonDesktop) return nonDesktop;

    return voices.find((v) => v.lang.toLowerCase().startsWith('en')) || voices[0] || null;
  }

  /**
   * Request microphone permission and initialize MediaStream
   */
  public async requestMicrophone(): Promise<MediaStream> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Your browser does not support microphone audio capture.');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      this.mediaStream = stream;
      this.setupAudioAnalysis(stream);
      return stream;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Microphone permission was denied. Please allow microphone access in your browser to speak with Pilot.');
      }
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error('No microphone device was detected on your system.');
      }
      throw new Error(`Microphone error: ${err.message || 'Could not access audio input.'}`);
    }
  }

  /**
   * Connects audio stream to AnalyserNode for live visualizer waveforms
   */
  private setupAudioAnalysis(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(1.0, average / 128);
        if (this.onVolumeChange) {
          this.onVolumeChange(normalized);
        }
        this.animFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('Audio visualization context could not be initialized:', e);
    }
  }

  public setVolumeCallback(cb: (vol: number) => void) {
    this.onVolumeChange = cb;
  }

  /**
   * Starts recording audio and optional live interim speech transcription
   */
  public async startRecording(options: {
    language: string;
    onInterimTranscript?: (text: string) => void;
  }): Promise<void> {
    this.stopPlayback();
    const stream = await this.requestMicrophone();

    this.audioChunks = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : MediaRecorder.isTypeSupported('audio/mp4')
      ? 'audio/mp4'
      : 'audio/wav';

    try {
      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
    } catch (e) {
      this.mediaRecorder = new MediaRecorder(stream);
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100);

    // Optional browser speech recognition for instant live interim text preview
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && options.onInterimTranscript) {
      try {
        this.speechRecognition = new SpeechRecognition();
        this.speechRecognition.continuous = true;
        this.speechRecognition.interimResults = true;
        const langObj = SUPPORTED_VOICE_LANGUAGES.find((l) => l.code === options.language);
        this.speechRecognition.lang = langObj ? langObj.locale : 'en-US';

        this.speechRecognition.onresult = (event: any) => {
          let fullTranscript = '';
          for (let i = 0; i < event.results.length; ++i) {
            const piece = event.results[i][0]?.transcript;
            if (piece) {
              const trimmed = piece.trim();
              if (trimmed) {
                fullTranscript += (fullTranscript.length > 0 ? ' ' : '') + trimmed;
              }
            }
          }
          if (fullTranscript.trim()) {
            options.onInterimTranscript?.(fullTranscript.trim());
          }
        };

        this.speechRecognition.onerror = (e: any) => {
          console.warn('SpeechRecognition interim error:', e);
        };

        this.speechRecognition.start();
      } catch (e) {
        // Fall back gracefully to backend STT
      }
    }
  }

  /**
   * Stops recording and returns captured audio as a base64 string
   */
  public async stopRecording(): Promise<{ audioBase64: string; format: string; blob: Blob }> {
    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (e) {
        // ignore
      }
      this.speechRecognition = null;
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('Recorder is not active.'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
          const format = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('wav') ? 'wav' : 'webm';
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });

          // Cleanup tracks
          if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((track) => track.stop());
            this.mediaStream = null;
          }

          if (this.audioContext && this.audioContext.state !== 'closed') {
            try {
              await this.audioContext.close();
            } catch (e) {
              // ignore
            }
          }

          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Data = reader.result as string;
            resolve({
              audioBase64: base64Data,
              format,
              blob: audioBlob
            });
          };
          reader.onerror = (err) => reject(err);
        } catch (e) {
          reject(e);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Cancel active recording without saving
   */
  public cancelRecording() {
    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (e) {
        // ignore
      }
      this.speechRecognition = null;
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }

    this.audioChunks = [];
  }

  /**
   * Plays speech audio for assistant response.
   * If server audio is provided, plays via HTMLAudioElement.
   * Otherwise falls back gracefully to window.speechSynthesis.
   */
  public async speakText(options: {
    text: string;
    language: string;
    voice?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: Error) => void;
  }): Promise<void> {
    this.stopPlayback();
    this.lastSpokenText = options.text;

    try {
      const ttsResult = await TripPilotAPI.textToSpeech({
        text: options.text,
        language: options.language,
        voice: options.voice || 'alloy'
      });

      if (ttsResult.audioData) {
        this.lastAudioUrl = ttsResult.audioData;
        this.playAudioUrl(ttsResult.audioData, options.onStart, options.onEnd, options.onError);
        return;
      }
    } catch (e) {
      console.warn('Backend TTS call failed, using client speech synthesis fallback:', e);
    }

    // Client-side Web Speech Synthesis fallback with natural tuned voice selection
    this.speakViaWebSpeech(options.text, options.language, options.onStart, options.onEnd, options.onError, options.voice);
  }

  private playAudioUrl(
    url: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: Error) => void
  ) {
    try {
      this.audioElement = new Audio(url);
      this.audioElement.onplay = () => onStart?.();
      this.audioElement.onended = () => {
        this.audioElement = null;
        onEnd?.();
      };
      this.audioElement.onerror = () => {
        const err = new Error('Audio playback failed.');
        onError?.(err);
        this.audioElement = null;
      };

      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.warn('Auto-play was prevented by the browser:', e);
          onError?.(new Error('Audio playback blocked by browser. Click anywhere to enable sound.'));
        });
      }
    } catch (e: any) {
      onError?.(e);
    }
  }

  private speakViaWebSpeech(
    text: string,
    language: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: Error) => void,
    preferredVoice?: string
  ) {
    if (!('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      // Clean text for natural conversational cadence, removing markdown symbols, expanding currencies
      const cleanSpoken = text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/https?:\/\/\S+/gi, '')
        .replace(/₹\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, '$1 rupees')
        .replace(/\$\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, '$1 dollars')
        .replace(/€\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, '$1 euros')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/^\s*[-*•]\s+/gm, ', ')
        .replace(/\s+/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanSpoken);
      const langObj = SUPPORTED_VOICE_LANGUAGES.find((l) => l.code === language);
      utterance.lang = langObj ? langObj.locale : 'en-US';

      // Assign highest fidelity natural / neural voice
      const naturalVoice = this.findBestNaturalVoice(language, preferredVoice);
      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      // Smooth conversational prosody: 0.96 rate and 1.02 pitch
      utterance.rate = 0.96;
      utterance.pitch = 1.02;

      utterance.onstart = () => onStart?.();
      utterance.onend = () => onEnd?.();
      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        onError?.(new Error('Speech synthesis error.'));
      };

      window.speechSynthesis.speak(utterance);
    } catch (e: any) {
      onError?.(e);
    }
  }

  /**
   * Stop any current speech playback immediately (user interruption)
   */
  public stopPlayback() {
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch (e) {
        // ignore
      }
      this.audioElement = null;
    }

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Pause playback
   */
  public pausePlayback() {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
    } else if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  }

  /**
   * Resume playback
   */
  public resumePlayback() {
    if (this.audioElement && this.audioElement.paused) {
      this.audioElement.play().catch(() => {});
    } else if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  /**
   * Replay last assistant response
   */
  public replayLast(options: {
    language: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: Error) => void;
  }) {
    if (this.lastAudioUrl) {
      this.playAudioUrl(this.lastAudioUrl, options.onStart, options.onEnd, options.onError);
    } else if (this.lastSpokenText) {
      this.speakViaWebSpeech(this.lastSpokenText, options.language, options.onStart, options.onEnd, options.onError);
    }
  }
}

export const globalVoiceController = new VoiceControllerClient();
