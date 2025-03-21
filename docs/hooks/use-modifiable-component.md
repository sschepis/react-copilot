---
title: useModifiableComponent
nav_order: 999
parent: React Copilot Hooks
permalink: /hooks/use-modifiable-component
---
# useModifiableComponent

The `useModifiableComponent` hook is a core part of React Copilot, allowing you to register a component as modifiable by the LLM. It provides the necessary infrastructure for the LLM to understand, modify, and track versions of your component.

## Import

```jsx
import { useModifiableComponent } from 'react-copilot';
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Unique name for the component |
| `initialSourceCode` | `string` | No | Source code of the component for the LLM to understand and modify |

## Return Value

The hook returns an object with the following properties:

```typescript
interface UseModifiableComponentReturn {
  ref: React.RefObject<HTMLDivElement>;
  componentId: string;
  registerSourceCode: (sourceCode: string) => void;
  getVersionHistory: () => ComponentVersion[];
  revertToVersion: (versionId: string) => Promise<boolean>;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `ref` | `React.RefObject<HTMLDivElement>` | Ref to attach to the component root element |
| `componentId` | `string` | Unique ID for the component |
| `registerSourceCode` | `(sourceCode: string) => void` | Function to update the source code |
| `getVersionHistory` | `() => ComponentVersion[]` | Function to get version history |
| `revertToVersion` | `(versionId: string) => Promise<boolean>` | Function to revert to a specific version |

## How It Works

When you use this hook:

1. The component is registered with the component registry
2. A unique ID is assigned to the component
3. The source code is stored for the LLM to understand and modify
4. The component becomes "modifiable" by the LLM
5. Version history is tracked for the component

## Usage Examples

### Basic Usage

```jsx
import React from 'react';
import { useModifiableComponent } from 'react-copilot';

function Button({ text, onClick }) {
  const { ref } = useModifiableComponent(
    'Button',
    `function Button({ text, onClick }) {
      const { ref } = useModifiableComponent('Button');
      return (
        <button 
          ref={ref}
          onClick={onClick}
          style={{ padding: '8px 16px', background: 'blue', color: 'white' }}
        >
          {text}
        </button>
      );
    }`
  );

  return (
    <button 
      ref={ref}
      onClick={onClick}
      style={{ padding: '8px 16px', background: 'blue', color: 'white' }}
    >
      {text}
    </button>
  );
}
```

### Working with Version History

```jsx
import React, { useState, useEffect } from 'react';
import { useModifiableComponent } from 'react-copilot';

function ProfileCard({ user }) {
  const { 
    ref, 
    componentId, 
    getVersionHistory, 
    revertToVersion 
  } = useModifiableComponent(
    'ProfileCard',
    `function ProfileCard({ user }) {
      // Component source code
      return (
        <div>
          <h2>{user.name}</h2>
          <p>{user.bio}</p>
        </div>
      );
    }`
  );

  const [versions, setVersions] = useState([]);

  useEffect(() => {
    // Get version history on mount
    setVersions(getVersionHistory());
  }, [getVersionHistory]);

  const handleRevert = async (versionId) => {
    const success = await revertToVersion(versionId);
    if (success) {
      console.log('Successfully reverted to version:', versionId);
    }
  };

  return (
    <div>
      <div ref={ref}>
        <h2>{user.name}</h2>
        <p>{user.bio}</p>
      </div>
      
      {versions.length > 1 && (
        <div>
          <h4>Version History</h4>
          <ul>
            {versions.map(version => (
              <li key={version.id}>
                Version {version.id.substring(0, 6)} - 
                {new Date(version.timestamp).toLocaleString()}
                <button onClick={() => handleRevert(version.id)}>
                  Revert
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### Dynamically Updating Source Code

```jsx
import React, { useEffect } from 'react';
import { useModifiableComponent } from 'react-copilot';

function DynamicComponent({ data, config }) {
  const { ref, registerSourceCode } = useModifiableComponent(
    'DynamicComponent',
    // Initial source code
    `function DynamicComponent({ data, config }) {
      return (
        <div>Dynamic content here</div>
      );
    }`
  );

  // Update source code when props change
  useEffect(() => {
    const newSourceCode = `function DynamicComponent({ data, config }) {
      // Updated with current data: ${JSON.stringify(data)}
      // And current config: ${JSON.stringify(config)}
      return (
        <div>
          <h3>${config.title || 'Dynamic Component'}</h3>
          <div>
            ${data.map(item => `<p>${item}</p>`).join('')}
          </div>
        </div>
      );
    }`;
    
    registerSourceCode(newSourceCode);
  }, [data, config, registerSourceCode]);

  return (
    <div ref={ref}>
      <h3>{config.title || 'Dynamic Component'}</h3>
      <div>
        {data.map((item, index) => (
          <p key={index}>{item}</p>
        ))}
      </div>
    </div>
  );
}
```

## Best Practices

1. **Always attach the ref to the root element** of your component to ensure proper identification.

2. **Provide detailed source code** that accurately represents your component, including all props, state, and functionality.

3. **Keep the rendered JSX synchronized with the source code** you provide to the hook, to prevent inconsistencies.

4. **Use meaningful component names** that clearly describe the component's purpose.

5. **When updating a component**, remember to update both the actual rendered JSX and the source code via `registerSourceCode`.

6. **For complex components**, consider breaking them down into smaller, individually modifiable components.

## Limitations

- The component must have a single root element to attach the ref to.
- The source code provided is static and doesn't automatically update with state changes.
- If your component structure changes significantly, you'll need to manually update the source code.

## See Also

- [ModifiableApp](../components/modifiable-app.md)
- [ComponentContext](../hooks/use-component-context.md)
- [Version Control](../advanced/version-control.md)