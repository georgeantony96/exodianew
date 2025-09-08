'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';

interface SimpleValueBetsProps {
  simulationResults: any;
  homeTeamName: string;
  awayTeamName: string;
}

interface ValueBet {
  id: string;
  market: string;
  outcome: string;
  displayName: string;
  edge: number;
  trueOdds: number;
  bookmakerOdds: number;
  trueProbability: number;
  confidence: string;
}

const SimpleValueBets: React.FC<SimpleValueBetsProps> = ({
  simulationResults,
  homeTeamName,
  awayTeamName
}) => {
  // Extract value bets from simulation results
  const valueBets = simulationResults?.results?.results?.value_bets || 
                   simulationResults?.results?.value_bets || 
                   simulationResults?.value_bets || {};

  // Process all value bets into a simple array
  const processValueBets = (): ValueBet[] => {
    const bets: ValueBet[] = [];

    if (!valueBets || typeof valueBets !== 'object') {
      return bets;
    }

    Object.entries(valueBets).forEach(([market, outcomes]) => {
      if (!outcomes || typeof outcomes !== 'object') return;

      Object.entries(outcomes).forEach(([outcome, bet]) => {
        if (!bet || typeof bet !== 'object') return;

        const valueBet = bet as any;
        if (!valueBet.edge || valueBet.edge <= 0) return;

        // Generate display name
        let displayName = '';
        switch (market) {
          // Full Time Markets
          case '1x2_ft':
            switch (outcome) {
              case 'home': displayName = `${homeTeamName} Win`; break;
              case 'away': displayName = `${awayTeamName} Win`; break;
              case 'draw': displayName = 'Draw'; break;
              default: displayName = outcome;
            }
            break;
          case 'over_under_25':
            displayName = `Over/Under 2.5 Goals - ${outcome === 'over' ? 'Over' : 'Under'}`;
            break;
          case 'over_under_3':
            displayName = `Over/Under 3.0 Goals - ${outcome === 'over' ? 'Over' : 'Under'}`;
            break;
          case 'over_under_35':
            displayName = `Over/Under 3.5 Goals - ${outcome === 'over' ? 'Over' : 'Under'}`;
            break;
          case 'gg_ng':
            displayName = outcome === 'gg' ? 'Both Teams to Score - Yes (GG)' : 'Both Teams to Score - No (NG)';
            break;
          case 'double_chance':
            switch (outcome) {
              case '1x': displayName = `Double Chance - 1X (${homeTeamName} or Draw)`; break;
              case '12': displayName = `Double Chance - 12 (${homeTeamName} or ${awayTeamName})`; break;
              case '2x': displayName = `Double Chance - 2X (${awayTeamName} or Draw)`; break;
              default: displayName = `Double Chance - ${outcome}`;
            }
            break;
          case 'asian_handicap_0':
            displayName = `AH+0 - ${outcome === 'home' ? homeTeamName + ' +0' : awayTeamName + ' +0'}`;
            break;
          case 'asian_handicap_minus1_plus1':
            displayName = `AH -1/+1 - ${outcome === 'home' ? homeTeamName + ' -1' : awayTeamName + ' +1'}`;
            break;
          case 'asian_handicap_plus1_minus1':
            displayName = `AH +1/-1 - ${outcome === 'home' ? homeTeamName + ' +1' : awayTeamName + ' -1'}`;
            break;
          
          // Half Time Markets
          case '1x2_ht':
            switch (outcome) {
              case 'home': displayName = `${homeTeamName} Win (HT)`; break;
              case 'away': displayName = `${awayTeamName} Win (HT)`; break;
              case 'draw': displayName = 'Draw (HT)'; break;
              default: displayName = `${outcome} (HT)`;
            }
            break;
          case 'asian_handicap_0_ht':
            displayName = `AH+0 HT - ${outcome === 'home' ? homeTeamName + ' +0' : awayTeamName + ' +0'}`;
            break;
          case 'over_under_15_ht':
            displayName = `Over/Under 1.5 Goals (HT) - ${outcome === 'over' ? 'Over' : 'Under'}`;
            break;
          
          // Legacy support for old market names
          case '1x2':
            switch (outcome) {
              case 'home': displayName = `${homeTeamName} Win`; break;
              case 'away': displayName = `${awayTeamName} Win`; break;
              case 'draw': displayName = 'Draw'; break;
              default: displayName = outcome;
            }
            break;
          case 'btts':
            displayName = outcome === 'yes' ? 'Both Teams to Score - Yes' : 'Both Teams to Score - No';
            break;
          case 'ou25':
            displayName = `Over/Under 2.5 Goals - ${outcome === 'over' ? 'Over' : 'Under'}`;
            break;
          case 'ou30':
            displayName = `Over/Under 3.0 Goals - ${outcome === 'over' ? 'Over' : 'Under'}`;
            break;
          case 'ou35':
            displayName = `Over/Under 3.5 Goals - ${outcome === 'over' ? 'Over' : 'Under'}`;
            break;
          case 'ou15':
            displayName = `Over/Under 1.5 Goals - ${outcome === 'over' ? 'Over' : 'Under'}`;
            break;
          case 'ou45':
            displayName = `Over/Under 4.5 Goals - ${outcome === 'over' ? 'Over' : 'Under'}`;
            break;
          case 'asian_handicap':
            displayName = `AH+0 - ${outcome === 'home' ? 'Home +0' : 'Away +0'}`;
            break;
          case 'first_half_gg':
            displayName = `1H BTTS - ${outcome === 'yes' ? 'Yes (GG 1H)' : 'No (NG 1H)'}`;
            break;
          case 'first_half_ou15':
            displayName = `1H O/U 1.5 - ${outcome === 'over' ? 'Over' : 'Under'}`;
            break;
          default:
            displayName = `${market.toUpperCase()} - ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`;
        }

        bets.push({
          id: `${market}_${outcome}`,
          market,
          outcome,
          displayName,
          edge: valueBet.edge,
          trueOdds: valueBet.true_odds,
          bookmakerOdds: valueBet.bookmaker_odds,
          trueProbability: valueBet.true_probability,
          confidence: valueBet.confidence || 'Medium'
        });
      });
    });

    // Sort by edge (highest first)
    return bets.sort((a, b) => b.edge - a.edge);
  };

  const allValueBets = processValueBets();

  // Get edge color
  const getEdgeColor = (edge: number) => {
    if (edge >= 10) return 'text-green-400 font-bold';
    if (edge >= 5) return 'text-yellow-400 font-semibold';
    if (edge >= 2) return 'text-blue-400 font-medium';
    return 'text-gray-400';
  };

  // Get confidence color
  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'high': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  if (allValueBets.length === 0) {
    return (
      <Card className="p-6 mb-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-card-foreground mb-4">💎 Value Betting Opportunities</h2>
          <div className="text-muted-foreground">
            <div className="text-4xl mb-2">📊</div>
            <p>No value betting opportunities found</p>
            <p className="text-sm mt-1">All markets appear to be efficiently priced</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-card-foreground">💎 Value Betting Opportunities</h2>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-primary">{allValueBets.length}</span> opportunities found
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6 text-center">
        <div>
          <div className="text-2xl font-bold text-green-400">
            {allValueBets.filter(bet => bet.edge >= 10).length}
          </div>
          <div className="text-sm text-muted-foreground">High Value (10%+)</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-yellow-400">
            {allValueBets.filter(bet => bet.edge >= 5 && bet.edge < 10).length}
          </div>
          <div className="text-sm text-muted-foreground">Medium Value (5-10%)</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-400">
            {allValueBets.filter(bet => bet.edge > 0 && bet.edge < 5).length}
          </div>
          <div className="text-sm text-muted-foreground">Low Value (0-5%)</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-400">
            {allValueBets.length > 0 ? allValueBets[0].edge.toFixed(1) : '0.0'}%
          </div>
          <div className="text-sm text-muted-foreground">Best Edge</div>
        </div>
      </div>

      {/* All Value Bets List */}
      <div className="space-y-3">
        {allValueBets.map((bet) => (
          <div key={bet.id} className="bg-muted/20 rounded-lg p-4 border border-border">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-card-foreground mb-1">{bet.displayName}</h3>
                <div className="text-sm text-muted-foreground">
                  Market: {bet.market.toUpperCase()} • {bet.confidence} Confidence
                </div>
              </div>
              
              <div className="text-right ml-4">
                <div className={`text-lg font-bold ${getEdgeColor(bet.edge)}`}>
                  +{bet.edge.toFixed(1)}% Edge
                </div>
                <div className="text-sm text-muted-foreground">
                  True: {bet.trueOdds.toFixed(2)} | Book: {bet.bookmakerOdds.toFixed(2)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
              <div>
                <span className="text-muted-foreground">True Probability:</span>
                <div className="font-medium">{(bet.trueProbability * 100).toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Implied Probability:</span>
                <div className="font-medium">{(1 / bet.bookmakerOdds * 100).toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Potential Profit ($100):</span>
                <div className="font-medium text-green-400">${((bet.bookmakerOdds - 1) * 100).toFixed(0)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default SimpleValueBets;