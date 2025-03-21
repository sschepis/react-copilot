import { Plugin, PluginHooks, PluginContext } from '../../../utils/types';
/**
 * Configuration options for the internationalization plugin
 */
export interface InternationalizationPluginOptions {
    /** The i18n library to use */
    library: 'react-i18next' | 'react-intl' | 'lingui' | 'custom';
    /** Default language */
    defaultLanguage: string;
    /** Supported languages */
    supportedLanguages: string[];
    /** Directory for translation files */
    translationsDir: string;
    /** Whether to enable auto-extraction of strings */
    autoExtract: boolean;
    /** Whether to enable RTL support */
    rtlSupport: boolean;
    /** Custom translation function name */
    translationFunctionName?: string;
    /** Whether to add namespace imports automatically */
    autoNamespaceImport?: boolean;
    /** Whether to wrap extracted strings automatically */
    autoWrapStrings?: boolean;
    /** Pattern to identify text that should not be translated */
    excludePattern?: string;
}
/**
 * Plugin for handling internationalization in components
 */
export declare class InternationalizationPlugin implements Plugin {
    id: string;
    name: string;
    version: string;
    private options;
    private extractedTranslations;
    private context;
    /**
     * Plugin hooks implementation
     */
    hooks: PluginHooks;
    /**
     * Create a new InternationalizationPlugin
     * @param options Internationalization plugin options
     */
    constructor(options?: Partial<InternationalizationPluginOptions>);
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
     * Extract translatable text from component code
     * @param code Component source code
     * @returns Array of detected texts
     */
    private extractTranslatableTexts;
    /**
     * Store extracted translations for later saving
     * @param component The component containing the texts
     * @param detectedTexts The detected translatable texts
     */
    private storeExtractedTranslations;
    /**
     * Generate a translation key from component name and text
     * @param componentName The name of the component
     * @param text The text to generate a key for
     * @returns A translation key
     */
    private generateTranslationKey;
    /**
     * Get the translation function call for a text
     * @param text The text to translate
     * @returns The translation function call
     */
    private getTranslationFunctionCall;
    /**
     * Wrap strings with translation function
     * @param code The original code
     * @param detectedTexts The detected translatable texts
     * @returns Code with wrapped strings
     */
    private wrapStringsWithTranslationFunction;
    /**
     * Save extracted translations to JSON files
     */
    private saveExtractedTranslations;
    /**
     * Get statistics about extracted translations
     * @returns Translation statistics
     */
    getTranslationStats(): {
        totalTranslations: number;
        translatedFiles: number;
        supportedLanguages: string[];
        defaultLanguage: string;
    };
    /**
     * Add a new supported language
     * @param language Language code to add
     */
    addLanguage(language: string): void;
    /**
     * Generate code for setting up i18n in a React application
     * @returns Code for i18n setup
     */
    generateI18nSetupCode(): string;
}
