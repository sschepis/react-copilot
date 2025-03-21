import { Plugin, PluginHooks, PluginContext, ModifiableComponent, CodeChangeResult } from '../../../utils/types';

/**
 * Interface defining an accessibility rule
 */
export interface AccessibilityRule {
  id: string;
  description: string;
  test: (code: string) => { passed: boolean; elements?: string[] };
  severity: 'error' | 'warning' | 'info';
  helpUrl?: string;
  wcagCriteria?: string; // e.g., "WCAG 2.1 AA 1.1.1"
}

/**
 * Options for configuring the accessibility plugin
 */
export interface AccessibilityPluginOptions {
  /** Minimum severity level to report ('error', 'warning', 'info') */
  minSeverity?: 'error' | 'warning' | 'info';
  /** Whether to insert accessible fixes automatically when possible */
  autoFix?: boolean;
  /** Custom rules to add to the default set */
  customRules?: AccessibilityRule[];
  /** Rules to disable (by ID) */
  disabledRules?: string[];
  /** Whether to include WCAG reference information */
  includeWcagInfo?: boolean;
  /** Whether to display detailed error information */
  verboseOutput?: boolean;
}

/**
 * Access violation with details
 */
export interface AccessibilityViolation {
  ruleId: string;
  description: string;
  elements: string[];
  severity: 'error' | 'warning' | 'info';
  helpUrl?: string;
  wcagCriteria?: string;
}

/**
 * Plugin for checking React components for accessibility issues
 */
export class AccessibilityPlugin implements Plugin {
  id = 'accessibility-plugin';
  name = 'Accessibility Plugin';
  version = '1.0.0';
  
  private options: AccessibilityPluginOptions;
  private rules: AccessibilityRule[] = [];
  private context: PluginContext | null = null;
  
  /**
   * Plugin hooks implementation
   */
  hooks: PluginHooks = {
    // Check for accessibility issues during component registration
    beforeComponentRegistration: (component: ModifiableComponent): ModifiableComponent => {
      if (!component.sourceCode) {
        return component;
      }
      
      // Check for accessibility issues
      const violations = this.checkAccessibility(component.sourceCode);
      
      if (violations.length > 0) {
        console.log(`[AccessibilityPlugin] Found ${violations.length} issues in component ${component.name}`);
        
        // Output violations to console
        if (this.options.verboseOutput) {
          violations.forEach(v => {
            console.log(`- ${v.severity.toUpperCase()}: ${v.description}`);
            if (v.elements.length > 0) {
              console.log(`  Affected elements: ${v.elements.join(', ')}`);
            }
            if (v.wcagCriteria && this.options.includeWcagInfo) {
              console.log(`  WCAG: ${v.wcagCriteria}`);
            }
            if (v.helpUrl) {
              console.log(`  More info: ${v.helpUrl}`);
            }
          });
        }
        
        // Apply auto-fixes if enabled
        if (this.options.autoFix) {
          const fixedCode = this.applyAccessibilityFixes(component.sourceCode, violations);
          if (fixedCode !== component.sourceCode) {
            return { ...component, sourceCode: fixedCode };
          }
        }
      }
      
      return component;
    },
    
    // Check code for accessibility issues before execution
    beforeCodeExecution: (code: string): string => {
      const violations = this.checkAccessibility(code);
      
      if (violations.length > 0) {
        console.log(`[AccessibilityPlugin] Found ${violations.length} accessibility issues`);
        
        // Add comments for violations
        const violationComments = violations
          .map(v => {
            let comment = `// ACCESSIBILITY ${v.severity.toUpperCase()}: ${v.description}`;
            if (v.wcagCriteria && this.options.includeWcagInfo) {
              comment += ` (${v.wcagCriteria})`;
            }
            if (v.helpUrl) {
              comment += `\n// More info: ${v.helpUrl}`;
            }
            return comment;
          })
          .join('\n');
        
        // Apply auto-fixes if enabled
        if (this.options.autoFix) {
          const fixedCode = this.applyAccessibilityFixes(code, violations);
          if (fixedCode !== code) {
            return `${violationComments}\n\n${fixedCode}`;
          }
        }
        
        return `${violationComments}\n\n${code}`;
      }
      
      return code;
    }
  };
  
  /**
   * Create a new AccessibilityPlugin
   * @param options Plugin configuration options
   */
  constructor(options: AccessibilityPluginOptions = {}) {
    this.options = {
      minSeverity: 'warning',
      autoFix: false,
      customRules: [],
      disabledRules: [],
      includeWcagInfo: true,
      verboseOutput: true,
      ...options
    };
    
    // Initialize default rules
    this.initializeRules();
    
    // Add custom rules
    if (this.options.customRules) {
      this.rules.push(...this.options.customRules);
    }
    
    // Filter out disabled rules
    if (this.options.disabledRules) {
      this.rules = this.rules.filter(rule => !this.options.disabledRules!.includes(rule.id));
    }
  }
  
