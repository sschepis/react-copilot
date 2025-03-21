# Installation Guide for React LLM UI

This guide will walk you through the process of setting up React LLM UI in your React application.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A React application (v16.8 or higher)
- API key from OpenAI or Anthropic

## Installation Steps

### 1. Install the package

Using npm:
```bash
npm install react-llm-ui
```

Using yarn:
```bash
yarn add react-llm-ui
```

### 2. Set up environment variables

Create or update your `.env` file in the root of your project:

```
# If using OpenAI
REACT_APP_OPENAI_API_KEY=your_openai_api_key

# If using Anthropic (Claude)
REACT_APP_ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional configuration
REACT_APP_LLM_PROVIDER=openai # or anthropic
REACT_APP_LLM_MODEL=gpt-4 # or claude-3-sonnet-20240229
```

### 3. Wrap your application

Modify your main `App.js` or `App.tsx` file:

```jsx
import React from 'react';
import { LLMProvider, ModifiableApp, ChatOverlay } from 'react-llm-ui';

function App() {
  return (
    <LLMProvider
      config={{
        provider: process.env.REACT_APP_LLM_PROVIDER === 'anthropic' ? 'anthropic' : 'openai',
        model: process.env.REACT_APP_LLM_MODEL || 'gpt-4',
      }}
    >
      <ModifiableApp>
        {/* Your existing app content */}
        <YourExistingApp />
      </ModifiableApp>
      <ChatOverlay position="bottom-right" />
    </LLMProvider>
  );
}

export default App;
```

### 4. Make components modifiable

Update your components to make them modifiable:

```jsx
import React from 'react';
import { useModifiableComponent } from 'react-llm-ui';

function Dashboard() {
  // Extract the component source from your actual implementation
  const sourceCode = `
function Dashboard() {
  const { ref } = useModifiableComponent('Dashboard');
  return (
    <div ref={ref} className="dashboard">
      <h1>Dashboard</h1>
      {/* Dashboard content */}
    </div>
  );
}
  `;
  
  // Register the component as modifiable
  const { ref } = useModifiableComponent('Dashboard', sourceCode);
  
  return (
    <div ref={ref} className="dashboard">
      <h1>Dashboard</h1>
      {/* Dashboard content */}
    </div>
  );
}

export default Dashboard;
```

### 5. Optional: Configure permissions

You can configure permissions in your environment:

```
# Permissions
REACT_APP_ALLOW_COMPONENT_CREATION=true
REACT_APP_ALLOW_COMPONENT_DELETION=false
REACT_APP_ALLOW_STYLE_CHANGES=true
REACT_APP_ALLOW_LOGIC_CHANGES=true
```

Or pass them programmatically:

```jsx
<LLMProvider
  config={{ /* config */ }}
  permissions={{
    allowComponentCreation: true,
    allowComponentDeletion: false,
    allowStyleChanges: true,
    allowLogicChanges: true,
    allowDataAccess: true,
    allowNetworkRequests: false,
  }}
>
  {/* App content */}
</LLMProvider>
```

### 6. Optional: Set up autonomous mode

```jsx
<LLMProvider
  config={{ /* config */ }}
  autonomousMode={{
    enabled: true,
    requirements: [
      'Add a dark mode toggle',
      'Create a notification system'
    ],
    schedule: 'onMount', // or 'manual'
  }}
>
  <ModifiableApp>
    <YourExistingApp />
    <AutonomousAgent feedback={true} />
  </ModifiableApp>
</LLMProvider>
```

## Testing Your Installation

1. Start your React application:
```bash
npm start
```

2. Open your application in a browser.

3. You should see the chat overlay in the position you specified.

4. Click on the chat icon to open the chat interface.

5. Try sending a simple message to test the connection:
```
Hello, can you help me modify this app?
```

## Troubleshooting

### API Key Issues

If you're getting authentication errors:

1. Double-check your API keys in the `.env` file
2. Make sure your API keys have the necessary permissions
3. Verify that you're using the correct environment variable names

### Component Modification Issues

If components aren't being modified:

1. Check that you've properly registered components with `useModifiableComponent`
2. Ensure the `ref` is correctly applied to the component's root element
3. Verify that the source code provided matches the actual component implementation

### Chat Interface Issues

If the chat interface isn't working:

1. Check the console for any errors
2. Verify that the `ChatOverlay` component is correctly included in your application
3. Ensure the LLM provider is correctly configured

### Autonomous Mode Issues

If autonomous mode isn't working:

1. Check that you've properly configured the autonomousMode settings
2. Verify that the requirements are clear and specific
3. Check for any permission restrictions that might be blocking the changes

## Next Steps

After successful installation, you can:

1. Explore the [sample prompts](./SAMPLE_PROMPTS.md) to learn how to interact with the LLM
2. Check the [API documentation](./API.md) for detailed information on customizing the package
3. Look at the example applications in the `/examples` directory for inspiration
