import * as ts from 'typescript';
import * as path from 'path';
import { InferredProp } from './PropTypeInference';

/**
 * CSS frameworks and styling approaches supported by the generator
 */
export enum StyleApproach {
  CSS = 'css',               // Plain CSS
  SCSS = 'scss',             // SASS/SCSS
  LESS = 'less',             // LESS
  STYLED_COMPONENTS = 'styled-components', // Styled Components
  CSS_MODULES = 'css-modules', // CSS Modules
  EMOTION = 'emotion',       // Emotion
  TAILWIND = 'tailwind',     // Tailwind
  MATERIAL_UI = 'material-ui', // Material UI
  BOOTSTRAP = 'bootstrap',   // Bootstrap
  CHAKRA_UI = 'chakra-ui'    // Chakra UI
}

/**
 * Style generation configuration options
 */
export interface StyleGeneratorOptions {
  /** Styling approach to use */
  approach: StyleApproach;
  /** Typography styling */
  typography?: TypographyOptions;
  /** Color schemes */
  colors?: ColorScheme;
  /** Spacing/sizing system */
  spacing?: SpacingOptions;
  /** Media query breakpoints */
  breakpoints?: Record<string, string>;
  /** Generate dark mode styles */
  includeDarkMode?: boolean;
  /** Generate animation styles */
  includeAnimations?: boolean;
  /** Generate responsive styles */
  includeResponsive?: boolean;
  /** Generate accessibility styles */
  includeA11y?: boolean;
  /** Custom theme tokens */
  customTokens?: Record<string, any>;
  /** Custom style blocks to include */
  customStyles?: Record<string, string>;
}

/**
 * Typography configuration options
 */
export interface TypographyOptions {
  /** Base font family */
  fontFamily?: string;
  /** Font families by category */
  fonts?: {
    primary?: string;
    secondary?: string;
    monospace?: string;
  };
  /** Font sizes by category */
  fontSizes?: Record<string, string>;
  /** Font weights */
  fontWeights?: Record<string, number>;
  /** Line heights */
  lineHeights?: Record<string, string | number>;
  /** Letter spacing */
  letterSpacing?: Record<string, string>;
}

/**
 * Color scheme configuration
 */
export interface ColorScheme {
  /** Primary color and variants */
  primary?: string | Record<string, string>;
  /** Secondary color and variants */
  secondary?: string | Record<string, string>;
  /** Accent color */
  accent?: string;
  /** Background colors */
  background?: string | Record<string, string>;
  /** Text colors */
  text?: string | Record<string, string>;
  /** Border colors */
  border?: string;
  /** Success state color */
  success?: string;
  /** Error state color */
  error?: string;
  /** Warning state color */
  warning?: string;
  /** Info state color */
  info?: string;
  /** Custom colors */
  custom?: Record<string, string>;
}

/**
 * Spacing and sizing configuration
 */
export interface SpacingOptions {
  /** Base spacing unit */
  baseUnit?: string;
  /** Spacing scale */
  scale?: Record<string, string>;
  /** Border radius values */
  borderRadius?: Record<string, string>;
  /** Box shadows */
  shadows?: Record<string, string>;
}

/**
 * Component style context
 */
export interface StyleContext {
  /** Component name */
  componentName: string;
  /** Component props */
  props: InferredProp[];
  /** Component type (button, card, etc.) */
  componentType?: string;
  /** Additional CSS class names */
  additionalClasses?: string[];
  /** HTMLElement type (div, span, etc.) */
  htmlElement?: string;
}

/**
 * Result of style generation
 */
export interface StyleGenerationResult {
  /** Generated style content */
  styleContent: string;
  /** Style imports to add */
  styleImports: string;
  /** Path to the generated style file */
  styleFilePath: string;
  /** Component modifications to apply */
  componentModifications: string;
  /** Styling approach used */
  approach: StyleApproach;
}

/**
 * Generates styling for React components using various approaches
 */
export class StyleGenerator {
  private options: Required<StyleGeneratorOptions>;
  
  constructor(options: StyleGeneratorOptions) {
    // Set default options
    this.options = {
      approach: options.approach,
      typography: options.typography || {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fonts: {
          primary: 'system-ui, sans-serif',
          secondary: 'Georgia, serif',
          monospace: 'monospace'
        },
        fontSizes: {
          xs: '0.75rem',    // 12px
          sm: '0.875rem',   // 14px
          md: '1rem',       // 16px
          lg: '1.125rem',   // 18px
          xl: '1.25rem',    // 20px
          '2xl': '1.5rem',  // 24px
          '3xl': '1.875rem', // 30px
          '4xl': '2.25rem',  // 36px
        },
        fontWeights: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700,
        },
        lineHeights: {
          none: 1,
          tight: 1.25,
          normal: 1.5,
          loose: 2,
        },
        letterSpacing: {
          tight: '-0.025em',
          normal: '0',
          wide: '0.025em',
        }
      },
      colors: options.colors || {
        primary: '#3182ce',
        secondary: '#805ad5',
        accent: '#ed64a6',
        background: {
          light: '#ffffff',
          dark: '#1a202c'
        },
        text: {
          light: '#2d3748',
          dark: '#f7fafc'
        },
        border: '#e2e8f0',
        success: '#48bb78',
        error: '#e53e3e',
        warning: '#ed8936',
        info: '#4299e1',
      },
      spacing: options.spacing || {
        baseUnit: '0.25rem',
        scale: {
          '0': '0',
          '1': '0.25rem',
          '2': '0.5rem',
          '3': '0.75rem',
          '4': '1rem',
          '5': '1.25rem',
          '6': '1.5rem',
          '8': '2rem',
          '10': '2.5rem',
          '12': '3rem',
          '16': '4rem',
          '20': '5rem',
          '24': '6rem',
          '32': '8rem',
        },
        borderRadius: {
          none: '0',
          sm: '0.125rem',
          md: '0.25rem',
          lg: '0.5rem',
          full: '9999px',
        },
        shadows: {
          none: 'none',
          sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }
      },
      breakpoints: options.breakpoints || {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      includeDarkMode: options.includeDarkMode ?? false,
      includeAnimations: options.includeAnimations ?? true,
      includeResponsive: options.includeResponsive ?? true,
      includeA11y: options.includeA11y ?? true,
      customTokens: options.customTokens || {},
      customStyles: options.customStyles || {},
    };
  }
  
