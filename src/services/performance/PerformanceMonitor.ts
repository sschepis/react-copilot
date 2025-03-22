import { ModifiableComponent, PerformanceProfile } from '../../utils/types';
import { EventBus } from '../../utils/EventBus';
import { LoggingSystem, LogCategory } from '../../utils/LoggingSystem';

/**
 * Performance metric type
 */
export enum MetricType {
  RENDER_TIME = 'renderTime',
  COMPONENT_LOAD = 'componentLoad',
  STATE_UPDATE = 'stateUpdate',
  PROP_UPDATE = 'propUpdate',
  EVENT_HANDLER = 'eventHandler',
  EFFECT_EXECUTION = 'effectExecution',
}

/**
 * Performance data point structure
 */
interface PerformanceDataPoint {
  componentId: string;
  type: MetricType;
  value: number; // Value in milliseconds
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Component performance data
 */
interface ComponentPerformanceData {
  renderTimes: number[];
  stateUpdates: {
    key: string;
    frequency: number;
    avgTime: number;
  }[];
  propUpdates: {
    key: string;
    frequency: number;
  }[];
  totalRenders: number;
  lastRenderTime: number;
  memoizationEffectiveness: number;
  recommendations: {
    type: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    implementation?: string;
  }[];
}

/**
 * Performance thresholds
 */
interface PerformanceThresholds {
  renderTime: number; // milliseconds
  renderFrequency: number; // per second
  propUpdates: number; // per render
  stateUpdates: number; // per render
  effectUpdates: number; // per render
}

/**
 * Performance monitoring service
 * Tracks and analyzes component performance metrics
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceDataPoint[]> = new Map();
  private componentData: Map<string, ComponentPerformanceData> = new Map();
  private eventBus: EventBus;
  private logger = LoggingSystem.getInstance().getChildLogger(LogCategory.PERFORMANCE);
  private isMonitoring: boolean = false;
  private sampleInterval: number = 100; // milliseconds
  private sampleTimer: NodeJS.Timeout | null = null;
  private thresholds: PerformanceThresholds = {
    renderTime: 16, // ~60fps
    renderFrequency: 5, // 5 renders per second max
    propUpdates: 3, // 3 prop updates per render max
    stateUpdates: 2, // 2 state updates per render max
    effectUpdates: 2, // 2 effect updates per render max
  };

  /**
   * Get the singleton instance
   */
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.logger.info('Performance monitor initialized');
  }

  /**
   * Start performance monitoring
   */
  public startMonitoring(sampleInterval: number = 100): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.sampleInterval = sampleInterval;
    
    // Start the sampling timer
    this.sampleTimer = setInterval(() => {
      this.analyzePerformanceData();
    }, this.sampleInterval);
    
    this.logger.info('Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.sampleTimer) {
      clearInterval(this.sampleTimer);
      this.sampleTimer = null;
    }
    
    this.logger.info('Performance monitoring stopped');
  }

  /**
   * Set performance thresholds
   */
  public setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = {
      ...this.thresholds,
      ...thresholds,
    };
  }

  /**
   * Record a performance metric
   */
  public recordMetric(
    componentId: string,
    type: MetricType,
    value: number,
    metadata?: Record<string, any>
  ): void {
    if (!this.isMonitoring) return;
    
    const dataPoint: PerformanceDataPoint = {
      componentId,
      type,
      value,
      timestamp: Date.now(),
      metadata,
    };
    
    // Add to metrics collection
    const componentMetrics = this.metrics.get(componentId) || [];
    componentMetrics.push(dataPoint);
    this.metrics.set(componentId, componentMetrics);
    
    // Update component data based on metric type
    this.updateComponentData(componentId, dataPoint);
  }

  /**
   * Update component data based on new metric
   */
  private updateComponentData(componentId: string, dataPoint: PerformanceDataPoint): void {
    // Get or initialize component data
    let data = this.componentData.get(componentId);
    
    if (!data) {
      data = {
        renderTimes: [],
        stateUpdates: [],
        propUpdates: [],
        totalRenders: 0,
        lastRenderTime: 0,
        memoizationEffectiveness: 1, // Default to 100% effective
        recommendations: [],
      };
    }
    
    // Update data based on metric type
    switch (dataPoint.type) {
      case MetricType.RENDER_TIME:
        data.renderTimes.push(dataPoint.value);
        data.totalRenders++;
        data.lastRenderTime = dataPoint.timestamp;
        break;
        
      case MetricType.STATE_UPDATE:
        if (dataPoint.metadata?.key) {
          const key = dataPoint.metadata.key as string;
          const existingUpdate = data.stateUpdates.find(u => u.key === key);
          
          if (existingUpdate) {
            existingUpdate.frequency++;
            existingUpdate.avgTime = (existingUpdate.avgTime + dataPoint.value) / 2;
          } else {
            data.stateUpdates.push({
              key,
              frequency: 1,
              avgTime: dataPoint.value,
            });
          }
        }
        break;
        
      case MetricType.PROP_UPDATE:
        if (dataPoint.metadata?.key) {
          const key = dataPoint.metadata.key as string;
          const existingUpdate = data.propUpdates.find(u => u.key === key);
          
          if (existingUpdate) {
            existingUpdate.frequency++;
          } else {
            data.propUpdates.push({
              key,
              frequency: 1,
            });
          }
        }
        break;
    }
    
    // Save updated data
    this.componentData.set(componentId, data);
  }

  /**
   * Analyze performance data and generate recommendations
   */
  private analyzePerformanceData(): void {
    for (const [componentId, data] of this.componentData.entries()) {
      // Skip components with fewer than 5 renders
      if (data.totalRenders < 5) continue;
      
      const recommendations: {
        type: string;
        description: string;
        priority: 'low' | 'medium' | 'high';
        implementation?: string;
      }[] = [];
      
      // Calculate average render time
      const avgRenderTime = data.renderTimes.reduce((sum, time) => sum + time, 0) / data.renderTimes.length;
      
      // Check for slow renders
      if (avgRenderTime > this.thresholds.renderTime) {
        recommendations.push({
          type: 'optimization',
          description: `Slow renders detected (avg: ${avgRenderTime.toFixed(2)}ms). Consider optimizing rendering logic.`,
          priority: avgRenderTime > this.thresholds.renderTime * 2 ? 'high' : 'medium',
          implementation: `
// Consider using React.memo to prevent unnecessary re-renders
export const ${componentId} = React.memo((props) => {
  // Component implementation
});

// Or use useMemo for expensive calculations
const expensiveValue = useMemo(() => computeExpensiveValue(props), [props.dependency]);
          `.trim(),
        });
      }
      
      // Check for frequent state updates
      const frequentStateUpdates = data.stateUpdates.filter(u => u.frequency > this.thresholds.stateUpdates);
      
      if (frequentStateUpdates.length > 0) {
        recommendations.push({
          type: 'state-management',
          description: `Frequent state updates detected for keys: ${frequentStateUpdates.map(u => u.key).join(', ')}. Consider batching updates or using a reducer.`,
          priority: 'medium',
          implementation: `
// Consider using useReducer instead of multiple useState
const initialState = { /* your state */ };
const reducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_MULTIPLE':
      return { ...state, ...action.payload };
    // other cases
    default:
      return state;
  }
};

const [state, dispatch] = useReducer(reducer, initialState);

// Then batch your updates
dispatch({ type: 'UPDATE_MULTIPLE', payload: { key1: value1, key2: value2 } });
          `.trim(),
        });
      }
      
      // Check for frequent prop updates
      const frequentPropUpdates = data.propUpdates.filter(u => u.frequency > this.thresholds.propUpdates);
      
      if (frequentPropUpdates.length > 0) {
        recommendations.push({
          type: 'props-optimization',
          description: `Frequent prop updates detected for keys: ${frequentPropUpdates.map(u => u.key).join(', ')}. Consider using memoization or restructuring your component hierarchy.`,
          priority: 'medium',
        });
      }
      
      // Update recommendations
      data.recommendations = recommendations;
      this.componentData.set(componentId, data);
      
      // Emit event for any UI to pick up
      this.eventBus.publish('performance:update', {
        componentId,
        profile: this.getComponentProfile(componentId),
      });
    }
  }

  /**
   * Get performance profile for a component
   */
  public getComponentProfile(componentId: string): PerformanceProfile | null {
    const data = this.componentData.get(componentId);
    
    if (!data) return null;
    
    // Calculate average render time
    const avgRenderTime = data.renderTimes.reduce((sum, time) => sum + time, 0) / data.renderTimes.length || 0;
    
    // Calculate update frequencies for state keys
    const stateAccessPatterns: Record<string, number> = {};
    data.stateUpdates.forEach(update => {
      stateAccessPatterns[update.key] = update.frequency;
    });
    
    return {
      componentId,
      renderCount: data.totalRenders,
      averageRenderTime: avgRenderTime,
      memoizationEffectiveness: data.memoizationEffectiveness,
      stateAccessPatterns,
      recommendedOptimizations: data.recommendations,
    };
  }

  /**
   * Get performance profiles for all monitored components
   */
  public getAllComponentProfiles(): Record<string, PerformanceProfile> {
    const profiles: Record<string, PerformanceProfile> = {};
    
    for (const componentId of this.componentData.keys()) {
      const profile = this.getComponentProfile(componentId);
      if (profile) {
        profiles[componentId] = profile;
      }
    }
    
    return profiles;
  }
  
  /**
   * Clear all performance data
   */
  public clearData(): void {
    this.metrics.clear();
    this.componentData.clear();
    this.logger.info('Performance data cleared');
  }
}