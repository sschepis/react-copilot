import React, { useState, useEffect } from 'react';
import { AutonomousAgentProps, AutonomousTask } from '../utils/types';
import { useAutonomousMode } from '../hooks/useAutonomousMode';

/**
 * Component that implements autonomous UI requirements
 */
export const AutonomousAgent: React.FC<AutonomousAgentProps> = ({
  requirements,
  schedule,
  feedback = true,
  maxChangesPerSession,
}) => {
  const {
    isEnabled,
    tasks,
    startAutonomousMode,
    stopAutonomousMode,
    status,
  } = useAutonomousMode(requirements);
  
  const [showFeedback, setShowFeedback] = useState(feedback);
  
  // Start autonomous mode based on schedule
  useEffect(() => {
    if (schedule === 'onMount' && status === 'idle') {
      startAutonomousMode();
    }
  }, [schedule, status, startAutonomousMode]);
  
  // Hide feedback after a delay when completed
  useEffect(() => {
    if (status === 'completed' && showFeedback) {
      const timeout = setTimeout(() => {
        setShowFeedback(false);
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [status, showFeedback]);
  
  if (!isEnabled || !showFeedback) {
    return null;
  }
  
  // Render task list
  const renderTasks = () => {
    return tasks.map((task: AutonomousTask) => (
      <div 
        key={task.id}
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        {/* Status indicator */}
        <div
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            marginRight: '8px',
            backgroundColor: 
              task.status === 'completed' ? '#4caf50' :
              task.status === 'inProgress' ? '#2196f3' :
              task.status === 'failed' ? '#f44336' :
              '#9e9e9e',
          }}
        />
        
        {/* Task description */}
        <div style={{ flex: 1 }}>
          {task.description}
        </div>
        
        {/* Task status */}
        <div
          style={{
            fontSize: '14px',
            color: 
              task.status === 'completed' ? '#4caf50' :
              task.status === 'inProgress' ? '#2196f3' :
              task.status === 'failed' ? '#f44336' :
              '#9e9e9e',
            marginLeft: '8px',
          }}
        >
          {task.status}
        </div>
      </div>
    ));
  };
  
  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        width: '300px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        zIndex: 9998,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#f8f8f8',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontWeight: 'bold' }}>
          Autonomous Agent
        </div>
        <div>
          {status === 'running' ? (
            <button
              onClick={stopAutonomousMode}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#f44336',
                fontWeight: 'bold',
                padding: '4px 8px',
              }}
            >
              Pause
            </button>
          ) : status === 'paused' ? (
            <button
              onClick={startAutonomousMode}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#4caf50',
                fontWeight: 'bold',
                padding: '4px 8px',
              }}
            >
              Resume
            </button>
          ) : (
            <button
              onClick={() => setShowFeedback(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#888',
                fontWeight: 'bold',
                padding: '4px 8px',
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>
      
      {/* Body */}
      <div style={{ padding: '12px 16px' }}>
        {/* Status */}
        <div
          style={{
            marginBottom: '16px',
            padding: '8px 12px',
            borderRadius: '4px',
            backgroundColor: 
              status === 'running' ? '#e3f2fd' :
              status === 'paused' ? '#ffebee' :
              status === 'completed' ? '#e8f5e9' :
              '#f5f5f5',
          }}
        >
          <div
            style={{
              fontWeight: 'bold',
              color: 
                status === 'running' ? '#2196f3' :
                status === 'paused' ? '#f44336' :
                status === 'completed' ? '#4caf50' :
                '#9e9e9e',
            }}
          >
            {status === 'running' ? 'Running' :
             status === 'paused' ? 'Paused' :
             status === 'completed' ? 'Completed' :
             'Idle'}
          </div>
          <div style={{ fontSize: '14px', marginTop: '4px' }}>
            {status === 'running' ? 'Implementing requirements...' :
             status === 'paused' ? 'Autonomous mode paused' :
             status === 'completed' ? 'All tasks completed successfully' :
             'Waiting to start'}
          </div>
        </div>
        
        {/* Tasks */}
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            Tasks ({tasks.filter(t => t.status === 'completed').length}/{tasks.length} completed)
          </div>
          {renderTasks()}
        </div>
      </div>
    </div>
  );
};
