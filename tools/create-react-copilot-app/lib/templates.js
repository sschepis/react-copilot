/**
 * Functions for handling different project templates
 */
import fs from 'fs-extra';
import path from 'path';
import { processTemplateDir } from '../utils/template-processor.js';
import { TS_FILE_EXTENSION_MAP } from './config.js';

/**
 * Process Vite template
 */
export async function processViteTemplate(templatePath, projectPath, templateVars, typescript) {
  // Process template directory
  await processTemplateDir(
    templatePath, 
    projectPath, 
    templateVars, 
    {
      fileExtensionMap: TS_FILE_EXTENSION_MAP,
      typescript
    }
  );
  
  // Create additional files or directories that might be needed
  await fs.ensureDir(path.join(projectPath, 'public'));
  
  // Copy default Vite favicon if using Vite template
  const viteSvgPath = path.join(projectPath, 'public', 'vite.svg');
  if (!fs.existsSync(viteSvgPath)) {
    const viteLogoContent = 
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--logos" width="31.88" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 256 257"><defs><linearGradient id="IconifyId1813088fe1fbc01fb466" x1="-.828%" x2="57.636%" y1="7.652%" y2="78.411%"><stop offset="0%" stop-color="#41D1FF"></stop><stop offset="100%" stop-color="#BD34FE"></stop></linearGradient><linearGradient id="IconifyId1813088fe1fbc01fb467" x1="43.376%" x2="50.316%" y1="2.242%" y2="89.03%"><stop offset="0%" stop-color="#FFEA83"></stop><stop offset="8.333%" stop-color="#FFDD35"></stop><stop offset="100%" stop-color="#FFA800"></stop></linearGradient></defs><path fill="url(#IconifyId1813088fe1fbc01fb466)" d="M255.153 37.938L134.897 252.976c-2.483 4.44-8.862 4.466-11.382.048L.875 37.958c-2.746-4.814 1.371-10.646 6.827-9.67l120.385 21.517a6.537 6.537 0 0 0 2.322-.004l117.867-21.483c5.438-.991 9.574 4.796 6.877 9.62Z"></path><path fill="url(#IconifyId1813088fe1fbc01fb467)" d="M185.432.063L96.44 17.501a3.268 3.268 0 0 0-2.634 3.014l-5.474 92.456a3.268 3.268 0 0 0 3.997 3.378l24.777-5.718c2.318-.535 4.413 1.507 3.936 3.838l-7.361 36.047c-.495 2.426 1.782 4.5 4.151 3.78l15.304-4.649c2.372-.72 4.652 1.36 4.15 3.788l-11.698 56.621c-.732 3.542 3.979 5.473 5.943 2.437l1.313-2.028l72.516-144.72c1.215-2.423-.88-5.186-3.54-4.672l-25.505 4.922c-2.396.462-4.435-1.77-3.759-4.114l16.646-57.705c.677-2.35-1.37-4.583-3.769-4.113Z"></path></svg>';
    
    await fs.writeFile(viteSvgPath, viteLogoContent);
  }
}

/**
 * Process Create React App (CRA) template for backward compatibility
 * This is an older approach that uses manual file generation rather than templates
 */
export async function processCRATemplate(templatePath, projectPath, templateVars, typescript) {
  // For backward compatibility, copy template files first
  await fs.copy(templatePath, projectPath);
  
  // Generate all files using the CRA approach
  await generateCRAFiles(projectPath, templateVars, typescript);
}

/**
 * Generate files for CRA template - older method for backward compatibility
 */
async function generateCRAFiles(projectPath, templateVars, typescript) {
  const { 
    projectName, provider, debugPanel, plugins, pluginImportStatement,
    debugPanelImport, debugPanelComponent, pluginsConfig, model,
    openaiEnv, anthropicEnv, deepseekEnv,
    docPluginEnv, analyticsPluginEnv, performancePluginEnv,
    validationPluginEnv, accessibilityPluginEnv, intlPluginEnv, themePluginEnv
  } = templateVars;
  
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
${provider === 'openai' ? `REACT_APP_OPENAI_API_KEY=${templateVars.apiKey}` : '# REACT_APP_OPENAI_API_KEY=your_openai_api_key_here'}
${provider === 'anthropic' ? `REACT_APP_ANTHROPIC_API_KEY=${templateVars.apiKey}` : '# REACT_APP_ANTHROPIC_API_KEY=your_anthropic_api_key_here'}
${provider === 'deepseek' ? `REACT_APP_DEEPSEEK_API_KEY=${templateVars.apiKey}` : '# REACT_APP_DEEPSEEK_API_KEY=your_deepseek_api_key_here'}

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
  
  // Create more CRA files - gitignore, readme, etc.
  await createCRAGitignore(projectPath);
  await createCRAReadme(projectPath, { projectName, debugPanel, plugins });
  await createCRASourceFiles(projectPath, templateVars);
  await createCRAPublicFiles(projectPath);
}

/**
 * Create .gitignore file for CRA template
 */
async function createCRAGitignore(projectPath) {
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
}

/**
 * Create README for CRA template
 */
async function createCRAReadme(projectPath, { projectName, debugPanel, plugins }) {
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
}

/**
 * Create source files for CRA template
 */
async function createCRASourceFiles(projectPath, templateVars) {
  const { typescript, provider, debugPanelImport, debugPanelComponent, pluginImportStatement, pluginsConfig, model } = templateVars;
  
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
  const appContent = `import React from 'react';
import { 
  LLMProvider, 
  ModifiableApp, 
  ChatOverlay${debugPanelImport}
} from '@sschepis/react-copilot';
${pluginImportStatement}
import './App.css';

function App() {
  return (
    <LLMProvider
      config={{
        provider: '${provider}',
        model: '${model}',
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
      ${debugPanelComponent}
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
import { useModifiableComponent } from '@sschepis/react-copilot';

export default App;
`;

  await fs.ensureDir(path.join(projectPath, 'src'));
  await fs.writeFile(path.join(projectPath, 'src', `App.${extension}`), appContent);
  
  // Create additional source files (index, reportWebVitals, CSS)
  await createCRAIndexFile(projectPath, extension);
  await createCRAReportWebVitals(projectPath, typescript);
  await createCRACssFiles(projectPath);
}

/**
 * Create index file for CRA template
 */
async function createCRAIndexFile(projectPath, extension) {
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
}

/**
 * Create reportWebVitals file for CRA template
 */
async function createCRAReportWebVitals(projectPath, typescript) {
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
}

/**
 * Create CSS files for CRA template
 */
async function createCRACssFiles(projectPath) {
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
}

/**
 * Create public files for CRA template
 */
async function createCRAPublicFiles(projectPath) {
  await fs.ensureDir(path.join(projectPath, 'public'));
  
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
  
  const robotsContent = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Disallow:
`;

  await fs.writeFile(path.join(projectPath, 'public', 'robots.txt'), robotsContent);
}