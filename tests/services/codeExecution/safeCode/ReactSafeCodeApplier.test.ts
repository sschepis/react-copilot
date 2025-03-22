import { ReactSafeCodeApplier } from '../../../../src/services/codeExecution/safeCode/appliers/ReactSafeCodeApplier';
import { 
  ValidationContext, 
  ValidationSeverity, 
  CodeChangeRequest
} from '../../../../src/services/codeExecution/safeCode/types';
import { ModifiableComponent } from '../../../../src/utils/types';

describe('ReactSafeCodeApplier', () => {
  let applier: ReactSafeCodeApplier;
  let mockGetComponent: jest.Mock;
  let mockGetDependencies: jest.Mock;
  
  // Sample component for testing
  const testComponent: ModifiableComponent = {
    id: 'Button',
    name: 'Button',
    sourceCode: `
      import React from 'react';
      
      function Button({ label, onClick }) {
        return (
          <button onClick={onClick}>
            {label}
          </button>
        );
      }
      
      export default Button;
    `,
    props: { label: 'Click me', onClick: jest.fn() },
    relationships: {
      childrenIds: []
    },
    ref: { current: null }
  };

  beforeEach(() => {
    applier = new ReactSafeCodeApplier();
    mockGetComponent = jest.fn().mockReturnValue(testComponent);
    mockGetDependencies = jest.fn().mockReturnValue(['Header', 'Footer']);
    
    // Clear event listeners between tests
    applier.events.removeAllListeners();
  });

  describe('validateComponentPatterns', () => {
    it('should validate React function component', async () => {
      const code = `
        import React from 'react';
        
        function Button({ label, onClick }) {
          return (
            <button onClick={onClick}>
              {label}
            </button>
          );
        }
        
        export default Button;
      `;
      
      const result = (applier as any).validateComponentPatterns(code, { componentId: 'Button' });
      
      expect(result.success).toBe(true);
      expect(result.issues).toBeUndefined();
    });

    it('should validate React arrow function component', async () => {
      const code = `
        import React from 'react';
        
        const Button = ({ label, onClick }) => {
          return (
            <button onClick={onClick}>
              {label}
            </button>
          );
        };
        
        export default Button;
      `;
      
      const result = (applier as any).validateComponentPatterns(code, { componentId: 'Button' });
      
      expect(result.success).toBe(true);
    });

    it('should validate React class component', async () => {
      const code = `
        import React from 'react';
        
        class Button extends React.Component {
          render() {
            const { label, onClick } = this.props;
            return (
              <button onClick={onClick}>
                {label}
              </button>
            );
          }
        }
        
        export default Button;
      `;
      
      const result = (applier as any).validateComponentPatterns(code, { componentId: 'Button' });
      
      expect(result.success).toBe(true);
    });

    it('should fail validation for non-component code', async () => {
      const code = `
        const utils = {
          formatDate: (date) => {
            return new Date(date).toLocaleDateString();
          }
        };
        
        export default utils;
      `;
      
      const result = (applier as any).validateComponentPatterns(code, { componentId: 'Button' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Could not find a proper Button component definition');
    });

    it('should warn about missing React import', async () => {
      const code = `
        function Button({ label, onClick }) {
          return (
            <button onClick={onClick}>
              {label}
            </button>
          );
        }
        
        export default Button;
      `;
      
      const result = (applier as any).validateComponentPatterns(code, { componentId: 'Button' });
      
      expect(result.issues).toBeDefined();
      expect(result.issues[0].message).toContain('Missing React import');
      expect(result.issues[0].autoFixable).toBe(true);
    });

    it('should warn about functional component without return', async () => {
      const code = `
        import React from 'react';
        
        function Button({ label, onClick }) {
          const handleClick = () => onClick();
          // Missing return statement
        }
        
        export default Button;
      `;
      
      const result = (applier as any).validateComponentPatterns(code, { componentId: 'Button' });
      
      expect(result.issues).toBeDefined();
      expect(result.issues.some((i: any) => i.message.includes('return statement'))).toBe(true);
    });
  });

  describe('executeSandbox', () => {
    it('should execute valid React component in sandbox', async () => {
      const code = `
        import React from 'react';
        
        function Button({ label, onClick }) {
          return (
            <button onClick={onClick}>
              {label}
            </button>
          );
        }
        
        export default Button;
      `;
      
      const result = await (applier as any).executeSandbox(code);
      
      expect(result.success).toBe(true);
    });

    it('should fail sandbox execution for invalid React component', async () => {
      const code = `
        import React from 'react';
        
        function Button({ label, onClick }) {
          return (
            <button onClick={undefinedFunction()}>
              {label}
            </button>
          );
        }
        
        export default Button;
      `;
      
      const result = await (applier as any).executeSandbox(code);
      
      expect(result.success).toBe(false);
    });
  });

  describe('checkDependencies', () => {
    it('should detect affected dependencies when exports change', async () => {
      const originalCode = `
        import React from 'react';
        export function useButtonStyles() {
          return { color: 'blue' };
        }
        function Button({ label, onClick }) {
          return <button onClick={onClick}>{label}</button>;
        }
        export default Button;
      `;
      
      const newCode = `
        import React from 'react';
        // Removed useButtonStyles export
        function Button({ label, onClick }) {
          return <button onClick={onClick}>{label}</button>;
        }
        export default Button;
      `;
      
      const result = await (applier as any).checkDependencies(
        'Button',
        originalCode,
        newCode,
        mockGetComponent,
        mockGetDependencies
      );
      
      expect(result.length).toBeGreaterThan(0);
    });

    it('should detect affected dependencies when props change', async () => {
      const originalCode = `
        import React from 'react';
        function Button({ label, onClick }) {
          return <button onClick={onClick}>{label}</button>;
        }
        export default Button;
      `;
      
      const newCode = `
        import React from 'react';
        function Button({ text, onClick }) {
          return <button onClick={onClick}>{text}</button>;
        }
        export default Button;
      `;
      
      // Mock a component that uses Button with the label prop
      mockGetComponent.mockImplementation((id) => {
        if (id === 'Header') {
          return {
            id: 'Header',
            name: 'Header',
            sourceCode: '<Button label="Home" />',
            ref: { current: null }
          };
        }
        return testComponent;
      });
      
      const result = await (applier as any).checkDependencies(
        'Button',
        originalCode,
        newCode,
        mockGetComponent,
        mockGetDependencies
      );
      
      expect(result).toContain('Header');
    });
  });

  describe('applyChangesImplementation', () => {
    it('should apply changes to React component', async () => {
      const request: CodeChangeRequest = {
        componentId: 'Button',
        sourceCode: `
          import React from 'react';
          
          function Button({ label, onClick, disabled }) {
            return (
              <button onClick={onClick} disabled={disabled}>
                {label}
              </button>
            );
          }
          
          export default Button;
        `
      };

      const context: ValidationContext = {
        componentId: 'Button',
        originalCode: testComponent.sourceCode,
        componentType: 'react-functional-component',
        language: 'typescript'
      };

      const result = await (applier as any).applyChangesImplementation(
        request,
        testComponent,
        context
      );

      expect(result.success).toBe(true);
      expect(result.newSourceCode).toBe(request.sourceCode);
    });
  });

  describe('detectComponentType', () => {
    it('should detect React class component', () => {
      const code = `
        import React from 'react';
        class Button extends React.Component {
          render() {
            return <button>{this.props.label}</button>;
          }
        }
      `;
      
      const result = (applier as any).detectComponentType(code);
      
      expect(result).toBe('react-class-component');
    });

    it('should detect React functional component', () => {
      const code = `
        import React from 'react';
        function Button() {
          return <button>Click me</button>;
        }
      `;
      
      const result = (applier as any).detectComponentType(code);
      
      expect(result).toBe('react-functional-component');
    });
  });

  describe('integration', () => {
    it('should successfully apply changes to React component', async () => {
      const request: CodeChangeRequest = {
        componentId: 'Button',
        sourceCode: `
          import React from 'react';
          
          function Button({ label, onClick, disabled = false }) {
            return (
              <button 
                onClick={onClick} 
                disabled={disabled}
                className="btn btn-primary"
              >
                {label}
              </button>
            );
          }
          
          export default Button;
        `
      };

      const result = await applier.applyChanges(
        request,
        mockGetComponent,
        mockGetDependencies
      );

      expect(result.success).toBe(true);
      expect(result.newSourceCode).toBe(request.sourceCode);
    });
  });
});