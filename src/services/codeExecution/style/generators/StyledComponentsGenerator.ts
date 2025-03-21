import {
  StyleApproach,
  StyleGeneratorOptions,
  StyleGenerationResult
} from '../types';
import { StyleGeneratorBase } from '../StyleGeneratorBase';

/**
 * Generates styled-components styles
 */
export class StyledComponentsGenerator extends StyleGeneratorBase {
  constructor() {
    super(StyleApproach.STYLED_COMPONENTS);
  }
  
  /**
   * Generate styled-components styles based on the provided options
   */
  generateStyles(
    options: StyleGeneratorOptions,
    componentProps?: Record<string, any>
  ): StyleGenerationResult {
    const validatedOptions = this.validateOptions(options);
    
    // Generate imports
    const imports = [
      "import styled from 'styled-components';",
      "import { ThemeProvider, createGlobalStyle } from 'styled-components';",
    ];
    
    // Generate theme object
    const theme = this.generateThemeObject(validatedOptions);
    
    // Generate global styles
    const globalStyles = this.generateGlobalStyles(validatedOptions);
    
    // Generate component styles
    const componentStyles = this.generateComponentStyles(validatedOptions, componentProps);
    
    // Combine all code
    const code = `${imports.join('\n')}\n\n${theme}\n\n${globalStyles}\n\n${componentStyles}`;
    
    return {
      styleContent: code,
      styleImports: imports.join('\n'),
      styleFilePath: 'src/styles/StyledComponents.ts',
      componentModifications: '', // No direct modifications to component code
      approach: StyleApproach.STYLED_COMPONENTS
    };
  }
  
  /**
   * Generate theme file for styled-components
   */
  generateTheme(options: StyleGeneratorOptions): StyleGenerationResult {
    const validatedOptions = this.validateOptions(options);
    
    // Generate theme object
    const theme = this.generateThemeObject(validatedOptions);
    
    // Generate theme file content
    const code = `import { DefaultTheme } from 'styled-components';\n\n${theme}\n\nexport default theme;`;
    
    return {
      styleContent: code,
      styleImports: "import { DefaultTheme } from 'styled-components';",
      styleFilePath: 'src/styles/theme.ts',
      componentModifications: '', // No direct modifications to component code
      approach: StyleApproach.STYLED_COMPONENTS
    };
  }
  
  /**
   * Generate a theme object based on options
   */
  private generateThemeObject(options: StyleGeneratorOptions): string {
    let theme = 'export const theme = {\n';
    
    // Add colors
    theme += '  colors: {\n';
    if (options.colors) {
      Object.entries(options.colors).forEach(([name, value]) => {
        if (typeof value === 'string') {
          theme += `    ${name}: '${this.formatColor(value)}',\n`;
        }
      });
      
      // Custom colors would go here
      if (options.colors.custom) {
        Object.entries(options.colors.custom).forEach(([colorName, value]) => {
          theme += `    ${colorName}: '${this.formatColor(value)}',\n`;
        });
      }
    }
    theme += '  },\n';
    
    // Add typography
    theme += '  typography: {\n';
    if (options.typography) {
      const typography = options.typography;
      
      if (typography.fontFamily) {
        const fontFamily = Array.isArray(typography.fontFamily)
          ? typography.fontFamily.join(', ')
          : typography.fontFamily;
        theme += `    fontFamily: '${fontFamily}',\n`;
      }
      
      if (typography.fontSizes) {
        theme += '    fontSizes: {\n';
        Object.entries(typography.fontSizes).forEach(([name, value]) => {
          theme += `      ${name}: '${value}',\n`;
        });
        theme += '    },\n';
      }
      
      if (typography.fontWeights) {
        theme += '    fontWeights: {\n';
        Object.entries(typography.fontWeights).forEach(([name, value]) => {
          theme += `      ${name}: ${value},\n`;
        });
        theme += '    },\n';
      }
    }
    theme += '  },\n';
    
    // Add spacing
    theme += '  spacing: {\n';
    if (options.spacing && options.spacing.scale) {
      Object.entries(options.spacing.scale).forEach(([name, value]) => {
        theme += `    ${name}: '${this.formatSpacing(value)}',\n`;
      });
    } else {
      // Default spacing
      theme += `    xs: '0.25rem',\n`;
      theme += `    sm: '0.5rem',\n`;
      theme += `    md: '1rem',\n`;
      theme += `    lg: '1.5rem',\n`;
      theme += `    xl: '2rem',\n`;
    }
    theme += '  },\n';
    
    // Add breakpoints
    theme += '  breakpoints: {\n';
    if (options.breakpoints) {
      Object.entries(options.breakpoints).forEach(([name, value]) => {
        theme += `    ${name}: '${value}',\n`;
      });
    } else {
      // Default breakpoints
      theme += `    sm: '640px',\n`;
      theme += `    md: '768px',\n`;
      theme += `    lg: '1024px',\n`;
      theme += `    xl: '1280px',\n`;
    }
    theme += '  },\n';
    
    // Add custom tokens
    if (options.customTokens) {
      Object.entries(options.customTokens).forEach(([category, values]) => {
        if (typeof values === 'object' && values !== null) {
          theme += `  ${category}: {\n`;
          Object.entries(values as Record<string, any>).forEach(([name, value]) => {
            if (typeof value === 'string' || typeof value === 'number') {
              theme += `    ${name}: ${typeof value === 'string' ? `'${value}'` : value},\n`;
            }
          });
          theme += '  },\n';
        }
      });
    }
    
    theme += '};\n\n';
    
    // Add TypeScript type definition
    theme += `// Add this to your styled.d.ts file to extend DefaultTheme\n`;
    theme += `/*
declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
      // Add other colors...
    };
    typography: {
      fontFamily: string;
      fontSizes: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
      };
      // Add other typography properties...
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    breakpoints: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    // Add other theme properties...
  }
}
*/`;
    
    return theme;
  }
  
