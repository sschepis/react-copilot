---
title: Troubleshooting Guide
nav_order: 7
permalink: /troubleshooting
---
# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with React Copilot.

## Common Issues

### LLM Connection Issues

#### API Key Not Working

**Problem**: The LLM provider returns authentication errors.

**Solutions**:
- Verify your API key is correct and hasn't expired
- Check if you've exceeded your API quota
- Ensure your API key has the necessary permissions
- Check if the API service is experiencing downtime

```jsx
// Correct configuration
<LLMProvider
  config={{
    provider: 'openai',
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    model: 'gpt-4',
  }}
>
```

#### Model Not Available

**Problem**: Error indicating the requested model is not available.

**Solutions**:
- Verify the model name is correct (e.g., 'gpt-4' not 'gpt4')
- Check if you have access to the requested model
- Try a different model that you're sure you have access to

```jsx
// Fallback configuration
<LLMProvider
  config={{
    provider: 'openai',
    model: 'gpt-3.5-turbo', // Fallback to widely available model
  }}
>
```

#### Network Errors

**Problem**: Timeouts or connection errors when communicating with LLM.

**Solutions**:
- Check your internet connection
- Verify the API endpoint is correct
- Increase timeout settings if your requests are complex
- Implement retry logic for transient failures

```jsx
// Configuration with custom API URL and timeout
<LLMProvider
  config={{
    provider: 'openai',
    model: 'gpt-4',
    apiUrl: 'https://your-proxy-server.com/v1',
    timeout: 60000, // 60 seconds
  }}
>
```

### Component Modification Issues

#### Component Not Updating

**Problem**: The LLM successfully returns a response, but the component doesn't update.

**Solutions**:
- Verify the component is registered with `useModifiableComponent`
- Check that the component has a ref attached to the root element
- Ensure the component name in useModifiableComponent matches the one used in requests
- Check browser console for errors

```jsx
// Correct component registration
function MyComponent() {
  // Ensure name matches what you're referring to in chat
  const { ref } = useModifiableComponent(
    'MyComponent', 
    `function MyComponent() { /* source code */ }`
  );
  
  // Make sure ref is attached to the root element
  return <div ref={ref}>Content</div>;
}
```

#### Invalid Modifications

**Problem**: The LLM generates code that causes errors when applied.

**Solutions**:
- Check browser console for specific error messages
- Verify the source code provided to `useModifiableComponent` is complete and valid
- Use the ValidationPlugin to enforce code quality
- Make sure the LLM has context about your component dependencies

```jsx
// Using ValidationPlugin to prevent issues
<LLMProvider
  plugins={[
    new ValidationPlugin({
      strictMode: true,
      blockEval: true,
    })
  ]}
>
```

#### Hot Reload Issues

**Problem**: Changes cause the application to reset or lose state.

**Solutions**:
- Ensure you're using the `ModifiableApp` wrapper
- Check that your state management is properly integrated
- Verify that the component structure matches what's in the source code
- Consider using state adapters for complex state

```jsx
// Correct usage with ModifiableApp
<LLMProvider>
  <ModifiableApp>
    <YourApplication />
  </ModifiableApp>
</LLMProvider>
```

### Permission Issues

#### Unauthorized Actions

**Problem**: The LLM attempts actions that are not allowed by your permissions.

**Solutions**:
- Review and adjust your permission settings
- Be more specific in your chat requests
- Use system prompts to clarify limitations

```jsx
// Restrictive permissions configuration
<LLMProvider
  permissions={{
    allowComponentCreation: false,
    allowComponentDeletion: false,
    allowStyleChanges: true,
    allowLogicChanges: false,
    allowDataAccess: false,
    allowNetworkRequests: false,
  }}
>
```

### Chat Interface Issues

#### Chat Overlay Not Appearing

**Problem**: The chat interface doesn't show up.

**Solutions**:
- Verify the `ChatOverlay` component is included in your app
- Check if it's properly positioned and styled
- Ensure there are no CSS conflicts hiding the overlay
- Check for JavaScript errors in the console

```jsx
// Explicit positioning for the chat overlay
<ChatOverlay 
  position="bottom-right"
  width="400px"
  height="600px"
  showToggleButton={true}
/>
```

#### Messages Not Sending

**Problem**: Chat messages don't seem to reach the LLM.

**Solutions**:
- Check network requests in the browser developer tools
- Verify the LLM service is properly initialized
- Ensure you haven't exceeded rate limits
- Check for connection or CORS issues

### Debug Panel Issues

#### Debug Panel Not Showing

**Problem**: The debug panel doesn't appear.

**Solutions**:
- Verify `debugOptions.enabled` is set to true
- Ensure there are no CSS conflicts
- Check that the `DebugPanel` component is included
- Verify the position setting works for your layout

```jsx
// Explicit debug panel configuration
<LLMProvider
  debugOptions={{
    enabled: true,
    position: 'right',
    initialVisible: true,
    width: '400px',
  }}
>
  {/* ... */}
  <DebugPanel />
</LLMProvider>
```

#### Component Inspection Not Working

**Problem**: Can't inspect components in the debug panel.

**Solutions**:
- Make sure components are registered with `useModifiableComponent`
- Check that components have proper refs
- Verify the component IDs match
- Look for console errors related to the debug panel

### Plugin Issues

#### Plugins Not Activating

**Problem**: Configured plugins don't seem to be working.

