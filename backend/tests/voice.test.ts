import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { STTService } from '../src/services/voice/stt.service.js';
import { TTSService } from '../src/services/voice/tts.service.js';

describe('Voice Assistant (STT & TTS) Module Suite', () => {
  const app = createApp();

  describe('STTService audio parsing & language normalization', () => {
    it('parses raw base64 audio and detects format', () => {
      const sampleBase64 = Buffer.from('fake-audio-bytes').toString('base64');
      const parsed = STTService.parseAudioBuffer(sampleBase64, 'webm');
      expect(parsed.buffer.toString()).toBe('fake-audio-bytes');
      expect(parsed.mimeType).toBe('audio/webm');
      expect(parsed.format).toBe('webm');
    });

    it('parses base64 data URI headers correctly', () => {
      const sampleBase64 = 'data:audio/wav;base64,' + Buffer.from('riff-wave-data').toString('base64');
      const parsed = STTService.parseAudioBuffer(sampleBase64);
      expect(parsed.buffer.toString()).toBe('riff-wave-data');
      expect(parsed.mimeType).toBe('audio/wav');
      expect(parsed.format).toBe('wav');
    });

    it('rejects empty audio payloads', () => {
      expect(() => STTService.parseAudioBuffer('')).toThrow('Audio payload is empty.');
    });

    it('normalizes supported languages (en, hi, kn)', () => {
      expect(STTService.normalizeLanguage('en-US')).toBe('en');
      expect(STTService.normalizeLanguage('hi-IN')).toBe('hi');
      expect(STTService.normalizeLanguage('kn-IN')).toBe('kn');
      expect(STTService.normalizeLanguage('KANNADA')).toBe('kn');
      expect(STTService.normalizeLanguage('HINDI')).toBe('hi');
      expect(STTService.normalizeLanguage(undefined)).toBe('en');
    });
  });

  describe('TTSService text preprocessing for speech', () => {
    it('cleans markdown symbols, bold tags, and headings', () => {
      const input = '### Day 1 in **Coorg**\nExplore *Abbey Falls* and enjoy local coffee!';
      const cleaned = TTSService.cleanTextForSpeech(input);
      expect(cleaned).not.toContain('###');
      expect(cleaned).not.toContain('**');
      expect(cleaned).not.toContain('*');
      expect(cleaned).toContain('Day 1 in Coorg');
      expect(cleaned).toContain('Abbey Falls');
    });

    it('expands currency symbols for natural speech', () => {
      const input = 'Total estimated budget is ₹10,000 for 2 travelers and $50 for extras.';
      const cleaned = TTSService.cleanTextForSpeech(input);
      expect(cleaned).toContain('10,000 rupees');
      expect(cleaned).toContain('50 dollars');
      expect(cleaned).not.toContain('₹');
      expect(cleaned).not.toContain('$');
    });

    it('strips coordinates and links', () => {
      const input = 'Visit [Raja Seat](https://maps.google.com/?q=RajaSeat) located at (12.4231, 75.7382).';
      const cleaned = TTSService.cleanTextForSpeech(input);
      expect(cleaned).toContain('Visit Raja Seat located at');
      expect(cleaned).not.toContain('https://');
      expect(cleaned).not.toContain('(12.4231, 75.7382)');
    });

    it('converts bullet points into smooth spoken transitions', () => {
      const input = 'Here are recommendations:\n- Visit Abbey Falls\n- Tour Coffee Plantation\n- Watch sunset at Raja Seat';
      const cleaned = TTSService.cleanTextForSpeech(input);
      expect(cleaned).not.toContain('\n-');
      expect(cleaned).toContain('Visit Abbey Falls');
      expect(cleaned).toContain('Tour Coffee Plantation');
    });

    it('strips emojis and pictographs so synthesizers do not speak emoji names', () => {
      const input = 'All the best for the trip! Have a wonderful and safe journey, goodbye for now! 👋✈️✨🎉';
      const cleaned = TTSService.cleanTextForSpeech(input);
      expect(cleaned).toBe('All the best for the trip! Have a wonderful and safe journey, goodbye for now!');
      expect(cleaned).not.toContain('👋');
      expect(cleaned).not.toContain('✈️');
      expect(cleaned).not.toContain('✨');
      expect(cleaned).not.toContain('🎉');
    });
  });

  describe('Voice REST API Endpoints', () => {
    it('GET /api/voice/config returns supported languages, voices, and active provider info', async () => {
      const res = await request(app)
        .get('/api/voice/config')
        .set('x-user-id', '00000000-0000-0000-0000-000000000001');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.supportedLanguages).toBeDefined();
      expect(res.body.supportedLanguages.map((l: any) => l.code)).toEqual(
        expect.arrayContaining(['en', 'hi', 'kn'])
      );
      expect(res.body.availableVoices.length).toBeGreaterThan(0);
      expect(res.body.sttProvider).toBeDefined();
      expect(res.body.ttsProvider).toBeDefined();
    });

    it('POST /api/voice/stt rejects empty audio payload with 400', async () => {
      const res = await request(app)
        .post('/api/voice/stt')
        .set('x-user-id', '00000000-0000-0000-0000-000000000001')
        .send({ audio: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });

    it('POST /api/voice/stt accepts valid base64 audio and returns transcription structure', async () => {
      const fakeAudio = 'data:audio/webm;base64,' + Buffer.from('dummy-audio-bytes').toString('base64');
      const res = await request(app)
        .post('/api/voice/stt')
        .set('x-user-id', '00000000-0000-0000-0000-000000000001')
        .send({
          audio: fakeAudio,
          language: 'hi'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.language).toBe('hi');
      expect(res.body.provider).toBeDefined();
    });

    it('POST /api/voice/tts rejects empty text with 400', async () => {
      const res = await request(app)
        .post('/api/voice/tts')
        .set('x-user-id', '00000000-0000-0000-0000-000000000001')
        .send({ text: '' });

      expect(res.status).toBe(400);
    });

    it('POST /api/voice/tts sanitizes speech text and responds with audio structure', async () => {
      const res = await request(app)
        .post('/api/voice/tts')
        .set('x-user-id', '00000000-0000-0000-0000-000000000001')
        .send({
          text: '### Welcome to **Coorg**! Total budget is ₹10,000.',
          voice: 'alloy',
          language: 'en'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.cleanText).toContain('Welcome to Coorg');
      expect(res.body.cleanText).toContain('10,000 rupees');
      expect(res.body.provider).toBeDefined();
    });

    it('POST /api/agent/chat responds instantly to simple courtesies (hello, hi, how are you)', async () => {
      const resHello = await request(app)
        .post('/api/agent/chat')
        .set('x-user-id', '00000000-0000-0000-0000-000000000001')
        .send({ message: 'hello' });

      expect(resHello.status).toBe(200);
      expect(resHello.body.status).toBe('success');
      expect(resHello.body.action).toBe('chat');
      expect(resHello.body.message).toMatch(/hello|pilot|travel/i);

      const resHi = await request(app)
        .post('/api/agent/chat')
        .set('x-user-id', '00000000-0000-0000-0000-000000000001')
        .send({ message: 'hi!' });

      expect(resHi.status).toBe(200);
      expect(resHi.body.status).toBe('success');
      expect(resHi.body.message).toMatch(/hello|pilot|travel/i);

      const resHearing = await request(app)
        .post('/api/agent/chat')
        .set('x-user-id', '00000000-0000-0000-0000-000000000001')
        .send({ message: 'can you hear me?' });

      expect(resHearing.status).toBe(200);
      expect(resHearing.body.message).toMatch(/hear you/i);
    });

    it('POST /api/agent/chat responds warmly to farewell and bye messages', async () => {
      const res = await request(app)
        .post('/api/agent/chat')
        .set('x-user-id', '00000000-0000-0000-0000-000000000001')
        .send({
          message: 'Thank you Pilot, bye bye!',
          context: {}
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.action).toBe('chat');
      expect(res.body.message).toMatch(/goodbye|safe travels|journey/i);
    });

    it('POST /api/agent/chat includes farewell/bye signoff when booking/planning a trip', async () => {
      const res = await request(app)
        .post('/api/agent/chat')
        .set('x-user-id', '00000000-0000-0000-0000-000000000001')
        .send({
          message: 'Plan a 2-day trip to Coorg',
          context: { currency: 'INR' }
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.action).toBe('plan_new_trip');
      expect(res.body.createdTrip).toBeDefined();
      expect(res.body.message).toMatch(/all the best for the trip/i);
      expect(res.body.message).toMatch(/goodbye|wonderful and safe trip|safe journey/i);
    });
  });
});