  /**
   * Generate styles for a component
   * 
   * @param componentPath Path to the component file
   * @param componentCode Component source code
   * @param context Styling context for the component
   * @returns Style generation result
   */
  generateStyles(
    componentPath: string,
    componentCode: string, 
    context: StyleContext
  ): StyleGenerationResult {
    // Analyze the component to determine additional context
    const enrichedContext = this.analyzeComponentForStyling(componentCode, context);
    
    // Generate the style file path
    const styleFilePath = this.generateStyleFilePath(componentPath, enrichedContext.componentName);
    
    // Generate styles based on the chosen approach
    let styleContent = '';
    let styleImports = '';
    let componentModifications = '';
    
    switch (this.options.approach) {
      case StyleApproach.CSS:
      case StyleApproach.SCSS:
      case StyleApproach.LESS:
        const cssResult = this.generateCssStyles(enrichedContext);
        styleContent = cssResult.styleContent;
        componentModifications = cssResult.componentModifications;
        break;
        
      case StyleApproach.CSS_MODULES:
        const modulesResult = this.generateCssModulesStyles(enrichedContext);
        styleContent = modulesResult.styleContent;
        styleImports = modulesResult.styleImports;
        componentModifications = modulesResult.componentModifications;
        break;
        
      case StyleApproach.STYLED_COMPONENTS:
        const styledResult = this.generateStyledComponentsStyles(enrichedContext);
        styleContent = styledResult.styleContent;
        styleImports = styledResult.styleImports;
        componentModifications = styledResult.componentModifications;
        break;
        
      case StyleApproach.EMOTION:
        const emotionResult = this.generateEmotionStyles(enrichedContext);
        styleContent = emotionResult.styleContent;
        styleImports = emotionResult.styleImports;
        componentModifications = emotionResult.componentModifications;
        break;
        
      case StyleApproach.TAILWIND:
        const tailwindResult = this.generateTailwindStyles(enrichedContext);
        styleContent = tailwindResult.styleContent;
        styleImports = tailwindResult.styleImports;
        componentModifications = tailwindResult.componentModifications;
        break;
        
      case StyleApproach.MATERIAL_UI:
        const muiResult = this.generateMaterialUIStyles(enrichedContext);
        styleContent = muiResult.styleContent;
        styleImports = muiResult.styleImports;
        componentModifications = muiResult.componentModifications;
        break;
        
      case StyleApproach.BOOTSTRAP:
        const bootstrapResult = this.generateBootstrapStyles(enrichedContext);
        styleContent = bootstrapResult.styleContent;
        styleImports = bootstrapResult.styleImports;
        componentModifications = bootstrapResult.componentModifications;
        break;
        
      case StyleApproach.CHAKRA_UI:
        const chakraResult = this.generateChakraUIStyles(enrichedContext);
        styleContent = chakraResult.styleContent;
        styleImports = chakraResult.styleImports;
        componentModifications = chakraResult.componentModifications;
        break;
    }
    
    return {
      styleContent,
      styleImports,
      styleFilePath,
      componentModifications,
      approach: this.options.approach
    };
  }
  
  /**
   * Analyze component to determine styling context
   * 
   * @param componentCode Component source code
   * @param context Initial styling context
   * @returns Enriched styling context
   */
  private analyzeComponentForStyling(
    componentCode: string,
    context: StyleContext
  ): StyleContext {
    const enrichedContext = { ...context };
    
    try {
      // Create a source file from the component code
      const sourceFile = ts.createSourceFile(
        'component.tsx',
        componentCode,
        ts.ScriptTarget.Latest,
        true
      );
      
      // Try to determine the component type based on props and structure
      if (!enrichedContext.componentType) {
        enrichedContext.componentType = this.inferComponentType(sourceFile, context.props);
      }
      
      // Try to determine the HTML element
      if (!enrichedContext.htmlElement) {
        enrichedContext.htmlElement = this.inferHtmlElement(sourceFile, enrichedContext.componentType);
      }
      
      // Extract existing class names
      if (!enrichedContext.additionalClasses) {
        enrichedContext.additionalClasses = this.extractExistingClassNames(sourceFile);
      }
      
    } catch (error) {
      console.error('Error analyzing component for styling:', error);
    }
    
    return enrichedContext;
  }
  
  /**
   * Infer component type based on props and code structure
   * 
   * @param sourceFile TypeScript source file
   * @param props Component props
   * @returns Inferred component type
   */
  private inferComponentType(sourceFile: ts.SourceFile, props: InferredProp[]): string {
    // Common component type patterns
    const patterns: Record<string, { propPattern?: RegExp; codePattern?: RegExp }> = {
      button: { 
        propPattern: /click|submit|press|action|handler|onClick/i,
        codePattern: /<button|Button/i
      },
      input: { 
        propPattern: /value|onChange|placeholder|input/i,
        codePattern: /<input|Input|TextField/i
      },
      form: { 
        propPattern: /submit|onSubmit|validation|form/i,
        codePattern: /<form|Form/i
      },
      card: { 
        propPattern: /title|content|header|footer|body|card/i,
        codePattern: /Card|Panel|Box/i
      },
      modal: { 
        propPattern: /isOpen|onClose|modal|dialog/i,
        codePattern: /Modal|Dialog/i
      },
      image: { 
        propPattern: /src|alt|image|img/i,
        codePattern: /<img|Image/i
      },
      list: { 
        propPattern: /items|list|data/i,
        codePattern: /<ul|<ol|List|ItemList/i
      },
      navbar: { 
        propPattern: /logo|links|navigation|menu/i,
        codePattern: /Navbar|NavBar|Header|Navigation/i
      },
      layout: { 
        propPattern: /layout|container|children/i,
        codePattern: /Layout|Container|Wrapper/i
      },
      table: { 
        propPattern: /data|columns|rows|table/i,
        codePattern: /<table|Table|DataGrid/i
      }
    };
    
    // Check props first
    for (const [type, { propPattern }] of Object.entries(patterns)) {
      if (propPattern && props.some(prop => propPattern.test(prop.name))) {
        return type;
      }
    }
    
    // Check code patterns
    const code = sourceFile.getText();
    for (const [type, { codePattern }] of Object.entries(patterns)) {
      if (codePattern && codePattern.test(code)) {
        return type;
      }
    }
    
    // Default to generic component
    return 'container';
  }
  
  /**
   * Infer HTML element based on component type
   * 
   * @param sourceFile TypeScript source file
   * @param componentType Component type
   * @returns Inferred HTML element
   */
  private inferHtmlElement(sourceFile: ts.SourceFile, componentType: string): string {
    // Map component types to default HTML elements
    const typeToElement: Record<string, string> = {
      button: 'button',
      input: 'input',
      form: 'form',
      card: 'div',
      modal: 'div',
      image: 'img',
      list: 'ul',
      navbar: 'nav',
      layout: 'div',
      table: 'table',
      container: 'div'
    };
    
    // Try to find the actual rendered element in the component
    const code = sourceFile.getText();
    const jsxElementRegex = /<(\w+)[^>]*>/g;
    const matches = [...code.matchAll(jsxElementRegex)];
    
    for (const match of matches) {
      const element = match[1];
      // Only consider HTML elements (lowercase first letter)
      if (element && /^[a-z]/.test(element)) {
        // If it's a main element (not a helper element), use it
        if (element !== 'div' && element !== 'span') {
          return element;
        }
      }
    }
    
    // Fall back to the mapped element
    return typeToElement[componentType] || 'div';
  }
  