  /**
   * Generate global styles for styled-components
   */
  private generateGlobalStyles(options: StyleGeneratorOptions): string {
    let styles = 'export const GlobalStyle = createGlobalStyle`\n';
    
    // Reset styles
    styles += '  /* Reset styles */\n';
    styles += '  *, *::before, *::after {\n';
    styles += '    box-sizing: border-box;\n';
    styles += '  }\n\n';
    
    // Body styles
    styles += '  body {\n';
    styles += '    margin: 0;\n';
    styles += '    padding: 0;\n';
    styles += '    background-color: ${({ theme }) => theme.colors.background};\n';
    styles += '    color: ${({ theme }) => theme.colors.text};\n';
    styles += '    font-family: ${({ theme }) => theme.typography.fontFamily};\n';
    styles += '  }\n';
    
    // Dark mode
    if (options.includeDarkMode) {
      styles += '\n  /* Dark mode styles */\n';
      styles += '  @media (prefers-color-scheme: dark) {\n';
      styles += '    body {\n';
      styles += '      background-color: #121212;\n';
      styles += '      color: #f8f8f8;\n';
      styles += '    }\n';
      styles += '  }\n';
    }
    
    // Animations
    if (options.includeAnimations) {
      styles += '\n  /* Animation keyframes */\n';
      styles += '  @keyframes fadeIn {\n';
      styles += '    from { opacity: 0; }\n';
      styles += '    to { opacity: 1; }\n';
      styles += '  }\n\n';
      
      styles += '  @keyframes slideIn {\n';
      styles += '    from { transform: translateY(20px); opacity: 0; }\n';
      styles += '    to { transform: translateY(0); opacity: 1; }\n';
      styles += '  }\n\n';
      
      styles += '  .fade-in {\n';
      styles += '    animation: fadeIn 0.3s ease-in-out;\n';
      styles += '  }\n\n';
      
      styles += '  .slide-in {\n';
      styles += '    animation: slideIn 0.3s ease-in-out;\n';
      styles += '  }\n';
    }
    
    // Custom styles
    if (options.customStyles) {
      styles += '\n  /* Custom styles */\n';
      Object.entries(options.customStyles).forEach(([selector, styleBlock]) => {
        styles += `  ${selector} {\n    ${styleBlock.replace(/\n/g, '\n    ')}\n  }\n`;
      });
    }
    
    styles += '`;\n';
    
    return styles;
  }
  
