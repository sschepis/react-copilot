import React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

export interface CollapsibleProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  children,
  trigger,
  defaultOpen,
  open,
  onOpenChange,
  disabled = false,
  className = '',
  triggerClassName = '',
  contentClassName = '',
}) => {
  return (
    <CollapsiblePrimitive.Root
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      disabled={disabled}
      className={`collapsible ${className}`}
    >
      <CollapsiblePrimitive.Trigger
        className={`collapsible-trigger ${triggerClassName}`}
        disabled={disabled}
      >
        {trigger}
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Content className={`collapsible-content ${contentClassName}`}>
        {children}
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  );
};