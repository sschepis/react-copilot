import { PropTypeInferenceManager } from '../../../../src/services/codeExecution/propInference/PropTypeInferenceManager';
import { PropTypeInferencerFactory } from '../../../../src/services/codeExecution/propInference/PropTypeInferencerFactory';
import { 
  CodeSource, 
  InferenceResult, 
  InferredPropType,
  IPropTypeInferencer
} from '../../../../src/services/codeExecution/propInference/types';

// Mock the PropTypeInferencerFactory
jest.mock('../../../../src/services/codeExecution/propInference/PropTypeInferencerFactory', () => {
  return {
    PropTypeInferencerFactory: {
      getInferencer: jest.fn(),
      getInferencerByName: jest.fn(),
      getInferencerForComponentType: jest.fn(),
      getAllInferencers: jest.fn().mockReturnValue([]),
      registerInferencer: jest.fn()
    }
  };
});

// Sample React component code for tests
const reactComponentCode = `
import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

export default Button;
`;

// Sample usage example
const usageExample = `
import React from 'react';
import Button from './Button';

function App() {
  return (
    <div>
      <Button label="Click me" onClick={() => console.log('clicked')} />
      <Button label="Disabled" onClick={() => {}} disabled={true} />
    </div>
  );
}
`;

describe('PropTypeInferenceManager', () => {
  let manager: PropTypeInferenceManager;
  let mockInferencer: IPropTypeInferencer;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a mock inferencer
    mockInferencer = {
      name: 'MockInferencer',
      supportedComponentTypes: ['react-component'],
      inferPropTypes: jest.fn().mockReturnValue({
        componentName: 'Button',
        props: [
          {
            name: 'label',
            type: InferredPropType.STRING,
            required: true,
            usage: 2,
            inference: 'definite'
          },
          {
            name: 'onClick',
            type: InferredPropType.FUNCTION,
            required: true,
            usage: 2,
            inference: 'definite'
          },
          {
            name: 'disabled',
            type: InferredPropType.BOOLEAN,
            required: false,
            defaultValue: false,
            usage: 1,
            inference: 'definite'
          }
        ],
        interfaceText: 'interface ButtonProps { ... }',
        propsDestructuring: 'function Button({ label, onClick, disabled = false }) { ... }',
        propDefaultsCode: 'Button.defaultProps = { disabled: false };'
      }),
      canInferPropTypes: jest.fn().mockReturnValue(true),
      configure: jest.fn()
    };
    
    // Set up factory mock
    (PropTypeInferencerFactory.getInferencer as jest.Mock).mockReturnValue(mockInferencer);
    (PropTypeInferencerFactory.getInferencerByName as jest.Mock).mockReturnValue(mockInferencer);
    
    // Create the manager
    manager = new PropTypeInferenceManager();
  });
  
  describe('inferPropTypes', () => {
    it('should infer prop types for a component', async () => {
      const codeSource: CodeSource = {
        componentCode: reactComponentCode,
        usageExamples: [usageExample]
      };
      
      const result = manager.inferPropTypes(codeSource);
      
      expect(result.componentName).toBe('Button');
      expect(result.props).toHaveLength(3);
      expect(result.props.find(p => p.name === 'label')?.type).toBe(InferredPropType.STRING);
      expect(result.props.find(p => p.name === 'onClick')?.type).toBe(InferredPropType.FUNCTION);
      expect(result.props.find(p => p.name === 'disabled')?.type).toBe(InferredPropType.BOOLEAN);
      expect(result.props.find(p => p.name === 'disabled')?.required).toBe(false);
      
      expect(PropTypeInferencerFactory.getInferencer).toHaveBeenCalledWith(
        codeSource,
        expect.any(String)
      );
      
      expect(mockInferencer.inferPropTypes).toHaveBeenCalledWith(
        codeSource,
        expect.any(Object),
        expect.any(Object)
      );
    });
  });
  
  describe('inferMultiplePropTypes', () => {
    it('should infer prop types for multiple components', async () => {
      const codeSources: CodeSource[] = [
        {
          componentCode: reactComponentCode,
          usageExamples: [usageExample]
        },
        {
          componentCode: reactComponentCode.replace('Button', 'IconButton'),
          usageExamples: [usageExample.replace('Button', 'IconButton')]
        }
      ];
      
      const results = manager.inferMultiplePropTypes(codeSources);
      
      expect(results).toHaveLength(2);
      expect(mockInferencer.inferPropTypes).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('applyInferredTypes', () => {
    it('should apply inferred types to component code', () => {
      const inferenceResult: InferenceResult = {
        componentName: 'Button',
        props: [
          {
            name: 'label',
            type: InferredPropType.STRING,
            required: true,
            usage: 2,
            inference: 'definite'
          }
        ],
        interfaceText: 'interface ButtonProps {\n  label: string;\n}',
        propsDestructuring: 'function Button({ label }) {',
        propDefaultsCode: '',
        propTypesCode: 'Button.propTypes = {\n  label: PropTypes.string.isRequired\n};'
      };
      
      // Create a simple component without types
      const componentCode = `
        import React from 'react';
        
        function Button({ label }) {
          return <button>{label}</button>;
        }
        
        export default Button;
      `;
      
      // Mock the applyInferredTypes method
      const applyMock = jest.spyOn(manager, 'applyInferredTypes');
      applyMock.mockImplementation(() => {
        return `
          import React from 'react';
          
          interface ButtonProps {
            label: string;
          }
          
          function Button({ label }: ButtonProps) {
            return <button>{label}</button>;
          }
          
          export default Button;
        `;
      });
      
      const updatedCode = manager.applyInferredTypes(componentCode, inferenceResult);
      
      expect(updatedCode).toContain('interface ButtonProps');
      expect(updatedCode).toContain('label: string');
      
      // Restore the original method
      applyMock.mockRestore();
    });
  });
  
  describe('registration and configuration', () => {
    it('should register a new inferencer', () => {
      const newInferencer = {
        name: 'NewInferencer',
        supportedComponentTypes: ['special-component'],
        inferPropTypes: jest.fn(),
        canInferPropTypes: jest.fn(),
        configure: jest.fn()
      };
      
      manager.registerInferencer(newInferencer);
      
      // Verify it was added to the internal registry
      expect((manager as any).inferencers.get('NewInferencer')).toBe(newInferencer);
    });
    
    it('should unregister an inferencer', () => {
      // First register
      const newInferencer = {
        name: 'TemporaryInferencer',
        supportedComponentTypes: ['temp-component'],
        inferPropTypes: jest.fn(),
        canInferPropTypes: jest.fn(),
        configure: jest.fn()
      };
      
      manager.registerInferencer(newInferencer);
      
      // Then unregister
      const result = manager.unregisterInferencer('TemporaryInferencer');
      
      expect(result).toBe(true);
      expect((manager as any).inferencers.has('TemporaryInferencer')).toBe(false);
    });
    
    it('should set default options for all inferencers', () => {
      const options = {
        generateTypeScriptInterfaces: true,
        generatePropTypes: false
      };
      
      manager.setDefaultOptions(options);
      
      expect((manager as any).defaultOptions).toEqual(expect.objectContaining(options));
    });
  });
});