**Solutions**:
- Check plugin initialization in browser console
- Verify plugins are properly instantiated with correct options
- Ensure plugins are passed to LLMProvider correctly
- Check for compatibility issues between plugins

```jsx
// Properly configured plugins
<LLMProvider
  plugins={[
    new DocumentationPlugin({
      generateJsDocs: true,
      docsDirectory: './docs/components',
    }),
    new ValidationPlugin({
      strictMode: true,
    }),
  ]}
>
```

#### Documentation Plugin Not Generating Docs

**Problem**: The DocumentationPlugin doesn't create expected documentation files.

**Solutions**:
- Verify the docsDirectory path is correct and writable
- Check if the plugin has write permissions to the directory
- Make sure components have proper source code for documentation
- Look for errors in the plugin initialization

```jsx
// Corrected DocumentationPlugin configuration
<LLMProvider
  plugins={[
    new DocumentationPlugin({
      generateJsDocs: true,
      generateReadmes: true,
      docsDirectory: './docs', // Ensure this directory exists
      format: 'markdown',
    }),
  ]}
>
```

### Performance Issues

#### Slow Response Times

**Problem**: The application becomes sluggish when using React Copilot.

**Solutions**:
- Use the PerformancePlugin to identify slow components
- Optimize components with heavy rendering
- Consider using lazy loading for large components
- Adjust the LLM request frequency and complexity

```jsx
// Performance optimization
<LLMProvider
  plugins={[
    new PerformancePlugin({
      injectMonitoring: true,
      trackRenderPerformance: true,
      slowRenderThreshold: 50,
      optimizeRerendersAutomatically: true,
    }),
  ]}
>
```

#### Memory Leaks

**Problem**: The application memory usage grows over time.

**Solutions**:
- Check for proper cleanup in component unmount
- Ensure chat history is properly managed
- Verify that event listeners are removed
- Consider implementing session limits

## Environment-Specific Issues

### React 18 Issues

**Problem**: Compatibility issues with React 18 features.

**Solutions**:
- Ensure you're using the latest version of React Copilot
- Check for conflicts with concurrent mode
- Verify compatibility with Suspense and transitions
- Consider disabling strict mode for troubleshooting

### NextJS Integration

**Problem**: Issues integrating with NextJS.

**Solutions**:
- Import React Copilot components dynamically
- Use the `next/dynamic` import with `ssr: false`
- Configure API routes for LLM provider proxying
- Ensure environment variables are properly set

```jsx
// NextJS dynamic import
import dynamic from 'next/dynamic';

const LLMProvider = dynamic(
  () => import('react-copilot').then(mod => mod.LLMProvider),
  { ssr: false }
);

const ModifiableApp = dynamic(
  () => import('react-copilot').then(mod => mod.ModifiableApp),
  { ssr: false }
);

const ChatOverlay = dynamic(
  () => import('react-copilot').then(mod => mod.ChatOverlay),
  { ssr: false }
);
```

### TypeScript Issues

**Problem**: Type errors with React Copilot components.

**Solutions**:
- Ensure you've installed the correct types
- Check version compatibility between React Copilot and TypeScript
- Explicitly import types from 'react-copilot'
- Use proper generic typing for components

```tsx
// Proper TypeScript usage
import { 
  LLMProvider, 
  ModifiableApp, 
  ChatOverlay,
  LLMConfig,
  Permissions
} from 'react-copilot';

const config: LLMConfig = {
  provider: 'openai',
  model: 'gpt-4',
};

const permissions: Permissions = {
  allowComponentCreation: true,
  allowComponentDeletion: false,
  // ...
};

function App() {
  return (
    <LLMProvider config={config} permissions={permissions}>
      <ModifiableApp>
        <YourTypedComponents />
      </ModifiableApp>
      <ChatOverlay position="bottom-right" />
    </LLMProvider>
  );
}
```

## Advanced Troubleshooting

### Debugging LLM Requests

To debug LLM communication issues:

1. Enable browser network monitoring in developer tools
2. Filter for requests to the LLM provider's domain
3. Inspect request payloads and response data
4. Look for error codes and messages in responses

### Component Registry Debugging

To debug component registration issues:

1. Access the component registry from React Copilot tools:

```jsx
import { useComponentContext } from 'react-copilot';

function DebugTool() {
  const { components } = useComponentContext();
  
  useEffect(() => {
    console.log('Registered components:', components);
  }, [components]);
  
  return null;
}
```

2. Verify components are properly registered with the correct IDs
3. Check that source code is correctly associated with components
4. Inspect component references to ensure they're valid

### Error Boundaries

React Copilot uses error boundaries to prevent crashes, but you can implement your own for more control:

```jsx
import { ErrorBoundary } from 'react-copilot';

<ErrorBoundary
  fallback={({ error, resetErrorBoundary }) => (
    <div>
      <h2>Something went wrong with this component</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Reset</button>
    </div>
  )}
>
  <YourModifiableComponent />
</ErrorBoundary>
```

## Getting Help

If you've tried the solutions above and still experience issues:

1. Check the [GitHub repository](https://github.com/sschepis/react-copilot) for known issues
2. Search existing GitHub issues for similar problems
3. Create a new issue with:
   - React Copilot version
   - React version
   - Browser and OS information
   - Steps to reproduce
   - Error messages
   - Code samples
4. Join the community discussions for peer support