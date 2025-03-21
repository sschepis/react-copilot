---
title: React Copilot Hooks
nav_order: 20
has_children: true
permalink: /hooks
---
# React Copilot Hooks

React Copilot provides several custom hooks that allow you to interact with the LLM functionality and integrate it with your components. This section documents each hook, its parameters, return values, usage examples, and best practices.

## Available Hooks

- [useModifiableComponent](use-modifiable-component.md): Register a component to be modifiable by the LLM
- [useLLM](use-llm.md): Access LLM functionality directly in your components
- [useAutonomousMode](use-autonomous-mode.md): Control autonomous mode programmatically
- [useDebug](use-debug.md): Access and control debug functionality
- [useLLMContext](use-llm-context.md): Access the LLM context directly
- [useComponentContext](use-component-context.md): Access the component registry context

## Hook Usage Patterns

### Component Registration

The most common hook you'll use is `useModifiableComponent`, which registers a component to be modifiable by the LLM:

```jsx
import { useModifiableComponent } from '@sschepis/react-copilot';

function MyComponent() {
  const { ref } = useModifiableComponent(
    'MyComponent',
    `function MyComponent() {
      // Source code for the LLM to understand
      return (
        <div>Your component content</div>
      );
    }`
  );

  return (
    <div ref={ref}>
      Your component content
    </div>
  );
}
```

### Direct LLM Interaction

For direct interaction with the LLM from your components:

```jsx
import { useLLM } from '@sschepis/react-copilot';

function MyComponent() {
  const { sendMessage, isProcessing } = useLLM();

  const handleClick = async () => {
    const response = await sendMessage('Generate a list of 5 items');
    console.log(response);
  };

  return (
    <button onClick={handleClick} disabled={isProcessing}>
      {isProcessing ? 'Processing...' : 'Generate Items'}
    </button>
  );
}
```

### Autonomous Mode Control

For controlling autonomous mode programmatically:

```jsx
import { useAutonomousMode } from '@sschepis/react-copilot';

function ControlPanel() {
  const { 
    isEnabled, 
    start, 
    stop, 
    setRequirements 
  } = useAutonomousMode();

  return (
    <div>
      <button onClick={() => setRequirements(['Add dark mode', 'Improve navigation'])}>
        Set Requirements
      </button>
      <button onClick={start} disabled={isEnabled}>
        Start Autonomous Mode
      </button>
      <button onClick={stop} disabled={!isEnabled}>
        Stop Autonomous Mode
      </button>
    </div>
  );
}
```

### Debugging

For debugging components and their state:

```jsx
import { useDebug } from '@sschepis/react-copilot';

function DebugControls() {
  const { 
    isDebugEnabled, 
    toggleDebugPanel, 
    selectComponent 
  } = useDebug();

  return (
    <button onClick={toggleDebugPanel}>
      {isDebugEnabled ? 'Hide' : 'Show'} Debug Panel
    </button>
  );
}
```

See individual hook pages for detailed documentation and examples.