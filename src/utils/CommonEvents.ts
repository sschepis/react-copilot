/**
 * Common event types used throughout the application
 * This facilitates standardized communication between components
 */
export enum CommonEvents {
  // System lifecycle events
  SYSTEM_INITIALIZED = 'system:initialized',
  SYSTEM_ERROR = 'system:error',
  SYSTEM_WARNING = 'system:warning',
  SYSTEM_READY = 'system:ready',
  SYSTEM_SHUTDOWN = 'system:shutdown',
  
  // Component events
  COMPONENT_REGISTERED = 'component:registered',
  COMPONENT_UNREGISTERED = 'component:unregistered',
  COMPONENT_UPDATED = 'component:updated',
  COMPONENT_REMOVED = 'component:removed',
  COMPONENT_ERROR = 'component:error',
  COMPONENT_CODE_CHANGED = 'component:code_changed',
  COMPONENT_PROPS_CHANGED = 'component:props_changed',
  COMPONENT_STATE_CHANGED = 'component:state_changed',
  COMPONENT_SELECTED = 'component:selected',
  COMPONENT_DESELECTED = 'component:deselected',
  COMPONENT_VERSION_CREATED = 'component:version:created',
  COMPONENT_VERSION_REVERTED = 'component:version:reverted',
  
  // Code change events
  CODE_CHANGE_REQUESTED = 'code:change:requested',
  CODE_CHANGE_APPLIED = 'code:change:applied',
  CODE_CHANGE_FAILED = 'code:change:failed',
  CODE_VALIDATION_FAILED = 'code:validation:failed',
  
  // State events
  STATE_CHANGED = 'state:changed',
  STATE_ACTION_EXECUTED = 'state:action:executed',
  STATE_SNAPSHOT_CREATED = 'state:snapshot_created',
  STATE_RESTORED = 'state:restored',
  STATE_RESET = 'state:reset',
  
  // LLM events
  LLM_REQUEST_STARTED = 'llm:request:started',
  LLM_REQUEST_COMPLETED = 'llm:request:completed',
  LLM_REQUEST_FAILED = 'llm:request:failed',
  LLM_RESPONSE_RECEIVED = 'llm:response_received',
  LLM_STREAMING_UPDATE = 'llm:streaming_update',
  LLM_PROVIDER_CHANGED = 'llm:provider:changed',
  
  // UI events
  UI_PANEL_TOGGLED = 'ui:panel_toggled',
  UI_THEME_CHANGED = 'ui:theme_changed',
  UI_ZOOM_CHANGED = 'ui:zoom_changed',
  UI_VIEWPORT_CHANGED = 'ui:viewport_changed',
  UI_CHAT_OPENED = 'ui:chat:opened',
  UI_CHAT_CLOSED = 'ui:chat:closed',
  UI_CHAT_MESSAGE_SENT = 'ui:chat:message:sent',
  UI_CHAT_MESSAGE_RECEIVED = 'ui:chat:message:received',
  UI_DEBUG_PANEL_OPENED = 'ui:debug:opened',
  UI_DEBUG_PANEL_CLOSED = 'ui:debug:closed',
  
  // Performance events
  PERFORMANCE_THRESHOLD_EXCEEDED = 'performance:threshold:exceeded',
  PERFORMANCE_METRICS_UPDATED = 'performance:metrics:updated',
  PERFORMANCE_METRIC_RECORDED = 'performance:metric_recorded',
  
  // Versioning events
  VERSION_CREATED = 'version:created',
  VERSION_REVERTED = 'version:reverted',
  VERSION_BRANCHED = 'version:branched',
  VERSION_MERGED = 'version:merged',
  VERSION_COMPARED = 'version:compared',
  
  // Relationship events
  RELATIONSHIP_DETECTED = 'relationship:detected',
  RELATIONSHIP_CHANGED = 'relationship:changed',
  RELATIONSHIP_LOST = 'relationship:lost',
  
  // Plugin events
  PLUGIN_REGISTERED = 'plugin:registered',
  PLUGIN_INITIALIZED = 'plugin:initialized',
  PLUGIN_ACTIVATED = 'plugin:activated',
  PLUGIN_DEACTIVATED = 'plugin:deactivated',
  PLUGIN_DISABLED = 'plugin:disabled',
  PLUGIN_REMOVED = 'plugin:removed',
  PLUGIN_ERROR = 'plugin:error'
}