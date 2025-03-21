# React Copilot

Dynamic React application assistance through AI-powered chat interfaces.

React Copilot is a powerful npm package that enables React applications to be controlled and modified by Large Language Models (LLMs) like OpenAI's GPT models or Anthropic's Claude through natural language conversations. Users can chat with an AI assistant to request UI changes, new features, or application improvements, and see them applied in real-time.

## Features

- **Chat Interface**: Floating chat overlay to interact with the LLM
- **Component Modification**: Dynamically update React components based on user requests
- **Hot Reloading**: Changes are applied without losing application state
- **Autonomous Mode**: Implement a list of requirements automatically
- **Security Controls**: Configure permissions for what the LLM can modify
- **Multi-Model Support**: Works with OpenAI, Anthropic (Claude), and DeepSeek models
- **Plugin System**: Extend functionality with plugins for analytics, documentation, performance, validation, and more
- **Debug Panel**: Interactive debugging tools for component inspection and state monitoring
- **Version Control**: Track changes and revert to previous component versions

## Installation

```bash
npm install react-copilot
```

or

```bash
yarn add react-copilot
```

## Quick Start

First, add your API keys to your `.env` file:

```env
REACT_APP_OPENAI_API_KEY=your_openai_api_key
# or
REACT_APP_ANTHROPIC_API_KEY=your_anthropic_api_key
# or
REACT_APP_DEEPSEEK_API_KEY=your_deepseek_api_key
```

Then, wrap your application with the LLM UI providers:

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

export default App;
```

## Making Components Modifiable

To allow the LLM to modify specific components, use the `useModifiableComponent` hook:

```jsx
import React from 'react';
import { useModifiableComponent } from 'react-copilot';

function Dashboard() {
  // Register component as modifiable
  const { ref } = useModifiableComponent(
    'Dashboard', 
    `function Dashboard() {
      // Source code so the LLM knows how to modify it
      const { ref } = useModifiableComponent('Dashboard');
      return (
        <div ref={ref}>
          <h1>Dashboard</h1>
          <p>Welcome to the dashboard!</p>
        </div>
      );
    }`
  );
  
  return (
    <div ref={ref}>
      <h1>Dashboard</h1>
      <p>Welcome to the dashboard!</p>
    </div>
  );
}
```

## Autonomous Mode

Enable the LLM to autonomously implement a list of requirements:

```jsx
import React from 'react';
import { LLMProvider, ModifiableApp, AutonomousAgent } from 'react-copilot';

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

## Plugins

React LLM UI includes a powerful plugin system that extends its functionality through specialized modules:

### Documentation Plugin

Automatically generates and maintains documentation for components:

```jsx
import { DocumentationPlugin } from 'react-copilot';

// Add to your LLM Provider setup
<LLMProvider
  plugins={[
    new DocumentationPlugin({
      generateJsDocs: true,
      generateReadmes: true,
      docsDirectory: './docs/components'
    })
  ]}
>
```

### Analytics Plugin

Tracks component usage and modifications for insights:

```jsx
import { AnalyticsPlugin } from 'react-copilot';

// Add to your LLM Provider setup
<LLMProvider
  plugins={[
    new AnalyticsPlugin({
      endpointUrl: 'https://your-analytics-endpoint.com/collect',
      batchEvents: true,
      trackSourceCode: false
    })
  ]}
>
```

### Performance Plugin

Monitors and optimizes component rendering:

```jsx
import { PerformancePlugin } from 'react-copilot';

// Add to your LLM Provider setup
<LLMProvider
  plugins={[
    new PerformancePlugin({
      injectMonitoring: true,
      trackRenderPerformance: true,
      slowRenderThreshold: 50
    })
  ]}
>
```

### Validation Plugin

Ensures code quality and prevents common issues:

```jsx
import { ValidationPlugin } from 'react-copilot';

// Add to your LLM Provider setup
<LLMProvider
  plugins={[
    new ValidationPlugin({
      strictMode: true,
      maxFileSize: 10000
    })
  ]}
>
```

### Accessibility Plugin

Helps ensure components meet accessibility standards:

```jsx
import { AccessibilityPlugin } from 'react-copilot';

// Add to your LLM Provider setup
<LLMProvider
  plugins={[
    new AccessibilityPlugin({
      checkAria: true,
      enforceContrast: true
    })
  ]}
>
```

### Internationalization Plugin

Aids in creating multi-language support:

```jsx
import { InternationalizationPlugin } from 'react-copilot';

// Add to your LLM Provider setup
<LLMProvider
  plugins={[
    new InternationalizationPlugin({
      defaultLocale: 'en',
      supportedLocales: ['en', 'es', 'fr']
    })
  ]}
>
```

### Theme Plugin

Facilitates dynamic theming capabilities:

```jsx
import { ThemePlugin } from 'react-copilot';

// Add to your LLM Provider setup
<LLMProvider
  plugins={[
    new ThemePlugin({
      defaultTheme: 'light',
      themes: {
        light: { /* theme values */ },
        dark: { /* theme values */ }
      }
    })
  ]}
>
```

## Debug Panel

The Debug Panel provides interactive tools for inspecting and monitoring components:

