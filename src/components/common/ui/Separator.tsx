import React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';

export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Separator: React.FC<SeparatorProps> = ({
  orientation = 'horizontal',
  decorative = true,
  className = '',
  style,
}) => {
  return (
    <SeparatorPrimitive.Root
      orientation={orientation}
      decorative={decorative}
      className={`separator separator-${orientation} ${className}`}
      style={{
        backgroundColor: 'var(--theme-colors-borderLight, rgba(0, 0, 0, 0.1))',
        margin: orientation === 'horizontal' ? '0.5rem 0' : '0 0.5rem',
        height: orientation === 'horizontal' ? '1px' : 'auto',
        width: orientation === 'vertical' ? '1px' : 'auto',
        ...style,
      }}
    />
  );
};