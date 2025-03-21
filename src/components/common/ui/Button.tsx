import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}) => {
  // Combine all classes
  const buttonClasses = [
    'button',
    `button-${variant}`,
    `button-${size}`,
    isLoading ? 'button-loading' : '',
    icon ? `button-with-icon button-icon-${iconPosition}` : '',
    disabled || isLoading ? 'button-disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="button-loader">
          <span className="button-loader-dot"></span>
          <span className="button-loader-dot"></span>
          <span className="button-loader-dot"></span>
        </span>
      )}
      
      {icon && iconPosition === 'left' && !isLoading && (
        <span className="button-icon">{icon}</span>
      )}
      
      {children && <span className="button-text">{children}</span>}
      
      {icon && iconPosition === 'right' && !isLoading && (
        <span className="button-icon">{icon}</span>
      )}
    </button>
  );
};