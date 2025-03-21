import { nanoid } from 'nanoid';
import { 
  IVersionManager, 
  VersionCreationOptions, 
  VersionRevertOptions 
} from './types';
import { ComponentVersion } from '../../../utils/types';
import { IComponentStorage } from './types';

/**
 * Manages component version history
 */
export class VersionManager implements IVersionManager {
  private versionHistory: Map<string, ComponentVersion[]> = new Map();
  private componentStorage: IComponentStorage;

  /**
   * Create a new VersionManager
   * 
   * @param componentStorage Storage for component data
   */
  constructor(componentStorage: IComponentStorage) {
    this.componentStorage = componentStorage;
  }

  /**
   * Create a new version of a component
   * 
   * @param componentId The ID of the component
   * @param sourceCode The source code for the new version
   * @param description A description of the changes
   * @param options Optional settings for version creation
   * @returns The newly created version or null if component not found
   */
  createVersion(
    componentId: string, 
    sourceCode: string, 
    description: string, 
    options?: VersionCreationOptions
  ): ComponentVersion | null {
    // Check if component exists
    if (!this.componentStorage.hasComponent(componentId)) {
      return null;
    }

    const component = this.componentStorage.getComponent(componentId);
    if (!component) {
      return null;
    }

    // Default options
    const defaultOptions: VersionCreationOptions = {
      updateComponent: true,
      emitEvent: true,
    };
    const effectiveOptions = { ...defaultOptions, ...options };

    // Create new version object
    const version: ComponentVersion = {
      id: nanoid(),
      timestamp: Date.now(),
      sourceCode,
      description,
      author: effectiveOptions.author,
    };

    // Initialize version history for this component if needed
    if (!this.versionHistory.has(componentId)) {
      this.versionHistory.set(componentId, []);
    }

    // Add to version history
    const versions = this.versionHistory.get(componentId)!;
    versions.unshift(version); // Add new version at the beginning
    
    // Update component's versions array if requested
    if (effectiveOptions.updateComponent) {
      this.componentStorage.updateComponent(componentId, { 
        versions,
        sourceCode // Also update the current source code
      });
    }
    
    return version;
  }

  /**
   * Get version history for a component
   * 
   * @param componentId The ID of the component
   * @returns Array of versions or empty array if component not found
   */
  getVersionHistory(componentId: string): ComponentVersion[] {
    return this.versionHistory.get(componentId) || [];
  }

  /**
   * Revert to a specific version
   * 
   * @param componentId The ID of the component
   * @param versionId The ID of the version to revert to
   * @param options Optional settings for reversion
   * @returns True if revert was successful
   */
  revertToVersion(
    componentId: string, 
    versionId: string, 
    options?: VersionRevertOptions
  ): boolean {
    // Default options
    const defaultOptions: VersionRevertOptions = {
      createNewVersion: true,
      emitEvent: true,
    };
    const effectiveOptions = { ...defaultOptions, ...options };

    const versions = this.versionHistory.get(componentId);
    if (!versions) {
      return false;
    }

    const version = versions.find(v => v.id === versionId);
    if (!version) {
      return false;
    }

    // Update the component with the version's source code
    const success = this.componentStorage.updateComponent(componentId, {
      sourceCode: version.sourceCode
    });

    if (!success) {
      return false;
    }

    // Create a new version marking the revert if requested
    if (effectiveOptions.createNewVersion) {
      this.createVersion(
        componentId,
        version.sourceCode,
        `Reverted to version from ${new Date(version.timestamp).toLocaleString()}`,
        { 
          emitEvent: effectiveOptions.emitEvent,
          updateComponent: true
        }
      );
    }

    return true;
  }

  /**
   * Get a specific version
   * 
   * @param componentId The ID of the component
   * @param versionId The ID of the version
   * @returns The version or null if not found
   */
  getVersion(componentId: string, versionId: string): ComponentVersion | null {
    const versions = this.versionHistory.get(componentId);
    if (!versions) {
      return null;
    }

    return versions.find(v => v.id === versionId) || null;
  }

  /**
   * Clear version history for a component
   * 
   * @param componentId The ID of the component
   * @returns True if successful
   */
  clearComponentHistory(componentId: string): boolean {
    return this.versionHistory.delete(componentId);
  }

  /**
   * Clear all version history
   */
  clearAllHistory(): void {
    this.versionHistory.clear();
  }
}

export default VersionManager;