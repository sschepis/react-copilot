import { Plugin, PluginHooks, PluginContext, ModifiableComponent, CodeChangeResult } from '../../../utils/types';
import { promises as fs } from 'fs';
import path from 'path';

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
 * Translation entry
 */
interface TranslationEntry {
  key: string;
  text: string;
  description?: string;
  context?: string;
  file: string;
  line: number;
}

/**
 * Detected text for translation
 */
interface DetectedText {
  text: string;
  context: {
    before: string;
    after: string;
  };
  lineNumber: number;
}

/**
 * Plugin for handling internationalization in components
 */
export class InternationalizationPlugin implements Plugin {
  id = 'i18n-plugin';
  name = 'Internationalization Plugin';
  version = '1.0.0';
  
  private options: InternationalizationPluginOptions;
  private extractedTranslations: Map<string, TranslationEntry[]> = new Map();
  private context: PluginContext | null = null;
  
  /**
   * Plugin hooks implementation
   */
  hooks: PluginHooks = {
    // Extract translations during component registration
    beforeComponentRegistration: (component: ModifiableComponent): ModifiableComponent => {
      if (!component.sourceCode) {
        return component;
      }
      
      if (this.options.autoExtract) {
        // Extract hard-coded strings for translation
        const extractedTexts = this.extractTranslatableTexts(component.sourceCode);
        
        if (extractedTexts.length > 0) {
          this.storeExtractedTranslations(component, extractedTexts);
          
          // Automatically wrap strings with translation function if enabled
          if (this.options.autoWrapStrings) {
            const wrappedCode = this.wrapStringsWithTranslationFunction(component.sourceCode, extractedTexts);
            if (wrappedCode !== component.sourceCode) {
              return { ...component, sourceCode: wrappedCode };
            }
          }
        }
      }
      
      return component;
    },
    
    // Check for hard-coded strings before code execution
    beforeCodeExecution: (code: string): string => {
      if (!this.options.autoExtract) {
        return code;
      }
      
      // Extract hard-coded strings for translation
      const extractedTexts = this.extractTranslatableTexts(code);
      
      if (extractedTexts.length > 0) {
        console.log(`[I18nPlugin] Found ${extractedTexts.length} potential strings for translation`);
        
        // If auto-wrap is disabled, just add comments
        if (!this.options.autoWrapStrings) {
          const i18nComments = extractedTexts
            .map(text => `// I18N: Text "${text.text}" should be translated using ${this.getTranslationFunctionCall(text.text)}`)
            .join('\n');
            
          return `${i18nComments}\n\n${code}`;
        } else {
          // Auto-wrap strings with translation function
          return this.wrapStringsWithTranslationFunction(code, extractedTexts);
        }
      }
      
      return code;
    }
  };
  
  /**
   * Create a new InternationalizationPlugin
   * @param options Internationalization plugin options
   */
  constructor(options: Partial<InternationalizationPluginOptions> = {}) {
    this.options = {
      library: 'react-i18next',
      defaultLanguage: 'en',
      supportedLanguages: ['en'],
      translationsDir: './src/i18n',
      autoExtract: true,
      rtlSupport: false,
      translationFunctionName: 't',
      autoNamespaceImport: true,
      autoWrapStrings: false,
      ...options
    };
  }
  
  /**
   * Initialize the plugin with context
   * @param context The plugin context
   */
  async initialize(context: PluginContext): Promise<void> {
    console.log('[I18nPlugin] Initializing...');
    this.context = context;
    
    // Create translations directory if it doesn't exist
    try {
      await fs.mkdir(this.options.translationsDir, { recursive: true });
      
      // Create default language file if it doesn't exist
      const defaultLangPath = path.join(this.options.translationsDir, `${this.options.defaultLanguage}.json`);
      try {
        await fs.access(defaultLangPath);
      } catch (err) {
        // File doesn't exist, create it
        await fs.writeFile(defaultLangPath, '{}', 'utf8');
      }
    } catch (error) {
      console.error(`[I18nPlugin] Error creating translations directory: ${error}`);
    }
    
    console.log('[I18nPlugin] Initialized successfully');
  }
  
