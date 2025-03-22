import React, { useState, useEffect } from 'react';
import { ModifiableComponent, PerformanceProfile } from '../../../utils/types';
import { PerformanceMonitor as PerformanceMonitorService } from '../../../services/performance/PerformanceMonitor';
import { EventBus } from '../../../utils/EventBus';

interface PerformanceMonitorProps {
  component: ModifiableComponent;
}

/**
 * Performance monitoring component that displays performance metrics and recommendations
 * for optimizing the selected component
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ component }) => {
  const [performanceData, setPerformanceData] = useState<PerformanceProfile | null>(null);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const performanceMonitor = PerformanceMonitorService.getInstance();

  // Load performance data when component changes
  useEffect(() => {
    if (component && component.id) {
      const profile = performanceMonitor.getComponentProfile(component.id);
      setPerformanceData(profile);
    }

    return () => {
      // Cleanup if needed
    };
  }, [component]);

  // Subscribe to performance updates
  useEffect(() => {
    const eventBus = EventBus.getInstance();

    const handlePerformanceUpdate = (event: any) => {
      const data = event.data;
      if (data.componentId === component.id) {
        setPerformanceData(data.profile);
      }
    };

    const subscription = eventBus.subscribe('performance:update', handlePerformanceUpdate);

    return () => {
      subscription.unsubscribe();
    };
  }, [component.id]);

  // Toggle performance monitoring
  const toggleMonitoring = () => {
    if (isMonitoring) {
      performanceMonitor.stopMonitoring();
      setIsMonitoring(false);
    } else {
      performanceMonitor.startMonitoring();
      setIsMonitoring(true);
    }
  };

  // Format time for display (ms with 2 decimal places)
  const formatTime = (time: number): string => {
    return `${time.toFixed(2)}ms`;
  };

  // Render empty state if no performance data
  if (!performanceData) {
    return (
      <div className="performance-monitor">
        <div className="performance-monitor-header">
          <h3>Performance Monitor</h3>
          <button
            className={`monitor-toggle-button ${isMonitoring ? 'active' : ''}`}
            onClick={toggleMonitoring}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
        </div>
        <div className="performance-monitor-empty">
          <p>No performance data available for this component.</p>
          <p>Start monitoring to collect performance metrics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="performance-monitor">
      <div className="performance-monitor-header">
        <h3>Performance Monitor</h3>
        <button
          className={`monitor-toggle-button ${isMonitoring ? 'active' : ''}`}
          onClick={toggleMonitoring}
        >
          {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </button>
      </div>
      
      <div className="performance-monitor-summary">
        <div className="metric-card">
          <div className="metric-label">Render Count</div>
          <div className="metric-value">{performanceData.renderCount}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Avg Render Time</div>
          <div className={`metric-value ${performanceData.averageRenderTime > 16 ? 'warning' : ''}`}>
            {formatTime(performanceData.averageRenderTime)}
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Memoization</div>
          <div className={`metric-value ${performanceData.memoizationEffectiveness < 0.7 ? 'warning' : ''}`}>
            {Math.round(performanceData.memoizationEffectiveness * 100)}%
          </div>
        </div>
      </div>
      
      {/* State Updates Section */}
      <div className="performance-monitor-section">
        <h4>State Access Patterns</h4>
        {Object.keys(performanceData.stateAccessPatterns).length > 0 ? (
          <table className="performance-table">
            <thead>
              <tr>
                <th>State Key</th>
                <th>Update Frequency</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(performanceData.stateAccessPatterns)
                .sort(([, freqA], [, freqB]) => freqB - freqA) // Sort by frequency (highest first)
                .map(([key, frequency]) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td className={frequency > 5 ? 'warning' : ''}>{frequency}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data-message">No state updates detected.</p>
        )}
      </div>
      
      {/* Recommendations Section */}
      <div className="performance-monitor-section">
        <h4>Optimization Recommendations</h4>
        {performanceData.recommendedOptimizations && performanceData.recommendedOptimizations.length > 0 ? (
          <div className="recommendations-list">
            {performanceData.recommendedOptimizations.map((recommendation, index) => (
              <div
                key={index}
                className={`recommendation-item priority-${typeof recommendation === 'string' ? 'medium' : recommendation.priority}`}
              >
                {typeof recommendation === 'string' ? (
                  // Handle string recommendations (legacy format)
                  <div className="recommendation-description">{recommendation}</div>
                ) : (
                  // Handle object recommendations (new format)
                  <>
                    <div className="recommendation-header">
                      <span className="recommendation-type">{recommendation.type}</span>
                      <span className={`recommendation-priority priority-${recommendation.priority}`}>
                        {recommendation.priority}
                      </span>
                    </div>
                    <div className="recommendation-description">{recommendation.description}</div>
                    {recommendation.implementation && (
                      <details className="recommendation-implementation">
                        <summary>Implementation Example</summary>
                        <pre>{recommendation.implementation}</pre>
                      </details>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data-message">No optimization recommendations available.</p>
        )}
      </div>

      <div className="performance-monitor-actions">
        <button 
          className="clear-button" 
          onClick={() => {
            performanceMonitor.clearData();
            setPerformanceData(null);
          }}
        >
          Clear Data
        </button>
      </div>
    </div>
  );
};