import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

export interface PanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  width?: number | string;
  height?: number | string;
  isMaximized?: boolean;
  onMaximizeChange?: (maximized: boolean) => void;
  headerContent?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export const Panel: React.FC<PanelProps> = ({
  isOpen,
  onOpenChange,
  position = 'bottom-right',
  width = 600,
  height = 500,
  isMaximized = false,
  onMaximizeChange,
  headerContent,
  children,
  className = '',
  overlayClassName = '',
  headerClassName = '',
  contentClassName = '',
}) => {
  // Calculate panel dimensions based on whether it's maximized
  const panelStyle = {
    width: isMaximized ? '100vw' : width,
    height: isMaximized ? '100vh' : height,
    ...(isMaximized
      ? {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 0,
        }
      : {}),
  };

  // Calculate position classes based on the position prop
  const positionClassName = isMaximized ? 'position-center' : `position-${position}`;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={`panel-overlay ${overlayClassName}`}
          style={{
            backgroundColor: isMaximized ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
          }}
        />
        <Dialog.Content
          className={`panel ${positionClassName} ${className}`}
          style={panelStyle}
          onEscapeKeyDown={() => onOpenChange(false)}
        >
          {headerContent && (
            <div className={`panel-header ${headerClassName}`}>
              {headerContent}
            </div>
          )}
          <div className={`panel-content ${contentClassName}`}>
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};