# API Reference

This document provides a comprehensive reference for React Copilot's API, including components, hooks, plugins, and utility functions.

## Components

### LLMProvider

```jsx
import { LLMProvider } from 'react-copilot';

<LLMProvider
  config={LLMConfig}
  permissions={Permissions}
  autonomousMode={AutonomousConfig}
  plugins={Plugin[]}
  debugOptions={DebugOptions}
>
  {children}
</LLMProvider>
```

#### Types

```typescript
interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'deepseek';
  model?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  apiUrl?: string;
  [key: string]: any;
}

interface Permissions {
  allowComponentCreation: boolean;
  allowComponentDeletion: boolean;
  allowStyleChanges: boolean;
  allowLogicChanges: boolean;
  allowDataAccess: boolean;
  allowNetworkRequests: boolean;
}

interface AutonomousConfig {
  enabled: boolean;
  requirements: string[] | string;
  schedule: 'manual' | 'onMount';
  feedbackEnabled: boolean;
  maxChangesPerSession: number;
}

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

### ModifiableApp

```jsx
import { ModifiableApp } from 'react-copilot';

<ModifiableApp
  debug={ModifiableAppDebugOptions}
>
  {children}
</ModifiableApp>
```

#### Types

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

### ChatOverlay

```jsx
import { ChatOverlay } from 'react-copilot';

<ChatOverlay
  position="bottom-right"
  width="350px"
  height="500px"
  initialOpen={false}
  showToggleButton={true}
  theme="light"
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'` | `'bottom-right'` | Position of the chat overlay |
| `width` | `string` | `'350px'` | Width of the chat panel |
| `height` | `string` | `'500px'` | Height of the chat panel |
| `initialOpen` | `boolean` | `false` | Whether the chat is initially open |
| `showToggleButton` | `boolean` | `true` | Whether to show the toggle button |
| `theme` | `'light' \| 'dark' \| 'system'` | `'light'` | Theme of the chat interface |

### AutonomousAgent

```jsx
import { AutonomousAgent } from 'react-copilot';

<AutonomousAgent
  requirements="Add a dark mode toggle, improve form validation"
  schedule="manual"
  feedback={true}
  maxChanges={10}
  onComplete={() => console.log('Requirements implemented')}
  onProgress={(progress) => console.log(`Progress: ${progress}%`)}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `requirements` | `string \| string[]` | - | Requirements to implement |
| `schedule` | `'manual' \| 'onMount'` | `'manual'` | When to start implementing requirements |
| `feedback` | `boolean` | `true` | Enable user feedback during implementation |
| `maxChanges` | `number` | `10` | Maximum number of changes per session |
| `onComplete` | `() => void` | - | Callback when requirements are completed |
| `onProgress` | `(progress: number) => void` | - | Callback for progress updates |

### DebugPanel

```jsx
import { DebugPanel } from 'react-copilot';

<DebugPanel
  position="right"
  width="400px"
  height="100%"
  initialVisible={true}
  initialTab="components"
  allowComponentInspection={true}
  allowStateModification={false}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'` | Position of the debug panel |
| `width` | `string` | `'350px'` | Width of the panel |
| `height` | `string` | `'100%'` | Height of the panel |
| `initialVisible` | `boolean` | `false` | Whether the panel is initially visible |
| `initialTab` | `'components' \| 'props' \| 'state' \| 'relationships'` | `'components'` | Initial active tab |
| `allowComponentInspection` | `boolean` | `true` | Allow component inspection |
| `allowStateModification` | `boolean` | `false` | Allow state modification |

## Hooks

### useModifiableComponent

```jsx
import { useModifiableComponent } from 'react-copilot';

function MyComponent() {
  const {
    ref,
    componentId,
    registerSourceCode,
    getVersionHistory,
    revertToVersion
  } = useModifiableComponent(
    'MyComponent',
    `function MyComponent() { /* Source code */ }`
  );
  
  return <div ref={ref}>...</div>;
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Unique name for the component |
| `initialSourceCode` | `string` | No | Source code of the component |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `ref` | `React.RefObject<HTMLDivElement>` | Ref to attach to the component root element |
| `componentId` | `string` | Unique ID for the component |
| `registerSourceCode` | `(sourceCode: string) => void` | Function to update the source code |
| `getVersionHistory` | `() => ComponentVersion[]` | Function to get version history |
| `revertToVersion` | `(versionId: string) => Promise<boolean>` | Function to revert to a specific version |

### useLLM

```jsx
import { useLLM } from 'react-copilot';

