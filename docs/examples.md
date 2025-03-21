# React Copilot Examples

This document provides practical examples of using React Copilot in various scenarios to help you understand how to implement and leverage its features effectively.

## Basic Chat Integration

This example shows the minimum setup required to add React Copilot's chat functionality to your React application:

```jsx
import React from 'react';
import { LLMProvider, ModifiableApp, ChatOverlay } from 'react-copilot';

function App() {
  return (
    <LLMProvider
      config={{
        provider: 'openai',
        model: 'gpt-4',
        apiKey: process.env.REACT_APP_OPENAI_API_KEY,
      }}
    >
      <ModifiableApp>
        <Header />
        <MainContent />
        <Footer />
      </ModifiableApp>
      <ChatOverlay position="bottom-right" />
    </LLMProvider>
  );
}

// Example of a modifiable component
function Header() {
  const { ref } = useModifiableComponent(
    'Header',
    `function Header() {
      const { ref } = useModifiableComponent('Header');
      return (
        <header ref={ref}>
          <h1>My Application</h1>
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
      <h1>My Application</h1>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </nav>
    </header>
  );
}
```

## Complete Dashboard Example

This example demonstrates how to build a dashboard application with multiple modifiable components:

```jsx
import React, { useState } from 'react';
import {
  LLMProvider,
  ModifiableApp,
  ChatOverlay,
  DebugPanel,
  useModifiableComponent
} from 'react-copilot';

function App() {
  return (
    <LLMProvider
      config={{
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
      }}
      permissions={{
        allowComponentCreation: true,
        allowComponentDeletion: false,
        allowStyleChanges: true,
        allowLogicChanges: true,
      }}
    >
      <ModifiableApp>
        <Dashboard />
      </ModifiableApp>
      <ChatOverlay position="bottom-right" />
      <DebugPanel position="right" initialVisible={false} />
    </LLMProvider>
  );
}

function Dashboard() {
  const [data, setData] = useState({
    revenue: 54280,
    users: 2120,
    tasks: 157,
    completion: 68
  });

  // Register main dashboard component
  const { ref } = useModifiableComponent(
    'Dashboard',
    `function Dashboard() {
      const [data, setData] = useState({
        revenue: 54280,
        users: 2120,
        tasks: 157,
        completion: 68
      });
      
      const { ref } = useModifiableComponent('Dashboard');
      
      return (
        <div ref={ref} className="dashboard">
          <DashboardHeader title="Analytics Dashboard" />
          <div className="dashboard-grid">
            <StatCard 
              title="Revenue" 
              value={\`$\${data.revenue.toLocaleString()}\`} 
              icon="dollar-sign" 
            />
            <StatCard 
              title="Users" 
              value={data.users.toLocaleString()} 
              icon="users" 
            />
            <StatCard 
              title="Tasks" 
              value={data.tasks} 
              icon="check-square" 
            />
            <StatCard 
              title="Completion" 
              value={\`\${data.completion}%\`} 
              icon="trending-up" 
            />
          </div>
          <DashboardChart />
        </div>
      );
    }`
  );

  return (
    <div ref={ref} className="dashboard">
      <DashboardHeader title="Analytics Dashboard" />
      <div className="dashboard-grid">
        <StatCard 
          title="Revenue" 
          value={`$${data.revenue.toLocaleString()}`} 
          icon="dollar-sign" 
        />
        <StatCard 
          title="Users" 
          value={data.users.toLocaleString()} 
          icon="users" 
        />
        <StatCard 
          title="Tasks" 
          value={data.tasks} 
          icon="check-square" 
        />
        <StatCard 
          title="Completion" 
          value={`${data.completion}%`} 
          icon="trending-up" 
        />
      </div>
      <DashboardChart />
    </div>
  );
}

