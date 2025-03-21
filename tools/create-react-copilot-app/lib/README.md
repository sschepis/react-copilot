# Library Modules

This directory contains the core functionality modules for the create-react-copilot-app tool, organized into modular components for better maintainability.

## Modules

### config.js

Contains configuration constants and settings:
- LLM provider options
- Available plugins 
- Template definitions
- Default model mappings
- File extension mappings for TypeScript

### prompt.js

Handles user interaction and project configuration gathering:
- Collects project information through CLI prompts
- Validates user inputs (project name, directory existence)
- Merges command line options with user-provided answers

### templateVars.js

Prepares variables for template processing:
- Generates template variables based on user configuration
- Builds plugin imports and configurations
- Creates environment variables and settings for different providers
- Formats variables for template placeholders

### templates.js

Handles template selection and processing:
- Processes Vite templates
- Processes Create React App (CRA) templates (backward compatibility)
- Generates source files, configuration files, and other project assets
- Manages TypeScript conversion when needed

### project.js

Manages the overall project creation process:
- Creates project directory
- Processes templates based on user selection
- Handles dependency installation
- Provides user guidance for next steps

## Usage

These modules are used internally by the CLI and aren't meant to be imported directly by users. The main CLI entrypoint in `bin/cli.js` coordinates these modules to create a new project.