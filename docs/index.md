---
title: React Copilot Documentation
nav_order: 1
permalink: /index
---
# React Copilot Documentation

Welcome to the official documentation for React Copilot, a powerful library that enables React applications to be controlled and modified by Large Language Models (LLMs) through natural language conversations.

## What is React Copilot?

React Copilot is an npm package that connects your React application with AI language models like OpenAI's GPT models, Anthropic's Claude, or DeepSeek. It provides a chat interface where users can request UI changes, new features, or application improvements, and see them applied in real-time without losing application state.

## Key Features

- **Dynamic Component Modification**: Update React components on-the-fly
- **Multi-Model Support**: Works with OpenAI, Anthropic Claude, and DeepSeek models
- **Chat Interface**: Intuitive overlay for user interactions
- **Hot Reloading**: Apply changes without losing application state
- **Autonomous Mode**: AI can implement requirements automatically
- **Plugin System**: Extend functionality with specialized plugins
- **Debug Panel**: Interactive tools for component inspection
- **Version Control**: Track and revert component changes

## Documentation Sections

- [Installation Guide](installation-guide.md)
- [Getting Started](getting-started.md)
- [API Reference](api-reference.md)
- [Architecture](architecture.md)
- [Examples](examples.md)
- [Troubleshooting](troubleshooting.md)
- [Sample Prompts](sample-prompts.md)

### Components

- [Components Overview](components/README.md)
- [LLMProvider](components/llm-provider.md)
- [ModifiableApp](components/modifiable-app.md)

### Hooks

- [Hooks Overview](hooks/README.md)
- [useModifiableComponent](hooks/use-modifiable-component.md)

### Plugins

- [Plugins Overview](plugins/README.md)
- [Documentation Plugin](plugins/documentation-plugin.md)

### Advanced Topics

- [Advanced Topics Overview](advanced/README.md)
- [Security Considerations](advanced/security.md)

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

This sets up a complete React application with React Copilot already integrated. Learn more about [Create React Copilot App](create-react-copilot-app.md).

## Quick Example

```jsx
import React from 'react';
import { LLMProvider, ModifiableApp, ChatOverlay } from 'react-copilot';

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

## License

React Copilot is released under the MIT License.