function DashboardHeader({ title }) {
  const { ref } = useModifiableComponent(
    'DashboardHeader',
    `function DashboardHeader({ title }) {
      const { ref } = useModifiableComponent('DashboardHeader');
      return (
        <div ref={ref} className="dashboard-header">
          <h1>{title}</h1>
          <div className="dashboard-actions">
            <button>Export</button>
            <button>Settings</button>
          </div>
        </div>
      );
    }`
  );

  return (
    <div ref={ref} className="dashboard-header">
      <h1>{title}</h1>
      <div className="dashboard-actions">
        <button>Export</button>
        <button>Settings</button>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  const { ref } = useModifiableComponent(
    'StatCard',
    `function StatCard({ title, value, icon }) {
      const { ref } = useModifiableComponent('StatCard');
      return (
        <div ref={ref} className="stat-card">
          <div className="stat-icon">{icon}</div>
          <div className="stat-content">
            <h3>{title}</h3>
            <p className="stat-value">{value}</p>
          </div>
        </div>
      );
    }`
  );

  return (
    <div ref={ref} className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3>{title}</h3>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );
}

function DashboardChart() {
  const { ref } = useModifiableComponent(
    'DashboardChart',
    `function DashboardChart() {
      const { ref } = useModifiableComponent('DashboardChart');
      return (
        <div ref={ref} className="dashboard-chart">
          <h2>Performance Metrics</h2>
          <div className="chart-placeholder">
            Chart goes here. The LLM can replace this with a real chart implementation.
          </div>
        </div>
      );
    }`
  );

  return (
    <div ref={ref} className="dashboard-chart">
      <h2>Performance Metrics</h2>
      <div className="chart-placeholder">
        Chart goes here. The LLM can replace this with a real chart implementation.
      </div>
    </div>
  );
}
```

## Autonomous Mode Example

This example shows how to implement the autonomous mode to automatically add features to your application:

```jsx
import React from 'react';
import {
  LLMProvider,
  ModifiableApp,
  AutonomousAgent,
  useModifiableComponent
} from 'react-copilot';

function App() {
  // Define requirements for the autonomous agent
  const requirements = `
    1. Add a dark mode toggle that switches the app's color scheme
    2. Create a notification system with a bell icon and dropdown
    3. Improve the navigation menu with dropdown submenus
    4. Add a search box in the header
    5. Create a user profile section with avatar and settings
  `;

  return (
    <LLMProvider
      config={{
        provider: 'openai',
        model: 'gpt-4',
        apiKey: process.env.REACT_APP_OPENAI_API_KEY,
      }}
    >
      <ModifiableApp>
        <AppContainer />
        
        {/* Autonomous agent that will implement the requirements */}
        <AutonomousAgent
          requirements={requirements}
          schedule="manual" // or "onMount" to start automatically
          feedback={true}
          maxChanges={10}
          onProgress={(progress) => console.log(`Progress: ${progress}%`)}
          onComplete={() => console.log('All requirements implemented!')}
        />
      </ModifiableApp>
    </LLMProvider>
  );
}

function AppContainer() {
  const { ref } = useModifiableComponent(
    'AppContainer',
    `function AppContainer() {
      const { ref } = useModifiableComponent('AppContainer');
      return (
        <div ref={ref} className="app-container">
          <Header />
          <MainContent />
          <Footer />
        </div>
      );
    }`
  );

  return (
    <div ref={ref} className="app-container">
      <Header />
      <MainContent />
      <Footer />
    </div>
  );
}

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
            <a href="/features">Features</a>
            <a href="/pricing">Pricing</a>
            <a href="/about">About</a>
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
        <a href="/features">Features</a>
        <a href="/pricing">Pricing</a>
        <a href="/about">About</a>
      </nav>
    </header>
  );
}

function MainContent() {
  const { ref } = useModifiableComponent(
    'MainContent',
    `function MainContent() {
      const { ref } = useModifiableComponent('MainContent');
      return (
        <main ref={ref}>
          <h2>Welcome to My App</h2>
          <p>This is the main content area. The autonomous agent will modify this application based on the requirements.</p>
        </main>
      );
    }`
  );

  return (
    <main ref={ref}>
      <h2>Welcome to My App</h2>
      <p>This is the main content area. The autonomous agent will modify this application based on the requirements.</p>
    </main>
  );
}

function Footer() {
  const { ref } = useModifiableComponent(
    'Footer',
    `function Footer() {
      const { ref } = useModifiableComponent('Footer');
      return (
        <footer ref={ref}>
          <p>&copy; 2025 My App. All rights reserved.</p>
        </footer>
      );
    }`
  );

  return (
    <footer ref={ref}>
      <p>&copy; 2025 My App. All rights reserved.</p>
    </footer>
  );
}
```

## Redux Integration Example

This example demonstrates how to integrate React Copilot with Redux state management:

```jsx
import React from 'react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import {
  LLMProvider,
  ModifiableApp,
  ChatOverlay,
  ReduxAdapter
} from 'react-copilot';

// Redux reducer
const initialState = {
  counter: 0,
  theme: 'light',
  user: null
};

function rootReducer(state = initialState, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, counter: state.counter + 1 };
    case 'DECREMENT':
      return { ...state, counter: state.counter - 1 };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

// Create store
const store = createStore(rootReducer);

// Create Redux adapter for React Copilot
const reduxAdapter = new ReduxAdapter(store);

function App() {
  return (
    <Provider store={store}>
      <LLMProvider
        config={{
          provider: 'openai',
          model: 'gpt-4',
        }}
        // Register the Redux adapter with LLMProvider
        stateAdapters={[reduxAdapter]}
      >
        <ModifiableApp>
          <Counter />
          <ThemeToggle />
          <UserProfile />
        </ModifiableApp>
        <ChatOverlay position="bottom-right" />
      </LLMProvider>
    </Provider>
  );
}

