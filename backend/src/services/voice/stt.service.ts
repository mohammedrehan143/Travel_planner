import OpenAI, { toFile } from 'openai';
import { env } from '../../config/env.js';

export interface TranscribeAudioOptions {
  audioBase64: string;
  format?: string;
  language?: string; // 'en' | 'hi' | 'kn' | string
}

export interface STTResult {
  text: string;
  language: string;
  provider: 'openai' | 'deepgram' | 'mock' | 'fallback';
  durationSeconds?: number;
}

const SUPPORTED_AUDIO_FORMATS: Record<string, string> = {
  webm: 'audio/webm',
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
  mp4: 'audio/mp4',
  m4a: 'audio/m4a',
  ogg: 'audio/ogg',
  opus: 'audio/ogg'
};

export class STTService {
  private static openaiClient: OpenAI | null = null;

  private static getOpenAIClient(): OpenAI | null {
    if (!env.OPENAI_API_KEY) return null;
    if (!this.openaiClient) {
      this.openaiClient = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
        baseURL: env.OPENAI_BASE_URL || undefined
      });
    }
    return this.openaiClient;
  }

  /**
   * Cleans base64 audio string removing data URI scheme prefix if present.
   */
  public static parseAudioBuffer(audioInput: string, defaultFormat = 'webm'): { buffer: Buffer; mimeType: string; format: string } {
    let base64Data = audioInput;
    let format = defaultFormat.toLowerCase().replace(/^\./, '');
    let mimeType = SUPPORTED_AUDIO_FORMATS[format] || 'audio/webm';

    const match = audioInput.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      base64Data = match[2];
      for (const [ext, mime] of Object.entries(SUPPORTED_AUDIO_FORMATS)) {
        if (mimeType.toLowerCase().includes(ext) || mimeType.toLowerCase() === mime) {
          format = ext;
          break;
        }
      }
    }

    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length === 0) {
      throw new Error('Audio payload is empty.');
    }

    // Safety limit: 20MB
    if (buffer.length > 20 * 1024 * 1024) {
      throw new Error('Audio payload exceeds maximum 20MB limit.');
    }

    return { buffer, mimeType, format };
  }

  /**
   * Normalizes language code for STT services.
   * Maps 'en', 'hi', 'kn' or locale codes ('en-US', 'hi-IN', 'kn-IN').
   */
  public static normalizeLanguage(lang?: string): string {
    if (!lang) return 'en';
    const l = lang.toLowerCase().trim();
    if (l.startsWith('hi') || l.startsWith('hin')) return 'hi';
    if (l.startsWith('kn') || l.startsWith('kan')) return 'kn';
    if (l.startsWith('en') || l.startsWith('eng')) return 'en';
    return l.split('-')[0];
  }

  /**
   * Transcribes audio using available provider (OpenAI Whisper, Deepgram, or Fallback).
   */
  public static async transcribe(options: TranscribeAudioOptions): Promise<STTResult> {
    const { buffer, mimeType, format } = this.parseAudioBuffer(options.audioBase64, options.format || 'webm');
    const language = this.normalizeLanguage(options.language);

    // 1. Deepgram transcription if explicitly configured
    if ((env.STT_PROVIDER === 'deepgram' || (env.STT_PROVIDER === 'auto' && !env.OPENAI_API_KEY)) && env.DEEPGRAM_API_KEY) {
      try {
        const queryParams = new URLSearchParams({
          model: 'nova-2',
          smart_format: 'true',
          punctuate: 'true'
        });
        if (language) queryParams.set('language', language);

        const response = await fetch(`https://api.deepgram.com/v1/listen?${queryParams}`, {
          method: 'POST',
          headers: {
            Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
            'Content-Type': mimeType
          },
          body: buffer
        });

        if (response.ok) {
          const dgData: any = await response.json();
          const transcript = dgData?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
          return {
            text: transcript.trim(),
            language,
            provider: 'deepgram',
            durationSeconds: dgData?.metadata?.duration
          };
        }
      } catch (err) {
        console.warn('[STTService] Deepgram transcription attempt failed:', err);
      }
    }

    // 2. OpenAI Whisper transcription
    const openai = this.getOpenAIClient();
    if (openai) {
      try {
        const file = await toFile(buffer, `audio.${format}`, { type: mimeType });
        const transcription = await openai.audio.transcriptions.create({
          file,
          model: 'whisper-1',
          language,
          prompt: 'TripPilot travel planning: itinerary, places, hotels, cafes, budget, Coorg, Manali, Goa, Tokyo, Paris.'
        });

        return {
          text: (transcription.text || '').trim(),
          language,
          provider: 'openai'
        };
      } catch (err: any) {
        console.error('[STTService] OpenAI Whisper transcription failed:', err?.message || err);
        throw new Error(`STT transcription failed: ${err?.message || 'Unknown OpenAI Whisper error'}`);
      }
    }

    // 3. Fallback when no STT server API key is configured
    return {
      text: '',
      language,
      provider: 'fallback'
    };
  }
}
