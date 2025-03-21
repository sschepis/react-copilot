---
title: Documentation Plugin
nav_order: 999
parent: React Copilot Plugins
permalink: /plugins/documentation-plugin
---
# Documentation Plugin

The `DocumentationPlugin` automatically generates and maintains documentation for your React components as they are modified by the LLM. It can create JSDoc comments, README files, and component API documentation.

## Import

```jsx
import { DocumentationPlugin } from 'react-copilot';
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `generateJsDocs` | `boolean` | `true` | Generate JSDoc comments for components |
| `generateReadmes` | `boolean` | `false` | Generate README files for components |
| `docsDirectory` | `string` | `'./docs/components'` | Directory where docs will be written |
| `includeProps` | `boolean` | `true` | Include props documentation |
| `includeExamples` | `boolean` | `true` | Include usage examples |
| `format` | `'markdown' \| 'html' \| 'json'` | `'markdown'` | Output format for documentation |
| `autoCommit` | `boolean` | `false` | Automatically commit docs to version control |
| `clearPrevious` | `boolean` | `false` | Clear previous docs before generating new ones |
| `customTemplate` | `string` | `null` | Path to a custom documentation template |

## Usage

```jsx
import React from 'react';
import { LLMProvider, DocumentationPlugin } from 'react-copilot';

function App() {
  return (
    <LLMProvider
      config={{
        provider: 'openai',
        model: 'gpt-4',
      }}
      plugins={[
        new DocumentationPlugin({
          generateJsDocs: true,
          generateReadmes: true,
          docsDirectory: './docs/components',
          includeProps: true,
          includeExamples: true,
          format: 'markdown',
        }),
      ]}
    >
      {/* Your application */}
    </LLMProvider>
  );
}
```

## How It Works

The Documentation Plugin:

1. Monitors component registrations and modifications
2. Analyzes the component source code to extract:
   - Component name and description
   - Props and their types
   - State variables
   - Methods and functions
   - Usage patterns
3. Generates documentation in the specified format
4. Updates documentation when components are modified
5. Organizes documentation in the specified directory structure

## Generated Documentation Structure

When `generateReadmes` is enabled, the plugin creates a documentation structure like this:

```
docsDirectory/
├── ComponentA/
│   ├── README.md
│   └── examples.md
├── ComponentB/
│   ├── README.md
│   └── examples.md
└── index.md
```

## JSDoc Generation

When `generateJsDocs` is enabled, the plugin adds JSDoc comments to component source code:

```jsx
/**
 * UserProfile component displays user information and profile actions
 * 
 * @component
 * @param {Object} props - Component props
 * @param {User} props.user - User object with name, email, and avatar
 * @param {Function} props.onEdit - Callback when edit button is clicked
 * @param {boolean} [props.showActions=true] - Whether to show action buttons
 * @returns {JSX.Element} A user profile card
 * @example
 * <UserProfile
 *   user={{ name: "John Doe", email: "john@example.com" }}
 *   onEdit={() => console.log("Edit clicked")}
 * />
 */
function UserProfile({ user, onEdit, showActions = true }) {
  // Component implementation
}
```

## README Generation

When `generateReadmes` is enabled, the plugin creates README files like this:

````markdown
# UserProfile

UserProfile component displays user information and profile actions

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `user` | `Object` | Yes | - | User object with name, email, and avatar |
| `onEdit` | `Function` | Yes | - | Callback when edit button is clicked |
| `showActions` | `boolean` | No | `true` | Whether to show action buttons |

## Example

```jsx
<UserProfile
  user={{ name: "John Doe", email: "john@example.com" }}
  onEdit={() => console.log("Edit clicked")}
/>
```

## Notes

- Requires user object with name and email properties
- Edit functionality is handled by the parent component
- Actions can be hidden by setting showActions to false
````

## Integration with Version Control

When `autoCommit` is enabled, the plugin will:

1. Check if the docs directory is under version control (git)
2. Add new and modified documentation files
3. Commit changes with a descriptive message
4. This requires git to be installed and configured

## Custom Templates

You can provide a custom template for documentation using the `customTemplate` option. The template should be a file with placeholders that will be replaced by the plugin:

```
# {{componentName}}

{{componentDescription}}

## Props

{{propsTable}}

## Example

{{examples}}

## Notes

{{notes}}
```

## Environment Variables

The plugin respects the following environment variables:

- `REACT_APP_ENABLE_DOCUMENTATION`: Set to "true" to enable documentation generation
- `REACT_APP_DOCS_DIRECTORY`: Path to the documentation directory
- `REACT_APP_DOCS_FORMAT`: Documentation format (markdown, html, json)

## Best Practices

1. **Set Up the Docs Directory**: Create the documentation directory before enabling the plugin.
2. **Version Control Integration**: If using `autoCommit`, ensure your repository is properly set up.
3. **Custom Templates**: Use custom templates for consistent documentation across projects.
4. **Include Examples**: Always enable `includeExamples` for better usability documentation.
5. **Selective Documentation**: Not all components need detailed documentation; focus on the important ones.

## Limitations

- JSDoc generation modifies source files and requires appropriate file permissions
- Props type inference may be limited for complex or dynamic prop types
- Auto-commit feature requires git CLI to be installed and configured

## See Also

- [Analytics Plugin](analytics-plugin.md)
- [Performance Plugin](performance-plugin.md)
- [Plugin System Architecture](../advanced/plugin-system.md)