import { InferredProp } from '../PropTypeInference';

/**
 * Interface for style generators
 * Defines the contract that all style generators must implement
 */
export interface IStyleGenerator {
  /**
   * Generate styles based on provided options and component props
   */
  generateStyles(
    options: StyleGeneratorOptions,
    componentProps?: Record<string, any>
  ): StyleGenerationResult;
  
  /**
   * Generate theme file if applicable
   */
  generateTheme?(options: StyleGeneratorOptions): StyleGenerationResult | null;
  
  /**
   * Check if the generator supports a specific feature
   */
  supportsFeature(feature: string): boolean;
}

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