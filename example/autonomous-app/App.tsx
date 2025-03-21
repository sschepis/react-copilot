import React from 'react';
import { 
  LLMProvider, 
  ModifiableApp, 
  ChatOverlay, 
  AutonomousAgent,
  useModifiableComponent 
} from 'react-llm-ui';
import './App.css';

// Simple component that will be modified autonomously
function Dashboard() {
  const { ref } = useModifiableComponent('Dashboard', `
function Dashboard() {
  const { ref } = useModifiableComponent('Dashboard');
  
  return (
    <div ref={ref} className="dashboard">
      <h1>Dashboard</h1>
      <div className="placeholder">
        <p>This is a placeholder dashboard that will be autonomously improved.</p>
        <p>The AI will:</p>
        <ul>
          <li>Add data visualization</li>
          <li>Create a better layout</li>
          <li>Add interactive elements</li>
        </ul>
      </div>
    </div>
  );
}
  `);
  
  return (
    <div ref={ref} className="dashboard">
      <h1>Dashboard</h1>
      <div className="placeholder">
        <p>This is a placeholder dashboard that will be autonomously improved.</p>
        <p>The AI will:</p>
        <ul>
          <li>Add data visualization</li>
          <li>Create a better layout</li>
          <li>Add interactive elements</li>
        </ul>
      </div>
    </div>
  );
}

// Simple header component
function Header() {
  const { ref } = useModifiableComponent('Header', `
function Header() {
  const { ref } = useModifiableComponent('Header');
  
  return (
    <header ref={ref} className="app-header">
      <div className="logo">Autonomous App</div>
      <nav>
        <ul>
          <li><a href="#dashboard">Dashboard</a></li>
          <li><a href="#settings">Settings</a></li>
        </ul>
      </nav>
    </header>
  );
}
  `);
  
  return (
    <header ref={ref} className="app-header">
      <div className="logo">Autonomous App</div>
      <nav>
        <ul>
          <li><a href="#dashboard">Dashboard</a></li>
          <li><a href="#settings">Settings</a></li>
        </ul>
      </nav>
    </header>
  );
}

// Main App component with autonomous mode enabled
function App() {
  // Get requirements from environment variables
  const requirements = process.env.REACT_APP_REQUIREMENTS || `
    1. Add a dark mode toggle
    2. Create a proper dashboard with sample data
    3. Add a user profile section
    4. Create a notification system
  `;
  
  // LLM configuration
  const llmConfig = {
    provider: (process.env.REACT_APP_LLM_PROVIDER as 'openai' | 'anthropic') || 'openai',
    apiKey: process.env.REACT_APP_LLM_API_KEY,
    model: process.env.REACT_APP_LLM_MODEL || 'gpt-4',
  };
  
  return (
    <LLMProvider 
      config={llmConfig}
      autonomousMode={{
        enabled: process.env.REACT_APP_AUTONOMOUS_MODE === 'true',
        requirements,
        schedule: (process.env.REACT_APP_AUTONOMOUS_SCHEDULE as any) || 'manual',
      }}
    >
      <ModifiableApp>
        <div className="app">
          <Header />
          <main>
            <Dashboard />
          </main>
        </div>
        
        {/* Autonomous agent that will modify the app */}
        <AutonomousAgent 
          requirements={requirements}
          schedule="manual"
          feedback={true}
        />
      </ModifiableApp>
      
      {/* Chat interface for manual modifications */}
      <ChatOverlay position="bottom-right" />
    </LLMProvider>
  );
}

export default App;
