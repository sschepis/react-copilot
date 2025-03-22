# Modular UI System

The Modular UI System provides a flexible way to manage UI components in your application. It allows developers to selectively include components at build time and enables end-users to toggle component visibility at runtime.

## Key Features

- **Module Registry**: Central repository for UI modules
- **Visibility Management**: Runtime toggling of module visibility
- **Control Panel**: UI for toggling modules
- **Persistence**: User preferences persist across sessions
- **Dependency Management**: Modules can depend on other modules

## Getting Started

### Basic Setup

```tsx
import React from 'react';
import { 
  ModuleProvider, 
  registerDefaultModules, 
  ChatOverlayModule, 
  DebugPanelModule 
} from 'react-llm-ui';

// Register default modules
registerDefaultModules();

const App = () => {
  return (
    <ModuleProvider>
      <YourApplication />
    </ModuleProvider>
  );
};

export default App;
```

This basic setup includes all registered modules with their default visibility settings and adds a control panel for toggling modules.

### Advanced Configuration

```tsx
import React from 'react';
import { 
  ModuleProvider, 
  registerDefaultModules, 
  ChatOverlayModule, 
  DebugPanelModule 
} from 'react-llm-ui';

// Register default modules
registerDefaultModules();

const App = () => {
  return (
    <ModuleProvider
      // Only include specific modules
      modules={[ChatOverlayModule.id, DebugPanelModule.id]}
      
      // Override default visibility
      defaultVisibility={{
        [ChatOverlayModule.id]: true,
        [DebugPanelModule.id]: false
      }}
      
      // Configure control panel
      enableControlPanel={true}
      controlPanelPosition="top-right"
    >
      <YourApplication />
    </ModuleProvider>
  );
};

export default App;
```

## Creating Custom Modules

You can create custom modules for your own UI components:

```tsx
import { UIModule, registerModule } from 'react-llm-ui';
import { MyCustomComponent } from './components/MyCustomComponent';

// Define your custom module
const MyCustomModule: UIModule = {
  id: 'my-custom-module',
  name: 'My Custom UI',
  description: 'A custom UI component',
  defaultVisible: true,
  category: 'custom',
  component: MyCustomComponent,
};

// Register your module
registerModule(MyCustomModule);

// Now it can be used with ModuleProvider
```

## Using Module Visibility in Components

You can check module visibility within your components:

```tsx
import React from 'react';
import { useModuleVisibility, DebugPanelModule } from 'react-llm-ui';

const MyComponent = () => {
  const { isModuleVisible, toggleModule } = useModuleVisibility();
  
  const isDebugVisible = isModuleVisible(DebugPanelModule.id);
  
  return (
    <div>
      <p>Debug Panel is {isDebugVisible ? 'visible' : 'hidden'}</p>
      <button onClick={() => toggleModule(DebugPanelModule.id)}>
        Toggle Debug Panel
      </button>
    </div>
  );
};
```

## Module Dependencies

Modules can depend on other modules:

```tsx
const AdvancedDebugModule: UIModule = {
  id: 'advanced-debug',
  name: 'Advanced Debug Tools',
  description: 'Extended debugging capabilities',
  defaultVisible: false,
  category: 'debug',
  component: AdvancedDebugTools,
  // This module depends on the basic debug panel
  dependencies: [DebugPanelModule.id]
};
```

If a module with dependencies is visible, all its dependencies will automatically be made visible as well.

## API Reference

### ModuleProvider Props

| Prop | Type | Description |
|------|------|-------------|
| `modules` | `string[]` | Optional array of module IDs to include. If omitted, all registered modules are included. |
| `defaultVisibility` | `Record<string, boolean>` | Optional object mapping module IDs to their default visibility. Overrides the module's own `defaultVisible` setting. |
| `enableControlPanel` | `boolean` | Whether to show the control panel. Default: `true` |
| `controlPanelPosition` | `'top-right'` \| `'top-left'` \| `'bottom-right'` \| `'bottom-left'` | Position of the control panel. Default: `'top-right'` |

### UIModule Interface

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier for the module |
| `name` | `string` | Display name for the module |
| `description` | `string` (optional) | Description of what the module does |
| `defaultVisible` | `boolean` | Whether the module is visible by default |
| `category` | `'debug'` \| `'chat'` \| `'tools'` \| `'custom'` (optional) | Category for organization in the control panel |
| `component` | `React.ComponentType<any>` | The React component to render |
| `requiredPermissions` | `string[]` (optional) | Array of permissions required to use this module |
| `dependencies` | `string[]` (optional) | Array of module IDs that this module depends on |

### Hooks

- `useModuleVisibility()`: Access module visibility state and methods
  - `visibilityState`: Current visibility state of all modules
  - `toggleModule(moduleId)`: Toggle a module's visibility
  - `setModuleVisibility(moduleId, visible)`: Explicitly set a module's visibility
  - `isModuleVisible(moduleId)`: Check if a module is currently visible

### Module Registry Functions

- `registerModule(module)`: Register a single module
- `registerModules(modules)`: Register multiple modules
- `registerDefaultModules()`: Register all default modules (Debug Panel, Chat Overlay, etc.)