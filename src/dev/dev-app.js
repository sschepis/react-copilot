// React and ReactDOM are loaded from CDN and available as globals
const React = window.React;
const ReactDOM = window.ReactDOM;

// Import our DevApp component
import { DevApp } from './DevApp';

// Mount the app
const container = document.getElementById('root');
if (container) {
  ReactDOM.createRoot(container).render(React.createElement(DevApp));
}