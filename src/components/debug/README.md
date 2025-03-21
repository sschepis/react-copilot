# Enhanced Debug Panel for React Copilot

This directory contains the enhanced debugging tools for React Copilot, built using Radix UI components to provide a more robust, accessible, and feature-rich debugging experience.

## Components

### EnhancedDebugPanel

An improved version of the original DebugPanel with the following enhancements:

- **Responsive Layout**: Adapts to different screen sizes and can be positioned in any corner
- **Dark/Light Mode**: Built-in theme support with automatic system preference detection
- **Maximizable**: Can expand to full screen for detailed debugging
- **Improved Component Tree**: Better visualization of component hierarchy
- **Multiple Tabs**: Organized view of props, state, relationships, performance, and history
- **Tooltips**: Helpful explanations of UI elements and features
- **Keyboard Accessibility**: Full keyboard navigation support
- **Collapsible Sections**: For better organization of information

```tsx
import { EnhancedDebugPanel } from '@sschepis/react-copilot';

// Add to your app
<EnhancedDebugPanel 
  initialVisible={true}
  position="bottom-right"
  width={600}
  height={500}
  darkMode={false}
/>
```

### EnhancedDebugProvider

A convenience wrapper component that combines:
- LLMProvider
- ModifiableApp
- EnhancedDebugPanel
- ChatOverlay

Making it easy to add all React Copilot features with enhanced debugging to your app:

```tsx
import { EnhancedDebugProvider } from '@sschepis/react-copilot';

function App() {
  return (
    <EnhancedDebugProvider initialVisible={true}>
      <YourAppContent />
    </EnhancedDebugProvider>
  );
}
```

## Features

### Component Inspection

Detailed inspection of components including:
- Props with type information and history
- State values and updates
- Methods and event handlers
- Component relationships (parent/child)
- Component versions and source code

### State Monitoring

Enhanced state monitoring capabilities:
- Real-time state updates
- State change history
- State comparison between updates
- Visual state representation

### Performance Monitoring

Coming soon:
- Render timing information
- Re-render counts and triggers
- Component performance metrics
- Optimization suggestions

### Timeline Views

Coming soon:
- State changes over time
- Component lifecycle events
- User interactions
- Time-travel debugging

## Styling and Theming

The enhanced debug panel uses Radix UI Colors for a consistent design system and supports both light and dark themes. The theme system is built with CSS variables for easy customization.

## Usage Examples

See the examples directory for complete examples of using the enhanced debugging tools:
- `example/simple-app/src/EnhancedDebugExample.tsx`
- `example/simple-app/src/EnhancedDebugApp.tsx`