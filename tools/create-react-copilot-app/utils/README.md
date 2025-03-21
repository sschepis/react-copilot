# Template Processing Utilities

This directory contains utility functions for processing templates in the create-react-copilot-app tool.

## Template Processor

The `template-processor.js` module provides utilities for:

- Processing individual template files by replacing placeholders with values
- Processing entire template directories, handling file extensions based on configuration
- Supporting TypeScript conversions by mapping file extensions

### Usage

The template processor uses a simple placeholder syntax with double curly braces:

```js
// Example template file content
const greeting = "Hello, {{name}}!";
```

The processors will replace `{{name}}` with the value provided in the variables object:

```js
// Example usage
import { processTemplate } from './template-processor.js';

await processTemplate('path/to/template.js.template', 'output/file.js', {
  name: 'World'
});
// Creates a file with: const greeting = "Hello, World!";
```

When processing directories, you can also provide options to handle TypeScript files:

```js
import { processTemplateDir } from './template-processor.js';

await processTemplateDir(
  'templates/vite-default',
  'my-project',
  { /* variables */ },
  {
    fileExtensionMap: { '.js': '.ts', '.jsx': '.tsx' },
    typescript: true
  }
);