#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import open from 'open';
import { createServer } from 'http-server';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../..');

console.log('📦 Starting development server for UI modules...');

// Start a simple HTTP server
const server = createServer({
  root: projectRoot,
  cors: true,
  cache: -1
});

// Listen on port 8080
server.listen(8080, '127.0.0.1', () => {
  const url = 'http://localhost:8080/src/dev/minimal.html';
  console.log(`🚀 Development server running at ${url}`);
  
  // Open the browser
  console.log('🌐 Opening browser...');
  open(url);
  
  console.log('⌨️  Press Ctrl+C to stop the server');
});

// Clean up on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping development server...');
  process.exit();
});