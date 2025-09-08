import React, { useState, useMemo } from 'react';

interface ValueBet {
  edge: number;
  true_odds: number;
  bookmaker_odds: number;
  true_probability: number;
  confidence: 'High' | 'Medium' | 'Low' | 'None';
}

interface ValueBets {
  [market: string]: {
    [outcome: string]: ValueBet;
  };
}

interface ValueBetsHighlightProps {
  simulationResults: any;
  bookmakerOdds: any;
  leagueContext: any;
  onBetSelect?: (market: string, outcome: string, bet: ValueBet) => void;
}

const ValueBetsHighlight: React.FC<ValueBetsHighlightProps> = ({
  simulationResults,
  bookmakerOdds,
  leagueContext,
  onBetSelect
}) => {
  // CRITICAL FIX: Extract data from correct nested location
  const valueBets = simulationResults?.results?.value_bets || simulationResults?.value_bets || {};
  const homeTeamName = simulationResults?.results?.home_team || simulationResults?.home_team || 'Home Team';
  const awayTeamName = simulationResults?.results?.away_team || simulationResults?.away_team || 'Away Team';
  const [selectedBets, setSelectedBets] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'edge' | 'confidence' | 'probability'>('edge');
  const [filterConfidence, setFilterConfidence] = useState<string>('all');

  // Helper functions (moved before useMemo to avoid hoisting issues)
  const getDisplayName = (market: string, outcome: string, home: string, away: string): string => {
    switch (market) {
      case '1x2':
        if (outcome === 'home') return `${home} Win`;
        if (outcome === 'away') return `${away} Win`;
        if (outcome === 'draw') return 'Draw';
        break;
      case 'over_under':
        if (outcome.includes('over')) {
          const goals = outcome.replace('over_', '').replace('5', '.5');
          return `Over ${goals} Goals`;
        }
        if (outcome.includes('under')) {
          const goals = outcome.replace('under_', '').replace('5', '.5');
          return `Under ${goals} Goals`;
        }
        break;
      case 'both_teams_score':
        return outcome === 'yes' ? 'Both Teams Score' : 'Both Teams Not Score';
    }
    return `${market} - ${outcome}`;
  };

  const getMarketCategory = (market: string): string => {
    switch (market) {
      case '1x2': return 'Match Result';
      case 'over_under': return 'Goals';
      case 'both_teams_score': return 'Goalscorer';
      default: return market;
    }
  };

  // Flatten and sort value bets
  const allValueBets = useMemo(() => {
    const flattened: Array<{
      market: string;
      outcome: string;
      bet: ValueBet;
      displayName: string;
      marketCategory: string;
    }> = [];

    if (valueBets && typeof valueBets === 'object') {
      Object.entries(valueBets).forEach(([market, outcomes]) => {
        if (outcomes && typeof outcomes === 'object') {
          Object.entries(outcomes).forEach(([outcome, bet]) => {
            const displayName = getDisplayName(market, outcome, homeTeamName, awayTeamName);
            const marketCategory = getMarketCategory(market);
            flattened.push({
              market,
              outcome,
              bet,
              displayName,
              marketCategory
            });
          });
        }
      });
    }

    // Filter by confidence
    let filtered = flattened;
    if (filterConfidence !== 'all') {
      filtered = flattened.filter(item => 
        item.bet.confidence.toLowerCase() === filterConfidence.toLowerCase()
      );
    }

    // Sort by selected criteria
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'edge':
          return b.bet.edge - a.bet.edge;
        case 'confidence':
          const confidenceOrder = { 'High': 3, 'Medium': 2, 'Low': 1, 'None': 0 };
          return confidenceOrder[b.bet.confidence] - confidenceOrder[a.bet.confidence];
        case 'probability':
          return b.bet.true_probability - a.bet.true_probability;
        default:
          return b.bet.edge - a.bet.edge;
      }
    });
  }, [valueBets, sortBy, filterConfidence, homeTeamName, awayTeamName]);

  const getConfidenceColor = (confidence: string): string => {
    switch (confidence.toLowerCase()) {
      case 'high': return 'bg-green-900/20 text-green-300 border-green-500/30 font-semibold';
      case 'medium': return 'bg-yellow-900/20 text-yellow-300 border-yellow-500/30 font-medium';
      case 'low': return 'bg-red-900/20 text-red-300 border-red-500/30 font-normal';
      default: return 'bg-gray-800 text-gray-300 border-gray-600';
    }
  };

  const getEdgeColor = (edge: number): string => {
    if (edge >= 15) return 'bg-gradient-to-r from-green-600 to-green-500 text-white font-bold';
    if (edge >= 10) return 'bg-gradient-to-r from-green-700 to-green-600 text-white font-semibold';
    if (edge >= 5) return 'bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium';
    return 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-normal';
  };

  const toggleBetSelection = (market: string, outcome: string, bet: ValueBet) => {
    const betKey = `${market}_${outcome}`;
    const newSelected = new Set(selectedBets);
    
    if (newSelected.has(betKey)) {
      newSelected.delete(betKey);
    } else {
      newSelected.add(betKey);
    }
    
    setSelectedBets(newSelected);
    onBetSelect?.(market, outcome, bet);
  };

  const calculatePotentialReturn = (stake: number, odds: number): number => {
    return stake * odds;
  };

  const getConfidenceIcon = (confidence: string): string => {
    switch (confidence.toLowerCase()) {
      case 'high': return '🎯';
      case 'medium': return '✅';
      case 'low': return '⚠️';
      default: return '❌';
    }
  };

  if (!allValueBets.length) {
    return (
      <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
        <h2 className="text-xl font-bold mb-4 text-card-foreground">🔍 Value Bet Analysis</h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-card-foreground mb-2">No Value Bets Found</h3>
          <p className="text-muted-foreground mb-4">
            The current bookmaker odds appear to be efficiently priced relative to our simulation results.
          </p>
          <div className="text-sm text-muted-foreground">
            Value bets require at least 2% edge to be displayed
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-card-foreground">🎯 Value Bet Opportunities</h2>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-input text-card-foreground focus:ring-2 focus:ring-ring"
          >
            <option value="edge">Sort by Edge</option>
            <option value="confidence">Sort by Confidence</option>
            <option value="probability">Sort by Probability</option>
          </select>
          <select
            value={filterConfidence}
            onChange={(e) => setFilterConfidence(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-input text-card-foreground focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Confidence Levels</option>
            <option value="high">High Confidence</option>
            <option value="medium">Medium Confidence</option>
            <option value="low">Low Confidence</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted rounded-lg border border-border">
        <div className="text-center">
          <div className="text-2xl font-bold text-success">
            {allValueBets.length}
          </div>
          <div className="text-sm text-muted-foreground">Value Bets Found</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {allValueBets.filter(bet => bet.bet.confidence === 'High').length}
          </div>
          <div className="text-sm text-muted-foreground">High Confidence</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-chart-5">
            {Math.max(...allValueBets.map(bet => bet.bet.edge)).toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">Best Edge</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-warning">
            {(allValueBets.reduce((sum, bet) => sum + bet.bet.edge, 0) / allValueBets.length).toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">Average Edge</div>
        </div>
      </div>

      {/* Value Bets List */}
      <div className="space-y-4">
        {allValueBets.map((item, index) => {
          const betKey = `${item.market}_${item.outcome}`;
          const isSelected = selectedBets.has(betKey);
          const sampleStake = 100;
          const potentialReturn = calculatePotentialReturn(sampleStake, item.bet.bookmaker_odds);

          return (
            <div
              key={betKey}
              onClick={() => toggleBetSelection(item.market, item.outcome, item.bet)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                isSelected 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-accent-foreground hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">
                      {getConfidenceIcon(item.bet.confidence)}
                    </span>
                    <div>
                      <h3 className="font-semibold text-card-foreground">
                        {item.displayName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.marketCategory}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Edge:</span>
                      <div className={`inline-block px-2 py-1 rounded text-xs font-bold ml-2 ${getEdgeColor(item.bet.edge)}`}>
                        +{item.bet.edge.toFixed(1)}%
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">True Odds:</span>
                      <div className="font-bold text-primary">
                        {item.bet.true_odds.toFixed(2)}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Bookmaker:</span>
                      <div className="font-bold text-card-foreground">
                        {item.bet.bookmaker_odds.toFixed(2)}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Probability:</span>
                      <div className="font-bold text-success">
                        {item.bet.true_probability.toFixed(1)}%
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Confidence:</span>
                      <div className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getConfidenceColor(item.bet.confidence)}`}>
                        {item.bet.confidence.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Potential Return Example */}
                  <div className="mt-3 p-3 bg-success/10 rounded-lg border border-success/20">
                    <div className="text-sm text-success">
                      <strong>Example:</strong> $100 stake → ${potentialReturn.toFixed(0)} return 
                      <span className="text-success font-bold ml-2">
                        (+${(potentialReturn - sampleStake).toFixed(0)} profit)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleBetSelection(item.market, item.outcome, item.bet)}
                    className="w-5 h-5 text-primary focus:ring-ring"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Bets Summary */}
      {selectedBets.size > 0 && (
        <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
          <h3 className="font-semibold text-primary mb-2">
            📊 Selected Bets ({selectedBets.size})
          </h3>
          <div className="text-sm text-primary">
            Total potential edge: +
            {allValueBets
              .filter(item => selectedBets.has(`${item.market}_${item.outcome}`))
              .reduce((sum, item) => sum + item.bet.edge, 0)
              .toFixed(1)}%
          </div>
        </div>
      )}

      {/* Value Betting Tips */}
      <div className="mt-6 p-4 bg-warning/10 rounded-lg border border-warning/20">
        <h4 className="font-medium text-warning mb-2">💡 Value Betting Tips</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Focus on high-confidence bets with 5%+ edge for best long-term returns</li>
          <li>• Consider proper bankroll management (1-3% of bankroll per bet)</li>
          <li>• Value betting requires discipline - avoid emotional decisions</li>
          <li>• Track results over time to validate your edge detection accuracy</li>
        </ul>
      </div>
    </div>
  );
};

export default ValueBetsHighlight;