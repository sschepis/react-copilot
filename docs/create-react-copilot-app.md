---
title: Create React LLM App
nav_order: 8
permalink: /create-react-copilot-app
---
# Create React LLM App

React Copilot includes a CLI tool called `create-react-llm-app` that helps you quickly set up a new React project with React Copilot pre-configured. This is similar to Create React App but with built-in AI capabilities.

## Installation

You can use npx to run the tool without installing it:

```bash
npx create-react-llm-app my-app
```

Or install it globally:

```bash
npm install -g create-react-llm-app
create-react-llm-app my-app
```

## Usage

### Basic Usage

```bash
npx create-react-llm-app my-app
```

This will create a new directory called `my-app` with a React project that has React Copilot pre-configured.

### Interactive Mode

If you run the command without specifying a project directory, it will prompt you for configuration options:

```bash
npx create-react-llm-app
```

The interactive CLI will ask you about:

- Project name
- TypeScript support
- LLM provider preference
- Debug Panel inclusion
- Plugins to include
- Package manager preference
- Whether to install dependencies immediately

### Command Line Options

```
Usage: create-react-llm-app [options] [project-directory]

Create a new React application with React Copilot pre-configured

Options:
  -V, --version               output the version number
  -t, --template <template>   template to use (default: "default")
  --provider <provider>       default LLM provider (openai, anthropic, deepseek) (default: "openai")
  --typescript                use TypeScript (default: false)
  --use-npm                   use npm instead of yarn (default: false)
  --no-debug-panel            disable debug panel
  --skip-install              skip dependency installation
  -h, --help                  display help for command
```

## Generated Project Structure

The tool generates a project with the following structure:

```
my-app/
├── node_modules/
├── public/
│   ├── favicon.ico
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── App.css
│   ├── App.js (or App.tsx)
│   ├── index.css
│   ├── index.js (or index.tsx)
│   └── reportWebVitals.js (or reportWebVitals.ts)
├── .env
├── .gitignore
├── package.json
├── README.md
└── tsconfig.json (if using TypeScript)
```

## Key Features of the Generated Project

### 1. Pre-configured LLM Provider

The project is set up with your chosen LLM provider (OpenAI, Anthropic, or DeepSeek) in the `.env` file:

```env
# LLM API Keys
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here

# LLM Configuration
REACT_APP_LLM_PROVIDER=openai
REACT_APP_LLM_MODEL=gpt-4
```

### 2. React Copilot Components

The App.js file includes the core React Copilot components:

```jsx
<LLMProvider
  config={{
    provider: 'openai',
    model: 'gpt-4',
  }}
>
  <ModifiableApp>
    <div className="App">
      {/* Your app content */}
    </div>
  </ModifiableApp>
  <ChatOverlay position="bottom-right" />
  <DebugPanel position="right" initialVisible={false} />
</LLMProvider>
```

### 3. Example Modifiable Components

The generated project includes example components that are already registered as modifiable:

```jsx
function Dashboard() {
  const { ref } = useModifiableComponent(
    'Dashboard',
    `function Dashboard() {
      // Source code that the LLM can understand and modify
      const { ref } = useModifiableComponent('Dashboard');
      return (
        <div ref={ref} className="Dashboard">
          <h2>Welcome to your React Copilot App</h2>
          <p>This component can be modified by the LLM through the chat interface.</p>
        </div>
      );
    }`
  );

  return (
    <div ref={ref} className="Dashboard">
      <h2>Welcome to your React Copilot App</h2>
      <p>This component can be modified by the LLM through the chat interface.</p>
    </div>
  );
}
```

### 4. Selected Plugins

The project includes any plugins you selected during setup:

```jsx
<LLMProvider
  config={{...}}
  plugins={[
    new DocumentationPlugin({ generateJsDocs: true, generateReadmes: true }),
    new PerformancePlugin({ injectMonitoring: true, trackRenderPerformance: true }),
    new ValidationPlugin({ strictMode: true }),
    // Additional selected plugins
  ]}
>
```

## Next Steps After Creation

1. Add your API keys to the `.env` file
2. Run `npm start` or `yarn start` to start the development server
3. Interact with your AI assistant through the chat interface in the bottom right
4. Make requests to modify your app or add new features

## Available Scripts

In the generated project directory, you can run:

- `npm start` or `yarn start`: Runs the app in development mode
- `npm test` or `yarn test`: Launches the test runner
- `npm run build` or `yarn build`: Builds the app for production

## Source Code

The source code for the `create-react-llm-app` tool is available in the React Copilot repository under the `/tools/create-react-llm-app` directory.