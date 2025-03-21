#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import validateProjectName from 'validate-npm-package-name';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Package version
const packageJSON = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const version = packageJSON.version;

// Available LLM providers
const LLM_PROVIDERS = ['openai', 'anthropic', 'deepseek'];

// Available plugins
const PLUGINS = [
  { name: 'Documentation Plugin', value: 'documentation', checked: true },
  { name: 'Analytics Plugin', value: 'analytics', checked: false },
  { name: 'Performance Plugin', value: 'performance', checked: true },
  { name: 'Validation Plugin', value: 'validation', checked: true },
  { name: 'Accessibility Plugin', value: 'accessibility', checked: true },
  { name: 'Internationalization Plugin', value: 'internationalization', checked: false },
  { name: 'Theme Plugin', value: 'theme', checked: true }
];

// Configure CLI
program
  .name('create-react-copilot-app')
  .description('Create a new React application with React Copilot pre-configured')
  .version(version)
  .argument('[project-directory]', 'Project directory name')
  .option('-t, --template <template>', 'template to use', 'default')
  .option('--provider <provider>', 'default LLM provider (openai, anthropic, deepseek)', 'openai')
  .option('--typescript', 'use TypeScript', false)
  .option('--use-npm', 'use npm instead of yarn', false)
  .option('--no-debug-panel', 'disable debug panel', false)
  .option('--skip-install', 'skip dependency installation', false)
  .action(async (projectDirectory, options) => {
    console.log(chalk.bold('\n🚀 Welcome to create-react-copilot-app! Let\'s create your AI-powered React app.\n'));
    
    try {
      // Collect project info if not provided via command line
      const answers = await collectProjectInfo(projectDirectory, options);
      
      // Create project
      await createProject(answers);
      
      // Success message
      console.log(chalk.green.bold('\n✨ Success! Your React Copilot app has been created.\n'));
      console.log('To get started:');
      console.log(chalk.cyan(`  cd ${answers.projectName}`));
      
      if (answers.packageManager === 'npm') {
        console.log(chalk.cyan('  npm start'));
      } else {
        console.log(chalk.cyan('  yarn start'));
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

/**
 * Collect project information through CLI prompts
 */
async function collectProjectInfo(projectDirectory, options) {
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
    template: options.template,
    typescript: options.typescript || answers.typescript,
    provider: options.provider || answers.provider,
    debugPanel: options.debugPanel !== undefined ? options.debugPanel : answers.debugPanel,
    plugins: answers.plugins || [],
    packageManager: options.useNpm ? 'npm' : (answers.packageManager || 'yarn'),
    runInstall: options.skipInstall ? false : (answers.runInstall !== undefined ? answers.runInstall : true)
  };
}

/**
 * Create project based on user preferences
 */
async function createProject(config) {
  const { projectName, template, typescript, provider, debugPanel, plugins, packageManager, runInstall } = config;
  
  // Create project directory
  const spinner = ora('Creating project directory...').start();
  const projectPath = path.resolve(process.cwd(), projectName);
  
  try {
    await fs.ensureDir(projectPath);
    spinner.succeed('Project directory created');
    
    // Copy template files
    spinner.text = 'Copying template files...';
    spinner.start();
    const templatePath = path.join(__dirname, '..', 'templates', template);
    await fs.copy(templatePath, projectPath);
    spinner.succeed('Template files copied');
    
    // Create package.json for the new project
    spinner.text = 'Generating project files...';
    spinner.start();
    await generateProjectFiles(projectPath, config);
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

/**
 * Generate project files
 */
async function generateProjectFiles(projectPath, config) {
  const { projectName, typescript, provider, debugPanel, plugins } = config;
  
  // Generate package.json
  const packageJson = {
    name: projectName,
    version: '0.1.0',
    private: true,
    dependencies: {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "react-scripts": "5.0.1",
      "react-copilot": "^0.1.0",
      "web-vitals": "^2.1.4"
    },
    scripts: {
      "start": "react-scripts start",
      "build": "react-scripts build",
      "test": "react-scripts test",
      "eject": "react-scripts eject"
    },
    eslintConfig: {
      "extends": [
        "react-app",
        "react-app/jest"
      ]
    },
    browserslist: {
      "production": [
        ">0.2%",
        "not dead",
        "not op_mini all"
      ],
      "development": [
        "last 1 chrome version",
        "last 1 firefox version",
        "last 1 safari version"
      ]
    }
  };
  
  // Add TypeScript dependencies if selected
  if (typescript) {
    packageJson.dependencies = {
      ...packageJson.dependencies,
      "@types/node": "^16.18.0",
      "@types/react": "^18.2.0",
      "@types/react-dom": "^18.2.0",
      "typescript": "^5.0.4"
    };
  }
  
  // Write package.json
  await fs.writeFile(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Create .env file for API keys
  const envContent = `# LLM API Keys
${provider === 'openai' ? 'REACT_APP_OPENAI_API_KEY=your_openai_api_key_here' : '# REACT_APP_OPENAI_API_KEY=your_openai_api_key_here'}
${provider === 'anthropic' ? 'REACT_APP_ANTHROPIC_API_KEY=your_anthropic_api_key_here' : '# REACT_APP_ANTHROPIC_API_KEY=your_anthropic_api_key_here'}
${provider === 'deepseek' ? 'REACT_APP_DEEPSEEK_API_KEY=your_deepseek_api_key_here' : '# REACT_APP_DEEPSEEK_API_KEY=your_deepseek_api_key_here'}

# LLM Configuration
REACT_APP_LLM_PROVIDER=${provider}
${provider === 'openai' ? 'REACT_APP_LLM_MODEL=gpt-4' : provider === 'anthropic' ? 'REACT_APP_LLM_MODEL=claude-3-sonnet-20240229' : 'REACT_APP_LLM_MODEL=deepseek-chat'}

# Debug Panel
REACT_APP_DEBUG_PANEL_ENABLED=${debugPanel}

# Plugins
${plugins.includes('documentation') ? 'REACT_APP_ENABLE_DOCUMENTATION=true' : '# REACT_APP_ENABLE_DOCUMENTATION=false'}
${plugins.includes('analytics') ? 'REACT_APP_ENABLE_ANALYTICS=true' : '# REACT_APP_ENABLE_ANALYTICS=false'}
${plugins.includes('performance') ? 'REACT_APP_ENABLE_PERFORMANCE=true' : '# REACT_APP_ENABLE_PERFORMANCE=false'}
${plugins.includes('validation') ? 'REACT_APP_ENABLE_VALIDATION=true' : '# REACT_APP_ENABLE_VALIDATION=false'}
${plugins.includes('accessibility') ? 'REACT_APP_ENABLE_ACCESSIBILITY=true' : '# REACT_APP_ENABLE_ACCESSIBILITY=false'}
${plugins.includes('internationalization') ? 'REACT_APP_ENABLE_INTERNATIONALIZATION=true' : '# REACT_APP_ENABLE_INTERNATIONALIZATION=false'}
${plugins.includes('theme') ? 'REACT_APP_ENABLE_THEME=true' : '# REACT_APP_ENABLE_THEME=false'}
`;

  await fs.writeFile(path.join(projectPath, '.env'), envContent);
  
  // Create gitignore
  const gitignoreContent = `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*
`;

  await fs.writeFile(path.join(projectPath, '.gitignore'), gitignoreContent);
  
  // Create README
  const readmeContent = `# ${projectName}

This project was bootstrapped with [Create React LLM App](https://github.com/sschepis/create-react-llm-app).

## Available Scripts

In the project directory, you can run:

### \`npm start\` or \`yarn start\`

Runs the app in the development mode.\\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\\
You will also see any lint errors in the console.

### \`npm test\` or \`yarn test\`

Launches the test runner in the interactive watch mode.

### \`npm run build\` or \`yarn build\`

Builds the app for production to the \`build\` folder.

## React Copilot Features

This app is configured with React Copilot, which provides:

- 💬 AI Chat Interface for modifying your app through natural language
${debugPanel ? '- 🔍 Debug Panel for component inspection and monitoring' : ''}
${plugins.includes('documentation') ? '- 📚 Documentation Plugin for auto-generating component docs' : ''}
${plugins.includes('analytics') ? '- 📊 Analytics Plugin for tracking component usage' : ''}
${plugins.includes('performance') ? '- ⚡ Performance Plugin for monitoring and optimizing component rendering' : ''}
${plugins.includes('validation') ? '- ✅ Validation Plugin for ensuring code quality' : ''}
${plugins.includes('accessibility') ? '- ♿ Accessibility Plugin for ensuring components meet accessibility standards' : ''}
${plugins.includes('internationalization') ? '- 🌐 Internationalization Plugin for multi-language support' : ''}
${plugins.includes('theme') ? '- 🎨 Theme Plugin for dynamic theming capabilities' : ''}

## Getting Started

1. Add your API keys to the \`.env\` file
2. Start the development server
3. Interact with your AI assistant through the chat interface
4. Make requests to modify your app or add new features

## Learn More

- [React Copilot Documentation](https://github.com/sschepis/react-copilot)
- [React Documentation](https://reactjs.org/)
`;

  await fs.writeFile(path.join(projectPath, 'README.md'), readmeContent);
  
  // Create index files and App component
  const extension = typescript ? 'tsx' : 'jsx';
  
  if (typescript) {
    // Create tsconfig.json
    const tsconfigContent = {
      "compilerOptions": {
        "target": "es5",
        "lib": ["dom", "dom.iterable", "esnext"],
        "allowJs": true,
        "skipLibCheck": true,
        "esModuleInterop": true,
        "allowSyntheticDefaultImports": true,
        "strict": true,
        "forceConsistentCasingInFileNames": true,
        "noFallthroughCasesInSwitch": true,
        "module": "esnext",
        "moduleResolution": "node",
        "resolveJsonModule": true,
        "isolatedModules": true,
        "noEmit": true,
        "jsx": "react-jsx"
      },
      "include": ["src"]
    };
    
    await fs.writeFile(
      path.join(projectPath, 'tsconfig.json'),
      JSON.stringify(tsconfigContent, null, 2)
    );
  }
  
  // Generate the App component content
  const pluginImports = [];
  const pluginInstances = [];
  
  if (plugins.includes('documentation')) {
    pluginImports.push('DocumentationPlugin');
    pluginInstances.push('    new DocumentationPlugin({ generateJsDocs: true, generateReadmes: true })');
  }
  if (plugins.includes('analytics')) {
    pluginImports.push('AnalyticsPlugin');
    pluginInstances.push('    new AnalyticsPlugin({ endpointUrl: "/api/analytics", batchEvents: true })');
  }
  if (plugins.includes('performance')) {
    pluginImports.push('PerformancePlugin');
    pluginInstances.push('    new PerformancePlugin({ injectMonitoring: true, trackRenderPerformance: true })');
  }
  if (plugins.includes('validation')) {
    pluginImports.push('ValidationPlugin');
    pluginInstances.push('    new ValidationPlugin({ strictMode: true })');
  }
  if (plugins.includes('accessibility')) {
    pluginImports.push('AccessibilityPlugin');
    pluginInstances.push('    new AccessibilityPlugin({ checkAria: true, enforceContrast: true })');
  }
  if (plugins.includes('internationalization')) {
    pluginImports.push('InternationalizationPlugin');
    pluginInstances.push('    new InternationalizationPlugin({ defaultLocale: "en", supportedLocales: ["en", "es", "fr"] })');
  }
  if (plugins.includes('theme')) {
    pluginImports.push('ThemePlugin');
    pluginInstances.push('    new ThemePlugin({ defaultTheme: "light", themes: { light: {}, dark: {} } })');
  }
  
  const pluginImportStatement = pluginImports.length > 0 
    ? `import { ${pluginImports.join(', ')} } from 'react-copilot';` 
    : '';
  
  const pluginsConfig = pluginInstances.length > 0 
    ? `\n  plugins={[\n${pluginInstances.join(',\n')}\n  ]}` 
    : '';
  
  const appContent = `import React from 'react';
import { 
  LLMProvider, 
  ModifiableApp, 
  ChatOverlay${debugPanel ? ', DebugPanel' : ''}
} from 'react-copilot';
${pluginImportStatement}
import './App.css';

function App() {
  return (
    <LLMProvider
      config={{
        provider: '${provider}',
        model: '${provider === 'openai' ? 'gpt-4' : provider === 'anthropic' ? 'claude-3-sonnet-20240229' : 'deepseek-chat'}',
      }}${pluginsConfig}
    >
      <ModifiableApp>
        <div className="App">
          <header className="App-header">
            <h1>React Copilot App</h1>
            <p>
              Edit components using the AI chat interface or modify this file directly.
            </p>
            <p className="App-instructions">
              Click the chat icon in the bottom right corner to start interacting with the AI assistant.
            </p>
          </header>
          <Dashboard />
        </div>
      </ModifiableApp>
      <ChatOverlay position="bottom-right" />
      ${debugPanel ? '<DebugPanel position="right" initialVisible={false} />' : ''}
    </LLMProvider>
  );
}

function Dashboard() {
  // Example component that can be modified by the LLM
  const { ref } = useModifiableComponent(
    'Dashboard',
    \`function Dashboard() {
      const { ref } = useModifiableComponent('Dashboard');
      return (
        <div ref={ref} className="Dashboard">
          <h2>Welcome to your React Copilot App</h2>
          <p>This component can be modified by the LLM through the chat interface.</p>
          <div className="Dashboard-cards">
            <Card title="Features" content="Try asking the AI to add new components or modify existing ones." />
            <Card title="Plugins" content="This app includes several plugins that extend its capabilities." />
            <Card title="Examples" content="Try asking: 'Add a dark mode toggle' or 'Create a user profile section'." />
          </div>
        </div>
      );
    }\`
  );

  return (
    <div ref={ref} className="Dashboard">
      <h2>Welcome to your React Copilot App</h2>
      <p>This component can be modified by the LLM through the chat interface.</p>
      <div className="Dashboard-cards">
        <Card title="Features" content="Try asking the AI to add new components or modify existing ones." />
        <Card title="Plugins" content="This app includes several plugins that extend its capabilities." />
        <Card title="Examples" content="Try asking: 'Add a dark mode toggle' or 'Create a user profile section'." />
      </div>
    </div>
  );
}

function Card({ title, content }) {
  // Example component that can be modified by the LLM
  const { ref } = useModifiableComponent(
    'Card',
    \`function Card({ title, content }) {
      const { ref } = useModifiableComponent('Card');
      return (
        <div ref={ref} className="Card">
          <h3>{title}</h3>
          <p>{content}</p>
        </div>
      );
    }\`
  );

  return (
    <div ref={ref} className="Card">
      <h3>{title}</h3>
      <p>{content}</p>
    </div>
  );
}

// Don't forget to import this hook
import { useModifiableComponent } from 'react-copilot';

export default App;
`;

  await fs.writeFile(path.join(projectPath, 'src', `App.${extension}`), appContent);
  
  // Create index file
  const indexContent = `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
`;

  await fs.writeFile(path.join(projectPath, 'src', `index.${extension}`), indexContent);
  
  // Create reportWebVitals.js
  const reportWebVitalsContent = typescript 
    ? `import { ReportHandler } from 'web-vitals';

const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
` 
    : `const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
`;

  await fs.writeFile(
    path.join(projectPath, 'src', typescript ? 'reportWebVitals.ts' : 'reportWebVitals.js'),
    reportWebVitalsContent
  );
  
  // Create CSS files
  const indexCssContent = `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
`;

  await fs.writeFile(path.join(projectPath, 'src', 'index.css'), indexCssContent);
  
  const appCssContent = `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  min-height: 40vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
  padding: 2rem;
}

.App-instructions {
  font-size: 1rem;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.Dashboard {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.Dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

.Card {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.Card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.Card h3 {
  margin-top: 0;
  color: #282c34;
}

@media (max-width: 768px) {
  .Dashboard-cards {
    grid-template-columns: 1fr;
  }
}
`;

  await fs.writeFile(path.join(projectPath, 'src', 'App.css'), appCssContent);
  
  // Create public directory files
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="React app created with create-react-llm-app"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>React Copilot App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
`;

  await fs.writeFile(path.join(projectPath, 'public', 'index.html'), htmlContent);
  
  const manifestContent = `{
  "short_name": "React Copilot App",
  "name": "React App with LLM Integration",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "logo512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
`;

  await fs.writeFile(path.join(projectPath, 'public', 'manifest.json'), manifestContent);
  
  // Create a robots.txt file
  const robotsContent = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Disallow:
`;

  await fs.writeFile(path.join(projectPath, 'public', 'robots.txt'), robotsContent);
}