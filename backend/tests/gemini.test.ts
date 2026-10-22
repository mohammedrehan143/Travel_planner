import { describe, it, expect } from 'vitest';
import { getActiveProvider, isLLMConfigured } from '../src/agent/llm.client.js';

describe('Google Gemini Agentic AI Configuration Suite', () => {
  it('detects active provider correctly', () => {
    const config = getActiveProvider();
    expect(config).toBeDefined();
    expect(config).toHaveProperty('provider');
    expect(config).toHaveProperty('model');
  });

  it('reports provider readiness without crashing when API key is unset', () => {
    const configured = isLLMConfigured();
    expect(typeof configured).toBe('boolean');
  });
});
