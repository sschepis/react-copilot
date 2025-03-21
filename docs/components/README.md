---
title: React Copilot Components
nav_order: 10
has_children: true
permalink: /components
---
# React Copilot Components

React Copilot provides several key components that form the foundation of its functionality. This section documents each component, its props, usage examples, and best practices.

## Core Components

- [LLMProvider](llm-provider.md): The main context provider that configures the LLM integration
- [ModifiableApp](modifiable-app.md): Wrapper component that enables hot-reloading and modification
- [ChatOverlay](chat-overlay.md): Floating chat interface for user interactions with the LLM
- [AutonomousAgent](autonomous-agent.md): Component that implements autonomous changes based on requirements

## Debug Components

- [DebugPanel](debug-panel.md): Container component for debugging tools
- [ComponentTree](component-tree.md): Visual hierarchy of registered components
- [PropsMonitor](props-monitor.md): Real-time inspection of component props
- [StateMonitor](state-monitor.md): Monitoring and modification of component state
- [RelationshipView](relationship-view.md): Visualization of component dependencies

## Component Relationships

The following diagram illustrates the relationships between the main components:

```
LLMProvider
├── ModifiableApp
│   └── Your Application Components
├── ChatOverlay
└── DebugPanel
    ├── ComponentTree
    ├── PropsMonitor
    ├── StateMonitor
    └── RelationshipView
```

## Usage Patterns

Most applications will use the three core components together:

```jsx
<LLMProvider config={...}>
  <ModifiableApp>
    <YourApp />
  </ModifiableApp>
  <ChatOverlay />
</LLMProvider>
```

For development or debugging purposes, you can add the DebugPanel:

```jsx
<LLMProvider config={...}>
  <ModifiableApp>
    <YourApp />
  </ModifiableApp>
  <ChatOverlay />
  <DebugPanel />
</LLMProvider>
```

For autonomous implementation of features, add the AutonomousAgent:

```jsx
<LLMProvider config={...}>
  <ModifiableApp>
    <YourApp />
    <AutonomousAgent requirements={...} />
  </ModifiableApp>
</LLMProvider>
```

See individual component pages for detailed documentation and examples.