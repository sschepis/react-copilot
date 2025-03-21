# Create React Copilot App

A CLI tool to quickly set up a new React project with [React Copilot](https://github.com/yourusername/react-copilot) pre-configured, similar to Create React App but with additional AI capabilities.

## Overview

Create React Copilot App helps you quickly set up a new React project with React Copilot integration, allowing you to build applications that can be modified through natural language conversations with AI models.

## Features

- 🚀 Quick project setup with React and React Copilot
- 🧠 Support for multiple LLM providers (OpenAI, Anthropic, DeepSeek)
- 🔌 Configurable plugins (Documentation, Analytics, Performance, etc.)
- 🛠️ TypeScript support
- 🔍 Optional Debug Panel for component inspection
- 📦 Choice of package managers (npm or yarn)

## Usage

You can use npx to run the tool without installing it:

```bash
npx create-react-copilot-app my-app
```

Or install it globally:

```bash
npm install -g create-react-copilot-app
create-react-copilot-app my-app
```

### Options

```
Usage: create-react-copilot-app [options] [project-directory]

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

### Interactive Mode

If you run the command without any options, it will prompt you for configuration:

```bash
npx create-react-copilot-app
```

The interactive CLI will ask you about:

- Project name
- TypeScript support
- LLM provider preference
- Debug Panel inclusion
- Plugins to include
- Package manager preference
- Whether to install dependencies

## Project Structure

The generated project will have the following structure:

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

## LLM Configuration

The generated project includes a pre-configured `.env` file with placeholders for your API keys. You'll need to add your own API keys before using the LLM features.

## Available Scripts

In the generated project directory, you can run:

- `npm start` or `yarn start`: Runs the app in development mode
- `npm test` or `yarn test`: Launches the test runner
- `npm run build` or `yarn build`: Builds the app for production

## Requirements

- Node.js 14.16.0 or later
- npm 5.2+ or yarn 1.12+

## License

MIT