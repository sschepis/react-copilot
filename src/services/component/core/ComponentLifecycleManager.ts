import { ModifiableComponent } from '../../../utils/types';
import { logger, LogCategory } from '../../../utils/LoggingSystem';

/**
 * Component lifecycle hook types
 */
export enum ComponentLifecycleHook {
  BEFORE_REGISTER = 'beforeRegister',
  AFTER_REGISTER = 'afterRegister',
  BEFORE_UPDATE = 'beforeUpdate',
  AFTER_UPDATE = 'afterUpdate',
  BEFORE_VERSION_CREATE = 'beforeVersionCreate',
  AFTER_VERSION_CREATE = 'afterVersionCreate',
  BEFORE_CODE_CHANGE = 'beforeCodeChange',
  AFTER_CODE_CHANGE = 'afterCodeChange',
  BEFORE_UNREGISTER = 'beforeUnregister',
  RENDER = 'render'
}

/**
 * Component lifecycle hook callback function type
 */
export type ComponentLifecycleCallback = (
  component: ModifiableComponent,
  data?: any
) => Promise<void> | void;

/**
 * Manages component lifecycle hooks
 */
export class ComponentLifecycleManager {
  private lifecycleHooks: Map<ComponentLifecycleHook, Set<ComponentLifecycleCallback>> = new Map();
  private log = logger.getChildLogger(LogCategory.COMPONENT);
  
  /**
   * Create a new ComponentLifecycleManager
   */
  constructor() {
    // Initialize lifecycle hook maps
    Object.values(ComponentLifecycleHook).forEach(hook => {
      this.lifecycleHooks.set(hook, new Set());
    });
  }
  
  /**
   * Register a lifecycle hook
   * @param hook The lifecycle hook to register for
   * @param callback The callback function
   */
  registerLifecycleHook(hook: ComponentLifecycleHook, callback: ComponentLifecycleCallback): void {
    const hooks = this.lifecycleHooks.get(hook);
    if (hooks) {
      hooks.add(callback);
    }
  }
  
  /**
   * Unregister a lifecycle hook
   * @param hook The lifecycle hook to unregister from
   * @param callback The callback function to remove
   */
  unregisterLifecycleHook(hook: ComponentLifecycleHook, callback: ComponentLifecycleCallback): boolean {
    const hooks = this.lifecycleHooks.get(hook);
    if (hooks) {
      return hooks.delete(callback);
    }
    return false;
  }
  
  /**
   * Run lifecycle hooks for a component
   * @param hook The lifecycle hook to run
   * @param component The component
   * @param data Additional data to pass to hooks
   * @returns True if all hooks completed successfully
   */
  async runLifecycleHook(
    hook: ComponentLifecycleHook,
    component: ModifiableComponent,
    data?: any
  ): Promise<boolean> {
    const hooks = this.lifecycleHooks.get(hook);
    if (!hooks || hooks.size === 0) {
      return true;
    }
    
    try {
      for (const callback of hooks) {
        const result = callback(component, data);
        if (result instanceof Promise) {
          await result;
        }
      }
      return true;
    } catch (error) {
      this.log.error(`Error running lifecycle hook ${hook} for component ${component.id}`, error);
      return false;
    }
  }
}

export default ComponentLifecycleManager;