  /**
   * Extract existing class names from component
   * 
   * @param sourceFile TypeScript source file
   * @returns Array of class names
   */
  private extractExistingClassNames(sourceFile: ts.SourceFile): string[] {
    const classNames: string[] = [];
    const code = sourceFile.getText();
    
    // Match className attributes
    const classNameRegex = /className=['"](.*?)['"]|className={\s*['"]?(.*?)['"]?\s*}/g;
    const matches = [...code.matchAll(classNameRegex)];
    
    for (const match of matches) {
      const className = match[1] || match[2] || '';
      if (className) {
        // Split multiple classes
        const classes = className.split(/\s+/);
        classNames.push(...classes.filter(c => c.trim() !== ''));
      }
    }
    
    return [...new Set(classNames)]; // Remove duplicates
  }
  
  /**
   * Generate the style file path
   * 
   * @param componentPath Component file path
   * @param componentName Component name
   * @returns Style file path
   */
  private generateStyleFilePath(componentPath: string, componentName: string): string {
    const dir = path.dirname(componentPath);
    const extension = this.getStyleExtension();
    return path.join(dir, `${componentName}.styles.${extension}`);
  }
  
  /**
   * Get file extension for the chosen style approach
   * 
   * @returns File extension
   */
  private getStyleExtension(): string {
    switch (this.options.approach) {
      case StyleApproach.SCSS:
        return 'scss';
      case StyleApproach.LESS:
        return 'less';
      case StyleApproach.STYLED_COMPONENTS:
      case StyleApproach.EMOTION:
      case StyleApproach.MATERIAL_UI:
      case StyleApproach.CHAKRA_UI:
        return 'ts';
      default:
        return 'css';
    }
  }
  
  /**
   * Generate plain CSS/SCSS/LESS styles
   * 
   * @param context Styling context
   * @returns Style generation partial result
   */
  private generateCssStyles(context: StyleContext): { 
    styleContent: string; 
    componentModifications: string 
  } {
    const { componentName, componentType, htmlElement } = context;
    const className = this.getBaseClassName(componentName);
    
    let css = '';
    
    // Add comment header
    css += `/* ${componentName} component styles */\n\n`;
    
    // Add variables for SCSS/LESS
    if (this.options.approach !== StyleApproach.CSS) {
      css += this.generateCssVariables();
    }
    
    // Generate base component style
    css += `.${className} {\n`;
    
    // Add core styles based on component type
    const coreStyles = this.getCoreStylesForType(componentType, htmlElement);
    css += this.indentLines(coreStyles);
    
    // Add responsive styles if enabled
    if (this.options.includeResponsive) {
      css += '\n  /* Responsive adjustments */\n';
      css += `  display: ${componentType === 'layout' ? 'flex' : 'block'};\n`;
      css += '  width: 100%;\n';
    }
    
    // Add a11y styles if enabled
    if (this.options.includeA11y) {
      css += '\n  /* Accessibility improvements */\n';
      if (componentType === 'button' || componentType === 'input') {
        css += '  &:focus {\n';
        css += '    outline: 2px solid var(--color-primary);\n';
        css += '    outline-offset: 2px;\n';
        css += '  }\n';
      }
    }
    
    css += '}\n\n';
    
    // Add nested styles
    css += this.generateNestedStyles(className, componentType);
    
    // Add animations if enabled
    if (this.options.includeAnimations) {
      css += this.generateAnimations(componentType);
    }
    
    // Add responsive media queries if enabled
    if (this.options.includeResponsive) {
      css += this.generateResponsiveStyles(className, componentType);
    }
    
    // Add dark mode styles if enabled
    if (this.options.includeDarkMode) {
      css += this.generateDarkModeStyles(className, componentType);
    }
    
    // Add custom styles
    if (this.options.customStyles[componentType]) {
      css += `\n/* Custom styles */\n${this.options.customStyles[componentType]}\n`;
    }
    
    // Generate component modifications to add class names
    const componentModifications = `className="${className}"`;
    
    return {
      styleContent: css,
      componentModifications
    };
  }
  
  /**
   * Generate CSS Modules styles
   * 
   * @param context Styling context
   * @returns Style generation partial result
   */
  private generateCssModulesStyles(context: StyleContext): { 
    styleContent: string; 
    styleImports: string; 
    componentModifications: string 
  } {
    // CSS Modules are similar to regular CSS
    const cssResult = this.generateCssStyles(context);
    
    // Generate imports for the component
    const styleImports = `import styles from './${context.componentName}.styles.css';\n`;
    
    // Generate modifications to use the imported styles
    const className = this.getBaseClassName(context.componentName);
    const componentModifications = `className={styles.${className}}`;
    
    return {
      styleContent: cssResult.styleContent,
      styleImports,
      componentModifications
    };
  }
  
  /**
   * Generate Styled Components styles
   * 
   * @param context Styling context
   * @returns Style generation partial result
   */
  private generateStyledComponentsStyles(context: StyleContext): { 
    styleContent: string; 
    styleImports: string; 
    componentModifications: string 
  } {
    const { componentName, componentType, htmlElement } = context;
    
    // Generate imports
    const styleImports = `import styled from 'styled-components';\n`;
    
    let styleContent = `// ${componentName} styled components\n\n`;
    
    // Generate theme if needed for typography, colors and spacing
    if (this.options.includeDarkMode || this.options.colors) {
      styleContent += `// Theme variables\nconst theme = {\n`;
      styleContent += `  colors: {\n`;
      Object.entries(this.options.colors).forEach(([key, value]) => {
        if (typeof value === 'object') {
          styleContent += `    ${key}: {\n`;
          Object.entries(value).forEach(([subKey, subValue]) => {
            styleContent += `      ${subKey}: '${subValue}',\n`;
          });
          styleContent += `    },\n`;
        } else if (typeof value === 'string') {
          styleContent += `    ${key}: '${value}',\n`;
        }
      });
      styleContent += `  },\n`;
      
      // Add typography
      styleContent += `  typography: {\n`;
      styleContent += `    fontFamily: '${this.options.typography.fontFamily}',\n`;
      styleContent += `    fontSizes: {\n`;
      Object.entries(this.options.typography.fontSizes).forEach(([key, value]) => {
        styleContent += `      ${key}: '${value}',\n`;
      });
      styleContent += `    },\n`;
      styleContent += `  },\n`;
      
      // Add spacing
      styleContent += `  spacing: {\n`;
      Object.entries(this.options.spacing.scale).forEach(([key, value]) => {
        styleContent += `    ${key}: '${value}',\n`;
      });
      styleContent += `  },\n`;
      
      styleContent += `};\n\n`;
    }
    
    // Determine base component to extend
    const baseElement = htmlElement || 'div';
    
    // Generate main component
    styleContent += `export const Styled${componentName} = styled.${baseElement}\`\n`;
    
    // Add core styles based on component type
    const coreStyles = this.getCoreStylesForType(componentType, htmlElement);
    styleContent += this.indentLines(coreStyles);
    
    // Add responsive styles
    if (this.options.includeResponsive) {
      styleContent += '\n  /* Responsive styling */\n';
      styleContent += `  display: ${componentType === 'layout' ? 'flex' : 'block'};\n`;
      styleContent += '  width: 100%;\n';
      
      // Add media queries
      Object.entries(this.options.breakpoints).forEach(([name, size]) => {
        styleContent += `\n  @media (min-width: ${size}) {\n`;
        
        switch (componentType) {
          case 'card':
            styleContent += `    width: ${name === 'sm' ? '100%' : name === 'md' ? '85%' : '70%'};\n`;
            break;
          case 'layout':
            styleContent += `    flex-direction: ${name === 'sm' ? 'column' : 'row'};\n`;
            break;
        }
        
        styleContent += `  }\n`;
      });
    }
    
    // Add dark mode styles
    if (this.options.includeDarkMode) {
      styleContent += '\n  /* Dark mode */\n';
      styleContent += '  @media (prefers-color-scheme: dark) {\n';
      styleContent += '    background-color: ${props => props.theme.colors.background.dark};\n';
      styleContent += '    color: ${props => props.theme.colors.text.dark};\n';
      styleContent += '  }\n';
    }
    
    // Add nested elements
    if (['card', 'layout', 'navbar'].includes(componentType)) {
      styleContent += this.generateStyledNestedElements(componentType);
    }
    
    // Add animations
    if (this.options.includeAnimations) {
      styleContent += this.generateStyledAnimations(componentType);
    }
    
    // Add a11y styles
    if (this.options.includeA11y) {
      styleContent += '\n  /* Accessibility */\n';
      if (componentType === 'button') {
        styleContent += '  &:focus {\n';
        styleContent += '    outline: 2px solid ${props => props.theme.colors.primary};\n';
        styleContent += '    outline-offset: 2px;\n';
        styleContent += '  }\n';
      }
    }
    
    styleContent += '`;\n\n';
    
    // Add child components if needed
    if (['card', 'layout', 'navbar'].includes(componentType)) {
      styleContent += this.generateStyledChildComponents(componentName, componentType);
    }
    
    // Generate component modifications
    const componentModifications = `as={Styled${componentName}}`;
    
    return {
      styleContent,
      styleImports,
      componentModifications
    };
  }
  
  /**
   * Generate Emotion styles
   * 
   * @param context Styling context
   * @returns Style generation partial result
   */
  private generateEmotionStyles(context: StyleContext): { 
    styleContent: string; 
    styleImports: string; 
    componentModifications: string 
  } {
    const { componentName, componentType, htmlElement } = context;
    
    // Generate imports
    const styleImports = `/** @jsxImportSource @emotion/react */\nimport { css } from '@emotion/react';\n`;
    
    let styleContent = `// ${componentName} emotion styles\n\n`;
    
    // Generate theme
    styleContent += `// Theme variables\nconst theme = {\n`;
    styleContent += `  colors: {\n`;
    Object.entries(this.options.colors).forEach(([key, value]) => {
      if (typeof value === 'object') {
        styleContent += `    ${key}: {\n`;
        Object.entries(value).forEach(([subKey, subValue]) => {
          styleContent += `      ${subKey}: '${subValue}',\n`;
        });
        styleContent += `    },\n`;
      } else if (typeof value === 'string') {
        styleContent += `    ${key}: '${value}',\n`;
      }
    });
    styleContent += `  },\n`;
    styleContent += `  typography: {\n`;
    styleContent += `    fontFamily: '${this.options.typography.fontFamily}',\n`;
    styleContent += `    fontSize: '${this.options.typography.fontSizes.md}',\n`;
    styleContent += `  },\n`;
    styleContent += `  spacing: {\n`;
    Object.entries(this.options.spacing.scale).forEach(([key, value]) => {
      styleContent += `    ${key}: '${value}',\n`;
    });
    styleContent += `  },\n`;
    styleContent += `};\n\n`;
    
    // Generate main component style
    styleContent += `export const ${componentName.charAt(0).toLowerCase() + componentName.slice(1)}Style = css\`\n`;
    
    // Add core styles based on component type
    const coreStyles = this.getCoreStylesForType(componentType, htmlElement);
    styleContent += this.indentLines(coreStyles);
    
    // Add responsive styles
    if (this.options.includeResponsive) {
      styleContent += '\n  /* Responsive styling */\n';
      styleContent += `  display: ${componentType === 'layout' ? 'flex' : 'block'};\n`;
      styleContent += '  width: 100%;\n';
      
      // Add media queries
      Object.entries(this.options.breakpoints).forEach(([name, size]) => {
        styleContent += `\n  @media (min-width: ${size}) {\n`;
        
        switch (componentType) {
          case 'card':
            styleContent += `    width: ${name === 'sm' ? '100%' : name === 'md' ? '85%' : '70%'};\n`;
            break;
          case 'layout':
            styleContent += `    flex-direction: ${name === 'sm' ? 'column' : 'row'};\n`;
            break;
        }
        
        styleContent += `  }\n`;
      });
    }
    
    // Add dark mode styles
    if (this.options.includeDarkMode) {
      styleContent += '\n  /* Dark mode */\n';
      styleContent += '  @media (prefers-color-scheme: dark) {\n';
      styleContent += '    background-color: ${theme.colors.background.dark};\n';
      styleContent += '    color: ${theme.colors.text.dark};\n';
      styleContent += '  }\n';
    }
    
    // Add nested elements 
    if (['card', 'layout', 'navbar'].includes(componentType)) {
      styleContent += this.generateEmotionNestedElements(componentType);
    }
    
    // Add animations
    if (this.options.includeAnimations) {
      styleContent += this.generateEmotionAnimations(componentType);
    }
    
    styleContent += '`;\n\n';
    
    // Add additional component styles if needed
    if (['card', 'layout', 'navbar'].includes(componentType)) {
      styleContent += this.generateEmotionChildStyles(componentName, componentType);
    }
    
    // Generate component modifications
    const componentModifications = `css={${componentName.charAt(0).toLowerCase() + componentName.slice(1)}Style}`;
    
    return {
      styleContent,
      styleImports,
      componentModifications
    };
  }
  
  /**
   * Generate Tailwind CSS styles
   * 
   * @param context Styling context
   * @returns Style generation partial result
   */
  private generateTailwindStyles(context: StyleContext): { 
    styleContent: string; 
    styleImports: string; 
    componentModifications: string 
  } {
    const { componentName, componentType, htmlElement } = context;
    
    // For Tailwind, we don't generate a separate style file, just classes
    const styleContent = '';
    const styleImports = '';
    
    // Generate tailwind classes based on component type
    let tailwindClasses: string[] = [];
    
    // Basic layout classes based on component type
    switch (componentType) {
      case 'button':
        tailwindClasses = [
          'px-4',
          'py-2',
          'rounded',
          'bg-blue-500',
          'text-white',
          'font-semibold',
          'hover:bg-blue-600',
          'focus:outline-none',
          'focus:ring-2',
          'focus:ring-blue-500',
          'focus:ring-opacity-50',
          'transition',
          'ease-in-out',
          'duration-150'
        ];
        break;
        
      case 'card':
        tailwindClasses = [
          'bg-white',
          'rounded-lg',
          'shadow-md',
          'p-6',
          'mb-4',
          'overflow-hidden',
          'dark:bg-gray-800',
          'dark:text-white'
        ];
        break;
        
      case 'input':
        tailwindClasses = [
          'border',
          'border-gray-300',
          'rounded',
          'px-4',
          'py-2',
          'focus:outline-none',
          'focus:ring-2',
          'focus:ring-blue-500',
          'focus:border-transparent',
          'dark:bg-gray-700',
          'dark:border-gray-600',
          'dark:text-white'
        ];
        break;
        
      case 'navbar':
        tailwindClasses = [
          'flex',
          'items-center',
          'justify-between',
          'bg-white',
          'px-6',
          'py-4',
          'shadow',
          'dark:bg-gray-800',
          'dark:text-white'
        ];
        break;
        
      case 'layout':
        tailwindClasses = [
          'flex',
          'flex-col',
          'md:flex-row',
          'w-full',
          'mx-auto',
          'p-4',
          'max-w-7xl'
        ];
        break;
        
      case 'list':
        tailwindClasses = [
          'divide-y',
          'divide-gray-200',
          'dark:divide-gray-700'
        ];
        break;
        
      case 'table':
        tailwindClasses = [
          'min-w-full',
          'divide-y',
          'divide-gray-200',
          'dark:divide-gray-700'
        ];
        break;
        
      case 'modal':
        tailwindClasses = [
          'fixed',
          'inset-0',
          'bg-gray-500',
          'bg-opacity-75',
          'flex',
          'items-center',
          'justify-center',
          'p-4'
        ];
        break;
        
      default:
        tailwindClasses = [
          'w-full',
          'p-4',
          'bg-white',
          'dark:bg-gray-800',
          'dark:text-white'
        ];
    }
    
    // Add responsive classes if enabled
    if (this.options.includeResponsive) {
      tailwindClasses.push('w-full');
      
      if (componentType === 'card') {
        tailwindClasses.push('sm:w-full', 'md:w-4/5', 'lg:w-3/4');
      }
      
      if (componentType === 'layout') {
        tailwindClasses.push('flex-col', 'md:flex-row');
      }
    }
    
    // Add animation classes if enabled
    if (this.options.includeAnimations) {
      tailwindClasses.push('transition', 'duration-300');
      
      if (componentType === 'button') {
        tailwindClasses.push('transform', 'hover:scale-105');
      }
      
      if (componentType === 'card') {
        tailwindClasses.push('hover:shadow-lg');
      }
    }
    
    // Add a11y classes if enabled
    if (this.options.includeA11y && componentType === 'button') {
      tailwindClasses.push('focus:outline-none', 'focus:ring-2');
    }
    
    // Generate component modifications with Tailwind classes
    const componentModifications = `className="${tailwindClasses.join(' ')}"`;
    
    return {
      styleContent,
      styleImports,
      componentModifications
    };
  }
  
  /**
   * Generate Material UI styles
   * 
   * @param context Styling context
   * @returns Style generation partial result
   */
  private generateMaterialUIStyles(context: StyleContext): { 
    styleContent: string; 
    styleImports: string; 
    componentModifications: string 
  } {
    const { componentName, componentType, htmlElement } = context;
    
    // Generate imports
    const styleImports = `import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';\n`;
    
    let styleContent = `// ${componentName} Material UI styles\n\n`;
    styleContent += `export const use${componentName}Styles = makeStyles((theme: Theme) => createStyles({\n`;
    
    // Root styles
    styleContent += `  root: {\n`;
    
    // Add styles based on component type
    switch (componentType) {
      case 'button':
        styleContent += `    padding: theme.spacing(1, 3),\n`;
        styleContent += `    borderRadius: theme.shape.borderRadius,\n`;
        styleContent += `    backgroundColor: theme.palette.primary.main,\n`;
        styleContent += `    color: theme.palette.primary.contrastText,\n`;
        styleContent += `    '&:hover': {\n`;
        styleContent += `      backgroundColor: theme.palette.primary.dark,\n`;
        styleContent += `    },\n`;
        break;
        
      case 'card':
        styleContent += `    padding: theme.spacing(3),\n`;
        styleContent += `    borderRadius: theme.shape.borderRadius,\n`;
        styleContent += `    boxShadow: theme.shadows[2],\n`;
        styleContent += `    backgroundColor: theme.palette.background.paper,\n`;
        styleContent += `    transition: theme.transitions.create(['box-shadow']),\n`;
        styleContent += `    '&:hover': {\n`;
        styleContent += `      boxShadow: theme.shadows[4],\n`;
        styleContent += `    },\n`;
        break;
        
      case 'input':
        styleContent += `    padding: theme.spacing(1, 2),\n`;
        styleContent += `    borderRadius: theme.shape.borderRadius,\n`;
        styleContent += `    border: \`1px solid \${theme.palette.divider}\`,\n`;
        styleContent += `    '&:focus': {\n`;
        styleContent += `      borderColor: theme.palette.primary.main,\n`;
        styleContent += `      outline: 'none',\n`;
        styleContent += `    },\n`;
        break;
        
      case 'layout':
        styleContent += `    display: 'flex',\n`;
        styleContent += `    flexDirection: 'column',\n`;
        styleContent += `    width: '100%',\n`;
        styleContent += `    [theme.breakpoints.up('md')]: {\n`;
        styleContent += `      flexDirection: 'row',\n`;
        styleContent += `    },\n`;
        break;
        
      default:
        styleContent += `    padding: theme.spacing(2),\n`;
        styleContent += `    backgroundColor: theme.palette.background.paper,\n`;
    }
    
    styleContent += `  },\n`;
    
    // Add additional styles for nested elements
    if (['card', 'layout', 'navbar'].includes(componentType)) {
      this.generateMaterialNestedStyles(componentType, styleContent);
    }
    
    styleContent += `}));\n`;
    
    // Generate component modifications
    const componentModifications = `className={classes.root}`;
    
    return {
      styleContent,
      styleImports,
      componentModifications
    };
  }
  
  /**
   * Generate Bootstrap styles
   * 
   * @param context Styling context
   * @returns Style generation partial result
   */
  private generateBootstrapStyles(context: StyleContext): { 
    styleContent: string; 
    styleImports: string; 
    componentModifications: string 
  } {
    const { componentName, componentType, htmlElement } = context;
    
    // For Bootstrap, we mostly rely on built-in classes
    // Generate minimal stylesheet for custom adjustments
    let styleContent = `/* ${componentName} Bootstrap custom styles */\n\n`;
    
    // Map component type to Bootstrap classes
    let bootstrapClasses: string[] = [];
    
    switch (componentType) {
      case 'button':
        bootstrapClasses = ['btn', 'btn-primary'];
        break;
        
      case 'card':
        bootstrapClasses = ['card'];
        break;
        
      case 'input':
        bootstrapClasses = ['form-control'];
        break;
        
      case 'navbar':
        bootstrapClasses = ['navbar', 'navbar-expand-lg', 'navbar-light', 'bg-light'];
        break;
        
      case 'layout':
        bootstrapClasses = ['container'];
        break;
        
      case 'list':
        bootstrapClasses = ['list-group'];
        break;
        
      case 'table':
        bootstrapClasses = ['table', 'table-striped'];
        break;
        
      case 'modal':
        bootstrapClasses = ['modal'];
        break;
        
      default:
        bootstrapClasses = ['container', 'py-3'];
    }
    
    // Add some custom styles for the component
    const baseClassName = this.getBaseClassName(componentName);
    styleContent += `.${baseClassName} {\n`;
    styleContent += `  /* Custom styles for ${componentName} */\n`;
    
    if (componentType === 'card') {
      styleContent += '  transition: box-shadow 0.3s ease-in-out;\n';
      styleContent += '}\n\n';
      styleContent += `.${baseClassName}:hover {\n`;
      styleContent += '  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);\n';
    } else {
      styleContent += '  /* Add custom styles here */\n';
    }
    
    styleContent += '}\n';
    
    // No imports needed for Bootstrap CSS
    const styleImports = '';
    
    // Generate component modifications
    const bootstrapClassNames = bootstrapClasses.join(' ');
    const componentModifications = `className="${bootstrapClassNames} ${baseClassName}"`;
    
    return {
      styleContent,
      styleImports,
      componentModifications
    };
  }
  
  /**
   * Generate Chakra UI styles
   * 
   * @param context Styling context
   * @returns Style generation partial result
   */
  private generateChakraUIStyles(context: StyleContext): { 
    styleContent: string; 
    styleImports: string; 
    componentModifications: string 
  } {
    const { componentName, componentType, htmlElement } = context;
    
    // For Chakra UI, we use the extendTheme function and component overrides
    // Generate imports
    const styleImports = `import { extendTheme } from '@chakra-ui/react';\n`;
    
    let styleContent = `// ${componentName} Chakra UI theme extension\n\n`;
    
    // Generate theme extension
    styleContent += `export const ${componentName.charAt(0).toLowerCase() + componentName.slice(1)}Theme = extendTheme({\n`;
    styleContent += `  components: {\n`;
    
    // Map component type to Chakra UI component
    let chakraComponent = '';
    let styleProps = '';
    
    switch (componentType) {
      case 'button':
        chakraComponent = 'Button';
        styleProps = `
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'md',
      },
      sizes: {
        md: {
          px: 4,
          py: 2,
        },
      },
      variants: {
        solid: {
          bg: 'blue.500',
          color: 'white',
          _hover: {
            bg: 'blue.600',
          },
        },
      },
      defaultProps: {
        variant: 'solid',
        size: 'md',
      },`;
        break;
        
      case 'card':
        chakraComponent = 'Box';
        styleProps = `
      baseStyle: {
        p: 6,
        borderRadius: 'lg',
        boxShadow: 'md',
        bg: 'white',
        _dark: {
          bg: 'gray.800',
        },
        transition: 'box-shadow 0.3s ease-in-out',
        _hover: {
          boxShadow: 'lg',
        },
      },`;
        break;
        
      case 'input':
        chakraComponent = 'Input';
        styleProps = `
      baseStyle: {
        field: {
          borderColor: 'gray.300',
          _focus: {
            borderColor: 'blue.500',
            boxShadow: '0 0 0 1px blue.500',
          },
          _dark: {
            borderColor: 'gray.600',
          },
        },
      },`;
        break;
        
      case 'layout':
        chakraComponent = 'Box';
        styleProps = `
      baseStyle: {
        display: 'flex',
        flexDirection: { base: 'column', md: 'row' },
        w: 'full',
        mx: 'auto',
        p: 4,
        maxW: '7xl',
      },`;
        break;
        
      default:
        chakraComponent = 'Box';
        styleProps = `
      baseStyle: {
        p: 4,
        bg: 'white',
        _dark: {
          bg: 'gray.800',
        },
      },`;
    }
    
    styleContent += `    ${chakraComponent}: {${styleProps}\n    },\n`;
    styleContent += `  },\n`;
    
    // Add custom colors
    styleContent += `  colors: {\n`;
    Object.entries(this.options.colors).forEach(([key, value]) => {
      if (typeof value === 'object') {
        styleContent += `    ${key}: {\n`;
        Object.entries(value).forEach(([subKey, subValue]) => {
          styleContent += `      ${subKey}: '${subValue}',\n`;
        });
        styleContent += `    },\n`;
      } else if (typeof value === 'string') {
        styleContent += `    ${key}: '${value}',\n`;
      }
    });
    styleContent += `  },\n`;
    
    styleContent += `});\n`;
    
    // Generate component modifications (Chakra props)
    const propsObject: Record<string, string> = {};
    
    switch (componentType) {
      case 'button':
        propsObject.colorScheme = 'blue';
        propsObject.size = 'md';
        break;
        
      case 'card':
        propsObject.p = '6';
        propsObject.borderRadius = 'lg';
        propsObject.boxShadow = 'md';
        propsObject.bg = 'white';
        if (this.options.includeDarkMode) {
          propsObject._dark = '{ bg: "gray.800" }';
        }
        break;
        
      case 'layout':
        propsObject.display = 'flex';
        propsObject.flexDirection = '{ base: "column", md: "row" }';
        propsObject.width = 'full';
        break;
        
      default:
        propsObject.p = '4';
        propsObject.bg = 'white';
        if (this.options.includeDarkMode) {
          propsObject._dark = '{ bg: "gray.800" }';
        }
    }
    
    // Convert props object to string
    const propsString = Object.entries(propsObject)
      .map(([key, value]) => `${key}=${value.includes('{') ? value : `"${value}"`}`)
      .join(' ');
    
    const componentModifications = propsString;
    
    return {
      styleContent,
      styleImports,
      componentModifications
    };
  }
  
  /**
   * Generate core styles for a component type
   * 
   * @param componentType Component type
   * @param htmlElement HTML element
   * @returns Core styles
   */
  private getCoreStylesForType(componentType: string, htmlElement?: string): string {
    switch (componentType) {
      case 'button':
        return `  /* Button styles */
  display: inline-block;
  padding: 0.5rem 1rem;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-tight);
  text-align: center;
  text-decoration: none;
  color: var(--color-text-light);
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  
  &:hover {
    background-color: var(--color-primary-dark);
  }
  
  &:active {
    transform: translateY(1px);
  }`;
        
      case 'card':
        return `  /* Card styles */
  padding: var(--spacing-6);
  background-color: var(--color-background-light);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  margin-bottom: var(--spacing-4);
  transition: box-shadow 0.3s ease-in-out;
  
  &:hover {
    box-shadow: var(--shadow-lg);
  }`;
        
      case 'input':
        return `  /* Input styles */
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: var(--font-size-md);
  line-height: var(--line-height-normal);
  color: var(--color-text-dark);
  background-color: var(--color-background-light);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.25);
    outline: none;
  }`;
        
      case 'navbar':
        return `  /* Navbar styles */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-4) var(--spacing-6);
  background-color: var(--color-background-light);
  box-shadow: var(--shadow-sm);
  position: relative;
  z-index: 10;`;
        
      case 'layout':
        return `  /* Layout styles */
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--spacing-4);
  
  /* Mobile first layout */
  @media (min-width: 768px) {
    flex-direction: row;
  }`;
        
      case 'list':
        return `  /* List styles */
  list-style: none;
  padding: 0;
  margin: 0;
  
  /* Dividers between list items */
  li {
    padding: var(--spacing-3) 0;
    border-bottom: 1px solid var(--color-border);
    
    &:last-child {
      border-bottom: none;
    }
  }`;
        
      case 'table':
        return `  /* Table styles */
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: var(--spacing-3) var(--spacing-4);
    text-align: left;
    border-bottom: 1px solid var(--color-border);
  }
  
  th {
    font-weight: var(--font-weight-bold);
    background-color: var(--color-background-light);
  }
  
  tr:hover {
    background-color: rgba(var(--color-primary-rgb), 0.05);
  }`;
        
      case 'modal':
        return `  /* Modal styles */
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  
  .modal-content {
    background-color: var(--color-background-light);
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-lg);
    padding: var(--spacing-6);
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
  }`;
        
      case 'form':
        return `  /* Form styles */
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  
  .form-group {
    margin-bottom: var(--spacing-4);
  }
  
  label {
    display: block;
    margin-bottom: var(--spacing-2);
    font-weight: var(--font-weight-medium);
  }
  
  input, select, textarea {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    transition: border-color 0.2s;
    
    &:focus {
      border-color: var(--color-primary);
      outline: none;
    }
  }`;
        
      case 'image':
        return `  /* Image styles */
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: var(--border-radius-md);
  overflow: hidden;`;
        
      default:
        return `  /* Container styles */
  width: 100%;
  padding: var(--spacing-4);
  background-color: var(--color-background-light);`;
    }
  }
  
  /**
   * Generate CSS variables for SCSS/LESS
   * 
   * @returns CSS variables
   */
  private generateCssVariables(): string {
    let variables = '/* Design tokens */\n';
    const variablePrefix = this.options.approach === StyleApproach.SCSS ? '$' : '@';
    
    // Typography variables
    variables += '\n/* Typography */\n';
    variables += `${variablePrefix}font-family: ${this.options.typography.fontFamily};\n`;
    
    Object.entries(this.options.typography.fontSizes).forEach(([name, value]) => {
      variables += `${variablePrefix}font-size-${name}: ${value};\n`;
    });
    
    Object.entries(this.options.typography.fontWeights).forEach(([name, value]) => {
      variables += `${variablePrefix}font-weight-${name}: ${value};\n`;
    });
    
    Object.entries(this.options.typography.lineHeights).forEach(([name, value]) => {
      variables += `${variablePrefix}line-height-${name}: ${value};\n`;
    });
    
    // Color variables
    variables += '\n/* Colors */\n';
    Object.entries(this.options.colors).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          variables += `${variablePrefix}color-${key}-${subKey}: ${subValue};\n`;
        });
      } else if (typeof value === 'string') {
        variables += `${variablePrefix}color-${key}: ${value};\n`;
      }
    });
    
    // Spacing variables
    variables += '\n/* Spacing */\n';
    variables += `${variablePrefix}spacing-base: ${this.options.spacing.baseUnit};\n`;
    
    Object.entries(this.options.spacing.scale).forEach(([name, value]) => {
      variables += `${variablePrefix}spacing-${name}: ${value};\n`;
    });
    
    // Border radius variables
    variables += '\n/* Border Radius */\n';
    Object.entries(this.options.spacing.borderRadius).forEach(([name, value]) => {
      variables += `${variablePrefix}border-radius-${name}: ${value};\n`;
    });
    
    // Shadow variables
    variables += '\n/* Shadows */\n';
    Object.entries(this.options.spacing.shadows).forEach(([name, value]) => {
      variables += `${variablePrefix}shadow-${name}: ${value};\n`;
    });
    
    // Breakpoint variables
    variables += '\n/* Breakpoints */\n';
    Object.entries(this.options.breakpoints).forEach(([name, value]) => {
      variables += `${variablePrefix}breakpoint-${name}: ${value};\n`;
    });
    
    variables += '\n';
    return variables;
  }
  
  /**
   * Generate nested styles for CSS/SCSS/LESS
   * 
   * @param baseClassName Base CSS class name
   * @param componentType Component type
   * @returns Nested styles
   */
  private generateNestedStyles(baseClassName: string, componentType: string): string {
    switch (componentType) {
      case 'card':
        return `.${baseClassName}-header {
  padding-bottom: var(--spacing-4);
  margin-bottom: var(--spacing-4);
  border-bottom: 1px solid var(--color-border);
}

.${baseClassName}-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-2);
}

.${baseClassName}-body {
  margin-bottom: var(--spacing-4);
}

.${baseClassName}-footer {
  margin-top: var(--spacing-4);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--color-border);
}
`;
        
      case 'layout':
        return `.${baseClassName}-sidebar {
  width: 100%;
  margin-bottom: var(--spacing-4);
  
  @media (min-width: 768px) {
    width: 250px;
    margin-right: var(--spacing-4);
    margin-bottom: 0;
  }
}

.${baseClassName}-main {
  flex: 1;
  width: 100%;
}

.${baseClassName}-footer {
  margin-top: var(--spacing-6);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--color-border);
}
`;
        
      case 'navbar':
        return `.${baseClassName}-brand {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  text-decoration: none;
}

.${baseClassName}-menu {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}

.${baseClassName}-item {
  margin-left: var(--spacing-4);
  
  a {
    text-decoration: none;
    color: var(--color-text-dark);
    transition: color 0.2s;
    
    &:hover {
      color: var(--color-primary);
    }
  }
}
`;
        
      default:
        return '';
    }
  }
  
  /**
   * Generate animation styles for CSS/SCSS/LESS
   * 
   * @param componentType Component type
   * @returns Animation styles
   */
  private generateAnimations(componentType: string): string {
    switch (componentType) {
      case 'button':
        return `/* Button animations */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--color-primary-rgb), 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(var(--color-primary-rgb), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--color-primary-rgb), 0);
  }
}

.btn-pulse {
  animation: pulse 2s infinite;
}
`;
        
      case 'card':
        return `/* Card animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-animated {
  animation: fadeIn 0.5s ease-out;
}
`;
        
      case 'modal':
        return `/* Modal animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-fade {
  animation: fadeIn 0.3s ease-out;
}

.modal-content {
  animation: slideIn 0.3s ease-out;
}
`;
        
      default:
        return '';
    }
  }
  
  /**
   * Generate responsive styles for CSS/SCSS/LESS
   * 
   * @param baseClassName Base CSS class name
   * @param componentType Component type
   * @returns Responsive styles
   */
  private generateResponsiveStyles(baseClassName: string, componentType: string): string {
    let styles = '/* Responsive styles */\n';
    
    Object.entries(this.options.breakpoints).forEach(([name, size]) => {
      styles += `@media (min-width: ${size}) {\n`;
      
      switch (componentType) {
        case 'card':
          styles += `  .${baseClassName} {\n`;
          styles += `    width: ${name === 'sm' ? '100%' : name === 'md' ? '85%' : '70%'};\n`;
          styles += `  }\n`;
          break;
          
        case 'layout':
          styles += `  .${baseClassName} {\n`;
          styles += `    flex-direction: ${name === 'sm' ? 'column' : 'row'};\n`;
          styles += `  }\n`;
          
          styles += `  .${baseClassName}-sidebar {\n`;
          styles += `    width: ${name === 'sm' ? '100%' : name === 'md' ? '250px' : '300px'};\n`;
          styles += `  }\n`;
          break;
          
        case 'navbar':
          styles += `  .${baseClassName}-menu {\n`;
          styles += `    display: ${name === 'sm' ? 'none' : 'flex'};\n`;
          styles += `  }\n`;
          
          styles += `  .${baseClassName}-toggle {\n`;
          styles += `    display: ${name === 'sm' ? 'block' : 'none'};\n`;
          styles += `  }\n`;
          break;
      }
      
      styles += '}\n\n';
    });
    
    return styles;
  }
  
  /**
   * Generate dark mode styles for CSS/SCSS/LESS
   * 
   * @param baseClassName Base CSS class name
   * @param componentType Component type
   * @returns Dark mode styles
   */
  private generateDarkModeStyles(baseClassName: string, componentType: string): string {
    let darkStyles = '/* Dark mode styles */\n';
    darkStyles += '@media (prefers-color-scheme: dark) {\n';
    
    switch (componentType) {
      case 'button':
        darkStyles += `  .${baseClassName} {\n`;
        darkStyles += '    background-color: var(--color-primary-dark);\n';
        darkStyles += '    color: var(--color-text-light);\n';
        darkStyles += '  }\n';
        break;
        
      case 'card':
        darkStyles += `  .${baseClassName} {\n`;
        darkStyles += '    background-color: var(--color-background-dark);\n';
        darkStyles += '    color: var(--color-text-light);\n';
        darkStyles += '    border-color: var(--color-border-dark);\n';
        darkStyles += '  }\n';
        
        darkStyles += `  .${baseClassName}-header,\n`;
        darkStyles += `  .${baseClassName}-footer {\n`;
        darkStyles += '    border-color: var(--color-border-dark);\n';
        darkStyles += '  }\n';
        break;
        
      case 'input':
        darkStyles += `  .${baseClassName} {\n`;
        darkStyles += '    background-color: var(--color-background-dark);\n';
        darkStyles += '    color: var(--color-text-light);\n';
        darkStyles += '    border-color: var(--color-border-dark);\n';
        darkStyles += '  }\n';
        break;
        
      default:
        darkStyles += `  .${baseClassName} {\n`;
        darkStyles += '    background-color: var(--color-background-dark);\n';
        darkStyles += '    color: var(--color-text-light);\n';
        darkStyles += '  }\n';
    }
    
    darkStyles += '}\n';
    return darkStyles;
  }
  
  /**
   * Generate styled-components nested elements
   * 
   * @param componentType Component type
   * @returns Styled-components nested styles
   */
  private generateStyledNestedElements(componentType: string): string {
    switch (componentType) {
      case 'card':
        return `
  /* Card parts */
  .card-header {
    padding-bottom: ${props => props.theme.spacing[4]};
    margin-bottom: ${props => props.theme.spacing[4]};
    border-bottom: 1px solid ${props => props.theme.colors.border};
  }
  
  .card-title {
    font-size: ${props => props.theme.typography.fontSizes.xl};
    font-weight: bold;
    margin-bottom: ${props => props.theme.spacing[2]};
  }
  
  .card-body {
    margin-bottom: ${props => props.theme.spacing[4]};
  }
  
  .card-footer {
    margin-top: ${props => props.theme.spacing[4]};
    padding-top: ${props => props.theme.spacing[4]};
    border-top: 1px solid ${props => props.theme.colors.border};
  }`;
        
      case 'layout':
        return `
  /* Layout parts */
  .layout-sidebar {
    width: 100%;
    margin-bottom: ${props => props.theme.spacing[4]};
    
    @media (min-width: ${props => props.theme.breakpoints.md}) {
      width: 250px;
      margin-right: ${props => props.theme.spacing[4]};
      margin-bottom: 0;
    }
  }
  
  .layout-main {
    flex: 1;
    width: 100%;
  }
  
  .layout-footer {
    margin-top: ${props => props.theme.spacing[6]};
    padding-top: ${props => props.theme.spacing[4]};
    border-top: 1px solid ${props => props.theme.colors.border};
  }`;
        
      case 'navbar':
        return `
  /* Navbar parts */
  .navbar-brand {
    font-size: ${props => props.theme.typography.fontSizes.xl};
    font-weight: bold;
    color: ${props => props.theme.colors.primary};
    text-decoration: none;
  }
  
  .navbar-menu {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .navbar-item {
    margin-left: ${props => props.theme.spacing[4]};
    
    a {
      text-decoration: none;
      color: ${props => props.theme.colors.text};
      transition: color 0.2s;
      
      &:hover {
        color: ${props => props.theme.colors.primary};
      }
    }
  }`;
        
      default:
        return '';
    }
  }
  
  /**
   * Generate styled-components animations
   * 
   * @param componentType Component type
   * @returns Styled-components animations
   */
  private generateStyledAnimations(componentType: string): string {
    switch (componentType) {
      case 'button':
        return `
  /* Button animations */
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(0, 123, 255, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(0, 123, 255, 0);
    }
  }
  
  &.btn-pulse {
    animation: pulse 2s infinite;
  }`;
        
      case 'card':
        return `
  /* Card animations */
  transition: transform 0.3s, box-shadow 0.3s;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }`;
        
      default:
        return '';
    }
  }
  
  /**
   * Generate styled-components child components
   * 
   * @param componentName Component name
   * @param componentType Component type
   * @returns Styled-components child components
   */
  private generateStyledChildComponents(componentName: string, componentType: string): string {
    switch (componentType) {
      case 'card':
        return `export const Styled${componentName}Header = styled.div\`
  padding-bottom: \${props => props.theme.spacing[4]};
  margin-bottom: \${props => props.theme.spacing[4]};
  border-bottom: 1px solid \${props => props.theme.colors.border};
\`;

export const Styled${componentName}Title = styled.h3\`
  font-size: \${props => props.theme.typography.fontSizes.xl};
  font-weight: bold;
  margin-bottom: \${props => props.theme.spacing[2]};
  color: \${props => props.theme.colors.text};
\`;

export const Styled${componentName}Body = styled.div\`
  margin-bottom: \${props => props.theme.spacing[4]};
\`;

export const Styled${componentName}Footer = styled.div\`
  margin-top: \${props => props.theme.spacing[4]};
  padding-top: \${props => props.theme.spacing[4]};
  border-top: 1px solid \${props => props.theme.colors.border};
\`;`;
        
      case 'layout':
        return `export const Styled${componentName}Sidebar = styled.div\`
  width: 100%;
  margin-bottom: \${props => props.theme.spacing[4]};
  
  @media (min-width: \${props => props.theme.breakpoints.md}) {
    width: 250px;
    margin-right: \${props => props.theme.spacing[4]};
    margin-bottom: 0;
  }
\`;

export const Styled${componentName}Main = styled.main\`
  flex: 1;
  width: 100%;
\`;

export const Styled${componentName}Footer = styled.footer\`
  margin-top: \${props => props.theme.spacing[6]};
  padding-top: \${props => props.theme.spacing[4]};
  border-top: 1px solid \${props => props.theme.colors.border};
\`;`;
        
      case 'navbar':
        return `export const Styled${componentName}Brand = styled.a\`
  font-size: \${props => props.theme.typography.fontSizes.xl};
  font-weight: bold;
  color: \${props => props.theme.colors.primary};
  text-decoration: none;
\`;

export const Styled${componentName}Menu = styled.ul\`
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
\`;

export const Styled${componentName}Item = styled.li\`
  margin-left: \${props => props.theme.spacing[4]};
  
  a {
    text-decoration: none;
    color: \${props => props.theme.colors.text};
    transition: color 0.2s;
    
    &:hover {
      color: \${props => props.theme.colors.primary};
    }
  }
\`;`;
        
      default:
        return '';
    }
  }
  
  /**
   * Generate Emotion nested elements
   * 
   * @param componentType Component type
   * @returns Emotion nested styles
   */
  private generateEmotionNestedElements(componentType: string): string {
    switch (componentType) {
      case 'card':
        return `
  /* Card parts */
  .card-header {
    padding-bottom: \${theme.spacing[4]};
    margin-bottom: \${theme.spacing[4]};
    border-bottom: 1px solid \${theme.colors.border};
  }
  
  .card-title {
    font-size: \${theme.typography.fontSize};
    font-weight: bold;
    margin-bottom: \${theme.spacing[2]};
  }
  
  .card-body {
    margin-bottom: \${theme.spacing[4]};
  }
  
  .card-footer {
    margin-top: \${theme.spacing[4]};
    padding-top: \${theme.spacing[4]};
    border-top: 1px solid \${theme.colors.border};
  }`;
        
      default:
        return '';
    }
  }
  
  /**
   * Generate Emotion animations
   * 
   * @param componentType Component type
   * @returns Emotion animations
   */
  private generateEmotionAnimations(componentType: string): string {
    return '';
  }
  
  /**
   * Generate Emotion child styles
   * 
   * @param componentName Component name
   * @param componentType Component type
   * @returns Emotion child styles
   */
  private generateEmotionChildStyles(componentName: string, componentType: string): string {
    switch (componentType) {
      case 'card':
        return `export const ${componentName.charAt(0).toLowerCase() + componentName.slice(1)}HeaderStyle = css\`
  padding-bottom: \${theme.spacing[4]};
  margin-bottom: \${theme.spacing[4]};
  border-bottom: 1px solid \${theme.colors.border};
\`;

export const ${componentName.charAt(0).toLowerCase() + componentName.slice(1)}TitleStyle = css\`
  font-size: \${theme.typography.fontSize};
  font-weight: bold;
  margin-bottom: \${theme.spacing[2]};
\`;

export const ${componentName.charAt(0).toLowerCase() + componentName.slice(1)}BodyStyle = css\`
  margin-bottom: \${theme.spacing[4]};
\`;

export const ${componentName.charAt(0).toLowerCase() + componentName.slice(1)}FooterStyle = css\`
  margin-top: \${theme.spacing[4]};
  padding-top: \${theme.spacing[4]};
  border-top: 1px solid \${theme.colors.border};
\`;`;
        
      default:
        return '';
    }
  }
  
  /**
   * Generate Material UI nested styles
   * 
   * @param componentType Component type
   * @param styleContent Style content to append to
   * @returns Updated style content
   */
  private generateMaterialNestedStyles(componentType: string, styleContent: string): string {
    switch (componentType) {
      case 'card':
        styleContent += `  header: {\n`;
        styleContent += `    paddingBottom: theme.spacing(2),\n`;
        styleContent += `    marginBottom: theme.spacing(2),\n`;
        styleContent += `    borderBottom: \`1px solid \${theme.palette.divider}\`,\n`;
        styleContent += `  },\n`;
        
        styleContent += `  title: {\n`;
        styleContent += `    fontSize: theme.typography.h6.fontSize,\n`;
        styleContent += `    fontWeight: theme.typography.fontWeightBold,\n`;
        styleContent += `    marginBottom: theme.spacing(1),\n`;
        styleContent += `  },\n`;
        
        styleContent += `  body: {\n`;
        styleContent += `    marginBottom: theme.spacing(2),\n`;
        styleContent += `  },\n`;
        
        styleContent += `  footer: {\n`;
        styleContent += `    marginTop: theme.spacing(2),\n`;
        styleContent += `    paddingTop: theme.spacing(2),\n`;
        styleContent += `    borderTop: \`1px solid \${theme.palette.divider}\`,\n`;
        styleContent += `  },\n`;
        break;
    }
    
    return styleContent;
  }
  
  /**
   * Get base class name for a component
   * 
   * @param componentName Component name
   * @returns Base class name
   */
  private getBaseClassName(componentName: string): string {
    return componentName.charAt(0).toLowerCase() + componentName.slice(1);
  }
  
  /**
   * Indent lines of text
   * 
   * @param text Text to indent
   * @param indent Indentation string
   * @returns Indented text
   */
  private indentLines(text: string, indent: string = '  '): string {
    return text.split('\n').map(line => `${indent}${line}`).join('\n');
  }
}

export default StyleGenerator;