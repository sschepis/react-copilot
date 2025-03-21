#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Import our modules
import { collectProjectInfo } from '../lib/prompt.js';
import { createProject } from '../lib/project.js';
import { TEMPLATES } from '../lib/config.js';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Package version
const packageJSON = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const version = packageJSON.version;

// Configure CLI
program
  .name('create-react-copilot-app')
  .description('Create a new React application with React Copilot pre-configured')
  .version(version)
  .argument('[project-directory]', 'Project directory name')
  .option('-t, --template <template>', 'template to use (default, vite-default)', 'vite-default')
  .option('--provider <provider>', 'default LLM provider (openai, anthropic, deepseek)', 'openai')
  .option('--typescript', 'use TypeScript', false)
  .option('--use-npm', 'use npm instead of yarn', false)
  .option('--no-debug-panel', 'disable debug panel', false)
  .option('--skip-install', 'skip dependency installation', false)
  .action(async (projectDirectory, options) => {
    console.log(chalk.bold('\n🚀 Welcome to create-react-copilot-app! Let\'s create your AI-powered React app.\n'));
    
    try {
      // Show available templates
      console.log(chalk.blue('Available templates:'));
      Object.entries(TEMPLATES).forEach(([key, value]) => {
        console.log(`  ${chalk.green(key)}: ${value}`);
      });
      console.log('');
      
      // Collect project info
      const answers = await collectProjectInfo(projectDirectory, options);
      
      // Create project
      await createProject(answers);
      
      // Success message
      console.log(chalk.green.bold('\n✨ Success! Your React Copilot app has been created.\n'));
      console.log('To get started:');
      console.log(chalk.cyan(`  cd ${answers.projectName}`));
      
      if (answers.packageManager === 'npm') {
        if (answers.template.startsWith('vite')) {
          console.log(chalk.cyan('  npm run dev'));
        } else {
          console.log(chalk.cyan('  npm start'));
        }
      } else {
        if (answers.template.startsWith('vite')) {
          console.log(chalk.cyan('  yarn dev'));
        } else {
          console.log(chalk.cyan('  yarn start'));
        }
      }
      
      console.log('\n📘 Check out the docs at https://github.com/sschepis/react-copilot');
      console.log('\n🌟 Happy coding with your AI assistant!\n');
    } catch (error) {
      console.error(chalk.red('\n❌ Error creating project:'));
      console.error(chalk.red(error.message || error));
      process.exit(1);
    }
  });

program.parse(process.argv);