import React, { useState } from 'react';
import { LLMProvider, ModifiableApp, ChatOverlay, useModifiableComponent } from 'react-llm-ui';
import './App.css';

// Example dashboard component that can be modified by the LLM
function Dashboard() {
  const { ref } = useModifiableComponent('Dashboard', `
function Dashboard() {
  const { ref } = useModifiableComponent('Dashboard');
  const [count, setCount] = useState(0);
  
  return (
    <div ref={ref} className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>1,234</p>
        </div>
        <div className="stat-card">
          <h3>Active Users</h3>
          <p>789</p>
        </div>
        <div className="stat-card">
          <h3>Revenue</h3>
          <p>$12,345</p>
        </div>
      </div>
      <div className="counter">
        <p>Count: {count}</p>
        <button onClick={() => setCount(count + 1)}>Increment</button>
      </div>
    </div>
  );
}
  `);
  
  const [count, setCount] = useState(0);
  
  return (
    <div ref={ref} className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>1,234</p>
        </div>
        <div className="stat-card">
          <h3>Active Users</h3>
          <p>789</p>
        </div>
        <div className="stat-card">
          <h3>Revenue</h3>
          <p>$12,345</p>
        </div>
      </div>
      <div className="counter">
        <p>Count: {count}</p>
        <button onClick={() => setCount(count + 1)}>Increment</button>
      </div>
    </div>
  );
}

// Example header component that can be modified by the LLM
function Header() {
  const { ref } = useModifiableComponent('Header', `
function Header() {
  const { ref } = useModifiableComponent('Header');
  
  return (
    <header ref={ref} className="app-header">
      <div className="logo">Company Dashboard</div>
      <nav>
        <ul>
          <li><a href="#dashboard">Dashboard</a></li>
          <li><a href="#analytics">Analytics</a></li>
          <li><a href="#settings">Settings</a></li>
        </ul>
      </nav>
      <div className="user-menu">
        <span>John Doe</span>
        <button>Logout</button>
      </div>
    </header>
  );
}
  `);
  
  return (
    <header ref={ref} className="app-header">
      <div className="logo">Company Dashboard</div>
      <nav>
        <ul>
          <li><a href="#dashboard">Dashboard</a></li>
          <li><a href="#analytics">Analytics</a></li>
          <li><a href="#settings">Settings</a></li>
        </ul>
      </nav>
      <div className="user-menu">
        <span>John Doe</span>
        <button>Logout</button>
      </div>
    </header>
  );
}

// Main App component
function App() {
  // LLM configuration
  const llmConfig = {
    provider: process.env.REACT_APP_LLM_PROVIDER as 'openai' | 'anthropic' || 'openai',
    apiKey: process.env.REACT_APP_LLM_API_KEY,
    model: process.env.REACT_APP_LLM_MODEL || 'gpt-4',
  };
  
  return (
    <LLMProvider config={llmConfig}>
      <ModifiableApp>
        <div className="app">
          <Header />
          <main>
            <Dashboard />
          </main>
        </div>
      </ModifiableApp>
      <ChatOverlay position="bottom-right" />
    </LLMProvider>
  );
}

export default App;
