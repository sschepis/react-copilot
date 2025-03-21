# React Copilot

React Copilot is a powerful library that enables React applications to be controlled and modified by Large Language Models (LLMs) through natural language conversations.

## Overview

React Copilot connects your React application with AI language models like OpenAI's GPT models, Anthropic's Claude, or DeepSeek. It provides a chat interface where users can request UI changes, new features, or application improvements, and see them applied in real-time without losing application state.

## Key Features

- **Dynamic Component Modification**: Update React components on-the-fly
- **Multi-Model Support**: Works with OpenAI, Anthropic Claude, and DeepSeek models
- **Chat Interface**: Intuitive overlay for user interactions
- **Hot Reloading**: Apply changes without losing application state
- **Autonomous Mode**: AI can implement requirements automatically
- **Plugin System**: Extend functionality with specialized plugins
- **Debug Panel**: Interactive tools for component inspection
- **Version Control**: Track and revert component changes

## Installation

```bash
npm install react-copilot
```

or

```bash
yarn add react-copilot
```

## Create React Copilot App

We provide a CLI tool to quickly create a new React project with React Copilot pre-configured:

```bash
npx create-react-copilot-app my-app
```

This sets up a complete React application with React Copilot already integrated. Learn more in the [Create React Copilot App documentation](./docs/create-react-copilot-app.md).

## Quick Example

```jsx
import React from 'react';
import { LLMProvider, ModifiableApp, ChatOverlay } from '@sschepis/react-copilot';

function App() {
  return (
    <LLMProvider
      config={{
        provider: 'openai', // or 'anthropic' or 'deepseek'
        model: 'gpt-4', // or 'claude-3-sonnet-20240229' or 'deepseek-chat'
      }}
    >
      <ModifiableApp>
        <YourExistingApp />
      </ModifiableApp>
      <ChatOverlay position="bottom-right" />
    </LLMProvider>
  );
}
```

## Documentation

For complete documentation, visit the [docs directory](./docs/index.md) or our website.

- [Installation Guide](./docs/installation-guide.md)
- [Getting Started](./docs/getting-started.md)
- [API Reference](./docs/api-reference.md)
- [Examples](./docs/examples.md)
- [Troubleshooting](./docs/troubleshooting.md)

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for more information.

## Publishing

React Copilot and its associated packages are published to npm automatically via GitHub Actions:

- The main `react-copilot` package is published via the [publish-react-copilot.yml](./.github/workflows/publish-react-copilot.yml) workflow
- The `create-react-copilot-app` CLI tool is published via the [publish-create-react-copilot-app.yml](./.github/workflows/publish-create-react-copilot-app.yml) workflow

To trigger a new publication, create a new version tag or GitHub release.

## License

React Copilot is released under the MIT License.
