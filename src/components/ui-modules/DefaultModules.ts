import { UIModule } from './types';
import { DebugPanel } from '../debug/DebugPanel';
import { ChatOverlay } from '../ChatOverlay';
import { MultiModalChatOverlay } from '../MultiModalChatOverlay';
import { registerModules } from './ModuleRegistry';

/**
 * Debug Panel module definition
 */
export const DebugPanelModule: UIModule = {
  id: 'debug-panel',
  name: 'Debug Panel',
  description: 'Advanced debugging panel that provides visibility into components',
  defaultVisible: false,
  category: 'debug',
  component: DebugPanel,
};

/**
 * Basic Chat Overlay module definition
 */
export const ChatOverlayModule: UIModule = {
  id: 'chat-overlay',
  name: 'Chat Overlay',
  description: 'Simple chat interface for interacting with the LLM',
  defaultVisible: true,
  category: 'chat',
  component: ChatOverlay,
};

/**
 * Multi-modal Chat Overlay module definition
 */
export const MultiModalChatOverlayModule: UIModule = {
  id: 'multimodal-chat-overlay',
  name: 'Multi-modal Chat',
  description: 'Enhanced chat interface with image upload capabilities',
  defaultVisible: false,
  category: 'chat',
  component: MultiModalChatOverlay,
};

/**
 * Default modules provided by the library
 */
export const DefaultModules = [
  DebugPanelModule,
  ChatOverlayModule,
  MultiModalChatOverlayModule,
];

/**
 * Register all default modules
 */
export function registerDefaultModules() {
  registerModules(DefaultModules);
}