```jsx
import { DebugPanel } from 'react-copilot';

function App() {
  return (
    <LLMProvider>
      <ModifiableApp>
        <YourExistingApp />
      </ModifiableApp>
      <DebugPanel position="right" initialVisible={true} />
    </LLMProvider>
  );
}
```

The Debug Panel includes:

- **Component Tree**: Visual hierarchy of all components
- **Props Monitor**: Live inspection of component props
- **State Monitor**: Real-time state tracking
- **Relationship View**: Component dependencies visualization

## Configuration Options

### Environment Variables

Configure the package using environment variables:

```env
# LLM Configuration
REACT_APP_LLM_PROVIDER=openai
REACT_APP_LLM_API_KEY=your_api_key
REACT_APP_LLM_MODEL=gpt-4

# For DeepSeek
REACT_APP_LLM_PROVIDER=deepseek
REACT_APP_DEEPSEEK_API_KEY=your_deepseek_api_key
REACT_APP_LLM_MODEL=deepseek-chat

# Permissions
REACT_APP_ALLOW_COMPONENT_CREATION=true
REACT_APP_ALLOW_COMPONENT_DELETION=false
REACT_APP_ALLOW_STYLE_CHANGES=true
REACT_APP_ALLOW_LOGIC_CHANGES=true

# Autonomous Mode
REACT_APP_AUTONOMOUS_MODE=true
REACT_APP_REQUIREMENTS="..."

# Plugins
REACT_APP_ENABLE_DOCUMENTATION=true
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_PERFORMANCE=true
REACT_APP_ENABLE_VALIDATION=true

# Debug Panel
REACT_APP_DEBUG_PANEL_POSITION=right
REACT_APP_DEBUG_PANEL_ENABLED=true
```

### Programmatic Configuration

```jsx
<LLMProvider
  config={{
    provider: 'anthropic', // or 'deepseek'
    apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY, // or process.env.REACT_APP_DEEPSEEK_API_KEY
    model: 'claude-3-sonnet-20240229', // or 'deepseek-chat'
    temperature: 0.7,
    // For DeepSeek, you can also specify:
    // apiUrl: 'https://api.deepseek.com/v1', // DeepSeek API URL (default)
  }}
  permissions={{
    allowComponentCreation: true,
    allowComponentDeletion: false,
    allowStyleChanges: true,
    allowLogicChanges: true,
    allowDataAccess: true,
    allowNetworkRequests: false,
  }}
  autonomousMode={{
    enabled: true,
    requirements: ['Add dark mode', 'Create user profile'],
    schedule: 'onMount',
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
    new PerformancePlugin({
      injectMonitoring: true,
      trackRenderPerformance: true,
    }),
    new ValidationPlugin({
      strictMode: true,
    }),
  ]}
  debugOptions={{
    enabled: true,
    position: 'right',
    initialTab: 'components',
    allowComponentInspection: true,
    allowStateModification: false,
  }}
>
  {/* App content */}
</LLMProvider>
```

## Security Considerations

The package includes several security features:

- **Permission System**: Control what the LLM can modify
- **Code Validation**: Prevent potentially dangerous code execution
- **Sandboxed Execution**: Changes are validated before being applied
- **Error Boundaries**: Graceful fallbacks for problematic changes
- **Version Control**: Track and revert changes if necessary

## Architecture

React Copilot is built on a modular architecture:

- **Core Components**: Provide the UI and context providers
- **LLM Services**: Handle communication with language models
- **Component Registry**: Tracks and manages modifiable components
- **Plugin System**: Allows for extensibility and customization
- **Debug Tools**: Facilitate debugging and inspection

## API Reference

### Components

- `<LLMProvider>`: Main context provider
- `<ModifiableApp>`: Wrapper for components that can be modified
- `<ChatOverlay>`: Floating chat interface
- `<AutonomousAgent>`: Component that implements autonomous changes
- `<DebugPanel>`: Interactive debugging interface
  - `<ComponentTree>`: Visual component hierarchy display
  - `<PropsMonitor>`: Component props inspector
  - `<StateMonitor>`: State tracking and modification
  - `<RelationshipView>`: Component dependency visualization

### Hooks

- `useModifiableComponent()`: Register a component for LLM modification
- `useLLM()`: Access LLM functionality directly
- `useAutonomousMode()`: Control autonomous mode programmatically
- `useDebug()`: Access debug functionality
- `useLLMContext()`: Access the LLM context
- `useComponentContext()`: Access the component registry context

### Plugins

- `DocumentationPlugin`: Generate and maintain component documentation
- `AnalyticsPlugin`: Track component usage and modifications
- `PerformancePlugin`: Monitor and optimize component rendering
- `ValidationPlugin`: Ensure code quality and prevent issues
- `AccessibilityPlugin`: Ensure accessibility standards are followed
- `InternationalizationPlugin`: Add multi-language support
- `ThemePlugin`: Manage themes and styling

### Plugin Manager

- `PluginManager`: Coordinate plugin initialization and operation
- Plugin Lifecycle: Initialize, register, execute, destroy
- Hook System: Intercept and modify component registration, code execution, and LLM interactions

## Examples

Check the `/examples` directory for full implementation examples:

- `simple-app`: Basic chat-driven UI modification
- `autonomous-app`: Autonomous implementation of requirements

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