  /**
   * Clean up plugin resources
   */
  async destroy(): Promise<void> {
    console.log('[I18nPlugin] Cleaning up...');
    
    // Save any extracted translations
    await this.saveExtractedTranslations();
    
    this.context = null;
    console.log('[I18nPlugin] Clean up complete');
  }
  
  /**
   * Extract translatable text from component code
   * @param code Component source code
   * @returns Array of detected texts
   */
  private extractTranslatableTexts(code: string): DetectedText[] {
    const detectedTexts: DetectedText[] = [];
    
    // Skip if code is already using i18n functions extensively
    const i18nUsageCount = (code.match(new RegExp(`\\b${this.options.translationFunctionName}\\(`, 'g')) || []).length;
    const totalStringLiterals = (code.match(/["'`].*?["'`]/g) || []).length;
    
    // If more than 70% of string literals are already translated, skip extraction
    if (i18nUsageCount > totalStringLiterals * 0.7) {
      return detectedTexts;
    }
    
    // Define patterns for different types of text
    const patterns = [
      // JSX text content
      {
        regex: />([^<>{}\n]+)</g,
        process: (match: RegExpExecArray) => match[1].trim()
      },
      // String literals in props
      { 
        regex: /\b\w+=['"]([^'"{}]+)['"]/g,
        process: (match: RegExpExecArray) => match[1].trim()
      },
      // String literals in JS code
      {
        regex: /['"]([^'"{}]{3,})['"]/g,
        process: (match: RegExpExecArray) => match[1].trim()
      }
    ];
    
    // Extract texts using the patterns
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.regex.exec(code)) !== null) {
        const text = pattern.process(match);
        
        // Skip if text is short, numeric-only, or matches the exclude pattern
        if (
          !text || 
          text.length < 3 || 
          /^\d+$/.test(text) || 
          /^\s*$/.test(text) ||
          (this.options.excludePattern && new RegExp(this.options.excludePattern).test(text))
        ) {
          continue;
        }
        
        // Skip if the text is already wrapped in an i18n function
        const lineStart = code.lastIndexOf('\n', match.index) + 1;
        const lineEnd = code.indexOf('\n', match.index);
        const line = code.substring(lineStart, lineEnd === -1 ? code.length : lineEnd);
        
        if (line.includes(`${this.options.translationFunctionName}(`)) {
          continue;
        }
        
        // Get line number
        const beforeText = code.substring(0, match.index);
        const lineNumber = beforeText.split('\n').length;
        
        // Get context (text before and after the match)
        const contextBefore = code.substring(Math.max(0, match.index - 30), match.index);
        const contextAfter = code.substring(match.index + match[0].length, Math.min(code.length, match.index + match[0].length + 30));
        
        detectedTexts.push({
          text,
          context: {
            before: contextBefore,
            after: contextAfter
          },
          lineNumber
        });
      }
    }
    
    return detectedTexts;
  }
  
  /**
   * Store extracted translations for later saving
   * @param component The component containing the texts
   * @param detectedTexts The detected translatable texts
   */
  private storeExtractedTranslations(component: ModifiableComponent, detectedTexts: DetectedText[]): void {
    const componentFile = component.path?.join('/') || `${component.name}.tsx`;
    const entries = this.extractedTranslations.get(componentFile) || [];
    
    // Convert detected texts to translation entries
    const newEntries = detectedTexts.map(text => ({
      key: this.generateTranslationKey(component.name, text.text),
      text: text.text,
      file: componentFile,
      line: text.lineNumber
    }));
    
    // Merge with existing entries, avoiding duplicates
    const updatedEntries = [...entries];
    for (const newEntry of newEntries) {
      if (!updatedEntries.some(e => e.key === newEntry.key)) {
        updatedEntries.push(newEntry);
      }
    }
    
    this.extractedTranslations.set(componentFile, updatedEntries);
  }
  
  /**
   * Generate a translation key from component name and text
   * @param componentName The name of the component
   * @param text The text to generate a key for
   * @returns A translation key
   */
  private generateTranslationKey(componentName: string, text: string): string {
    // Convert text to a key format
    // 1. Replace non-alphanumeric chars with underscore
    // 2. Convert to lowercase
    // 3. Trim to reasonable length
    // 4. Prefix with component name
    const textKey = text
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 40);
      
