import React, { useState, useEffect, useRef } from 'react';
import { Panel } from '../../common/ui/Panel';
import { Tooltip } from '../../common/ui/Tooltip';
import { Button } from '../../common/ui/Button';
import * as Icons from '../../common/icons';
import { ThemeConfig, lightTheme, darkTheme, createThemeVariables, applyThemeVariables, getSystemColorScheme, listenForColorSchemeChanges } from '../../../utils/theme';

export type DebugPanelPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
export type DebugPanelTheme = 'light' | 'dark' | 'system';

export interface BaseDebugPanelProps {
  initialVisible?: boolean;
  position?: DebugPanelPosition;
  width?: number | string;
  height?: number | string;
  theme?: DebugPanelTheme;
  toggleButtonContent?: React.ReactNode;
  toggleButtonAriaLabel?: string;
  headerContent?: React.ReactNode;
  headerControlsContent?: React.ReactNode;
  sidebarContent?: React.ReactNode;
  mainContent?: React.ReactNode | ((selectedComponentId: string | null) => React.ReactNode);
  className?: string;
  overlayClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  sidebarClassName?: string;
  mainClassName?: string;
  renderToggleButton?: (props: {
    visible: boolean;
    position: DebugPanelPosition;
    toggleVisibility: () => void;
  }) => React.ReactNode;
  shortcuts?: {
    toggle?: string;
  };
}

export const BaseDebugPanel: React.FC<BaseDebugPanelProps> = ({
  initialVisible = false,
  position = 'bottom-right',
  width = 600,
  height = 500,
  theme = 'system',
  toggleButtonContent = <Icons.DebugIcon />,
  toggleButtonAriaLabel = 'Toggle Debug Panel',
  headerContent,
  headerControlsContent,
  sidebarContent,
  mainContent,
  className = '',
  overlayClassName = '',
  headerClassName = '',
  contentClassName = '',
  sidebarClassName = '',
  mainClassName = '',
  renderToggleButton,
  shortcuts = { toggle: 'Alt+D' },
}) => {
  const [visible, setVisible] = useState(initialVisible);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (theme === 'system') {
      return getSystemColorScheme() === 'dark';
    }
    return theme === 'dark';
  });
  
  // New state for selected component ID
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const themeVariables = useRef<Record<string, string>>({});
  
  // Apply theme based on mode
  useEffect(() => {
    const currentTheme = isDarkMode ? darkTheme : lightTheme;
    themeVariables.current = createThemeVariables(currentTheme, '--debug');
    
    if (panelRef.current) {
      applyThemeVariables(panelRef.current, themeVariables.current);
    }
  }, [isDarkMode]);
  
  // Listen for system theme changes if set to 'system'
  useEffect(() => {
    if (theme === 'system') {
      const removeListener = listenForColorSchemeChanges((isDark) => {
        setIsDarkMode(isDark);
      });
      
      return () => removeListener();
    } else {
      setIsDarkMode(theme === 'dark');
    }
  }, [theme]);
  
  // Toggle visibility with keyboard shortcut
  useEffect(() => {
    if (!shortcuts.toggle) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Parse the shortcut (e.g., "Alt+D")
      const keys = shortcuts.toggle!.split('+');
      const modifierKey = keys[0].toLowerCase();
      const key = keys[1]?.toLowerCase();
      
      if (
        (modifierKey === 'alt' && e.altKey && e.key.toLowerCase() === key) ||
        (modifierKey === 'ctrl' && e.ctrlKey && e.key.toLowerCase() === key) ||
        (modifierKey === 'shift' && e.shiftKey && e.key.toLowerCase() === key)
      ) {
        setVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts.toggle]);
  
  // Toggle visibility
  const toggleVisibility = () => {
    setVisible(prev => !prev);
  };
  
  // Toggle maximize
  const toggleMaximize = () => {
    setIsMaximized(prev => !prev);
  };
  
  // Render toggle button
  const renderDefaultToggleButton = () => (
    <Tooltip content={`Open Debug Panel (${shortcuts.toggle})`}>
      <Button
        className={`debug-panel-toggle position-${position}`}
        onClick={toggleVisibility}
        aria-label={toggleButtonAriaLabel}
        variant="ghost"
        icon={toggleButtonContent}
      />
    </Tooltip>
  );
  
  // If not visible, render toggle button only
  if (!visible) {
    return renderToggleButton ? 
      renderToggleButton({ visible, position, toggleVisibility }) : 
      renderDefaultToggleButton();
  }
  
  // Default header controls
  const defaultHeaderControls = (
    <div className="debug-panel-controls">
      <Tooltip content={isMaximized ? "Minimize" : "Maximize"}>
        <Button
          className="debug-panel-control"
          onClick={toggleMaximize}
          aria-label={isMaximized ? "Minimize" : "Maximize"}
          variant="ghost"
          icon={isMaximized ? <Icons.MinimizeIcon /> : <Icons.MaximizeIcon />}
        />
      </Tooltip>
      <Tooltip content={`Close (${shortcuts.toggle})`}>
        <Button
          className="debug-panel-control"
          onClick={toggleVisibility}
          aria-label="Close Debug Panel"
          variant="ghost"
          icon={<Icons.CloseIcon />}
        />
      </Tooltip>
    </div>
  );
  
  // Render main content
  const renderMainContent = () => {
    if (typeof mainContent === 'function') {
      return mainContent(selectedComponentId);
    }
    return mainContent;
  };
  
  return (
    <Panel
      isOpen={visible}
      onOpenChange={setVisible}
      position={isMaximized ? 'center' : position}
      width={width}
      height={height}
      isMaximized={isMaximized}
      onMaximizeChange={setIsMaximized}
      className={`debug-panel ${className}`}
      overlayClassName={overlayClassName}
      headerContent={
        <div className={`debug-panel-header ${headerClassName}`}>
          {headerContent}
          {headerControlsContent || defaultHeaderControls}
        </div>
      }
    >
      <div ref={panelRef} className={`debug-panel-content ${contentClassName}`}>
        {sidebarContent && (
          <div className={`debug-panel-sidebar ${sidebarClassName}`}>
            {sidebarContent}
          </div>
        )}
        
        <div className={`debug-panel-main ${mainClassName}`}>
          {renderMainContent()}
        </div>
      </div>
    </Panel>
  );
};

export default BaseDebugPanel;