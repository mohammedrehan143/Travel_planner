import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 TripPilot AI Backend & Agentic Service`);
  console.log(`📡 Server running on http://localhost:${env.PORT}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
  console.log(`🤖 LLM Provider: ${env.OPENAI_API_KEY ? 'Configured (' + env.OPENAI_MODEL + ')' : 'Deterministic Heuristic Fallback'}`);
  console.log(`=======================================================`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
