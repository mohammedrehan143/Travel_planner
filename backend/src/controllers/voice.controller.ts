import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { STTService } from '../services/voice/stt.service.js';
import { TTSService } from '../services/voice/tts.service.js';
import { env } from '../config/env.js';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', locale: 'en-US' },
  { code: 'hi', name: 'हिन्दी (Hindi)', locale: 'hi-IN' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', locale: 'kn-IN' }
];

export const AVAILABLE_VOICES = [
  { id: 'nova', name: 'Nova (Smooth & Warm)', gender: 'female' },
  { id: 'shimmer', name: 'Shimmer (Soft & Gentle)', gender: 'female' },
  { id: 'fable', name: 'Fable (British/Melodic)', gender: 'neutral' },
  { id: 'alloy', name: 'Alloy (Balanced)', gender: 'neutral' },
  { id: 'echo', name: 'Echo (Warm)', gender: 'male' },
  { id: 'onyx', name: 'Onyx (Deep/Authoritative)', gender: 'male' }
];

export class VoiceController {
  /**
   * POST /api/voice/stt
   * Transcribe user audio to text
   */
  static async transcribe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { audio, format, language } = req.body as {
        audio: string;
        format?: string;
        language?: string;
      };

      if (!audio || typeof audio !== 'string') {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Audio payload (base64 string or data URI) is required.'
        });
        return;
      }

      const result = await STTService.transcribe({
        audioBase64: audio,
        format: format || 'webm',
        language: language || 'en'
      });

      res.status(200).json({
        status: 'success',
        text: result.text,
        language: result.language,
        provider: result.provider,
        durationSeconds: result.durationSeconds
      });
    } catch (err: any) {
      console.error('[VoiceController.transcribe] Error:', err?.message || err);
      res.status(500).json({
        error: 'STT Failed',
        message: err?.message || 'Failed to transcribe audio.'
      });
    }
  }

  /**
   * POST /api/voice/tts
   * Synthesize text to speech
   */
  static async synthesize(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { text, voice, language, speed, stream } = req.body as {
        text: string;
        voice?: string;
        language?: string;
        speed?: number;
        stream?: boolean;
      };

      if (!text || typeof text !== 'string') {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Text string is required for speech synthesis.'
        });
        return;
      }

      const result = await TTSService.synthesize({
        text,
        voice,
        language,
        speed
      });

      // Stream binary audio directly if requested and buffer is present
      const wantsBinary = stream === true || req.headers.accept?.includes('audio/');
      if (wantsBinary && result.audioBuffer) {
        res.setHeader('Content-Type', result.mimeType);
        res.setHeader('Content-Length', result.audioBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.status(200).send(result.audioBuffer);
        return;
      }

      // Return JSON payload with audio data or browser fallback
      res.status(200).json({
        status: 'success',
        audioData: result.audioBase64 ? `data:${result.mimeType};base64,${result.audioBase64}` : null,
        cleanText: result.cleanText,
        mimeType: result.mimeType,
        provider: result.provider
      });
    } catch (err: any) {
      console.error('[VoiceController.synthesize] Error:', err?.message || err);
      res.status(500).json({
        error: 'TTS Failed',
        message: err?.message || 'Failed to synthesize speech.'
      });
    }
  }

  /**
   * GET /api/voice/config
   * Return supported languages, voices, and active provider info
   */
  static async getConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    const hasOpenAI = Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 0);
    const hasDeepgram = Boolean(env.DEEPGRAM_API_KEY && env.DEEPGRAM_API_KEY.trim().length > 0);
    const hasElevenLabs = Boolean(env.ELEVENLABS_API_KEY && env.ELEVENLABS_API_KEY.trim().length > 0);

    const sttActive = env.STT_PROVIDER === 'deepgram' && hasDeepgram
      ? 'deepgram'
      : (hasOpenAI ? 'openai' : (hasDeepgram ? 'deepgram' : 'browser-speech-recognition'));

    const ttsActive = env.TTS_PROVIDER === 'elevenlabs' && hasElevenLabs
      ? 'elevenlabs'
      : (hasOpenAI ? 'openai' : (hasElevenLabs ? 'elevenlabs' : 'browser-speech-synthesis'));

    res.status(200).json({
      status: 'success',
      supportedLanguages: SUPPORTED_LANGUAGES,
      availableVoices: AVAILABLE_VOICES,
      defaultVoice: env.TTS_VOICE || 'shimmer',
      sttProvider: sttActive,
      ttsProvider: ttsActive,
      serverSTTAvailable: hasOpenAI || hasDeepgram,
      serverTTSAvailable: hasOpenAI || hasElevenLabs
    });
  }
}
