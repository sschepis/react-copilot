import { nanoid } from 'nanoid';
import { ComponentVersion } from '../../utils/types';
import { EventEmitter } from '../../utils/EventEmitter';
import { diff as createDiff } from 'jest-diff';

/**
 * Events emitted by the VersionControl system
 */
export enum VersionControlEvents {
  VERSION_CREATED = 'version_created',
  VERSION_REVERTED = 'version_reverted',
  BRANCH_CREATED = 'branch_created',
  MERGE_COMPLETED = 'merge_completed',
  ERROR = 'error',
}

/**
 * Interface for a version comparison result
 */
export interface VersionDiff {
  componentId: string;
  fromVersionId: string;
  toVersionId: string;
  diff: string; // String representation of the diff
  addedLines: number;
  removedLines: number;
  changedLines: number;
}

/**
 * Interface for a version branch
 */
export interface VersionBranch {
  id: string;
  name: string;
  rootVersionId: string;
  versionIds: string[]; // IDs of versions in this branch
  createdAt: number;
}

/**
 * Manages component version history, branching, and merging
 */
export class VersionControl extends EventEmitter {
  private versionHistory: Map<string, ComponentVersion[]> = new Map(); // componentId -> versions
  private branches: Map<string, VersionBranch> = new Map(); // branchId -> branch
  private componentBranches: Map<string, Set<string>> = new Map(); // componentId -> Set<branchId>
  
  /**
   * Create a new version of a component
   * @param componentId The ID of the component
   * @param sourceCode The source code for the new version
   * @param description A description of the changes
   * @param author Optional author of the changes
   * @param parentVersionId Optional ID of the parent version
   * @returns The newly created version
   */
  createVersion(
    componentId: string, 
    sourceCode: string, 
    description: string, 
    author?: string,
    parentVersionId?: string
  ): ComponentVersion {
    // Initialize version history for this component if needed
    if (!this.versionHistory.has(componentId)) {
      this.versionHistory.set(componentId, []);
    }
    
    const versions = this.versionHistory.get(componentId)!;
    
    // Create new version
    const version: ComponentVersion = {
      id: nanoid(),
      timestamp: Date.now(),
      sourceCode,
      description,
      author,
    };
    
    // Add to version history at the beginning (newest first)
    versions.unshift(version);
    
    // Emit version creation event
    this.emit(VersionControlEvents.VERSION_CREATED, {
      componentId,
      versionId: version.id,
    });
    
    return version;
  }
  
  /**
   * Get version history for a component
   * @param componentId The ID of the component
   * @returns Array of versions or empty array if component not found
   */
  getVersionHistory(componentId: string): ComponentVersion[] {
    return this.versionHistory.get(componentId) || [];
  }
  
  /**
   * Get a specific version of a component
   * @param componentId The ID of the component
   * @param versionId The ID of the version
   * @returns The version or null if not found
   */
  getVersion(componentId: string, versionId: string): ComponentVersion | null {
    const versions = this.getVersionHistory(componentId);
    return versions.find(v => v.id === versionId) || null;
  }
  
  /**
   * Compare two versions of a component
   * @param componentId The ID of the component
   * @param fromVersionId The ID of the older version
   * @param toVersionId The ID of the newer version
   * @returns Version diff or null if versions not found
   */
  compareVersions(
    componentId: string, 
    fromVersionId: string, 
    toVersionId: string
  ): VersionDiff | null {
    const fromVersion = this.getVersion(componentId, fromVersionId);
    const toVersion = this.getVersion(componentId, toVersionId);
    
    if (!fromVersion || !toVersion) {
      return null;
    }
    
    // Create diff between versions
    const diffResult = createDiff(fromVersion.sourceCode, toVersion.sourceCode);
    
    // Ensure diffResult is a string (jest-diff can return null)
    const diffString = diffResult || `No differences found between versions ${fromVersionId} and ${toVersionId}`;
    
    // Count added/removed/changed lines
    const diffLines = diffString.split('\n');
    
    let addedLines = 0;
    let removedLines = 0;
    let changedLines = 0;
    
    for (const line of diffLines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        addedLines++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        removedLines++;
      } else if (line.startsWith('!')) {
        changedLines++;
      }
    }
    