function MyComponent() {
  const {
    sendMessage,
    isProcessing,
    error,
    createSession,
    selectSession,
    currentSession,
  } = useLLM();
  
  const handleSend = async () => {
    const response = await sendMessage('Generate a button component');
    console.log(response);
  };
  
  return <button onClick={handleSend}>Send to LLM</button>;
}
```

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `sendMessage` | `(content: string) => Promise<Message>` | Send a message to the LLM |
| `isProcessing` | `boolean` | Whether a message is being processed |
| `error` | `string \| null` | Error message, if any |
| `createSession` | `() => ChatSession` | Create a new chat session |
| `selectSession` | `(id: string) => void` | Select an existing session |
| `currentSession` | `ChatSession \| null` | Current chat session |

### useAutonomousMode

```jsx
import { useAutonomousMode } from 'react-copilot';

function MyComponent() {
  const {
    isEnabled,
    isRunning,
    progress,
    requirements,
    setRequirements,
    start,
    stop,
    pause,
    resume,
  } = useAutonomousMode();
  
  return (
    <div>
      <button onClick={start} disabled={isRunning}>Start</button>
      <button onClick={stop} disabled={!isRunning}>Stop</button>
      <progress value={progress} max="100" />
    </div>
  );
}
```

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `isEnabled` | `boolean` | Whether autonomous mode is enabled |
| `isRunning` | `boolean` | Whether autonomous mode is currently running |
| `progress` | `number` | Implementation progress (0-100) |
| `requirements` | `string[]` | Current requirements |
| `setRequirements` | `(reqs: string[] \| string) => void` | Set new requirements |
| `start` | `() => void` | Start implementing requirements |
| `stop` | `() => void` | Stop implementation |
| `pause` | `() => void` | Pause implementation |
| `resume` | `() => void` | Resume implementation |

### useDebug

```jsx
import { useDebug } from 'react-copilot';