function Counter() {
  const { ref } = useModifiableComponent(
    'Counter',
    `function Counter() {
      const { ref } = useModifiableComponent('Counter');
      const counter = useSelector(state => state.counter);
      const dispatch = useDispatch();
      
      return (
        <div ref={ref}>
          <h2>Counter: {counter}</h2>
          <button onClick={() => dispatch({ type: 'INCREMENT' })}>Increment</button>
          <button onClick={() => dispatch({ type: 'DECREMENT' })}>Decrement</button>
        </div>
      );
    }`
  );
  
  // Using Redux hooks
  const counter = useSelector(state => state.counter);
  const dispatch = useDispatch();
  
  return (
    <div ref={ref}>
      <h2>Counter: {counter}</h2>
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>Increment</button>
      <button onClick={() => dispatch({ type: 'DECREMENT' })}>Decrement</button>
    </div>
  );
}

function ThemeToggle() {
  const { ref } = useModifiableComponent(
    'ThemeToggle',
    `function ThemeToggle() {
      const { ref } = useModifiableComponent('ThemeToggle');
      const theme = useSelector(state => state.theme);
      const dispatch = useDispatch();
      
      const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        dispatch({ type: 'SET_THEME', payload: newTheme });
      };
      
      return (
        <div ref={ref}>
          <button onClick={toggleTheme}>
            Switch to {theme === 'light' ? 'dark' : 'light'} mode
          </button>
        </div>
      );
    }`
  );
  
  const theme = useSelector(state => state.theme);
  const dispatch = useDispatch();
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    dispatch({ type: 'SET_THEME', payload: newTheme });
  };
  
  return (
    <div ref={ref}>
      <button onClick={toggleTheme}>
        Switch to {theme === 'light' ? 'dark' : 'light'} mode
      </button>
    </div>
  );
}
```

## Multi-Plugin Example

This example demonstrates using multiple plugins together:

```jsx
import React from 'react';
import {
  LLMProvider,
  ModifiableApp,
  ChatOverlay,
  DocumentationPlugin,
  AnalyticsPlugin,
  PerformancePlugin,
  ValidationPlugin,
  AccessibilityPlugin
} from 'react-copilot';

function App() {
  return (
    <LLMProvider
      config={{
        provider: 'openai',
        model: 'gpt-4',
      }}
      plugins={[
        // Generate documentation for components
        new DocumentationPlugin({
          generateJsDocs: true,
          generateReadmes: true,
          docsDirectory: './docs/components',
        }),
        
        // Track component usage and modifications
        new AnalyticsPlugin({
          endpointUrl: '/api/analytics',
          batchEvents: true,
          trackSourceCode: false,
        }),
        
        // Monitor and optimize component rendering
        new PerformancePlugin({
          injectMonitoring: true,
          trackRenderPerformance: true,
          slowRenderThreshold: 50,
        }),
        
        // Ensure code quality and prevent issues
        new ValidationPlugin({
          strictMode: true,
          maxFileSize: 10000,
        }),
        
        // Ensure accessibility standards
        new AccessibilityPlugin({
          checkAria: true,
          enforceContrast: true,
        }),
      ]}
    >
      <ModifiableApp>
        <YourApplication />
      </ModifiableApp>
      <ChatOverlay position="bottom-right" />
    </LLMProvider>
  );
}
```

## Debugging Example

This example shows how to use the debugging features of React Copilot:

```jsx
import React from 'react';
import {
  LLMProvider,
  ModifiableApp,
  DebugPanel,
  useDebug,
  useModifiableComponent
} from 'react-copilot';

function App() {
  return (
    <LLMProvider
      config={{
        provider: 'openai',
        model: 'gpt-4',
      }}
      debugOptions={{
        enabled: true,
        initialVisible: true,
        position: 'right',
        initialTab: 'components',
      }}
    >
      <ModifiableApp>
        <DebugControls />
        <Counter />
      </ModifiableApp>
      <DebugPanel />
    </LLMProvider>
  );
}

function DebugControls() {
  // Use the debug hook to control debug features
  const {
    isDebugEnabled,
    isDebugVisible,
    toggleDebugPanel,
    selectComponent,
    inspectProps,
    inspectState,
  } = useDebug();
  
  return (
    <div className="debug-controls">
      <button onClick={toggleDebugPanel}>
        {isDebugVisible ? 'Hide' : 'Show'} Debug Panel
      </button>
      <button onClick={() => selectComponent('Counter')}>
        Inspect Counter
      </button>
    </div>
  );
}

function Counter() {
  const [count, setCount] = React.useState(0);
  
  // Register as a modifiable component
  const { ref, componentId } = useModifiableComponent(
    'Counter',
    `function Counter() {
      const [count, setCount] = React.useState(0);
      const { ref } = useModifiableComponent('Counter');
      
      return (
        <div ref={ref}>
          <h2>Count: {count}</h2>
          <button onClick={() => setCount(count + 1)}>Increment</button>
          <button onClick={() => setCount(count - 1)}>Decrement</button>
        </div>
      );
    }`
  );
  
  return (
    <div ref={ref}>
      <h2>Count: {count}</h2>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
    </div>
  );
}
```

These examples demonstrate different ways to use React Copilot in various scenarios. You can adapt them to fit your specific needs and requirements.