import { Plugin, PluginHooks, PluginContext } from '../../../utils/types';
/**
 * Configuration options for the documentation plugin
 */
export interface DocumentationPluginOptions {
    /** Whether to automatically generate JSDoc/TSDoc comments */
    generateJsDocs?: boolean;
    /** Whether to create/update README.md files for component directories */
    generateReadmes?: boolean;
    /** Whether to create usage examples */
    generateExamples?: boolean;
    /** Directory where documentation files should be saved (relative to project root) */
    docsDirectory?: string;
    /** Level of detail for documentation generation */
    detailLevel?: 'minimal' | 'standard' | 'verbose';
    /** Custom templates for different documentation types */
    templates?: {
        jsDoc?: string;
        readme?: string;
        example?: string;
    };
}
/**
 * Plugin that generates and maintains documentation for components
 */
export declare class DocumentationPlugin implements Plugin {
    id: string;
    name: string;
    version: string;
    private options;
    private componentMetadata;
    private context;
    /**
     * Plugin hooks implementation
     */
    hooks: PluginHooks;
    /**
     * Create a new DocumentationPlugin
     * @param options Plugin configuration options
     */
    constructor(options?: DocumentationPluginOptions);
    /**
     * Initialize the plugin with context
     * @param context The plugin context
     */
    initialize(context: PluginContext): Promise<void>;
    /**
     * Clean up plugin resources
     */
    destroy(): Promise<void>;
    /**
     * Extract metadata from a component's source code
     * @param component The component to analyze
     * @returns Extracted component metadata
     */
    private extractComponentMetadata;
    /**
     * Extract component description from code or comments
     * @param sourceCode Component source code
     * @returns Description for the component
     */
    private extractDescription;
    /**
     * Extract props information from component code
     * @param sourceCode Component source code
     * @returns Array of props information
     */
    private extractProps;
    /**
     * Extract React hook usage from component code
     * @param sourceCode Component source code
     * @returns Array of hook names used
     */
    private extractHooks;
    /**
     * Extract dependencies from import statements
     * @param sourceCode Component source code
     * @returns Array of dependencies
     */
    private extractDependencies;
    /**
     * Check if code already has JSDoc comments
     * @param code Component source code
     * @returns Whether the code has JSDoc comments
     */
    private hasJsDocComments;
    /**
     * Generate basic JSDoc comment for a component
     * @param code Component source code
     * @returns Code with added JSDoc comments
     */
    private generateBasicJsDoc;
    /**
     * Schedule documentation generation for a component
     * @param componentId The ID of the component
     */
    private scheduleDocGeneration;
    /**
     * Generate comprehensive documentation for a component
     * @param componentId The ID of the component
     */
    private generateComponentDocs;
    /**
     * Generate complete documentation for a component
     * @param metadata Component metadata
     * @param sourceCode Component source code
     * @returns Generated documentation
     */
    private generateDocs;
    /**
     * Set documentation generation options
     * @param options New options to apply
     */
    setOptions(options: Partial<DocumentationPluginOptions>): void;
    /**
     * Manually generate documentation for all components
     */
    generateAllDocs(): Promise<void>;
}