    return {
      componentId,
      fromVersionId,
      toVersionId,
      diff: diffString,
      addedLines,
      removedLines,
      changedLines,
    };
  }
  
  /**
   * Create a branch from a specific version
   * @param componentId The ID of the component
   * @param versionId The ID of the version to branch from
   * @param branchName Name for the new branch
   * @returns ID of the new branch
   */
  createBranch(
    componentId: string, 
    versionId: string, 
    branchName: string
  ): string {
    // Check if version exists
    const version = this.getVersion(componentId, versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found for component ${componentId}`);
    }
    
    // Create branch
    const branchId = nanoid();
    const branch: VersionBranch = {
      id: branchId,
      name: branchName,
      rootVersionId: versionId,
      versionIds: [versionId],
      createdAt: Date.now(),
    };
    
    // Store branch
    this.branches.set(branchId, branch);
    
    // Associate branch with component
    if (!this.componentBranches.has(componentId)) {
      this.componentBranches.set(componentId, new Set());
    }
    this.componentBranches.get(componentId)!.add(branchId);
    
    // Emit branch created event
    this.emit(VersionControlEvents.BRANCH_CREATED, {
      componentId,
      branchId,
      branchName,
      versionId,
    });
    
    return branchId;
  }
  
  /**
   * Get all branches for a component
   * @param componentId The ID of the component
   * @returns Array of branches
   */
  getBranches(componentId: string): VersionBranch[] {
    const branchIds = this.componentBranches.get(componentId);
    if (!branchIds) {
      return [];
    }
    
    return Array.from(branchIds)
      .map(id => this.branches.get(id)!)
      .filter(Boolean);
  }
  
  /**
   * Add a version to a branch
   * @param branchId The ID of the branch
   * @param versionId The ID of the version to add
   */
  addVersionToBranch(branchId: string, versionId: string): void {
    const branch = this.branches.get(branchId);
    if (!branch) {
      throw new Error(`Branch ${branchId} not found`);
    }
    
    // Add version to branch if not already present
    if (!branch.versionIds.includes(versionId)) {
      branch.versionIds.push(versionId);
      this.branches.set(branchId, branch);
    }
  }
  
  /**
   * Merge changes from one branch to another
   * @param componentId The ID of the component
   * @param sourceBranchId The ID of the source branch
   * @param targetBranchId The ID of the target branch
   * @param mergeMessage Description of the merge
   * @returns ID of the new merged version
   */
  mergeBranches(
    componentId: string,
    sourceBranchId: string,
    targetBranchId: string,
    mergeMessage: string
  ): string {
    const sourceBranch = this.branches.get(sourceBranchId);
    const targetBranch = this.branches.get(targetBranchId);
    
    if (!sourceBranch || !targetBranch) {
      throw new Error('Source or target branch not found');
    }
    
    // Get latest versions from each branch
    const sourceVersionId = sourceBranch.versionIds[sourceBranch.versionIds.length - 1];
    const targetVersionId = targetBranch.versionIds[targetBranch.versionIds.length - 1];
    
    const sourceVersion = this.getVersion(componentId, sourceVersionId);
    const targetVersion = this.getVersion(componentId, targetVersionId);
    
    if (!sourceVersion || !targetVersion) {
      throw new Error('Source or target version not found');
    }
    
    // For a real implementation, we would perform a proper merge here.
    // For simplicity, we'll just use the source version's code as the merge result.
    // In a production system, you would use a proper diff/merge algorithm.
    
    // Create a new version representing the merge
    const mergedVersion = this.createVersion(
      componentId,
      sourceVersion.sourceCode,
      `Merged branch '${sourceBranch.name}' into '${targetBranch.name}': ${mergeMessage}`,
      undefined, // author
      targetVersionId // parent version
    );
    
    // Add the new version to the target branch
    this.addVersionToBranch(targetBranchId, mergedVersion.id);
    
    // Emit merge completed event
    this.emit(VersionControlEvents.MERGE_COMPLETED, {
      componentId,
      sourceBranchId,
      targetBranchId,
      mergedVersionId: mergedVersion.id,
    });
    
    return mergedVersion.id;
  }
  
  /**
   * Get the latest version of a component
   * @param componentId The ID of the component
   * @returns The latest version or null if none exists
   */
  getLatestVersion(componentId: string): ComponentVersion | null {
    const versions = this.getVersionHistory(componentId);
    return versions.length > 0 ? versions[0] : null;
  }
  
  /**
   * Create a summary of version history for a component
   * @param componentId The ID of the component
   * @returns Summary of the version history
   */
  getVersionSummary(componentId: string): {
    totalVersions: number;
    branches: number;
    latestVersion: ComponentVersion | null;
    firstVersion: ComponentVersion | null;
  } {
    const versions = this.getVersionHistory(componentId);
    const branches = this.getBranches(componentId);
    
    return {
      totalVersions: versions.length,
      branches: branches.length,
      latestVersion: versions.length > 0 ? versions[0] : null,
      firstVersion: versions.length > 0 ? versions[versions.length - 1] : null,
    };
  }
}