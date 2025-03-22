#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import open from 'open';
import fs from 'fs';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../..');

// Path to the dockview UI HTML file
const htmlPath = resolve(__dirname, 'dockview-ui.html');

// Use the file:// protocol to open the HTML file directly
const fileUrl = `file://${htmlPath}`;

console.log('📦 Starting DockView UI development environment...');
console.log(`🌐 Opening browser to ${fileUrl}`);

// Open the browser
open(fileUrl);

console.log('✨ DockView UI development environment started');
console.log('📝 Note: You can edit the dockview-ui.html file to customize the interface');