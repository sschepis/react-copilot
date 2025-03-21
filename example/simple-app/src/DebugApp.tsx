import React from 'react';
import { useModifiableComponent } from '../../../src/hooks/useModifiableComponent';
import { DebugProvider } from './DebugProvider';
import './App.css';
import './EnhancedDebugExample.css';

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
  
  const [count, setCount] = React.useState(0);
  
  return (
    <div ref={ref} className="dashboard">
      <h1>Enhanced Debug Demo</h1>
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
      <div className="logo">Enhanced Debugging</div>
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
      <div className="logo">Enhanced Debugging</div>
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

// Card component for the example
function Card() {
  const { ref } = useModifiableComponent('Card', `
function Card({ title, content }) {
  const { ref } = useModifiableComponent('Card');
  
  return (
    <div ref={ref} className="card">
      <h3>{title}</h3>
      <p>{content}</p>
      <button className="card-button">Learn More</button>
    </div>
  );
}
  `);
  
  return (
    <div ref={ref} className="card">
      <h3>Enhanced Debugging</h3>
      <p>This example demonstrates the enhanced debugging capabilities with Radix UI.</p>
      <button className="card-button">Learn More</button>
    </div>
  );
}

// Main App component with debugging
function DebugApp() {
  return (
    <DebugProvider initialVisible={true}>
      <div className="app">
        <Header />
        <main>
          <Dashboard />
          <div className="card-container">
            <Card />
          </div>
        </main>
      </div>
    </DebugProvider>
  );
}

export default DebugApp;