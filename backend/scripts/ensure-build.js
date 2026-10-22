import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');
const serverJsPath = path.join(backendDir, 'dist', 'server.js');

if (!fs.existsSync(serverJsPath)) {
  console.log('⚠️  dist/server.js not found. Running build (tsc)...');
  try {
    execSync('npx tsc', { cwd: backendDir, stdio: 'inherit' });
    console.log('✅ Build completed successfully.');
  } catch (err) {
    console.error('❌ Build failed:', err);
    process.exit(1);
  }
} else {
  // dist/server.js exists, ready to run
}