    return `${componentName.toLowerCase()}.${textKey}`;
  }
  
  /**
   * Get the translation function call for a text
   * @param text The text to translate
   * @returns The translation function call
   */
  private getTranslationFunctionCall(text: string): string {
    const key = text
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 40);
      
    switch (this.options.library) {
      case 'react-i18next':
        return `{${this.options.translationFunctionName}('${key}', '${text}')}`;
      case 'react-intl':
        return `<FormattedMessage id="${key}" defaultMessage="${text}" />`;
      case 'lingui':
        return `<Trans id="${key}">${text}</Trans>`;
      case 'custom':
      default:
        return `{${this.options.translationFunctionName}('${key}', '${text}')}`;
    }
  }
  
  /**
   * Wrap strings with translation function
   * @param code The original code
   * @param detectedTexts The detected translatable texts
   * @returns Code with wrapped strings
   */
  private wrapStringsWithTranslationFunction(code: string, detectedTexts: DetectedText[]): string {
    let wrappedCode = code;
    
    // First, add necessary imports if not present
    if (this.options.autoNamespaceImport) {
      switch (this.options.library) {
        case 'react-i18next':
          if (!wrappedCode.includes('useTranslation')) {
            wrappedCode = `import { useTranslation } from 'react-i18next';\n${wrappedCode}`;
          }
          // Add useTranslation hook if needed
          if (!wrappedCode.includes(`const { ${this.options.translationFunctionName} }`)) {
            const componentDefMatch = wrappedCode.match(/function\s+(\w+)\([^)]*\)\s*{/);
            if (componentDefMatch) {
              const insertPoint = componentDefMatch.index! + componentDefMatch[0].length;
              wrappedCode = wrappedCode.slice(0, insertPoint) + 
                `\n  const { ${this.options.translationFunctionName} } = useTranslation();\n` + 
                wrappedCode.slice(insertPoint);
            }
          }
          break;
        case 'react-intl':
          if (!wrappedCode.includes('FormattedMessage')) {
            wrappedCode = `import { FormattedMessage } from 'react-intl';\n${wrappedCode}`;
          }
          break;
        case 'lingui':
          if (!wrappedCode.includes('Trans')) {
            wrappedCode = `import { Trans } from '@lingui/macro';\n${wrappedCode}`;
          }
          break;
      }
    }
    
    // Process detected texts in reverse order to avoid offset issues
    const sortedTexts = [...detectedTexts].sort((a, b) => b.lineNumber - a.lineNumber);
    
    for (const text of sortedTexts) {
      // Find the exact position of the text in the code
      const lines = wrappedCode.split('\n');
      const line = lines[text.lineNumber - 1];
      
      if (!line) continue;
      
      const textIndex = line.indexOf(text.text);
      if (textIndex === -1) continue;
      
      const beforeText = line.substring(0, textIndex);
      const afterText = line.substring(textIndex + text.text.length);
      
      // Skip if inside existing translation function
      if (beforeText.includes(`${this.options.translationFunctionName}(`)) {
        continue;
      }
      
      // Get translation function call
      const translationCall = this.getTranslationFunctionCall(text.text);
      
      // Check if the text is in JSX context
      const isJSX = beforeText.includes('<') && !beforeText.includes('{') && afterText.includes('>');
      
      // Replace the text with translation function
      if (isJSX) {
        lines[text.lineNumber - 1] = `${beforeText}${translationCall}${afterText}`;
      } else if (beforeText.includes('"') || beforeText.includes("'")) {
        // If the text is in quotes, replace the whole quoted string
        const quoteChar = beforeText.lastIndexOf('"') > beforeText.lastIndexOf("'") ? '"' : "'";
        const quoteStart = beforeText.lastIndexOf(quoteChar);
        const quoteEnd = afterText.indexOf(quoteChar) + 1;
        
        lines[text.lineNumber - 1] = 
          beforeText.substring(0, quoteStart) + 
          translationCall + 
          afterText.substring(quoteEnd);
      }
      
      wrappedCode = lines.join('\n');
    }
    
    return wrappedCode;
  }
  
  /**
   * Save extracted translations to JSON files
   */
  private async saveExtractedTranslations(): Promise<void> {
    try {
      if (this.extractedTranslations.size === 0) {
        return;
      }
      
      // Load existing translations
      const defaultLangPath = path.join(this.options.translationsDir, `${this.options.defaultLanguage}.json`);
      let existingTranslations: Record<string, string> = {};
      
      try {
        const content = await fs.readFile(defaultLangPath, 'utf8');
        existingTranslations = JSON.parse(content);
      } catch (err) {
        // File doesn't exist or is invalid, use empty object
        existingTranslations = {};
      }
      
      // Merge extracted translations with existing ones
      for (const entries of this.extractedTranslations.values()) {
        for (const entry of entries) {
          if (!existingTranslations[entry.key]) {
            existingTranslations[entry.key] = entry.text;
          }
        }
      }
      
      // Save merged translations
      await fs.writeFile(
        defaultLangPath,
        JSON.stringify(existingTranslations, null, 2),
        'utf8'
      );
      
      console.log(`[I18nPlugin] Saved ${Object.keys(existingTranslations).length} translations to ${defaultLangPath}`);
      
      // Create empty translation files for other supported languages
      for (const lang of this.options.supportedLanguages) {
        if (lang === this.options.defaultLanguage) continue;
        
        const langPath = path.join(this.options.translationsDir, `${lang}.json`);
        
        try {
          // Check if file exists
          await fs.access(langPath);
          
          // If exists, load and update with new keys (but don't overwrite existing translations)
          const content = await fs.readFile(langPath, 'utf8');
          const langTranslations = JSON.parse(content);
          
          let updated = false;
          for (const key of Object.keys(existingTranslations)) {
            if (!langTranslations[key]) {
              langTranslations[key] = ''; // Empty string indicates untranslated
              updated = true;
            }
          }
          
          if (updated) {
            await fs.writeFile(
              langPath,
              JSON.stringify(langTranslations, null, 2),
              'utf8'
            );
            console.log(`[I18nPlugin] Updated ${langPath} with new translation keys`);
          }
        } catch (err) {
          // File doesn't exist, create with empty translations
          const emptyTranslations: Record<string, string> = {};
          for (const key of Object.keys(existingTranslations)) {
            emptyTranslations[key] = ''; // Empty string indicates untranslated
          }
          
          await fs.writeFile(
            langPath,
            JSON.stringify(emptyTranslations, null, 2),
            'utf8'
          );
          console.log(`[I18nPlugin] Created ${langPath} with ${Object.keys(emptyTranslations).length} keys`);
        }
      }
    } catch (error) {
      console.error(`[I18nPlugin] Error saving translations: ${error}`);
    }
  }
  
  /**
   * Get statistics about extracted translations
   * @returns Translation statistics
   */
  getTranslationStats(): {
    totalTranslations: number;
    translatedFiles: number;
    supportedLanguages: string[];
    defaultLanguage: string;
  } {
    let totalTranslations = 0;
    for (const entries of this.extractedTranslations.values()) {
      totalTranslations += entries.length;
    }
    
    return {
      totalTranslations,
      translatedFiles: this.extractedTranslations.size,
      supportedLanguages: this.options.supportedLanguages,
      defaultLanguage: this.options.defaultLanguage,
    };
  }
  
  /**
   * Add a new supported language
   * @param language Language code to add
   */
  addLanguage(language: string): void {
    if (!this.options.supportedLanguages.includes(language)) {
      this.options.supportedLanguages.push(language);
      console.log(`[I18nPlugin] Added support for language: ${language}`);
      
      // Create translation file if it doesn't exist
      const langPath = path.join(this.options.translationsDir, `${language}.json`);
      fs.access(langPath)
        .catch(() => {
          // File doesn't exist, create it
          fs.writeFile(langPath, '{}', 'utf8')
            .then(() => console.log(`[I18nPlugin] Created translation file: ${langPath}`))
            .catch(err => console.error(`[I18nPlugin] Error creating translation file: ${err}`));
        });
    }
  }
  
  /**
   * Generate code for setting up i18n in a React application
   * @returns Code for i18n setup
   */
  generateI18nSetupCode(): string {
    let setupCode = '';
    
    switch (this.options.library) {
      case 'react-i18next':
        setupCode = `
// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
${this.options.supportedLanguages
  .map(lang => `import ${lang}Translation from './${lang}.json';`)
  .join('\n')
}

const resources = {
${this.options.supportedLanguages
  .map(lang => `  ${lang}: { translation: ${lang}Translation }`)
  .join(',\n')
}
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: '${this.options.defaultLanguage}',
    fallbackLng: '${this.options.defaultLanguage}',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    }
  });

export default i18n;
`;
        break;
      case 'react-intl':
        setupCode = `
// i18n.js
import React from 'react';
import { IntlProvider } from 'react-intl';

// Import translation files
${this.options.supportedLanguages
  .map(lang => `import ${lang}Messages from './${lang}.json';`)
  .join('\n')
}

const messages = {
${this.options.supportedLanguages
  .map(lang => `  ${lang}: ${lang}Messages`)
  .join(',\n')
}
};

export const I18nProvider = ({ children }) => {
  const [locale, setLocale] = React.useState('${this.options.defaultLanguage}');

  const switchLanguage = (language) => {
    if (messages[language]) {
      setLocale(language);
    }
  };

  return (
    <IntlProvider 
      locale={locale} 
      messages={messages[locale]} 
      defaultLocale="${this.options.defaultLanguage}"
    >
      {children}
    </IntlProvider>
  );
};

export const useI18n = () => {
  const [locale, setLocale] = React.useState('${this.options.defaultLanguage}');

  const switchLanguage = (language) => {
    if (messages[language]) {
      setLocale(language);
      // You could also store the preferred language in localStorage here
    }
  };

  return {
    locale,
    switchLanguage,
    languages: Object.keys(messages),
  };
};
`;
        break;
      case 'lingui':
        setupCode = `
// i18n.js
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import React, { useEffect, useState } from 'react';

// Import catalogs
${this.options.supportedLanguages
  .map(lang => `import { messages as ${lang}Messages } from './locales/${lang}/messages';`)
  .join('\n')
}

const catalogs = {
${this.options.supportedLanguages
  .map(lang => `  ${lang}: { messages: ${lang}Messages }`)
  .join(',\n')
}
};

i18n.load(catalogs);
i18n.activate('${this.options.defaultLanguage}');

export const LinguiI18nProvider = ({ children }) => {
  const [activeLang, setActiveLang] = useState('${this.options.defaultLanguage}');

  useEffect(() => {
    i18n.activate(activeLang);
  }, [activeLang]);

  return (
    <I18nProvider i18n={i18n}>
      {children}
    </I18nProvider>
  );
};

export const useI18n = () => {
  const [locale, setLocale] = React.useState('${this.options.defaultLanguage}');

  const switchLanguage = (language) => {
    if (catalogs[language]) {
      setLocale(language);
      i18n.activate(language);
    }
  };

  return {
    locale,
    switchLanguage,
    languages: Object.keys(catalogs),
  };
};
`;
        break;
      case 'custom':
      default:
        setupCode = `
// i18n.js
import React, { createContext, useContext, useState } from 'react';

// Import translation files
${this.options.supportedLanguages
  .map(lang => `import ${lang}Translations from './${lang}.json';`)
  .join('\n')
}

const translations = {
${this.options.supportedLanguages
  .map(lang => `  ${lang}: ${lang}Translations`)
  .join(',\n')
}
};

const I18nContext = createContext(null);

export const I18nProvider = ({ children }) => {
  const [locale, setLocale] = useState('${this.options.defaultLanguage}');

  const ${this.options.translationFunctionName} = (key, defaultValue = '') => {
    return translations[locale]?.[key] || defaultValue;
  };

  const switchLanguage = (language) => {
    if (translations[language]) {
      setLocale(language);
    }
  };

  return (
    <I18nContext.Provider value={{ ${this.options.translationFunctionName}, locale, switchLanguage }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
`;
    }
    
    return setupCode;
  }
}