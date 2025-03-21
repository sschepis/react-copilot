---
title: ModifiableApp
nav_order: 999
parent: React Copilot Components
permalink: /components/modifiable-app
---
# ModifiableApp

The `ModifiableApp` component is a wrapper that enables hot-reloading and dynamic modification of your application components. It serves as a container for the components that can be modified by the LLM.

## Import

```jsx
import { ModifiableApp } from 'react-copilot';
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | Yes | - | The application components that will be modifiable |
| `debug` | `ModifiableAppDebugOptions` | No | `{}` | Configuration for debug features |

## ModifiableAppDebugOptions Type

```typescript
interface ModifiableAppDebugOptions {
  enabled?: boolean;
  initialVisible?: boolean;
  position?: 'left' | 'right' | 'top' | 'bottom';
  width?: string;
  height?: string;
  shortcutKey?: string;
}
```

## How It Works

The `ModifiableApp` component:

1. Creates a wrapper div with a specific class name that the LLM can target
2. Monitors changes to components registered with `useModifiableComponent`
3. Displays a notification when components are being updated
4. Handles hot-reloading to apply changes without losing application state
5. Optionally renders the Debug Panel based on configuration

## Usage Examples

### Basic Usage

```jsx
import React from 'react';
import { LLMProvider, ModifiableApp, ChatOverlay } from 'react-copilot';

function App() {
  return (
    <LLMProvider config={{ provider: 'openai', model: 'gpt-4' }}>
      <ModifiableApp>
        <Header />
        <MainContent />
        <Footer />
      </ModifiableApp>
      <ChatOverlay position="bottom-right" />
    </LLMProvider>
  );
}
```

### With Debug Options Enabled

```jsx
import React from 'react';
import { LLMProvider, ModifiableApp, ChatOverlay } from 'react-copilot';

function App() {
  return (
    <LLMProvider config={{ provider: 'openai', model: 'gpt-4' }}>
      <ModifiableApp
        debug={{
          enabled: true,
          initialVisible: true,
          position: 'right',
          width: '350px',
          shortcutKey: 'Alt+D',
        }}
      >
        <Header />
        <MainContent />
        <Footer />
      </ModifiableApp>
      <ChatOverlay position="bottom-right" />
    </LLMProvider>
  );
}
```

## Making Components Modifiable

For components inside `ModifiableApp` to be modifiable, they must be registered using the `useModifiableComponent` hook:

```jsx
import React from 'react';
import { useModifiableComponent } from 'react-copilot';

function Header() {
  const { ref } = useModifiableComponent(
    'Header',
    `function Header() {
      const { ref } = useModifiableComponent('Header');
      return (
        <header ref={ref}>
          <h1>My App</h1>
          <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
          </nav>
        </header>
      );
    }`
  );

  return (
    <header ref={ref}>
      <h1>My App</h1>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </nav>
    </header>
  );
}
```

## Hot Reloading

The `ModifiableApp` component implements a hot-reloading mechanism that allows components to be updated without losing the application state. When a component is modified, the following happens:

1. The new component code is evaluated
2. The component is re-rendered with the new implementation
3. The application state is preserved
4. A notification is shown to indicate the update

This happens in real-time as the LLM modifies components based on user requests.

## Notes

- Always place all components that you want to be modifiable inside the `ModifiableApp` wrapper.
- Only components registered with `useModifiableComponent` can be modified by the LLM.
- The `ModifiableApp` component must be a child of `LLMProvider` to function correctly.
- The debug panel is automatically included when debug options are enabled.

## See Also

- [LLMProvider](llm-provider.md)
- [useModifiableComponent](../hooks/use-modifiable-component.md)
- [DebugPanel](debug-panel.md)