  /**
   * Generate component styles for styled-components
   */
  private generateComponentStyles(
    options: StyleGeneratorOptions,
    componentProps?: Record<string, any>
  ): string {
    let styles = '// Component styles\n';
    
    // Basic styled component template
    styles += 'export const StyledComponent = styled.div`\n';
    styles += '  /* Base styles */\n';
    styles += '  display: flex;\n';
    styles += '  flex-direction: column;\n';
    styles += '  padding: ${({ theme }) => theme.spacing.md};\n';
    
    // Add component-specific styles based on props
    if (componentProps) {
      if (componentProps.padding) {
        styles += `  padding: ${this.formatSpacing(componentProps.padding)};\n`;
      }
      
      if (componentProps.margin) {
        styles += `  margin: ${this.formatSpacing(componentProps.margin)};\n`;
      }
      
      if (componentProps.width) {
        styles += `  width: ${componentProps.width};\n`;
      }
      
      if (componentProps.height) {
        styles += `  height: ${componentProps.height};\n`;
      }
    }
    
    // Responsive styles
    if (options.includeResponsive && options.breakpoints) {
      styles += '\n  /* Responsive styles */\n';
      Object.entries(options.breakpoints).forEach(([name, value]) => {
        styles += `  @media (min-width: ${value}) {\n`;
        styles += `    /* Styles for ${name} breakpoint */\n`;
        styles += `  }\n`;
      });
    }
    
    styles += '`;\n\n';
    
    // Example of a styled component with props
    styles += '// Example of a component using props for conditional styling\n';
    styles += 'export const Button = styled.button<{ primary?: boolean; size?: "small" | "medium" | "large" }>`\n';
    styles += '  background-color: ${({ primary, theme }) => primary ? theme.colors.primary : "transparent"};\n';
    styles += '  color: ${({ primary, theme }) => primary ? "white" : theme.colors.primary};\n';
    styles += '  border: 2px solid ${({ theme }) => theme.colors.primary};\n';
    styles += '  border-radius: 4px;\n';
    styles += '  padding: ${({ size, theme }) => {\n';
    styles += '    switch (size) {\n';
    styles += '      case "small": return `${theme.spacing.xs} ${theme.spacing.sm}`;\n';
    styles += '      case "large": return `${theme.spacing.md} ${theme.spacing.lg}`;\n';
    styles += '      default: return `${theme.spacing.sm} ${theme.spacing.md}`;\n';
    styles += '    }\n';
    styles += '  }};\n';
    styles += '  font-size: ${({ size, theme }) => {\n';
    styles += '    switch (size) {\n';
    styles += '      case "small": return theme.typography.fontSizes.xs;\n';
    styles += '      case "large": return theme.typography.fontSizes.lg;\n';
    styles += '      default: return theme.typography.fontSizes.md;\n';
    styles += '    }\n';
    styles += '  }};\n';
    styles += '  cursor: pointer;\n';
    styles += '  transition: all 0.2s ease-in-out;\n\n';
    
    styles += '  &:hover {\n';
    styles += '    background-color: ${({ primary, theme }) => primary ? theme.colors.primary : "rgba(0, 0, 0, 0.05)"};\n';
    styles += '    opacity: 0.9;\n';
    styles += '  }\n';
    styles += '`;\n\n';
    
    // Example usage
    styles += '// Example usage with ThemeProvider\n';
    styles += '/*\nimport React from "react";\n\nconst App = () => {\n';
    styles += '  return (\n';
    styles += '    <ThemeProvider theme={theme}>\n';
    styles += '      <GlobalStyle />\n';
    styles += '      <StyledComponent>\n';
    styles += '        <h1>My Styled App</h1>\n';
    styles += '        <Button>Default Button</Button>\n';
    styles += '        <Button primary>Primary Button</Button>\n';
    styles += '        <Button size="large">Large Button</Button>\n';
    styles += '      </StyledComponent>\n';
    styles += '    </ThemeProvider>\n';
    styles += '  );\n';
    styles += '};\n\nexport default App;\n*/';
    
    return styles;
  }
}