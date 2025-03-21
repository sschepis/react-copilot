/**
 * Functions related to prompting the user and collecting project information
 */
import fs from 'fs-extra';
import inquirer from 'inquirer';
import validateProjectName from 'validate-npm-package-name';
import { LLM_PROVIDERS, PLUGINS, TEMPLATES } from './config.js';

/**
 * Collect project information through CLI prompts
 */
export async function collectProjectInfo(projectDirectory, options) {
  const questions = [];
  
  // Project name
  if (!projectDirectory) {
    questions.push({
      type: 'input',
      name: 'projectName',
      message: 'What is the name of your project?',
      default: 'my-react-copilot-app',
      validate: input => {
        const validation = validateProjectName(input);
        if (!validation.validForNewPackages) {
          return `Invalid project name: ${validation.errors?.[0] || 'Unknown error'}`;
        }
        
        // Check if directory exists
        if (fs.existsSync(input)) {
          return `Directory ${input} already exists. Please choose a different name.`;
        }
        return true;
      }
    });
  }
  
  // Template selection
  if (!options.template || !Object.keys(TEMPLATES).includes(options.template)) {
    questions.push({
      type: 'list',
      name: 'template',
      message: 'Which template would you like to use?',
      choices: Object.entries(TEMPLATES).map(([value, name]) => ({ 
        name: `${name} (${value})`, 
        value 
      })),
      default: 'vite-default'
    });
  }
  
  // TypeScript support
  if (!options.typescript) {
    questions.push({
      type: 'confirm',
      name: 'typescript',
      message: 'Would you like to use TypeScript?',
      default: true
    });
  }
  
  // LLM Provider
  if (!options.provider || !LLM_PROVIDERS.includes(options.provider)) {
    questions.push({
      type: 'list',
      name: 'provider',
      message: 'Which LLM provider would you like to use?',
      choices: LLM_PROVIDERS,
      default: 'openai'
    });
  }
  
  // API Key for the selected provider
  const providerToUse = options.provider || 'openai';
  questions.push({
    type: 'password',
    name: 'apiKey',
    message: `Please enter your ${providerToUse.toUpperCase()} API key:`,
    mask: '*',
    validate: input => {
      if (!input || input.trim() === '') {
        return `API key is required. You can enter a placeholder and update it later if you don't have it now.`;
      }
      return true;
    }
  });
  
  // Debug Panel
  if (options.debugPanel === undefined) {
    questions.push({
      type: 'confirm',
      name: 'debugPanel',
      message: 'Would you like to include the Debug Panel?',
      default: true
    });
  }
  
  // Plugins
  questions.push({
    type: 'checkbox',
    name: 'plugins',
    message: 'Select which plugins you would like to include:',
    choices: PLUGINS
  });
  
  // Package manager
  if (!options.useNpm) {
    questions.push({
      type: 'list',
      name: 'packageManager',
      message: 'Which package manager would you like to use?',
      choices: [
        { name: 'npm', value: 'npm' },
        { name: 'yarn', value: 'yarn' }
      ],
      default: 'yarn'
    });
  }
  
  // Run installation
  if (!options.skipInstall) {
    questions.push({
      type: 'confirm',
      name: 'runInstall',
      message: 'Would you like to install dependencies now?',
      default: true
    });
  }
  
  // Collect answers
  const answers = await inquirer.prompt(questions);
  
  // Merge command line options with answers
  return {
    projectName: projectDirectory || answers.projectName,
    template: options.template || answers.template,
    typescript: options.typescript || answers.typescript,
    provider: options.provider || answers.provider,
    apiKey: answers.apiKey,
    debugPanel: options.debugPanel !== undefined ? options.debugPanel : answers.debugPanel,
    plugins: answers.plugins || [],
    packageManager: options.useNpm ? 'npm' : (answers.packageManager || 'yarn'),
    runInstall: options.skipInstall ? false : (answers.runInstall !== undefined ? answers.runInstall : true)
  };
}