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
          let interimText = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            interimText += event.results[i][0].transcript;
          }
          if (interimText.trim()) {
            options.onInterimTranscript?.(interimText.trim());
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

    // Client-side Web Speech Synthesis fallback
    this.speakViaWebSpeech(options.text, options.language, options.onStart, options.onEnd, options.onError);
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
    onError?: (err: Error) => void
  ) {
    if (!('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const langObj = SUPPORTED_VOICE_LANGUAGES.find((l) => l.code === language);
      utterance.lang = langObj ? langObj.locale : 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

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
