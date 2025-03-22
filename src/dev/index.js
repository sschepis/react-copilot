#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';
import open from 'open';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create the dist/dev directory if it doesn't exist
const distDevDir = resolve(__dirname, '../../dist/dev');
if (!fs.existsSync(distDevDir)) {
  fs.mkdirSync(distDevDir, { recursive: true });
}

// Copy the index.html file to the dist/dev directory
fs.copyFileSync(
  resolve(__dirname, 'index.html'),
  resolve(distDevDir, 'index.html')
);

console.log('📦 Building and starting development server...');

// Run rollup with the dev config in watch mode
const rollup = spawn('npx', ['rollup', '-c', 'rollup.config.dev.js', '-w'], {
  stdio: 'inherit',
  shell: true
});

// Listen for process termination to clean up
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping development server...');
  rollup.kill();
  process.exit();
});

// Wait a moment for the server to start, then open the browser
setTimeout(() => {
  console.log('🚀 Opening browser at http://localhost:3030');
  open('http://localhost:3030');
}, 3000);

console.log('⌨️  Press Ctrl+C to stop the development server');