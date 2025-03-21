import React, { useState } from 'react';
import { ModifiableComponent } from '../../../src/components/ModifiableComponent';
import { useModifiableComponent } from '../../../src/hooks/useModifiableComponent';
import { EnhancedDebugPanel } from '../../../src/components/debug';
import './EnhancedDebugExample.css';

/**
 * Example component demonstrating the enhanced debug panel
 */
export const EnhancedDebugExample: React.FC = () => {
  const [count, setCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [debugPanelPosition, setDebugPanelPosition] = useState<'bottom-right' | 'top-right' | 'bottom-left' | 'top-left'>('bottom-right');

  return (
    <div className="enhanced-debug-example" style={{ padding: '2rem' }}>
      <h1>Enhanced Debug Panel Example</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>Debug Panel Settings</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <label>
            <input 
              type="checkbox" 
              checked={darkMode} 
              onChange={() => setDarkMode(!darkMode)} 
            />
            Dark Mode
          </label>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <h3>Position</h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {(['bottom-right', 'top-right', 'bottom-left', 'top-left'] as const).map(position => (
              <label key={position}>
                <input 
                  type="radio" 
                  name="position" 
                  value={position}
                  checked={debugPanelPosition === position}
                  onChange={() => setDebugPanelPosition(position)}
                />
                {position}
              </label>
            ))}
          </div>
        </div>
      </div>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>Example Components</h2>
        <p>The following components are registered with the component context and can be inspected in the debug panel.</p>
        
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <ModifiableComponent 
            name="Counter" 
            initialSourceCode={`
              function Counter({ initialCount = 0 }) {
                const [count, setCount] = useState(initialCount);
                
                return (
                  <div className="counter">
                    <h3>Counter: {count}</h3>
                    <button onClick={() => setCount(count - 1)}>-</button>
                    <button onClick={() => setCount(count + 1)}>+</button>
                  </div>
                );
              }
            `}
          >
            <div className="counter">
              <h3>Counter: {count}</h3>
              <button onClick={() => setCount(count - 1)}>-</button>
              <button onClick={() => setCount(count + 1)}>+</button>
            </div>
          </ModifiableComponent>
          
          <ModifiableComponent 
            name="UserCard" 
            initialSourceCode={`
              function UserCard({ user = { name: "John Doe", role: "Developer", avatar: "https://i.pravatar.cc/150?u=johndoe" } }) {
                return (
                  <div className="user-card">
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="user-avatar" 
                      style={{ width: 64, height: 64, borderRadius: '50%' }}
                    />
                    <div className="user-info">
                      <h3>{user.name}</h3>
                      <p>{user.role}</p>
                    </div>
                  </div>
                );
              }
            `}
          >
            <div className="user-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid #eee', borderRadius: '0.5rem' }}>
              <img 
                src="https://i.pravatar.cc/150?u=johndoe" 
                alt="John Doe" 
                className="user-avatar" 
                style={{ width: 64, height: 64, borderRadius: '50%' }}
              />
              <div className="user-info">
                <h3 style={{ margin: 0 }}>John Doe</h3>
                <p style={{ margin: 0 }}>Developer</p>
              </div>
            </div>
          </ModifiableComponent>
        </div>
      </div>
      
      {/* The Enhanced Debug Panel */}
      <EnhancedDebugPanel 
        initialVisible={true}
        position={debugPanelPosition}
        width={600}
        height={500}
        darkMode={darkMode}
      />
    </div>
  );
};

export default EnhancedDebugExample;