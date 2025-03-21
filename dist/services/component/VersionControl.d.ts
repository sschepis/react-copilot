import { ComponentVersion } from '../../utils/types';
import { EventEmitter } from '../../utils/EventEmitter';
/**
 * Events emitted by the VersionControl system
 */
export declare enum VersionControlEvents {
    VERSION_CREATED = "version_created",
    VERSION_REVERTED = "version_reverted",
    BRANCH_CREATED = "branch_created",
    MERGE_COMPLETED = "merge_completed",
    ERROR = "error"
}
/**
 * Interface for a version comparison result
 */
export interface VersionDiff {
    componentId: string;
    fromVersionId: string;
    toVersionId: string;
    diff: string;
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
    versionIds: string[];
    createdAt: number;
}
/**
 * Manages component version history, branching, and merging
 */
export declare class VersionControl extends EventEmitter {
    private versionHistory;
    private branches;
    private componentBranches;
    /**
     * Create a new version of a component
     * @param componentId The ID of the component
     * @param sourceCode The source code for the new version
     * @param description A description of the changes
     * @param author Optional author of the changes
     * @param parentVersionId Optional ID of the parent version
     * @returns The newly created version
     */
    createVersion(componentId: string, sourceCode: string, description: string, author?: string, parentVersionId?: string): ComponentVersion;
    /**
     * Get version history for a component
     * @param componentId The ID of the component
     * @returns Array of versions or empty array if component not found
     */
    getVersionHistory(componentId: string): ComponentVersion[];
    /**
     * Get a specific version of a component
     * @param componentId The ID of the component
     * @param versionId The ID of the version
     * @returns The version or null if not found
     */
    getVersion(componentId: string, versionId: string): ComponentVersion | null;
    /**
     * Compare two versions of a component
     * @param componentId The ID of the component
     * @param fromVersionId The ID of the older version
     * @param toVersionId The ID of the newer version
     * @returns Version diff or null if versions not found
     */
    compareVersions(componentId: string, fromVersionId: string, toVersionId: string): VersionDiff | null;
    /**
     * Create a branch from a specific version
     * @param componentId The ID of the component
     * @param versionId The ID of the version to branch from
     * @param branchName Name for the new branch
     * @returns ID of the new branch
     */
    createBranch(componentId: string, versionId: string, branchName: string): string;
    /**
     * Get all branches for a component
     * @param componentId The ID of the component
     * @returns Array of branches
     */
    getBranches(componentId: string): VersionBranch[];
    /**
     * Add a version to a branch
     * @param branchId The ID of the branch
     * @param versionId The ID of the version to add
     */
    addVersionToBranch(branchId: string, versionId: string): void;
    /**
     * Merge changes from one branch to another
     * @param componentId The ID of the component
     * @param sourceBranchId The ID of the source branch
     * @param targetBranchId The ID of the target branch
     * @param mergeMessage Description of the merge
     * @returns ID of the new merged version
     */
    mergeBranches(componentId: string, sourceBranchId: string, targetBranchId: string, mergeMessage: string): string;
    /**
     * Get the latest version of a component
     * @param componentId The ID of the component
     * @returns The latest version or null if none exists
     */
    getLatestVersion(componentId: string): ComponentVersion | null;
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
    };
}
