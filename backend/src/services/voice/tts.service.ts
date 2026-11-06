import OpenAI from 'openai';
import { env } from '../../config/env.js';

export interface SynthesizeSpeechOptions {
  text: string;
  voice?: string; // 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  language?: string; // 'en' | 'hi' | 'kn'
  speed?: number; // 0.25 to 4.0
}

export interface TTSResult {
  audioBuffer?: Buffer;
  audioBase64?: string;
  mimeType: string;
  cleanText: string;
  provider: 'openai' | 'elevenlabs' | 'browser-fallback';
}

export class TTSService {
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
   * Cleans and formats raw AI text for natural conversational speech.
   * Strips markdown symbols, code blocks, JSON, raw coordinates, and formats bullet points.
   */
  public static cleanTextForSpeech(rawText: string): string {
    if (!rawText) return '';

    let text = rawText;

    // 1. Remove code blocks (e.g. ```json ... ```)
    text = text.replace(/```[\s\S]*?```/g, '');

    // 2. Remove inline code
    text = text.replace(/`([^`]+)`/g, '$1');

    // 3. Remove URLs and markdown links [text](url) -> text
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    text = text.replace(/https?:\/\/\S+/gi, '');

    // 4. Remove coordinates like (12.34, 56.78)
    text = text.replace(/\(\s*-?\d+\.\d+,\s*-?\d+\.\d+\s*\)/g, '');

    // 5. Expand currency symbols for natural speech pronunciation
    text = text.replace(/₹\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, '$1 rupees');
    text = text.replace(/\$\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, '$1 dollars');
    text = text.replace(/€\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, '$1 euros');

    // 6. Clean markdown headings, bold, italics, strikethrough
    text = text.replace(/^#{1,6}\s+/gm, '');
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
    text = text.replace(/\*([^*]+)\*/g, '$1');
    text = text.replace(/__([^_]+)__/g, '$1');
    text = text.replace(/_([^_]+)_/g, '$1');
    text = text.replace(/~~([^~]+)~~/g, '$1');

    // 7. Convert bullet points and numbered lists to fluid conversational phrasing
    text = text.replace(/^\s*[-*•]\s+/gm, '. ');
    text = text.replace(/^\s*\d+\.\s+/gm, '. ');

    // 8. Collapse whitespace and repeated punctuation
    text = text.replace(/\s+/g, ' ');
    text = text.replace(/\.{2,}/g, '.');
    text = text.replace(/\s+([.,!?;:])/g, '$1');
    text = text.trim();

    // 9. Cap length for speech to ensure responsiveness (~180 words max for spoken audio)
    const words = text.split(/\s+/);
    if (words.length > 180) {
      text = words.slice(0, 180).join(' ') + '... Check the screen for full details.';
    }

    return text;
  }

  /**
   * Synthesizes speech using available provider or signals client fallback.
   */
  public static async synthesize(options: SynthesizeSpeechOptions): Promise<TTSResult> {
    const cleanText = this.cleanTextForSpeech(options.text);
    if (!cleanText) {
      throw new Error('Text to synthesize is empty after preprocessing.');
    }

    const voice = options.voice || env.TTS_VOICE || 'alloy';
    const speed = Math.max(0.5, Math.min(2.0, options.speed || 1.0));

    // 1. ElevenLabs if configured
    if ((env.TTS_PROVIDER === 'elevenlabs' || (env.TTS_PROVIDER === 'auto' && !env.OPENAI_API_KEY)) && env.ELEVENLABS_API_KEY) {
      try {
        const voiceId = env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel default
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg'
          },
          body: JSON.stringify({
            text: cleanText,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 }
          })
        });

        if (response.ok) {
          const arrayBuf = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuf);
          return {
            audioBuffer: buffer,
            audioBase64: buffer.toString('base64'),
            mimeType: 'audio/mpeg',
            cleanText,
            provider: 'elevenlabs'
          };
        }
      } catch (err) {
        console.warn('[TTSService] ElevenLabs synthesis failed:', err);
      }
    }

    // 2. OpenAI TTS
    const openai = this.getOpenAIClient();
    if (openai) {
      try {
        const response = await openai.audio.speech.create({
          model: 'tts-1',
          voice: voice as any,
          input: cleanText,
          speed
        });

        const arrayBuf = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);

        return {
          audioBuffer: buffer,
          audioBase64: buffer.toString('base64'),
          mimeType: 'audio/mpeg',
          cleanText,
          provider: 'openai'
        };
      } catch (err: any) {
        console.error('[TTSService] OpenAI TTS error:', err?.message || err);
        throw new Error(`TTS synthesis failed: ${err?.message || 'Unknown OpenAI TTS error'}`);
      }
    }

    // 3. Browser-fallback mode when no server TTS key is present
    return {
      mimeType: 'audio/mpeg',
      cleanText,
      provider: 'browser-fallback'
    };
  }
}
