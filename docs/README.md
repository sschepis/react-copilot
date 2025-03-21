# React Copilot Documentation

Welcome to the comprehensive documentation for React Copilot, a powerful library that enables React applications to be controlled and modified by Large Language Models (LLMs) through natural language conversations.

## Table of Contents

- [Overview](#overview)
- [Installation](installation-guide.md)
- [Getting Started](getting-started.md)
- [API Reference](#api-reference)
- [Examples](examples.md)
- [Advanced Usage](advanced/README.md)
- [Troubleshooting](troubleshooting.md)
- [Sample Prompts](sample-prompts.md)

## Overview

React Copilot is an npm package that connects React applications with AI language models like OpenAI's GPT-4, Anthropic's Claude, and DeepSeek's models. It provides a chat interface that enables users to request UI changes, new features, or application improvements through natural language, and see them applied in real-time.

### Key Features

- **Dynamic Component Modification**: Update React components on-the-fly
- **Multi-Model Support**: Works with OpenAI, Anthropic Claude, and DeepSeek models
- **Chat Interface**: Intuitive overlay for user interactions
- **Hot Reloading**: Apply changes without losing application state
- **Autonomous Mode**: AI can implement requirements automatically
- **Plugin System**: Extend functionality with specialized plugins
- **Debug Panel**: Interactive tools for component inspection
- **Version Control**: Track and revert component changes

## API Reference

- [Components](components/README.md)
  - [LLMProvider](components/llm-provider.md)
  - [ModifiableApp](components/modifiable-app.md)
  - [ChatOverlay](components/chat-overlay.md)
  - [AutonomousAgent](components/autonomous-agent.md)
  - [DebugPanel](components/debug-panel.md)

- [Hooks](hooks/README.md)
  - [useModifiableComponent](hooks/use-modifiable-component.md)
  - [useLLM](hooks/use-llm.md)
  - [useAutonomousMode](hooks/use-autonomous-mode.md)
  - [useDebug](hooks/use-debug.md)

- [Plugins](plugins/README.md)
  - [Documentation Plugin](plugins/documentation-plugin.md)
  - [Analytics Plugin](plugins/analytics-plugin.md)
  - [Performance Plugin](plugins/performance-plugin.md)
  - [Validation Plugin](plugins/validation-plugin.md)
  - [Accessibility Plugin](plugins/accessibility-plugin.md)
  - [Internationalization Plugin](plugins/internationalization-plugin.md)
  - [Theme Plugin](plugins/theme-plugin.md)

## Security Considerations

React Copilot includes several security features:

- **Permission System**: Fine-grained control over what the LLM can modify
- **Code Validation**: Prevents potentially dangerous code execution
- **Sandboxed Execution**: Changes are validated before being applied
- **Error Boundaries**: Graceful fallbacks for problematic changes
- **Version Control**: Ability to track and revert changes if necessary

## Contributing

We welcome contributions to React Copilot! Please see our [contribution guidelines](advanced/contributing.md) for more information on how to get involved.

## License

React Copilot is released under the [MIT License](advanced/license.md).