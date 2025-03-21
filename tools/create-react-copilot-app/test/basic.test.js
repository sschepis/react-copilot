/**
 * Basic tests for create-react-copilot-app CLI
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('create-react-copilot-app', () => {
  it('should have the correct structure', () => {
    // Check package.json exists
    const packageJsonPath = path.join(rootDir, 'package.json');
    assert.ok(fs.existsSync(packageJsonPath), 'package.json should exist');
    
    // Check bin/cli.js exists
    const cliPath = path.join(rootDir, 'bin', 'cli.js');
    assert.ok(fs.existsSync(cliPath), 'bin/cli.js should exist');
    
    // Check package.json has correct bin config
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    assert.ok(packageJson.bin, 'package.json should have bin field');
    assert.ok(packageJson.bin['create-react-copilot-app'], 'bin field should include create-react-copilot-app');
    assert.strictEqual(
      packageJson.bin['create-react-copilot-app'], 
      './bin/cli.js',
      'bin path should be ./bin/cli.js'
    );
    
    // Check templates directory exists
    const templatesDir = path.join(rootDir, 'templates');
    assert.ok(fs.existsSync(templatesDir), 'templates directory should exist');
    assert.ok(fs.statSync(templatesDir).isDirectory(), 'templates should be a directory');
  });
  
  it('should have all required dependencies', () => {
    const packageJsonPath = path.join(rootDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Required dependencies for CLI functionality
    const requiredDeps = [
      'commander',
      'chalk',
      'inquirer',
      'fs-extra',
      'ora'
    ];
    
    requiredDeps.forEach(dep => {
      assert.ok(
        packageJson.dependencies[dep],
        `Package should include ${dep} dependency`
      );
    });
  });
});