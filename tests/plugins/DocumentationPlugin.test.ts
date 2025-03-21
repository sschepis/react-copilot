import { DocumentationPlugin } from '../../src/services/plugin/plugins/DocumentationPlugin';
import { ModifiableComponent, CodeChangeResult } from '../../src/utils/types';
import * as fs from 'fs';
import * as path from 'path';

describe('DocumentationPlugin', () => {
  let documentationPlugin: DocumentationPlugin;
  let mockContext: any;
  
  // Sample component for testing
  const sampleComponent: ModifiableComponent = {
    id: 'test-component-1',
    name: 'ButtonComponent',
    sourceCode: `
import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean; // Optional prop
  variant?: 'primary' | 'secondary';
}

function ButtonComponent({ label, onClick, disabled = false, variant = 'primary' }: ButtonProps) {
  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };
  
  return (
    <button 
      className={\`btn btn-\${variant}\`}
      disabled={disabled}
      onClick={handleClick}
    >
      {label}
    </button>
  );
}

export default ButtonComponent;
    `,
    ref: { current: null },
    path: ['components', 'common', 'ButtonComponent.tsx'],
  };
  
  // Sample code change result
  const sampleCodeResult: CodeChangeResult = {
    componentId: 'test-component-1',
    success: true,
    newSourceCode: `
import React, { useEffect } from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger'; // Added danger option
  count?: number; // Added new prop
}

function ButtonComponent({ 
  label, 
  onClick, 
  disabled = false, 
  variant = 'primary',
  count = 0
}: ButtonProps) {
  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };
  
  // Added effect
  useEffect(() => {
    console.log('Button rendered with count:', count);
  }, [count]);
  
  return (
    <button 
      className={\`btn btn-\${variant}\`}
      disabled={disabled}
      onClick={handleClick}
    >
      {label} {count > 0 && \`(\${count})\`}
    </button>
  );
}

export default ButtonComponent;
    `,
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create plugin instance with default config
    documentationPlugin = new DocumentationPlugin({
      generateJsDocs: true,
      generateReadmes: true,
      generateExamples: true,
      docsDirectory: './docs/components',
    });
    
    // Mock context for initialization
    mockContext = {
      componentRegistry: {
        getAllComponents: jest.fn().mockReturnValue({
          [sampleComponent.id]: sampleComponent,
        }),
        getComponent: jest.fn().mockReturnValue(sampleComponent),
        updateComponent: jest.fn(),
      },
      llmManager: {
        getCurrentProvider: jest.fn().mockReturnValue({}),
      },
    };
    
    // Mock fs functions
    jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue('{}');
    jest.spyOn(path, 'join').mockImplementation((...parts) => parts.join('/'));
  });
  
  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const defaultPlugin = new DocumentationPlugin();
      
      expect(defaultPlugin).toBeDefined();
      expect(defaultPlugin.id).toBe('documentation-plugin');
      expect(defaultPlugin.name).toBe('Documentation Plugin');
      expect(defaultPlugin.version).toBe('1.0.0');
      
      // Access private options through type assertion
      const options = (defaultPlugin as any).options;
      expect(options.generateJsDocs).toBe(true);
      expect(options.generateReadmes).toBe(true);
      expect(options.generateExamples).toBe(true);
      expect(options.docsDirectory).toBe('./docs/components');
    });
    
    it('should accept custom configuration', () => {
      const customPlugin = new DocumentationPlugin({
        generateJsDocs: false,
        generateReadmes: false,
        docsDirectory: './custom-docs',
        detailLevel: 'minimal',
      });
      
      // Access private options through type assertion
      const options = (customPlugin as any).options;
      
      expect(options.generateJsDocs).toBe(false);
      expect(options.generateReadmes).toBe(false);
      expect(options.docsDirectory).toBe('./custom-docs');
      expect(options.detailLevel).toBe('minimal');
    });
  });
  
  describe('initialize', () => {
    it('should initialize with context and create docs directory', async () => {
      await documentationPlugin.initialize(mockContext);
      
      // Verify docs directory is created
      expect(fs.promises.mkdir).toHaveBeenCalledWith('./docs/components', { recursive: true });
      
      // Verify console output
      expect(console.log).toHaveBeenCalledWith('[DocumentationPlugin] Initializing...');
      expect(console.log).toHaveBeenCalledWith('[DocumentationPlugin] Initialized successfully');
      
      // Verify context is saved properly
      expect((documentationPlugin as any).context).toBe(mockContext);
    });
    
    it('should process existing components on initialization', async () => {
      // Spy on extractComponentMetadata method
      const extractSpy = jest.spyOn(documentationPlugin as any, 'extractComponentMetadata');
      
      await documentationPlugin.initialize(mockContext);
      
      // Verify metadata was extracted for the sample component
      expect(extractSpy).toHaveBeenCalledWith(expect.objectContaining({
        id: sampleComponent.id,
        name: sampleComponent.name,
      }));
      
      // Verify component was added to tracking
      const metadata = (documentationPlugin as any).componentMetadata;
      expect(metadata.has(sampleComponent.id)).toBe(true);
    });
  });
  
  describe('hooks', () => {
    describe('afterComponentRegistration', () => {
      it('should extract metadata when a component is registered', () => {
        // Spy on extractComponentMetadata method
        const extractSpy = jest.spyOn(documentationPlugin as any, 'extractComponentMetadata');
        
        // Call the hook
        documentationPlugin.hooks!.afterComponentRegistration!(sampleComponent);
        
        // Verify extraction was called
        expect(extractSpy).toHaveBeenCalledWith(sampleComponent);
        
        // Verify component metadata was stored
        const metadata = (documentationPlugin as any).componentMetadata;
        expect(metadata.has(sampleComponent.id)).toBe(true);
      });
      
      it('should schedule documentation generation if JSDoc is enabled', () => {
        // Spy on scheduleDocGeneration method
        const scheduleSpy = jest.spyOn(documentationPlugin as any, 'scheduleDocGeneration');
        
        // Enable JSDoc generation
        (documentationPlugin as any).options.generateJsDocs = true;
        
        // Call the hook
        documentationPlugin.hooks!.afterComponentRegistration!(sampleComponent);
        
        // Verify scheduling was called
        expect(scheduleSpy).toHaveBeenCalledWith(sampleComponent.id);
      });
      
      it('should not schedule documentation if JSDoc is disabled', () => {
        // Spy on scheduleDocGeneration method
        const scheduleSpy = jest.spyOn(documentationPlugin as any, 'scheduleDocGeneration');
        
        // Disable JSDoc generation
        (documentationPlugin as any).options.generateJsDocs = false;
        
        // Call the hook
        documentationPlugin.hooks!.afterComponentRegistration!(sampleComponent);
        
        // Verify scheduling was not called
        expect(scheduleSpy).not.toHaveBeenCalled();
      });
    });
    
    describe('beforeCodeExecution', () => {
      it('should add JSDoc to code if missing and generation enabled', () => {
        // Spy on generateBasicJsDoc method
        const generateSpy = jest.spyOn(documentationPlugin as any, 'generateBasicJsDoc')
          .mockReturnValue('/** \n * Test JSDoc\n */');
        
        // Enable JSDoc generation
        (documentationPlugin as any).options.generateJsDocs = true;
        
        // Code without JSDoc
        const code = 'function TestComponent() { return <div></div>; }';
        
        // Call the hook
        const result = documentationPlugin.hooks!.beforeCodeExecution!(code);
        
        // Verify JSDoc generation was called
        expect(generateSpy).toHaveBeenCalledWith(code);
        
        // Verify JSDoc was added to the code
        expect(result).toContain('/** \n * Test JSDoc\n */');
        expect(result).toContain(code);
      });
      
      it('should not add JSDoc if it already exists', () => {
        // Spy on generateBasicJsDoc method
        const generateSpy = jest.spyOn(documentationPlugin as any, 'generateBasicJsDoc');
        
        // Code with existing JSDoc
        const code = '/**\n * Existing JSDoc\n */\nfunction TestComponent() { return <div></div>; }';
        
        // Call the hook
        const result = documentationPlugin.hooks!.beforeCodeExecution!(code);
        
        // Verify JSDoc generation was not called
        expect(generateSpy).not.toHaveBeenCalled();
        
        // Verify code was returned unchanged
        expect(result).toBe(code);
      });
      
      it('should not add JSDoc if generation is disabled', () => {
        // Disable JSDoc generation
        (documentationPlugin as any).options.generateJsDocs = false;
        
        // Code without JSDoc
        const code = 'function TestComponent() { return <div></div>; }';
        
        // Call the hook
        const result = documentationPlugin.hooks!.beforeCodeExecution!(code);
        
        // Verify code was returned unchanged
        expect(result).toBe(code);
      });
    });
    
    describe('afterCodeExecution', () => {
      it('should update component metadata when code changes', () => {
        // Initialize with context first
        documentationPlugin.initialize(mockContext);
        
        // Reset the getComponent mock to ensure it returns component with the right ID
        mockContext.componentRegistry.getComponent.mockReturnValue(sampleComponent);
        
        // Setup initial component metadata
        (documentationPlugin as any).componentMetadata.set(sampleCodeResult.componentId, {
          name: sampleComponent.name,
          props: [],
          hookUsage: [],
          dependencies: [],
          description: 'Initial description',
          hasDefaultExport: true,
          hasNamedExport: false,
          fileName: 'ButtonComponent.tsx',
        });
        
        // Spy on extractComponentMetadata method
        const extractSpy = jest.spyOn(documentationPlugin as any, 'extractComponentMetadata')
          .mockReturnValue({
            name: sampleComponent.name,
            props: [{ name: 'count', type: 'number', required: false }],
            hookUsage: ['useEffect'],
            dependencies: [],
            description: 'Updated description',
            hasDefaultExport: true,
            hasNamedExport: false,
            fileName: 'ButtonComponent.tsx',
          });
        
        // Call the hook
        documentationPlugin.hooks!.afterCodeExecution!(sampleCodeResult);
        
        // Verify the component was retrieved from the registry
        expect(mockContext.componentRegistry.getComponent).toHaveBeenCalledWith(sampleCodeResult.componentId);
        
        // Verify extraction was called
        expect(extractSpy).toHaveBeenCalled();
        
        // Verify metadata was updated
        const metadata = (documentationPlugin as any).componentMetadata.get(sampleCodeResult.componentId);
        expect(metadata.props).toEqual([{ name: 'count', type: 'number', required: false }]);
        expect(metadata.hookUsage).toEqual(['useEffect']);
      });
      
      it('should schedule JSDoc regeneration if JSDoc was removed', () => {
        // Initialize with context first
        documentationPlugin.initialize(mockContext);
        
        // Reset the getComponent mock to ensure it returns component with the right ID
        mockContext.componentRegistry.getComponent.mockReturnValue(sampleComponent);
        
        // Setup component metadata
        (documentationPlugin as any).componentMetadata.set(sampleCodeResult.componentId, {
          name: sampleComponent.name,
          props: [],
          hookUsage: [],
          dependencies: [],
          description: 'Initial description',
          hasDefaultExport: true,
          hasNamedExport: false,
          fileName: 'ButtonComponent.tsx',
        });
        
        // Setup JSDoc detection
        const hasJsDocCommentsSpy = jest.spyOn(documentationPlugin as any, 'hasJsDocComments')
          .mockReturnValue(false); // Indicate JSDoc is missing
        
        // Spy on scheduleDocGeneration method
        const scheduleSpy = jest.spyOn(documentationPlugin as any, 'scheduleDocGeneration');
        
        // Make sure JSDoc generation is enabled
        (documentationPlugin as any).options.generateJsDocs = true;
        
        // Call the hook
        documentationPlugin.hooks!.afterCodeExecution!(sampleCodeResult);
        
        // Verify JSDoc check was called
        expect(hasJsDocCommentsSpy).toHaveBeenCalledWith(sampleCodeResult.newSourceCode);
        
        // Verify regeneration was scheduled
        expect(scheduleSpy).toHaveBeenCalledWith(sampleCodeResult.componentId);
      });
      
      it('should not update if the code change failed', () => {
        // Spy on extractComponentMetadata method
        const extractSpy = jest.spyOn(documentationPlugin as any, 'extractComponentMetadata');
        
        // Create a failed code result
        const failedResult: CodeChangeResult = {
          ...sampleCodeResult,
          success: false,
        };
        
        // Call the hook
        documentationPlugin.hooks!.afterCodeExecution!(failedResult);
        
        // Verify extraction was not called
        expect(extractSpy).not.toHaveBeenCalled();
      });
    });
  });
  
  describe('metadata extraction', () => {
    it('should extract props from component code', () => {
      const props = (documentationPlugin as any).extractProps(sampleComponent.sourceCode);
      
      expect(props).toContainEqual(expect.objectContaining({
        name: 'label',
        type: 'string',
        required: true
      }));
      
      expect(props).toContainEqual(expect.objectContaining({
        name: 'onClick',
        type: '() => void',
        required: true
      }));
      
      expect(props).toContainEqual(expect.objectContaining({
        name: 'disabled',
        type: 'boolean',
        required: false,
        defaultValue: 'false'
      }));
      
      expect(props).toContainEqual(expect.objectContaining({
        name: 'variant',
        type: "'primary' | 'secondary'",
        required: false,
        defaultValue: "'primary'"
      }));
    });
    
    it('should extract React hooks usage', () => {
      const hooks = (documentationPlugin as any).extractHooks(sampleCodeResult.newSourceCode);
      
      expect(hooks).toContain('useEffect');
      expect(hooks).not.toContain('useState'); // Not used in the sample
    });
    
    it('should extract dependencies from imports', () => {
      const dependencies = (documentationPlugin as any).extractDependencies(sampleComponent.sourceCode);
      
      expect(dependencies).toContain('react');
    });
    
    it('should detect JSDoc comments in code', () => {
      const withJSDoc = '/**\n * Component description\n */\nfunction Test() {}';
      const withoutJSDoc = 'function Test() {}';
      
      const hasJSDoc = (documentationPlugin as any).hasJsDocComments(withJSDoc);
      const hasNoJSDoc = (documentationPlugin as any).hasJsDocComments(withoutJSDoc);
      
      expect(hasJSDoc).toBe(true);
      expect(hasNoJSDoc).toBe(false);
    });
  });
  
  describe('documentation generation', () => {
    beforeEach(async () => {
      // Initialize with context
      await documentationPlugin.initialize(mockContext);
      
      // Add component metadata
      (documentationPlugin as any).componentMetadata.set(sampleComponent.id, {
        componentId: sampleComponent.id,
        componentName: 'ButtonComponent',
        name: 'ButtonComponent',
        props: [
          { name: 'label', type: 'string', required: true },
          { name: 'onClick', type: '() => void', required: true },
          { name: 'disabled', type: 'boolean', required: false, defaultValue: 'false' },
          { name: 'variant', type: "'primary' | 'secondary'", required: false, defaultValue: "'primary'" }
        ],
        hookUsage: [],
        dependencies: ['react'],
        description: 'A reusable button component with various variants',
        hasDefaultExport: true,
        hasNamedExport: false,
        fileName: 'ButtonComponent.tsx',
        path: 'components/common',
      });
    });
    
    it('should generate JSDoc comment for a component', () => {
      const jsDoc = (documentationPlugin as any).generateBasicJsDoc(sampleComponent.sourceCode);
      
      expect(jsDoc).toContain('/**');
      expect(jsDoc).toContain('ButtonComponent');
      expect(jsDoc).toContain('@param {string} props.label');
      expect(jsDoc).toContain('@param {() => void} props.onClick');
      expect(jsDoc).toContain("@example");
    });
    
    it('should generate README markdown for a component', async () => {
      // Generate docs
      const metadata = (documentationPlugin as any).componentMetadata.get(sampleComponent.id);
      const docs = (documentationPlugin as any).generateDocs(metadata, sampleComponent.sourceCode);
      
      // Verify README content
      expect(docs.readme).toContain('# ButtonComponent');
      expect(docs.readme).toContain('## Props');
      expect(docs.readme).toContain('| Name | Type | Required | Default | Description |');
      expect(docs.readme).toContain('| label | `string` | Yes | - |');
      expect(docs.readme).toContain('| onClick | `() => void` | Yes | - |');
      expect(docs.readme).toContain('| disabled | `boolean` | No | false |');
      expect(docs.readme).toContain("| variant | `'primary' | 'secondary'` | No | 'primary' |");
    });
    
    it('should generate example usage code', async () => {
      // Generate docs
      const metadata = (documentationPlugin as any).componentMetadata.get(sampleComponent.id);
      const docs = (documentationPlugin as any).generateDocs(metadata, sampleComponent.sourceCode);
      
      // Verify example content
      expect(docs.example).toContain('import React from \'react\';');
      expect(docs.example).toContain('import { ButtonComponent } from \'components/common\';');
      expect(docs.example).toContain('export const Example = () => {');
      expect(docs.example).toContain('const handleClick = () => {');
      expect(docs.example).toContain('<ButtonComponent');
      expect(docs.example).toContain('label="example"');
      expect(docs.example).toContain('onClick={handleClick}');
    });
    
    it('should save documentation files when generateComponentDocs is called', async () => {
      // Call generateComponentDocs
      await (documentationPlugin as any).generateComponentDocs(sampleComponent.id);
      
      // Verify directory was created
      expect(fs.promises.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('ButtonComponent'),
        expect.anything()
      );
      
      // Verify files were written
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.any(String),
        'utf8'
      );
      
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('example.tsx'),
        expect.any(String),
        'utf8'
      );
    });
    
    it('should update component source code with JSDoc', async () => {
      // Mock the JSDoc generation to return a simple comment
      jest.spyOn(documentationPlugin as any, 'generateBasicJsDoc')
        .mockReturnValue('/** Test JSDoc */');
      
      // Mock hasJsDocComments to return false (no existing JSDoc)
      jest.spyOn(documentationPlugin as any, 'hasJsDocComments')
        .mockReturnValue(false);
      
      // Call generateComponentDocs
      await (documentationPlugin as any).generateComponentDocs(sampleComponent.id);
      
      // Verify component was updated with JSDoc
      expect(mockContext.componentRegistry.updateComponent).toHaveBeenCalledWith(
        sampleComponent.id,
        expect.objectContaining({
          sourceCode: expect.stringContaining('/** Test JSDoc */')
        })
      );
    });
  });
  
  describe('plugin configuration', () => {
    it('should allow changing options after initialization', () => {
      // Initial options
      expect((documentationPlugin as any).options.generateJsDocs).toBe(true);
      
      // Set new options
      documentationPlugin.setOptions({
        generateJsDocs: false,
        detailLevel: 'verbose'
      });
      
      // Verify options were updated
      expect((documentationPlugin as any).options.generateJsDocs).toBe(false);
      expect((documentationPlugin as any).options.detailLevel).toBe('verbose');
      // Other options should be preserved
      expect((documentationPlugin as any).options.generateReadmes).toBe(true);
    });
  });
  
  describe('generateAllDocs', () => {
    it('should generate documentation for all tracked components', async () => {
      // Add multiple components to tracking
      (documentationPlugin as any).componentMetadata.set('comp-1', {
        componentId: 'comp-1',
        name: 'Component1',
        props: [],
        hookUsage: [],
        dependencies: [],
        description: 'Test component 1',
        hasDefaultExport: true,
        hasNamedExport: false,
        fileName: 'Component1.tsx',
      });
      
      (documentationPlugin as any).componentMetadata.set('comp-2', {
        componentId: 'comp-2',
        name: 'Component2',
        props: [],
        hookUsage: [],
        dependencies: [],
        description: 'Test component 2',
        hasDefaultExport: true,
        hasNamedExport: false,
        fileName: 'Component2.tsx',
      });
      
      // Mock generateComponentDocs to track calls
      const generateSpy = jest.spyOn(documentationPlugin as any, 'generateComponentDocs')
        .mockResolvedValue(undefined);
      
      // Call generateAllDocs
      await documentationPlugin.generateAllDocs();
      
      // Verify generateComponentDocs was called for both components
      expect(generateSpy).toHaveBeenCalledTimes(2);
      expect(generateSpy).toHaveBeenCalledWith('comp-1');
      expect(generateSpy).toHaveBeenCalledWith('comp-2');
    });
  });
  
  describe('destroy', () => {
    it('should clean up resources', async () => {
      await documentationPlugin.destroy();
      
      expect(console.log).toHaveBeenCalledWith('[DocumentationPlugin] Cleaning up...');
      expect(console.log).toHaveBeenCalledWith('[DocumentationPlugin] Clean up complete');
      
      // Verify context was cleared
      expect((documentationPlugin as any).context).toBeNull();
    });
  });
});