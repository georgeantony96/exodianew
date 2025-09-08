import React, { useState, useMemo } from 'react';
import { Card, ValueBetCard } from '@/components/ui/Card';
import { Button, ValueBetButton } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface ValueOpportunity {
  market: string;
  trueOdds: number;
  bookmakerOdds: number;
  edge: number;
  probability: number;
  confidence: number;
  kellyStake?: number;
}

interface ProbabilityAnalysis {
  highestProbability: {
    market: string;
    probability: number;
    trueOdds: number;
  };
  highestEdge: {
    market: string;
    edge: number;
    probability: number;
  };
  hasConflict: boolean;
  recommendation?: {
    primary: string;
    reason: string;
    secondary?: string;
  };
}

interface LeagueContext {
  name: string;
  country: string;
  userAccuracy?: number;
  leagueAverage?: number;
  marketSpecificAccuracy?: Record<string, number>;
}

interface ValueOpportunitiesProps {
  opportunities: ValueOpportunity[];
  analysis: ProbabilityAnalysis;
  leagueContext: LeagueContext;
  isLoading?: boolean;
  onPlaceBet?: (opportunity: ValueOpportunity) => void;
  onShowDetails?: (market: string) => void;
}

const ValueOpportunities: React.FC<ValueOpportunitiesProps> = ({
  opportunities,
  analysis,
  leagueContext,
  isLoading = false,
  onPlaceBet,
  onShowDetails
}) => {
  // State for filtering and sorting - FIXED: Persistent state
  const [edgeFilter, setEdgeFilter] = useState(0); // Minimum edge filter
  const [marketFilter, setMarketFilter] = useState('all'); // Market type filter
  const [sortBy, setSortBy] = useState<'edge' | 'probability' | 'value'>('value');
  const getValuePriority = (edge: number, confidence: number): 'high' | 'medium' | 'low' => {
    if (edge > 7 && confidence > 0.7) return 'high';
    if (edge > 3 && confidence > 0.5) return 'medium';
    return 'low';
  };

  const getRecommendationIcon = (market: string) => {
    if (analysis.recommendation?.primary === market) return '⭐';
    if (analysis.recommendation?.secondary === market) return '🔸';
    return '';
  };

  // Memoized filtering and sorting - FIXED: Stable filtering
  const processedOpportunities = useMemo(() => {
    let filtered = [...opportunities];

    // Apply edge filter
    if (edgeFilter > 0) {
      filtered = filtered.filter(opp => opp.edge >= edgeFilter);
    }

    // Apply market filter (simplified structure)
    if (marketFilter !== 'all') {
      filtered = filtered.filter(opp => {
        const market = opp.market.toLowerCase();
        if (marketFilter === '1x2_ft') return market.includes('1x2') || market.includes('home') || market.includes('draw') || market.includes('away');
        if (marketFilter === 'over_under_25') return market.includes('over') || market.includes('under') || market.includes('2.5');
        if (marketFilter === 'goal_ranges') return market.includes('goal') || market.includes('range');
        if (marketFilter === 'asian_handicap_0') return market.includes('ah') || market.includes('handicap') || market.includes('+0');
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'edge':
          return b.edge - a.edge;
        case 'probability':
          return b.probability - a.probability;
        case 'value':
        default:
          // Sort by edge * confidence for true value ranking
          const scoreA = a.edge * a.confidence;
          const scoreB = b.edge * b.confidence;
          return scoreB - scoreA;
      }
    });

    return filtered;
  }, [opportunities, edgeFilter, marketFilter, sortBy]);

  // Get unique market types for filter dropdown (simplified structure)
  const marketTypes = useMemo(() => {
    const types = new Set(['all']);
    opportunities.forEach(opp => {
      const market = opp.market.toLowerCase();
      if (market.includes('1x2') || market.includes('home') || market.includes('draw') || market.includes('away')) types.add('1x2_ft');
      if (market.includes('over') || market.includes('under') || market.includes('2.5')) types.add('over_under_25');
      if (market.includes('goal') || market.includes('range')) types.add('goal_ranges');
      if (market.includes('ah') || market.includes('handicap') || market.includes('+0')) types.add('asian_handicap_0');
    });
    return Array.from(types);
  }, [opportunities]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-bg-tertiary rounded-xl h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Primary Section: Value Opportunities */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-card-foreground flex items-center gap-2">
              🔥 VALUE OPPORTUNITIES
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Immediate betting opportunities with positive edge
            </p>
          </div>
          
          {/* Total Edge Display */}
          <div className="text-right">
            <div className="text-3xl font-bold text-success">
              +{processedOpportunities.reduce((sum, opp) => sum + Math.max(0, opp.edge), 0).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Edge ({processedOpportunities.length} bets)
            </div>
          </div>
        </div>

        {/* ENHANCED: Filter and Sort Controls */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Edge Filter */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Minimum Edge (%)
              </label>
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={edgeFilter}
                onChange={(e) => setEdgeFilter(parseFloat(e.target.value))}
                className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span>
                <span className="font-medium text-card-foreground">{edgeFilter}%</span>
                <span>15%</span>
              </div>
            </div>

            {/* Market Filter */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Market Type
              </label>
              <select
                value={marketFilter}
                onChange={(e) => setMarketFilter(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Markets</option>
                {marketTypes.filter(t => t !== 'all').map(type => (
                  <option key={type} value={type}>
                    {type === '1x2_ft' ? '1X2 Full Time' : 
                     type === 'over_under_25' ? 'Over/Under 2.5' :
                     type === 'goal_ranges' ? 'Goal Ranges' :
                     type === 'asian_handicap_0' ? 'Asian Handicap +0' : type}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'edge' | 'probability' | 'value')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="value">Best Value (Edge × Confidence)</option>
                <option value="edge">Highest Edge</option>
                <option value="probability">Highest Probability</option>
              </select>
            </div>
          </div>

          {/* Reset Filters Button */}
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setEdgeFilter(0);
                setMarketFilter('all');
                setSortBy('value');
              }}
              className="text-sm text-muted-foreground hover:text-card-foreground underline"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Value Bet Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {processedOpportunities.length > 0 ? (
            processedOpportunities.map((opportunity, index) => (
              <ValueBetCard
                key={`${opportunity.market}-${index}`}
                edge={opportunity.edge}
                market={opportunity.market}
                trueOdds={opportunity.trueOdds}
                bookmakerOdds={opportunity.bookmakerOdds}
                confidence={opportunity.confidence}
                isRecommended={analysis.recommendation?.primary === opportunity.market}
                className={cn(
                  'transition-all duration-300',
                  index === 0 && 'md:col-span-2 lg:col-span-1' // Make first card prominent
                )}
                onClick={() => onShowDetails?.(opportunity.market)}
              >
                <div className="space-y-3 mt-3">
                  {/* Probability */}
                  <div className="text-sm text-text-secondary">
                    <span>Probability: </span>
                    <span className="font-semibold text-text-primary">
                      {opportunity.probability.toFixed(1)}%
                    </span>
                  </div>

                  {/* Kelly Stake */}
                  {opportunity.kellyStake && (
                    <div className="text-sm">
                      <span className="text-text-secondary">Kelly Stake: </span>
                      <span className="font-semibold text-accent">
                        {(opportunity.kellyStake * 100).toFixed(1)}% of bankroll
                      </span>
                    </div>
                  )}

                  {/* Action Button */}
                  <ValueBetButton
                    size="sm"
                    priority={getValuePriority(opportunity.edge, opportunity.confidence)}
                    edge={opportunity.edge}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlaceBet?.(opportunity);
                    }}
                    className="w-full mt-4"
                  >
                    {getRecommendationIcon(opportunity.market)}
                    {opportunity.edge > 7 ? 'BET NOW' : 
                     opportunity.edge > 3 ? 'CONSIDER' : 'MARGINAL'}
                  </ValueBetButton>
                </div>
              </ValueBetCard>
            ))
          ) : (
            <Card className="col-span-full p-8 text-center">
              <div className="text-4xl mb-4">
                {opportunities.length === 0 ? '🔍' : '🔧'}
              </div>
              <h3 className="text-lg font-semibold text-card-foreground mb-2">
                {opportunities.length === 0 
                  ? 'No Value Opportunities Found'
                  : 'No Results Match Your Filters'
                }
              </h3>
              <p className="text-muted-foreground">
                {opportunities.length === 0
                  ? 'The simulation didn\'t detect any positive edge betting opportunities for this match.'
                  : `Found ${opportunities.length} total opportunities, but none match your current filter settings.`
                }
              </p>
              {opportunities.length > 0 && (
                <button
                  onClick={() => {
                    setEdgeFilter(0);
                    setMarketFilter('all');
                    setSortBy('value');
                  }}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  Reset Filters to Show All
                </button>
              )}
            </Card>
          )}
        </div>
      </section>

      {/* Secondary Section: Probability vs Edge Analysis */}
      {analysis.hasConflict && (
        <section>
          <Card variant="outlined" padding="lg">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🎯</div>
                <div>
                  <h3 className="text-xl font-bold text-text-primary">
                    PROBABILITY vs EDGE ANALYSIS
                  </h3>
                  <p className="text-text-secondary text-sm">
                    Conflict detected between highest probability and highest edge
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Highest Probability */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-info uppercase text-sm tracking-wide">
                    Highest Probability
                  </h4>
                  <div className="bg-info-bg rounded-lg p-4">
                    <div className="text-lg font-bold text-text-primary">
                      {analysis.highestProbability.market}
                    </div>
                    <div className="text-2xl font-bold text-info">
                      {analysis.highestProbability.probability.toFixed(1)}% chance
                    </div>
                    <div className="text-sm text-text-secondary">
                      True odds: {analysis.highestProbability.trueOdds.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Highest Edge */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-success uppercase text-sm tracking-wide">
                    Highest Edge
                  </h4>
                  <div className="bg-success-bg rounded-lg p-4">
                    <div className="text-lg font-bold text-text-primary">
                      {analysis.highestEdge.market}
                    </div>
                    <div className="text-2xl font-bold text-success">
                      +{analysis.highestEdge.edge.toFixed(1)}% edge
                    </div>
                    <div className="text-sm text-text-secondary">
                      {analysis.highestEdge.probability.toFixed(1)}% probability
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              {analysis.recommendation && (
                <div className="bg-warning-bg border-l-4 border-warning rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-warning text-xl">⚠️</div>
                    <div>
                      <h5 className="font-semibold text-text-primary mb-2">
                        Smart Recommendation
                      </h5>
                      <p className="text-text-secondary mb-3">
                        {analysis.recommendation.reason}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-success font-medium">Primary:</span>
                          <span className="text-text-primary font-semibold">
                            {analysis.recommendation.primary}
                          </span>
                        </div>
                        {analysis.recommendation.secondary && (
                          <div className="flex items-center gap-2">
                            <span className="text-warning font-medium">Secondary:</span>
                            <span className="text-text-primary">
                              {analysis.recommendation.secondary}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </section>
      )}

      {/* Tertiary Section: League Context */}
      <section>
        <Card variant="elevated" padding="lg">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">📊</div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  LEAGUE CONTEXT
                </h3>
                <p className="text-text-secondary text-sm">
                  {leagueContext.name}, {leagueContext.country}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* User Accuracy */}
              {leagueContext.userAccuracy && (
                <div className="text-center p-3 bg-success-bg rounded-lg">
                  <div className="text-2xl font-bold text-success">
                    {(leagueContext.userAccuracy * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-text-secondary uppercase">
                    Your Accuracy
                  </div>
                </div>
              )}

              {/* League Average */}
              {leagueContext.leagueAverage && (
                <div className="text-center p-3 bg-info-bg rounded-lg">
                  <div className="text-2xl font-bold text-info">
                    {(leagueContext.leagueAverage * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-text-secondary uppercase">
                    League Average
                  </div>
                </div>
              )}

              {/* Market Specific Accuracies */}
              {leagueContext.marketSpecificAccuracy && 
               Object.entries(leagueContext.marketSpecificAccuracy).map(([market, accuracy]) => (
                <div key={market} className="text-center p-3 bg-accent-bg rounded-lg">
                  <div className="text-2xl font-bold text-accent">
                    {(accuracy * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-text-secondary uppercase">
                    {market} Accuracy
                  </div>
                </div>
              ))}
            </div>

            {/* Performance Insight */}
            {leagueContext.userAccuracy && leagueContext.leagueAverage && (
              <div className={cn(
                'text-sm p-3 rounded-lg flex items-center gap-2',
                leagueContext.userAccuracy > leagueContext.leagueAverage 
                  ? 'bg-success-bg text-success' 
                  : 'bg-warning-bg text-warning'
              )}>
                <span className="text-lg">
                  {leagueContext.userAccuracy > leagueContext.leagueAverage ? '🎯' : '📈'}
                </span>
                <span>
                  {leagueContext.userAccuracy > leagueContext.leagueAverage 
                    ? `You're performing ${((leagueContext.userAccuracy - leagueContext.leagueAverage) * 100).toFixed(1)}% above league average!`
                    : `Room for improvement: ${((leagueContext.leagueAverage - leagueContext.userAccuracy) * 100).toFixed(1)}% below league average.`
                  }
                </span>
              </div>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
};

export default ValueOpportunities;