function MyComponent() {
  const {
    isDebugEnabled,
    isDebugVisible,
    debugOptions,
    toggleDebugPanel,
    selectComponent,
    inspectProps,
    inspectState,
  } = useDebug(debugOptions);
  
  return (
    <button onClick={toggleDebugPanel}>
      {isDebugVisible ? 'Hide' : 'Show'} Debug Panel
    </button>
  );
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `options` | `DebugOptions` | No | Debug configuration options |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `isDebugEnabled` | `boolean` | Whether debug mode is enabled |
| `isDebugVisible` | `boolean` | Whether debug panel is visible |
| `debugOptions` | `DebugOptions` | Current debug options |
| `toggleDebugPanel` | `() => void` | Toggle debug panel visibility |
| `selectComponent` | `(id: string) => void` | Select a component to inspect |
| `inspectProps` | `(id: string) => any` | Get props of a component |
| `inspectState` | `(id: string) => any` | Get state of a component |

## Plugins

### DocumentationPlugin

```jsx
import { DocumentationPlugin } from 'react-copilot';

const docPlugin = new DocumentationPlugin({
  generateJsDocs: true,
  generateReadmes: true,
  docsDirectory: './docs/components',
});
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `generateJsDocs` | `boolean` | `true` | Generate JSDoc comments |
| `generateReadmes` | `boolean` | `false` | Generate README files |
| `docsDirectory` | `string` | `'./docs/components'` | Output directory |
| `includeProps` | `boolean` | `true` | Include props documentation |
| `includeExamples` | `boolean` | `true` | Include usage examples |
| `format` | `'markdown' \| 'html' \| 'json'` | `'markdown'` | Output format |

### AnalyticsPlugin

```jsx
import { AnalyticsPlugin } from 'react-copilot';

const analyticsPlugin = new AnalyticsPlugin({
  endpointUrl: '/api/analytics',
  batchEvents: true,
  trackSourceCode: false,
});
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `endpointUrl` | `string` | - | Analytics endpoint URL |
| `batchEvents` | `boolean` | `false` | Batch events before sending |
| `trackSourceCode` | `boolean` | `false` | Include source code in events |
| `interval` | `number` | `5000` | Batch interval in ms |
| `anonymizeData` | `boolean` | `true` | Anonymize sensitive data |

### PerformancePlugin

```jsx
import { PerformancePlugin } from 'react-copilot';

const perfPlugin = new PerformancePlugin({
  injectMonitoring: true,
  trackRenderPerformance: true,
  slowRenderThreshold: 50,
});
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `injectMonitoring` | `boolean` | `true` | Add performance monitoring |
| `trackRenderPerformance` | `boolean` | `true` | Track component render times |
| `slowRenderThreshold` | `number` | `50` | Threshold for slow renders (ms) |
| `optimizeRerendersAutomatically` | `boolean` | `false` | Add memoization automatically |
| `logLevel` | `'info' \| 'warn' \| 'error'` | `'warn'` | Logging level |

### ValidationPlugin

```jsx
import { ValidationPlugin } from 'react-copilot';

const validationPlugin = new ValidationPlugin({
  strictMode: true,
  maxFileSize: 10000,
});
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `strictMode` | `boolean` | `false` | Enable strict validation |
| `maxFileSize` | `number` | `10000` | Maximum file size in bytes |
| `blockEval` | `boolean` | `true` | Block use of eval() and new Function() |
| `customRules` | `ValidationRule[]` | `[]` | Custom validation rules |
| `allowedHooks` | `string[]` | All hooks | Whitelist of allowed hooks |

## Utility Types

```typescript
type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
};

type ComponentVersion = {
  id: string;
  componentId: string;
  sourceCode: string;
  timestamp: number;
  author: string;
  notes?: string;
};

type ProviderInfo = {
  id: string;
  name: string;
  capabilities: {
    streaming: boolean;
    multiModal: boolean;
    functionCalling: boolean;
    embeddings: boolean;
    contextSize: number;
    supportedLanguages: string[];
  };
  availableModels: ModelOption[];
  isAvailable: boolean;
};

type ModelOption = {
  id: string;
  name: string;
  contextSize: number;
  description?: string;
  capabilities?: Partial<LLMCapabilities>;
};
```

## Global Configuration

You can configure React Copilot globally using environment variables:

```env
# LLM Configuration
REACT_APP_LLM_PROVIDER=openai
REACT_APP_LLM_API_KEY=your_api_key
REACT_APP_LLM_MODEL=gpt-4

# Permissions
REACT_APP_ALLOW_COMPONENT_CREATION=true
REACT_APP_ALLOW_COMPONENT_DELETION=false
REACT_APP_ALLOW_STYLE_CHANGES=true
REACT_APP_ALLOW_LOGIC_CHANGES=true

# Autonomous Mode
REACT_APP_AUTONOMOUS_MODE=true
REACT_APP_REQUIREMENTS="Add dark mode, improve navigation"

# Plugins
REACT_APP_ENABLE_DOCUMENTATION=true
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_PERFORMANCE=true
REACT_APP_ENABLE_VALIDATION=true

# Debug Panel
REACT_APP_DEBUG_PANEL_POSITION=right
REACT_APP_DEBUG_PANEL_ENABLED=true
```

## Constants

```jsx
import { VERSION } from 'react-copilot';

console.log(`React Copilot version: ${VERSION}`);
```

## Type Exports

React Copilot exports all of its TypeScript types, which can be imported directly:

```typescript
import {
  LLMConfig,
  Permissions,
  AutonomousConfig,
  Message,
  ChatSession,
  ComponentVersion,
  // ... and other types
} from 'react-copilot';
```

For more detailed information on each component, hook, or plugin, refer to their respective documentation pages.