  /**
   * Initialize the plugin with context
   * @param context The plugin context
   */
  async initialize(context: PluginContext): Promise<void> {
    console.log('[AccessibilityPlugin] Initializing...');
    this.context = context;
    console.log('[AccessibilityPlugin] Initialized successfully');
  }
  
  /**
   * Clean up plugin resources
   */
  async destroy(): Promise<void> {
    console.log('[AccessibilityPlugin] Cleaning up...');
    this.context = null;
    console.log('[AccessibilityPlugin] Clean up complete');
  }
  
  /**
   * Initialize default accessibility rules
   */
  private initializeRules(): void {
    this.rules = [
      // Alt text for images
      {
        id: 'img-alt',
        description: 'Images must have alt text',
        test: (code) => {
          const imgRegex = /<img\s+(?![^>]*alt=)[^>]*>/g;
          const matches = code.match(imgRegex) || [];
          return { 
            passed: matches.length === 0,
            elements: matches
          };
        },
        severity: 'error',
        helpUrl: 'https://www.w3.org/WAI/tutorials/images/decision-tree/',
        wcagCriteria: 'WCAG 2.1 A 1.1.1'
      },
      
      // Form inputs need labels
      {
        id: 'input-label',
        description: 'Form inputs should have associated labels',
        test: (code) => {
          // This is a simplified check - a real implementation would be more comprehensive
          const inputRegex = /<input\s+(?![^>]*aria-label|[^>]*aria-labelledby|[^>]*role="presentation")[^>]*>/g;
          const matches = code.match(inputRegex) || [];
          
          // Also check for inputs that don't have a nearby label element
          // Modified to avoid using 's' flag which requires ES2018+
          const inputWithoutLabelRegex = /<input[^>]*id="([^"]*)"[^>]*>(?:(?!<label[^>]*for="\1")[\s\S])*$/g;
          const unlabeledMatches = code.match(inputWithoutLabelRegex) || [];
          
          return { 
            passed: matches.length === 0 && unlabeledMatches.length === 0,
            elements: [...matches, ...unlabeledMatches]
          };
        },
        severity: 'error',
        helpUrl: 'https://www.w3.org/WAI/tutorials/forms/labels/',
        wcagCriteria: 'WCAG 2.1 A 1.3.1'
      },
      
      // Color contrast
      {
        id: 'color-contrast-warning',
        description: 'Be cautious of potential color contrast issues with hardcoded colors',
        test: (code) => {
          // Look for inline style color declarations - this is just an approximation
          const colorRegex = /style=\{?["']\s*color:\s*(#[0-9a-f]{3,6}|rgba?\([^)]+\))/gi;
          const matches = code.match(colorRegex) || [];
          return { 
            passed: matches.length === 0,
            elements: matches
          };
        },
        severity: 'warning',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
        wcagCriteria: 'WCAG 2.1 AA 1.4.3'
      },
      
      // Interactive elements with keyboard support
      {
        id: 'keyboard-interaction',
        description: 'Custom interactive elements should have keyboard support',
        test: (code) => {
          // Check for div/span with click handlers but no keyboard handlers
          const clickWithoutKeyboardRegex = /<(div|span)[^>]*onClick=[^>]*(?!onKeyDown|onKeyUp|onKeyPress)[^>]*>/g;
          const matches = code.match(clickWithoutKeyboardRegex) || [];
          return { 
            passed: matches.length === 0,
            elements: matches
          };
        },
        severity: 'error',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
        wcagCriteria: 'WCAG 2.1 A 2.1.1'
      },
      
      // ARIA roles
      {
        id: 'valid-aria-role',
        description: 'ARIA roles must be valid',
        test: (code) => {
          // Check for invalid ARIA roles (simplified)
          const validRoles = [
            'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 
            'cell', 'checkbox', 'columnheader', 'combobox', 'complementary', 
            'contentinfo', 'definition', 'dialog', 'directory', 'document', 
            'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading', 
            'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main', 
            'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 
            'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation', 
            'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup', 
            'rowheader', 'scrollbar', 'search', 'searchbox', 'separator', 
            'slider', 'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist', 
            'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 
            'treegrid', 'treeitem'
          ];
          
          const rolePattern = /role=["']([^"']+)["']/g;
          let match;
          const invalidRoles = [];
          
          while ((match = rolePattern.exec(code)) !== null) {
            const role = match[1];
            if (!validRoles.includes(role)) {
              invalidRoles.push(`Invalid role: ${role} in ${match[0]}`);
            }
          }
          
          return {
            passed: invalidRoles.length === 0,
            elements: invalidRoles
          };
        },
        severity: 'error',
        helpUrl: 'https://www.w3.org/TR/wai-aria-1.1/#role_definitions',
        wcagCriteria: 'WCAG 2.1 A 4.1.2'
      },
      
      // Headings in correct order
      {
        id: 'heading-order',
        description: 'Heading levels should only increase by one',
        test: (code) => {
          const headings = [];
          const headingRegex = /<h([1-6])[^>]*>/g;
          let match;
          
          while ((match = headingRegex.exec(code)) !== null) {
            headings.push(parseInt(match[1], 10));
          }
          
          const violations = [];
          for (let i = 1; i < headings.length; i++) {
            if (headings[i] > headings[i-1] + 1) {
              violations.push(`Heading jumps from h${headings[i-1]} to h${headings[i]}`);
            }
          }
          
          return {
            passed: violations.length === 0,
            elements: violations
          };
        },
        severity: 'warning',
        helpUrl: 'https://www.w3.org/WAI/tutorials/page-structure/headings/',
        wcagCriteria: 'WCAG 2.1 A 1.3.1'
      }
    ];
  }
  
