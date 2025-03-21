/**
 * Functions for creating and setting up a new project
 */
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { prepareTemplateVariables } from './templateVars.js';
import { processViteTemplate, processCRATemplate } from './templates.js';

/**
 * Create project based on user preferences
 */
export async function createProject(config) {
  const { projectName, template, typescript, provider, debugPanel, plugins, packageManager, runInstall } = config;
  
  // Create project directory
  const spinner = ora('Creating project directory...').start();
  const projectPath = path.resolve(process.cwd(), projectName);
  
  try {
    await fs.ensureDir(projectPath);
    spinner.succeed('Project directory created');
    
    // Process template files
    spinner.text = 'Processing template files...';
    spinner.start();
    
    // Prepare template variables
    const templateVars = await prepareTemplateVariables(config);
    
    // Set up template processor options based on the selected template
    const templatePath = path.join(path.dirname(path.dirname(__dirname)), 'templates', template);
    
    if (template.startsWith('vite')) {
      // Process Vite template
      await processViteTemplate(templatePath, projectPath, templateVars, typescript);
    } else {
      // Process CRA template for backward compatibility
      await processCRATemplate(templatePath, projectPath, templateVars, typescript);
    }
    
    spinner.succeed('Project files generated');
    
    // Install dependencies
    if (runInstall) {
      spinner.text = `Installing dependencies with ${packageManager}...`;
      spinner.start();
      
      try {
        const packageManagerCmd = packageManager === 'npm' ? 'npm install' : 'yarn';
        execSync(packageManagerCmd, { cwd: projectPath, stdio: 'ignore' });
        spinner.succeed('Dependencies installed');
      } catch (error) {
        spinner.fail('Failed to install dependencies');
        console.log(chalk.yellow('\n⚠️ You can install dependencies later by running:'));
        console.log(chalk.cyan(`  cd ${projectName}`));
        console.log(chalk.cyan(`  ${packageManager} ${packageManager === 'npm' ? 'install' : ''}`));
      }
    } else {
      console.log(chalk.yellow('\n⚠️ Remember to install dependencies:'));
      console.log(chalk.cyan(`  cd ${projectName}`));
      console.log(chalk.cyan(`  ${packageManager} ${packageManager === 'npm' ? 'install' : ''}`));
    }
  } catch (error) {
    spinner.fail(`Failed: ${error.message}`);
    throw error;
  }
}