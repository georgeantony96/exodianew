import React from 'react';
import { cn } from '@/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'value-high' | 'value-medium' | 'value-low' | 'pattern-discovery' | 'enhanced';
  padding?: 'none' | 'sm' | 'base' | 'lg' | 'xl';
  hoverable?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant = 'default', 
    padding = 'base', 
    hoverable = false,
    children, 
    ...props 
  }, ref) => {
    const baseClasses = [
      'rounded-xl transition-all duration-200',
      'border border-border-subtle'
    ];

    const variants = {
      default: [
        'bg-bg-tertiary shadow-sm'
      ],
      elevated: [
        'bg-bg-tertiary shadow-lg'
      ],
      outlined: [
        'bg-transparent border-2 border-border-medium'
      ],
      'value-high': [
        'bg-gradient-to-br from-success-bg to-success-muted/20',
        'border-2 border-success shadow-success',
        'relative overflow-hidden'
      ],
      'value-medium': [
        'bg-gradient-to-br from-warning-bg to-warning-muted/20',
        'border-2 border-warning shadow-warning'
      ],
      'value-low': [
        'bg-bg-tertiary border-border-subtle',
        'opacity-80'
      ],
      'pattern-discovery': [
        'bg-gradient-to-br from-accent-bg to-info-bg',
        'border-2 border-accent shadow-accent',
        'relative'
      ],
      'enhanced': [
        'bg-gradient-to-br from-bg-tertiary to-accent-bg/10',
        'border border-accent/30 shadow-accent/20',
        'shadow-lg hover:shadow-accent/30 hover:border-accent/50',
        'transition-all duration-300'
      ]
    };

    const paddings = {
      none: '',
      sm: 'p-3',
      base: 'p-4',
      lg: 'p-6',
      xl: 'p-8'
    };

    const hoverEffects = hoverable ? [
      'hover:shadow-lg hover:scale-[1.02] hover:border-accent/50',
      'cursor-pointer'
    ] : [];

    return (
      <div
        className={cn(
          baseClasses,
          variants[variant],
          paddings[padding],
          hoverEffects,
          className
        )}
        ref={ref}
        {...props}
      >

        {/* High Value Animation Overlay */}
        {variant === 'value-high' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        )}

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }
);

Card.displayName = 'Card';

// Specialized Card Components
export const ValueBetCard = React.forwardRef<HTMLDivElement, CardProps & {
  edge: number;
  market: string;
  trueOdds: number;
  bookmakerOdds: number;
  confidence?: number;
  isRecommended?: boolean;
}>(({ 
  edge, 
  market, 
  trueOdds, 
  bookmakerOdds, 
  confidence = 0.5,
  isRecommended = false,
  className,
  children,
  ...props 
}, ref) => {
  const getPriority = () => {
    if (edge > 7) return 'value-high';
    if (edge > 3) return 'value-medium';
    return 'value-low';
  };

  const getConfidenceColor = () => {
    if (confidence > 0.8) return 'text-success';
    if (confidence > 0.6) return 'text-warning';
    return 'text-info';
  };

  return (
    <Card
      ref={ref}
      variant={getPriority()}
      className={cn(
        'relative',
        isRecommended && 'ring-2 ring-accent ring-offset-2 ring-offset-bg-primary',
        className
      )}
      {...props}
    >
      {/* Recommended Badge */}
      {isRecommended && (
        <div className="absolute -top-2 -right-2 z-20">
          <div className="bg-accent text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            ⭐ RECOMMENDED
          </div>
        </div>
      )}

      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">
            {market}
          </h3>
          <div className="text-right">
            <div className={cn(
              'text-2xl font-bold',
              edge > 0 ? 'text-success' : 'text-danger'
            )}>
              {edge > 0 ? '+' : ''}{edge.toFixed(1)}%
            </div>
            <div className="text-xs text-text-secondary">
              Edge
            </div>
          </div>
        </div>

        {/* Odds Comparison */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-text-secondary">True Odds</div>
            <div className="text-lg font-semibold text-text-primary">
              {trueOdds.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-text-secondary">Book Odds</div>
            <div className="text-lg font-semibold text-text-primary">
              {bookmakerOdds.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Confidence Meter */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary">Confidence</span>
            <span className={getConfidenceColor()}>
              {(confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-bg-primary rounded-full h-2">
            <div 
              className={cn(
                'h-2 rounded-full transition-all duration-500',
                confidence > 0.8 ? 'bg-success' :
                confidence > 0.6 ? 'bg-warning' : 'bg-info'
              )}
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>

        {children}
      </div>
    </Card>
  );
});

ValueBetCard.displayName = 'ValueBetCard';

// League Intelligence Card
export const LeagueIntelligenceCard = React.forwardRef<HTMLDivElement, CardProps & {
  leagueName: string;
  country: string;
  marketType: string;
  averageOdds: number;
  opportunityFrequency: number;
  hitRate?: number;
}>(({ 
  leagueName, 
  country, 
  marketType, 
  averageOdds, 
  opportunityFrequency,
  hitRate,
  className,
  ...props 
}, ref) => {
  const getValueRating = () => {
    if (opportunityFrequency > 0.6) return 'HIGH VALUE';
    if (opportunityFrequency > 0.4) return 'MEDIUM VALUE';
    if (opportunityFrequency > 0.2) return 'LOW VALUE';
    return 'AVOID';
  };

  const getRatingColor = () => {
    const rating = getValueRating();
    switch (rating) {
      case 'HIGH VALUE': return 'text-success';
      case 'MEDIUM VALUE': return 'text-warning';
      case 'LOW VALUE': return 'text-info';
      default: return 'text-danger';
    }
  };

  return (
    <Card
      ref={ref}
      variant={opportunityFrequency > 0.6 ? 'pattern-discovery' : 'elevated'}
      className={cn('hover:scale-105 transition-transform', className)}
      hoverable
      {...props}
    >
      <div className="space-y-3">
        {/* Header */}
        <div>
          <h3 className="font-semibold text-text-primary">
            {leagueName}
          </h3>
          <p className="text-sm text-text-secondary">{country}</p>
        </div>

        {/* Market Info */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Market</span>
            <span className="font-medium text-text-primary uppercase">
              {marketType}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Avg Odds</span>
            <span className="font-semibold text-text-primary">
              {averageOdds.toFixed(2)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Value Rating</span>
            <span className={cn('font-bold text-xs', getRatingColor())}>
              {getValueRating()}
            </span>
          </div>
          
          {hitRate !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Hit Rate</span>
              <span className="font-medium text-text-primary">
                {(hitRate * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* Opportunity Frequency Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary">Opportunity Frequency</span>
            <span className={getRatingColor()}>
              {(opportunityFrequency * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-bg-primary rounded-full h-2">
            <div 
              className={cn(
                'h-2 rounded-full transition-all duration-700',
                opportunityFrequency > 0.6 ? 'bg-success' :
                opportunityFrequency > 0.4 ? 'bg-warning' :
                opportunityFrequency > 0.2 ? 'bg-info' : 'bg-danger'
              )}
              style={{ width: `${opportunityFrequency * 100}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
});

LeagueIntelligenceCard.displayName = 'LeagueIntelligenceCard';

export { Card };