  /**
   * Check code for accessibility issues
   * @param code Component source code to check
   * @returns Array of accessibility violations
   */
  checkAccessibility(code: string): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    
    // Map severity levels to numeric values for comparison
    const severityValues = {
      'error': 3,
      'warning': 2,
      'info': 1
    };
    
    const minSeverityValue = severityValues[this.options.minSeverity!];
    
    // Apply each rule
    for (const rule of this.rules) {
      // Skip rules below minimum severity
      if (severityValues[rule.severity] < minSeverityValue) {
        continue;
      }
      
      const result = rule.test(code);
      
      if (!result.passed) {
        violations.push({
          ruleId: rule.id,
          description: rule.description,
          elements: result.elements || [],
          severity: rule.severity,
          helpUrl: rule.helpUrl,
          wcagCriteria: rule.wcagCriteria
        });
      }
    }
    
    return violations;
  }
  
  /**
   * Apply automatic fixes for accessibility issues
   * @param code The original code
   * @param violations The detected violations
   * @returns Fixed code with accessibility improvements
   */
  private applyAccessibilityFixes(code: string, violations: AccessibilityViolation[]): string {
    let fixedCode = code;
    
    for (const violation of violations) {
      switch (violation.ruleId) {
        case 'img-alt':
          // Add empty alt attributes to images
          fixedCode = fixedCode.replace(/<img\s+(?![^>]*alt=)([^>]*)>/g, '<img alt="" $1>');
          break;
          
        case 'keyboard-interaction':
          // Add basic keyboard handler to clickable divs/spans
          fixedCode = fixedCode.replace(
            /<(div|span)([^>]*)(onClick={[^>]*})([^>]*)(?!onKeyDown|onKeyUp|onKeyPress)([^>]*)>/g,
            '<$1$2$3$4 onKeyDown={(e) => e.key === "Enter" && e.currentTarget.click()}$5 role="button" tabIndex={0}>'
          );
          break;
          
        case 'input-label':
          // This is complex to auto-fix properly - would need AST parsing
          // Here's a very simplified attempt to add aria-label to plain inputs
          fixedCode = fixedCode.replace(
            /<input\s+([^>]*)(?!aria-label|aria-labelledby)([^>]*)>/g,
            (match, beforeAttrs, afterAttrs) => {
              // Try to extract a name or placeholder to use as label
              const nameMatch = beforeAttrs.match(/name=["']([^"']+)["']/);
              const placeholderMatch = beforeAttrs.match(/placeholder=["']([^"']+)["']/);
              const label = nameMatch?.[1] || placeholderMatch?.[1] || 'Input field';
              
              return `<input ${beforeAttrs} aria-label="${label}" ${afterAttrs}>`;
            }
          );
          break;
          
        default:
          // No auto-fix available for other rules
          break;
      }
    }
    
    return fixedCode;
  }
  
  /**
   * Add a custom accessibility rule
   * @param rule The rule to add
   */
  addRule(rule: AccessibilityRule): void {
    this.rules.push(rule);
  }
  
  /**
   * Disable a rule by ID
   * @param ruleId The ID of the rule to disable
   * @returns Whether the rule was found and disabled
   */
  disableRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * Set minimum severity level
   * @param level The minimum severity level
   */
  setMinSeverity(level: 'error' | 'warning' | 'info'): void {
    this.options.minSeverity = level;
  }
  
  /**
   * Enable or disable auto-fixing
   * @param enabled Whether auto-fixing should be enabled
   */
  setAutoFix(enabled: boolean): void {
    this.options.autoFix = enabled;
  }
}