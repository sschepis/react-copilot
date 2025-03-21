---
title: LLMProvider
nav_order: 999
parent: React Copilot Components
permalink: /components/llm-provider
---
# LLMProvider

The `LLMProvider` is the core component that initializes the LLM functionality and provides the configuration context to all child components.

## Import

```jsx
import { LLMProvider } from '@sschepis/react-copilot';
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `config` | `LLMConfig` | Yes | - | Configuration for the LLM provider |
| `permissions` | `Permissions` | No | Default permissions | Controls what the LLM can modify |
| `autonomousMode` | `AutonomousConfig` | No | `{ enabled: false }` | Configuration for autonomous mode |
| `plugins` | `Plugin[]` | No | `[]` | Array of plugins to extend functionality |
| `debugOptions` | `DebugOptions` | No | `{ enabled: false }` | Configuration for the debug panel |
| `children` | `ReactNode` | Yes | - | Child components |

## LLMConfig Type

```typescript
interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'deepseek';
  model?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  apiUrl?: string;
  [key: string]: any; // Provider-specific options
}
```

## Permissions Type

```typescript
interface Permissions {
  allowComponentCreation: boolean;
  allowComponentDeletion: boolean;
  allowStyleChanges: boolean;
  allowLogicChanges: boolean;
  allowDataAccess: boolean;
  allowNetworkRequests: boolean;
}
```

## AutonomousConfig Type

```typescript
interface AutonomousConfig {
  enabled: boolean;
  requirements: string[] | string;
  schedule: 'manual' | 'onMount';
  feedbackEnabled: boolean;
  maxChangesPerSession: number;
}
```

## DebugOptions Type

```typescript
interface DebugOptions {
  enabled: boolean;
  position?: 'left' | 'right' | 'bottom' | 'top';
  initialTab?: string;
  initialVisible?: boolean;
  allowComponentInspection?: boolean;
  allowStateModification?: boolean;
  width?: string;
  height?: string;
  shortcutKey?: string;
}
```

## Usage Examples

### Basic Example

```jsx
import React from 'react';
import { LLMProvider, ModifiableApp, ChatOverlay } from '@sschepis/react-copilot';

function App() {
  return (
    <LLMProvider
      config={{
        provider: 'openai',
        model: 'gpt-4',
        apiKey: process.env.REACT_APP_OPENAI_API_KEY,
      }}
    >
      <ModifiableApp>
        <YourApp />
      </ModifiableApp>
      <ChatOverlay />
    </LLMProvider>
  );
}
```

### With Permissions and Autonomous Mode

```jsx
import React from 'react';
import { LLMProvider, ModifiableApp, ChatOverlay } from '@sschepis/react-copilot';

function App() {
  return (
    <LLMProvider
      config={{
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
      }}
      permissions={{
        allowComponentCreation: true,
        allowComponentDeletion: false,
        allowStyleChanges: true,
        allowLogicChanges: true,
        allowDataAccess: false,
        allowNetworkRequests: false,
      }}
      autonomousMode={{
        enabled: true,
        requirements: [
          'Add a dark mode toggle',
          'Improve form validation',
        ],
        schedule: 'manual',
        feedbackEnabled: true,
      }}
    >
      <ModifiableApp>
        <YourApp />
      </ModifiableApp>
      <ChatOverlay />
    </LLMProvider>
  );
}
```

### With Plugins and Debug Options

```jsx
import React from 'react';
import {
  LLMProvider,
  ModifiableApp,
  ChatOverlay,
  DocumentationPlugin,
  AnalyticsPlugin,
} from '@sschepis/react-copilot';

function App() {
  return (
    <LLMProvider
      config={{
        provider: 'deepseek',
        model: 'deepseek-chat',
        apiKey: process.env.REACT_APP_DEEPSEEK_API_KEY,
      }}
      plugins={[
        new DocumentationPlugin({
          generateJsDocs: true,
          generateReadmes: true,
        }),
        new AnalyticsPlugin({
          endpointUrl: '/api/analytics',
          batchEvents: true,
        }),
      ]}
      debugOptions={{
        enabled: true,
        position: 'right',
        initialVisible: true,
        allowComponentInspection: true,
        allowStateModification: false,
        shortcutKey: 'Alt+D',
      }}
    >
      <ModifiableApp>
        <YourApp />
      </ModifiableApp>
      <ChatOverlay />
    </LLMProvider>
  );
}
```

## Notes

- The `LLMProvider` must be the top-level component in your React Copilot integration.
- It is responsible for initializing the LLM service and providing the configuration to all child components.
- Always place `ModifiableApp` inside the `LLMProvider` to ensure components can be modified.
- If `apiKey` is not provided in the config, the provider will attempt to read it from environment variables.

## Environment Variables

The LLMProvider will check for the following environment variables if `apiKey` is not explicitly provided in the config:

- OpenAI: `REACT_APP_OPENAI_API_KEY` or `OPENAI_API_KEY`
- Anthropic: `REACT_APP_ANTHROPIC_API_KEY` or `ANTHROPIC_API_KEY`
- DeepSeek: `REACT_APP_DEEPSEEK_API_KEY` or `DEEPSEEK_API_KEY`

## See Also

- [ModifiableApp](modifiable-app.md)
- [ChatOverlay](chat-overlay.md)
- [AutonomousAgent](autonomous-agent.md)
- [useLLMContext](../hooks/use-llm-context.md)