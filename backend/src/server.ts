import { createApp } from './app.js';
import { env } from './config/env.js';
import { getActiveProvider } from './agent/llm.client.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  const { provider, model } = getActiveProvider();
  console.log(`=======================================================`);
  console.log(`🚀 TripPilot AI Backend & Agentic Service`);
  console.log(`📡 Server running on http://localhost:${env.PORT}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
  console.log(`🤖 Agentic AI Provider: ${provider === 'gemini' ? 'Google Gemini (' + model + ')' : provider === 'openai' ? 'OpenAI (' + model + ')' : 'Deterministic Heuristic Fallback'}`);
  console.log(`=======================================================`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
