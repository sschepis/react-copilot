#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import open from 'open';
import fs from 'fs';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../..');

// Path to the standalone HTML file
const htmlPath = resolve(__dirname, 'standalone.html');

// Check if distribution file exists, if not build it
const distPath = resolve(projectRoot, 'dist/index.js');
if (!fs.existsSync(distPath)) {
  console.log('📦 Building the library first...');
  try {
    // Run synchronously to ensure the build completes before proceeding
    const { execSync } = await import('child_process');
    execSync('npm run build', { stdio: 'inherit', cwd: projectRoot });
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Start a local server (needed for proper module loading)
console.log('🚀 Starting development server...');
const server = spawn('npx', ['http-server', projectRoot, '-p', '8080', '--cors'], {
  stdio: 'pipe',
  shell: true
});

// Buffer to capture server output
let outputBuffer = '';
server.stdout.on('data', (data) => {
  const output = data.toString();
  outputBuffer += output;
  process.stdout.write(output);
  
  // Once the server is running, open the browser
  if (output.includes('Available on') && !process.env.BROWSER_OPENED) {
    process.env.BROWSER_OPENED = 'true';
    const fileUrl = `http://localhost:8080/src/dev/standalone.html`;
    console.log(`Opening browser to ${fileUrl}`);
    open(fileUrl);
  }
});

server.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

// Listen for process termination to clean up
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping development server...');
  server.kill();
  process.exit();
});

console.log('⌨️  Press Ctrl+C to stop the development server');