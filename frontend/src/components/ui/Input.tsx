import React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';

// Stable ID generation for SSR compatibility
let idCounter = 0;
const generateId = () => `input-${++idCounter}`;

// Use useId hook for SSR-safe ID generation in React 18+
const useStableId = (providedId?: string) => {
  const reactId = React.useId();
  return React.useMemo(() => providedId || reactId, [providedId, reactId]);
};

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = 'text',
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    isLoading = false,
    id,
    ...props 
  }, ref) => {
    const inputId = useStableId(id);

    return (
      <div className="space-y-1">
        {/* Label */}
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        
        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
              {leftIcon}
            </div>
          )}
          
          {/* Input */}
          <input
            type={type}
            id={inputId}
            autoComplete="off"
            className={cn(
              // Base styles
              'w-full px-4 py-3 text-base bg-bg-input border border-border-medium rounded-lg',
              'text-text-primary placeholder-text-disabled',
              'transition-all duration-200',
              
              // Focus styles
              'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
              
              // Disabled styles  
              'disabled:bg-bg-secondary disabled:text-text-disabled disabled:cursor-not-allowed disabled:opacity-60',
              
              // Touch target
              'min-h-[44px]',
              
              // Icon spacing
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              
              // Error state
              error && 'border-danger focus:ring-danger focus:border-danger',
              
              className
            )}
            ref={ref}
            {...props}
          />
          
          {/* Right Icon or Loading */}
          {(rightIcon || isLoading) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
              {isLoading ? (
                <svg 
                  className="w-4 h-4 animate-spin" 
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
              ) : (
                rightIcon
              )}
            </div>
          )}
        </div>
        
        {/* Error Message */}
        {error && (
          <p className="text-sm text-danger flex items-center gap-1">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
            {error}
          </p>
        )}
        
        {/* Hint */}
        {hint && !error && (
          <p className="text-sm text-text-secondary">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Specialized Input for Odds
export const OddsInput = React.forwardRef<HTMLInputElement, Omit<InputProps, 'type'> & {
  market?: string;
  isValueBet?: boolean;
  edge?: number;
}>(({ 
  market, 
  isValueBet = false, 
  edge,
  className,
  rightIcon,
  ...props 
}, ref) => {
  const getValueIndicator = () => {
    if (!isValueBet || edge === undefined) return null;
    
    const color = edge > 7 ? 'text-success' : edge > 3 ? 'text-warning' : 'text-info';
    
    return (
      <div className={cn('flex items-center gap-1 text-xs font-medium', color)}>
        {edge > 0 && '⚡'}
        {edge.toFixed(1)}%
      </div>
    );
  };

  return (
    <Input
      ref={ref}
      type="number"
      step="0.01"
      min="1.01"
      placeholder="1.50"
      className={cn(
        isValueBet && edge && edge > 7 && 'ring-2 ring-success ring-opacity-50',
        isValueBet && edge && edge > 3 && edge <= 7 && 'ring-2 ring-warning ring-opacity-50',
        className
      )}
      rightIcon={getValueIndicator() || rightIcon}
      {...props}
    />
  );
});

OddsInput.displayName = 'OddsInput';

// Autocomplete Input for Teams/Leagues
export const AutocompleteInput = React.forwardRef<HTMLInputElement, InputProps & {
  suggestions?: Array<{
    id: string | number;
    label: string;
    description?: string;
    badge?: string;
  }>;
  onSuggestionSelect?: (suggestion: any) => void;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
}>(({ 
  suggestions = [], 
  onSuggestionSelect,
  isOpen = false,
  onToggle,
  className,
  ...props 
}, ref) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [dropdownPosition, setDropdownPosition] = React.useState<{ top: number; left: number; width: number; positioning: 'bottom' | 'top' }>({
    top: 0,
    left: 0,
    width: 0,
    positioning: 'bottom'
  });
  const [isMounted, setIsMounted] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const open = onToggle ? isOpen : internalOpen;
  const setOpen = onToggle || setInternalOpen;

  // Ensure component is mounted (for SSR compatibility)
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // FIXED: Robust positioning logic using getBoundingClientRect with viewport coordinates
  React.useEffect(() => {
    if (open && inputRef.current) {
      const updatePosition = () => {
        if (!inputRef.current) return;
        
        // Get input element's position relative to viewport
        const inputRect = inputRef.current.getBoundingClientRect();
        const menuHeight = 240; // max-h-60 = 240px
        const spaceBelow = window.innerHeight - inputRect.bottom;
        const spaceAbove = inputRect.top;
        
        // Use viewport coordinates (no scroll offset needed for fixed positioning)
        const positioning = spaceBelow < menuHeight && spaceAbove > menuHeight ? 'top' : 'bottom';
        
        const newPosition = {
          top: positioning === 'top' 
            ? inputRect.top - menuHeight - 8 
            : inputRect.bottom + 8,
          left: inputRect.left,
          width: inputRect.width,
          positioning
        };
        
        // Debug logging for dropdown positioning
        console.log('🎯 Dropdown Position Debug:', {
          inputElement: inputRef.current?.tagName + (inputRef.current?.placeholder ? ` (${inputRef.current.placeholder})` : ''),
          inputRect: {
            top: inputRect.top,
            bottom: inputRect.bottom,
            left: inputRect.left,
            right: inputRect.right,
            width: inputRect.width,
            height: inputRect.height
          },
          calculatedPosition: newPosition,
          appliedPosition: {
            top: Math.max(0, newPosition.top),
            left: Math.max(0, newPosition.left),
            width: Math.max(200, newPosition.width)
          },
          viewport: { width: window.innerWidth, height: window.innerHeight },
          spaceBelow,
          spaceAbove,
          positioning
        });
        
        setDropdownPosition(newPosition);
      };

      // Multiple position updates to ensure accuracy
      updatePosition(); // Immediate
      requestAnimationFrame(updatePosition); // Next frame
      setTimeout(updatePosition, 50); // Small delay for any async updates
      
      // Update position on scroll or resize
      const handlePositionUpdate = () => {
        requestAnimationFrame(updatePosition);
      };
      
      window.addEventListener('scroll', handlePositionUpdate, true);
      window.addEventListener('resize', handlePositionUpdate);
      
      return () => {
        window.removeEventListener('scroll', handlePositionUpdate, true);
        window.removeEventListener('resize', handlePositionUpdate);
      };
    }
  }, [open]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, setOpen]);

  const handleSuggestionClick = (suggestion: any) => {
    onSuggestionSelect?.(suggestion);
    setOpen(false);
  };

  // Portal dropdown component
  const DropdownPortal = () => {
    if (!isMounted || !open || suggestions.length === 0) return null;

    return createPortal(
      <div 
        ref={dropdownRef}
        className="fixed z-[99999] bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-lg shadow-2xl max-h-60 overflow-y-auto"
        style={{
          top: Math.max(0, dropdownPosition.top), // Ensure not negative
          left: Math.max(0, dropdownPosition.left), // Ensure not negative  
          width: Math.max(200, dropdownPosition.width), // Minimum width
          maxHeight: '240px',
          // Force dropdown above all content
          isolation: 'isolate',
          transform: 'translateZ(0)', // Create new stacking context
          pointerEvents: 'auto', // Ensure dropdown is clickable
          // Ensure visibility
          opacity: 1,
          visibility: 'visible',
          // Debug: temporary bright border to see positioning
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
        }}
      >
        {suggestions.map((suggestion, index) => (
          <button
            key={suggestion.id || index}
            type="button"
            className={cn(
              'w-full px-4 py-3 text-left text-text-primary hover:bg-accent/10 transition-colors',
              'first:rounded-t-lg last:rounded-b-lg',
              'focus:outline-none focus:bg-accent focus:text-white',
              'border-b border-border-subtle last:border-b-0'
            )}
            onClick={() => handleSuggestionClick(suggestion)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {suggestion.label}
                </div>
                {suggestion.description && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {suggestion.description}
                  </div>
                )}
              </div>
              
              {suggestion.badge && (
                <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  {suggestion.badge}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>,
      document.body
    );
  };

  return (
    <div className="relative" style={{ isolation: 'isolate' }}>
      <Input
        ref={(node) => {
          inputRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={cn(
          'pr-10',
          className
        )}
        rightIcon={
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg 
              className={cn('w-5 h-5 transition-transform', open && 'rotate-180')} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        }
        {...props}
      />
      
      {/* Portal-based dropdown */}
      <DropdownPortal />
    </div>
  );
});

AutocompleteInput.displayName = 'AutocompleteInput';

export { Input };