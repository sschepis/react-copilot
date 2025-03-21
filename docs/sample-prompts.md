# Sample Prompts for React LLM UI

This document provides example prompts you can use with the React LLM UI chat interface to modify your application.

## UI Modifications

### Adding or Changing Components

```
Please add a dark mode toggle to the Header component. It should:
1. Add a sun/moon icon in the top right
2. Toggle between light and dark themes
3. Save the user's preference in localStorage
```

```
Create a notification center in the Header. It should:
1. Show a bell icon with a counter for unread notifications
2. Display a dropdown with notification items
3. Allow marking notifications as read
```

```
Can you update the Dashboard to show data in a chart? Use recharts to create a line chart showing the trend of user registrations over time.
```

### Layout and Style Changes

```
Can you reorganize the Dashboard layout to be more modern? I'd like:
1. Card-based UI for statistics
2. Better spacing and hierarchy
3. More subtle color scheme
```

```
Please update the color scheme of the entire app to be more accessible. Use higher contrast colors and ensure all text is readable.
```

```
Make the application mobile-responsive. The current layout breaks on small screens.
```

### Functionality Improvements

```
Add form validation to the Login component. Check for:
1. Valid email format
2. Password minimum length of 8 characters
3. Show inline error messages
```

```
Implement local search functionality for the UserList component, so users can filter the list by name or email.
```

```
Add data caching to improve performance when fetching user data. Use localStorage to cache the results for 5 minutes.
```

## Autonomous Mode Requirements

Here are sample requirements that work well for autonomous mode:

```
1. Add a dark mode toggle to the header
2. Create a user profile page with editable fields
3. Implement a notification system with toast messages
4. Add data visualization to the dashboard
5. Create a searchable and sortable table component
```

```
1. Improve accessibility across all components
2. Add error handling and loading states to all data fetching operations
3. Create a responsive mobile navigation menu
4. Add form validation to all user inputs
5. Implement data filtering and sorting capabilities
```

## Tips for Effective Prompts

1. **Be Specific**: Clearly describe what you want to change and where
2. **Provide Context**: Mention the component name and its current functionality
3. **Set Priorities**: For multiple changes, indicate what's most important
4. **Include Design Guidelines**: Mention any style preferences or constraints
5. **Ask for Explanations**: Request the LLM to explain its changes

## Troubleshooting Prompts

If a change doesn't work as expected, try:

```
The dark mode toggle isn't working correctly. It changes the UI but doesn't save the preference. Can you fix this?
```

```
The chart component is causing an error. Can you debug it and show me what's wrong?
```

```
The layout looks broken on mobile screens. Can you improve the responsive design?
```
