import '@testing-library/jest-dom';

// Mock fs and path modules for plugins that use file system
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue('{}'),
    access: jest.fn().mockImplementation((path) => {
      if (path.includes('default.json')) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('File not found'));
    }),
  }
}));

jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn().mockImplementation((...args) => args.join('/')),
}));

// Mock fetch API
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({}),
});

// Mock performance.now
if (typeof window !== 'undefined') {
  window.performance = {
    ...window.performance,
    now: jest.fn().mockReturnValue(100),
  };
}

// Create a more complete console mock
const originalConsole = { ...console };
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  // Preserve some console functions for test output
  debug: originalConsole.debug,
};

// Create a mock CustomEvent instead of overriding the Event interface
// which would require matching all the static properties
if (typeof window !== 'undefined' && !window.CustomEvent) {
  // @ts-ignore - this is just for testing purposes
  window.CustomEvent = class CustomEvent {
    type: string;
    detail: any;
    constructor(type: string, options?: { detail?: any }) {
      this.type = type;
      this.detail = options?.detail || null;
    }
  };
}

// Add mock for localStorage
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });
}