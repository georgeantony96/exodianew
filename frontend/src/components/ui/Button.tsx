import React from 'react';
import { cn } from '@/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'base' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'base', 
    isLoading = false,
    leftIcon,
    rightIcon,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = [
      // Base styles
      'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'touch-target' // Ensures minimum 44px touch target
    ];

    const variants = {
      primary: [
        'bg-accent hover:bg-accent-muted text-white',
        'shadow-lg hover:shadow-xl active:scale-95'
      ],
      secondary: [
        'bg-bg-tertiary hover:bg-bg-hover text-text-primary border border-border-medium',
        'shadow hover:shadow-lg active:scale-95'
      ],
      success: [
        'bg-success hover:bg-success-muted text-white',
        'shadow-success hover:shadow-lg active:scale-95',
        'relative overflow-hidden'
      ],
      warning: [
        'bg-warning hover:bg-warning-muted text-white',
        'shadow-warning hover:shadow-lg active:scale-95'
      ],
      danger: [
        'bg-danger hover:bg-danger-muted text-white',
        'shadow hover:shadow-lg active:scale-95'
      ],
      ghost: [
        'hover:bg-bg-hover text-text-primary',
        'hover:shadow active:scale-95'
      ],
      outline: [
        'border-2 border-border-strong hover:border-accent hover:bg-accent-bg text-text-primary',
        'hover:text-accent hover:shadow active:scale-95'
      ]
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm min-h-[36px]',
      base: 'px-4 py-3 text-base min-h-[44px]',
      lg: 'px-6 py-4 text-lg min-h-[48px]',
      xl: 'px-8 py-5 text-xl min-h-[52px]'
    };

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        {isLoading && (
          <svg 
            className="w-4 h-4 mr-2 animate-spin" 
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {!isLoading && leftIcon && (
          <span className="mr-2 flex items-center">
            {leftIcon}
          </span>
        )}
        
        {children}
        
        {!isLoading && rightIcon && (
          <span className="ml-2 flex items-center">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Value Betting Specific Button Variants
export const ValueBetButton = React.forwardRef<HTMLButtonElement, ButtonProps & {
  edge?: number;
  priority?: 'high' | 'medium' | 'low';
}>(({ edge, priority = 'medium', className, children, ...props }, ref) => {
  const priorityStyles = {
    high: 'bg-gradient-to-br from-success to-success-muted shadow-success animate-pulse',
    medium: 'bg-gradient-to-br from-warning to-warning-muted shadow-warning',
    low: 'bg-bg-tertiary border border-border-medium text-text-secondary'
  };

  return (
    <Button
      ref={ref}
      className={cn(
        'relative overflow-hidden',
        priorityStyles[priority],
        priority === 'high' && 'transform scale-105 hover:scale-110',
        className
      )}
      {...props}
    >
      {priority !== 'low' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      )}
      
      <div className="relative z-10 flex items-center gap-2">
        {children}
        {edge !== undefined && (
          <span className="text-xs font-bold">
            {edge > 0 ? '+' : ''}{edge.toFixed(1)}%
          </span>
        )}
      </div>
    </Button>
  );
});

ValueBetButton.displayName = 'ValueBetButton';

export { Button };