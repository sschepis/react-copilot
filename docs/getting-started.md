---
title: Getting Started with React Copilot
nav_order: 3
permalink: /getting-started
---
# Getting Started with React Copilot

This guide will walk you through the process of integrating React Copilot into your React application and using its key features.

## Prerequisites

- React 16.8.0 or higher
- An API key for at least one of the supported LLM providers:
  - OpenAI
  - Anthropic (Claude)
  - DeepSeek

## Basic Setup

### Step 1: Install the Package

```bash
npm install react-copilot
# or
yarn add react-copilot
```

### Step 2: Set Up API Keys

You can provide your API keys through environment variables:

```env
# For OpenAI
REACT_APP_OPENAI_API_KEY=your_openai_api_key

# For Anthropic Claude
REACT_APP_ANTHROPIC_API_KEY=your_anthropic_api_key

# For DeepSeek
REACT_APP_DEEPSEEK_API_KEY=your_deepseek_api_key
```

### Step 3: Wrap Your Application

Wrap your application with the React Copilot providers:

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

export default App;
```

## Making Components Modifiable

For the LLM to modify a component, you need to register it using the `useModifiableComponent` hook:

```jsx
import React from 'react';
import { useModifiableComponent } from '@sschepis/react-copilot';

function Dashboard() {
  // Register component as modifiable
  const { ref } = useModifiableComponent(
    'Dashboard', 
    `function Dashboard() {
      // Source code for the LLM to understand and modify
      const { ref } = useModifiableComponent('Dashboard');
      return (
        <div ref={ref}>
          <h1>Dashboard</h1>
          <p>Welcome to your dashboard!</p>
        </div>
      );
    }`
  );
  
  return (
    <div ref={ref}>
      <h1>Dashboard</h1>
      <p>Welcome to your dashboard!</p>
    </div>
  );
}
```

The second parameter of `useModifiableComponent` provides the component source code, which helps the LLM understand how to modify it.

## Using the Chat Interface

Once your app is wrapped with the providers and components are registered as modifiable, users can interact with the LLM through the chat overlay:

1. Click on the chat button in the position you specified.
2. Type a request, such as "Change the dashboard title to 'My Control Center'" or "Add a dark mode toggle button to the header".
3. The LLM will process the request and make the changes to the registered components.

## Configuring Permissions

You can control what the LLM is allowed to modify in your application:

```jsx
<LLMProvider
  config={{
    provider: 'openai',
    model: 'gpt-4',
  }}
  permissions={{
    allowComponentCreation: true,
    allowComponentDeletion: false,
    allowStyleChanges: true,
    allowLogicChanges: true,
    allowDataAccess: true,
    allowNetworkRequests: false,
  }}
>
  {/* Your application */}
</LLMProvider>
```

## Adding the Debug Panel

The Debug Panel provides tools for inspecting and monitoring components:

```jsx
import { DebugPanel } from '@sschepis/react-copilot';

function App() {
  return (
    <LLMProvider>
      <ModifiableApp>
        <YourExistingApp />
      </ModifiableApp>
      <ChatOverlay position="bottom-right" />
      <DebugPanel position="right" initialVisible={true} />
    </LLMProvider>
  );
}
```

## Enabling Autonomous Mode

Autonomous Mode allows the LLM to implement a list of requirements automatically:

```jsx
import { AutonomousAgent } from '@sschepis/react-copilot';

function App() {
  const requirements = `
    1. Add a dark mode toggle
    2. Create a notification system
    3. Improve the navigation menu
  `;

  return (
    <LLMProvider config={{ provider: 'openai', model: 'gpt-4' }}>
      <ModifiableApp>
        <YourExistingApp />
        <AutonomousAgent
          requirements={requirements}
          schedule="manual" // or 'onMount'
          feedback={true}
        />
      </ModifiableApp>
    </LLMProvider>
  );
}
```

## Using Plugins

Extend React Copilot functionality with plugins:

```jsx
import { DocumentationPlugin, AnalyticsPlugin, ValidationPlugin } from '@sschepis/react-copilot';

function App() {
  return (
    <LLMProvider
      config={{ provider: 'openai', model: 'gpt-4' }}
      plugins={[
        new DocumentationPlugin({
          generateJsDocs: true,
          generateReadmes: true,
        }),
        new AnalyticsPlugin({
          endpointUrl: '/api/analytics',
          batchEvents: true,
        }),
        new ValidationPlugin({
          strictMode: true,
        }),
      ]}
    >
      {/* Your application */}
    </LLMProvider>
  );
}
```

## Next Steps

- Check out the [API Reference](components/README.md) for detailed information about each component and hook.
- Explore [Advanced Usage](advanced/README.md) for more sophisticated use cases.
- See [Examples](examples.md) for complete implementation examples.
- View [Sample Prompts](sample-prompts.md) for effective ways to interact with the LLM.