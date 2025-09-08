import React, { useState } from 'react';

interface TrueOdds {
  '1x2': {
    home: number;
    draw: number;
    away: number;
  };
  over_under: {
    over_25: number;
    under_25: number;
    over_35: number;
    under_35: number;
    over_45: number;
    under_45: number;
    over_55: number;
    under_55: number;
  };
  both_teams_score: {
    yes: number;
    no: number;
  };
}

interface BookmakerOdds {
  '1x2': {
    home: number;
    draw: number;
    away: number;
  };
  over_under: {
    ou25: { over: number; under: number };
    ou35: { over: number; under: number };
    ou45: { over: number; under: number };
    ou55: { over: number; under: number };
  };
  both_teams_score: {
    yes: number;
    no: number;
  };
  first_half_gg: {
    yes: number;
    no: number;
  };
}

interface SimulationStats {
  avg_home_goals: number;
  avg_away_goals: number;
  avg_total_goals: number;
  distribution_type: string;
  iterations: number;
}

interface TrueOddsDisplayProps {
  simulationResults: any;
  bookmakerOdds: any;
  leagueContext: any;
}

const TrueOddsDisplay: React.FC<TrueOddsDisplayProps> = ({
  simulationResults,
  bookmakerOdds,
  leagueContext
}) => {
  // ENHANCED: Better data extraction with probability-to-odds conversion
  const rawResults = simulationResults?.results || simulationResults;
  const simulationStats = rawResults || {};
  
  // Helper function to convert probability to odds
  const probToOdds = (prob: number): number => prob > 0 ? (1 / prob) : 999;
  
  // Extract and process true odds - FIXED: Handle both odds and probabilities
  const extractProcessedOdds = () => {
    const existingOdds = rawResults?.true_odds || {};
    const probabilities = rawResults?.probabilities;
    
    let processedOdds: any = { ...existingOdds };
    
    // If we have probabilities, convert them to fill missing odds
    if (probabilities) {
      // Match outcomes (1X2)
      if (probabilities.match_outcomes && !processedOdds.match_outcomes) {
        processedOdds.match_outcomes = {
          home_win: probToOdds(probabilities.match_outcomes.home_win || 0.33),
          draw: probToOdds(probabilities.match_outcomes.draw || 0.33),
          away_win: probToOdds(probabilities.match_outcomes.away_win || 0.33)
        };
      }
      
      // Goal markets (Over/Under) - FIXED: Convert probabilities to odds
      if (probabilities.goal_markets && !processedOdds.goal_markets) {
        processedOdds.goal_markets = {
          over_1_5: probToOdds(probabilities.goal_markets.over_1_5 || 0.7),
          under_1_5: probToOdds(probabilities.goal_markets.under_1_5 || 0.3),
          over_2_5: probToOdds(probabilities.goal_markets.over_2_5 || 0.5),
          under_2_5: probToOdds(probabilities.goal_markets.under_2_5 || 0.5),
          over_3_5: probToOdds(probabilities.goal_markets.over_3_5 || 0.3),
          under_3_5: probToOdds(probabilities.goal_markets.under_3_5 || 0.7),
          over_4_5: probToOdds(probabilities.goal_markets.over_4_5 || 0.15),
          under_4_5: probToOdds(probabilities.goal_markets.under_4_5 || 0.85)
        };
      }
      
      // Both Teams to Score (BTTS) - FIXED: Convert probabilities to odds
      if (probabilities.btts && !processedOdds.btts) {
        processedOdds.btts = {
          yes: probToOdds(probabilities.btts.yes || 0.5),
          no: probToOdds(probabilities.btts.no || 0.5)
        };
      }
    }
    
    return processedOdds;
  };
  
  const trueOdds = extractProcessedOdds();
  const homeTeamName = simulationResults?.results?.home_team || simulationResults?.home_team || leagueContext?.home_team || 'Home Team';
  const awayTeamName = simulationResults?.results?.away_team || simulationResults?.away_team || leagueContext?.away_team || 'Away Team';
  const [activeTab, setActiveTab] = useState('1x2');
  const [showComparison, setShowComparison] = useState(!!bookmakerOdds);

  const calculateProbability = (odds: number): string => {
    if (odds <= 0) return '0.0%';
    return ((1 / odds) * 100).toFixed(1) + '%';
  };

  const getEdge = (trueOdd: number, bookmakerOdd: number): number => {
    if (!bookmakerOdd || bookmakerOdd <= 0) return 0;
    const trueProbability = 1 / trueOdd;
    return (trueProbability * bookmakerOdd - 1) * 100;
  };

  const getEdgeColor = (edge: number): string => {
    if (edge >= 10) return 'text-success bg-success/10 border border-success/20';
    if (edge >= 5) return 'text-primary bg-primary/10 border border-primary/20';
    if (edge >= 2) return 'text-warning bg-warning/10 border border-warning/20';
    return 'text-muted-foreground bg-muted border border-border';
  };

  const getEdgeIcon = (edge: number): string => {
    if (edge >= 10) return '🎯';
    if (edge >= 5) return '✅';
    if (edge >= 2) return '⚠️';
    return '❌';
  };

  const renderOddsComparison = (
    label: string,
    trueOdd: number,
    bookmakerOdd?: number,
    isWinningOutcome?: boolean
  ) => {
    const edge = bookmakerOdd ? getEdge(trueOdd, bookmakerOdd) : 0;
    const hasValue = edge >= 2;

    return (
      <div className={`p-3 rounded-lg border ${
        hasValue ? 'border-success/20 bg-success/5' : 'border-border bg-card'
      } ${isWinningOutcome ? 'ring-2 ring-primary/20' : ''}`}>
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-card-foreground">{label}</span>
          {hasValue && <span className="text-lg">{getEdgeIcon(edge)}</span>}
        </div>
        
        <div className="space-y-2">
          {/* True Odds */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">True Odds:</span>
            <div className="text-right">
              <div className="font-bold text-primary">{trueOdd.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">
                {calculateProbability(trueOdd)}
              </div>
            </div>
          </div>

          {/* Bookmaker Odds */}
          {bookmakerOdd && showComparison && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Bookmaker:</span>
              <div className="text-right">
                <div className="font-bold text-card-foreground">{bookmakerOdd.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">
                  {calculateProbability(bookmakerOdd)}
                </div>
              </div>
            </div>
          )}

          {/* Edge Calculation */}
          {bookmakerOdd && showComparison && (
            <div className={`flex justify-between items-center p-2 rounded-lg ${getEdgeColor(edge)}`}>
              <span className="text-xs font-medium truncate mr-2">Edge:</span>
              <div className="text-right min-w-0 flex-1">
                <div className="font-bold text-sm">
                  {edge >= 0 ? '+' : ''}{edge.toFixed(1)}%
                </div>
                <div className="text-xs opacity-80 truncate">
                  {edge >= 10 ? 'High Value' :
                   edge >= 5 ? 'Good Value' :
                   edge >= 2 ? 'Fair Value' : 'No Value'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const tabs = [
    { key: '1x2', label: 'Match Result' },
    { key: 'over_under', label: 'Over/Under' },
    { key: 'both_teams_score', label: 'Both Teams Score' }
  ];

  // Early return if no data
  if (!trueOdds) {
    return (
      <div className="bg-card p-6 rounded-xl border border-border shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-card-foreground">Simulation Results</h2>
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-6xl mb-4">📊</div>
          <div className="text-lg">No simulation results available</div>
          <p className="text-sm mt-2">Run a simulation to see true odds and analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-card-foreground">Simulation Results</h2>
        {bookmakerOdds && (
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showComparison
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-card-foreground hover:bg-accent border border-border'
            }`}
          >
            {showComparison ? 'Hide Comparison' : '⚖️ Show vs Bookmaker'}
          </button>
        )}
      </div>

      {/* Simulation Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted rounded-lg border border-border">
        <div className="text-center">
          <div className="text-xl font-bold text-primary">
            {simulationStats?.avg_home_goals?.toFixed(1) ?? '0.0'}
          </div>
          <div className="text-sm text-muted-foreground">{homeTeamName} Goals</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-destructive">
            {simulationStats?.avg_away_goals?.toFixed(1) ?? '0.0'}
          </div>
          <div className="text-sm text-muted-foreground">{awayTeamName} Goals</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-success">
            {simulationStats?.avg_total_goals?.toFixed(1) ?? '0.0'}
          </div>
          <div className="text-sm text-muted-foreground">Total Goals</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-chart-5">
            {(simulationResults?.results?.metadata?.iterations || simulationResults?.metadata?.iterations || simulationStats?.iterations)?.toLocaleString() ?? '0'}
          </div>
          <div className="text-sm text-muted-foreground">Simulations</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground border-b-2 border-primary'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-card-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results Content */}
      <div className="space-y-4">
        {/* 1X2 Market */}
        {activeTab === '1x2' && (trueOdds?.['1x2'] || trueOdds?.match_outcomes) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderOddsComparison(
              `1 - ${homeTeamName} Win`,
              trueOdds['1x2']?.home || trueOdds.match_outcomes?.home_win,
              bookmakerOdds?.['1x2']?.home
            )}
            {renderOddsComparison(
              'X - Draw',
              trueOdds['1x2']?.draw || trueOdds.match_outcomes?.draw,
              bookmakerOdds?.['1x2']?.draw
            )}
            {renderOddsComparison(
              `2 - ${awayTeamName} Win`,
              trueOdds['1x2']?.away || trueOdds.match_outcomes?.away_win,
              bookmakerOdds?.['1x2']?.away
            )}
          </div>
        )}

        {/* Over/Under Markets */}
        {activeTab === 'over_under' && trueOdds?.goal_markets && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              { key: 'ou15', label: '1.5 Goals', over: 'over_1_5', under: 'under_1_5' },
              { key: 'ou25', label: '2.5 Goals', over: 'over_2_5', under: 'under_2_5' },
              { key: 'ou35', label: '3.5 Goals', over: 'over_3_5', under: 'under_3_5' },
              { key: 'ou45', label: '4.5 Goals', over: 'over_4_5', under: 'under_4_5' }
            ].map(market => (
              <div key={market.key} className="space-y-3">
                <h4 className="font-semibold text-center text-card-foreground border-b border-border pb-2">{market.label}</h4>
                <div className="grid grid-cols-2 gap-3">
                  {renderOddsComparison(
                    'Over',
                    trueOdds.goal_markets[market.over],
                    bookmakerOdds?.over_under?.[market.key]?.over
                  )}
                  {renderOddsComparison(
                    'Under',
                    trueOdds.goal_markets[market.under],
                    bookmakerOdds?.over_under?.[market.key]?.under
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Both Teams Score */}
        {activeTab === 'both_teams_score' && trueOdds?.btts && (
          <div className="grid grid-cols-2 gap-4">
            {renderOddsComparison(
              'Yes - Both Score (GG)',
              trueOdds.btts.yes,
              bookmakerOdds?.both_teams_score?.yes
            )}
            {renderOddsComparison(
              'No - Not Both Score (NG)',
              trueOdds.btts.no,
              bookmakerOdds?.both_teams_score?.no
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
        <h4 className="font-medium text-card-foreground mb-2">📊 Value Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <span className="text-success">High Value (10%+ edge)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span className="text-primary">Good Value (5-10% edge)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span className="text-warning">Fair Value (2-5% edge)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">❌</span>
            <span className="text-muted-foreground">No Value (&lt;2% edge)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrueOddsDisplay;