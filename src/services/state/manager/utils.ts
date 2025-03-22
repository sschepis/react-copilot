/**
 * Utility functions for state management
 */

import { StatePath } from '../types/state-path';

/**
 * Normalize a state path to string format
 * @param path Path to normalize (string or string array)
 * @returns Normalized path string
 */
export function normalizeStatePath(path: StatePath): string {
  if (Array.isArray(path)) {
    return path.join('.');
  }
  return path;
}

/**
 * Deep clone a value
 * @param value Value to clone
 * @returns Deep copy of the value
 */
export function deepClone<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }
  
  if (Array.isArray(value)) {
    return value.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof value === 'object') {
    const result: Record<string, any> = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        result[key] = deepClone((value as Record<string, any>)[key]);
      }
    }
    return result as T;
  }
  
  return value;
}

/**
 * Deep equality check
 * @param a First value to compare
 * @param b Second value to compare
 * @returns Whether values are deeply equal
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) {
    return true;
  }
  
  if (a === null || b === null || a === undefined || b === undefined) {
    return a === b;
  }
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) {
        return false;
      }
    }
    
    return true;
  }
  
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) {
      return false;
    }
    
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) {
        return false;
      }
      
      if (!deepEqual(a[key], b[key])) {
        return false;
      }
    }
    
    return true;
  }
  
  return false;
}

/**
 * Get a value from an object by path
 * @param obj Object to get value from
 * @param path Path to the value (dot notation)
 * @param defaultValue Default value if path doesn't exist
 * @returns Value at path or default value
 */
export function getValueByPath(obj: any, path: string, defaultValue?: any): any {
  if (!obj || !path) {
    return defaultValue;
  }
  
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    
    if (!Object.prototype.hasOwnProperty.call(current, part)) {
      return defaultValue;
    }
    
    current = current[part];
  }
  
  return current === undefined ? defaultValue : current;
}

/**
 * Set a value in an object by path
 * @param obj Object to set value in
 * @param path Path to set value at (dot notation)
 * @param value Value to set
 * @returns Modified object
 */
export function setValueByPath(obj: any, path: string, value: any): any {
  if (!obj || !path) {
    return obj;
  }
  
  const result = deepClone(obj);
  const parts = path.split('.');
  let current = result;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    
    if (current[part] === undefined) {
      current[part] = {};
    } else if (typeof current[part] !== 'object') {
      // Convert non-objects to empty objects
      current[part] = {};
    }
    
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
  return result;
}

/**
 * Delete a value in an object by path
 * @param obj Object to delete value from
 * @param path Path to delete (dot notation)
 * @returns Modified object
 */
export function deleteValueByPath(obj: any, path: string): any {
  if (!obj || !path) {
    return obj;
  }
  
  const result = deepClone(obj);
  const parts = path.split('.');
  let current = result;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    
    if (current[part] === undefined || typeof current[part] !== 'object') {
      // Path doesn't exist, nothing to delete
      return result;
    }
    
    current = current[part];
  }
  
  const lastPart = parts[parts.length - 1];
  if (Object.prototype.hasOwnProperty.call(current, lastPart)) {
    delete current[lastPart];
  }
  
  return result;
}

/**
 * Memoize a function based on its arguments
 * @param fn Function to memoize
 * @param keyFn Optional function to generate cache key
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T, 
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}