'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';

interface SimplifiedBookmakerAnalysisProps {
  simulationResults: any;
  bookmakerOdds: any;
  leagueContext: any;
}

const SimplifiedBookmakerAnalysis: React.FC<SimplifiedBookmakerAnalysisProps> = ({
  simulationResults,
  bookmakerOdds,
  leagueContext
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Extract key data
  const trueOdds = simulationResults?.results?.true_odds || simulationResults?.true_odds;
  const probabilities = simulationResults?.results?.probabilities || simulationResults?.probabilities;
  
  // Calculate bookmaker margin (overround)
  const calculateMargin = (odds: Record<string, number>): number => {
    const totalImpliedProb = Object.values(odds).reduce((sum, odd) => sum + (1 / odd), 0);
    return ((totalImpliedProb - 1) * 100);
  };

  // Calculate value opportunities
  const findValueBets = () => {
    const valueBets: Array<{
      market: string;
      outcome: string;
      trueProb: number;
      bookmakerProb: number;
      edge: number;
      quality: 'Excellent' | 'Good' | 'Fair';
    }> = [];

    if (!probabilities || !bookmakerOdds) return valueBets;

    // Check 1X2 market
    if (probabilities.match_outcomes && bookmakerOdds['1x2']) {
      const outcomes = [
        { key: 'home_win', name: 'Home Win', bookmaker: bookmakerOdds['1x2'].home },
        { key: 'draw', name: 'Draw', bookmaker: bookmakerOdds['1x2'].draw },
        { key: 'away_win', name: 'Away Win', bookmaker: bookmakerOdds['1x2'].away }
      ];

      outcomes.forEach(outcome => {
        const trueProb = probabilities.match_outcomes[outcome.key];
        const bookmakerProb = 1 / outcome.bookmaker;
        const edge = ((trueProb - bookmakerProb) / bookmakerProb) * 100;

        if (edge > 2) { // Only show 2%+ edges
          valueBets.push({
            market: 'Match Result',
            outcome: outcome.name,
            trueProb: trueProb * 100,
            bookmakerProb: bookmakerProb * 100,
            edge,
            quality: edge > 10 ? 'Excellent' : edge > 5 ? 'Good' : 'Fair'
          });
        }
      });
    }

    // Check Over/Under 2.5
    if (probabilities.goal_markets && bookmakerOdds.over_under?.ou25) {
      const overProb = probabilities.goal_markets.over_2_5;
      const underProb = probabilities.goal_markets.under_2_5;
      const bookmakerOverProb = 1 / bookmakerOdds.over_under.ou25.over;
      const bookmakerUnderProb = 1 / bookmakerOdds.over_under.ou25.under;

      const overEdge = ((overProb - bookmakerOverProb) / bookmakerOverProb) * 100;
      const underEdge = ((underProb - bookmakerUnderProb) / bookmakerUnderProb) * 100;

      if (overEdge > 2) {
        valueBets.push({
          market: 'Over/Under 2.5',
          outcome: 'Over 2.5',
          trueProb: overProb * 100,
          bookmakerProb: bookmakerOverProb * 100,
          edge: overEdge,
          quality: overEdge > 10 ? 'Excellent' : overEdge > 5 ? 'Good' : 'Fair'
        });
      }

      if (underEdge > 2) {
        valueBets.push({
          market: 'Over/Under 2.5',
          outcome: 'Under 2.5',
          trueProb: underProb * 100,
          bookmakerProb: bookmakerUnderProb * 100,
          edge: underEdge,
          quality: underEdge > 10 ? 'Excellent' : underEdge > 5 ? 'Good' : 'Fair'
        });
      }
    }

    return valueBets.sort((a, b) => b.edge - a.edge);
  };

  // Calculate overall market efficiency
  const getMarketEfficiency = (): { rating: string; margin: number; description: string } => {
    if (!bookmakerOdds) return { rating: 'Unknown', margin: 0, description: 'No odds data available' };

    let totalMargin = 0;
    let marketCount = 0;

    // 1X2 Margin
    if (bookmakerOdds['1x2']) {
      const margin = calculateMargin(bookmakerOdds['1x2']);
      totalMargin += margin;
      marketCount++;
    }

    // Over/Under Margin
    if (bookmakerOdds.over_under?.ou25) {
      const margin = calculateMargin({
        over: bookmakerOdds.over_under.ou25.over,
        under: bookmakerOdds.over_under.ou25.under
      });
      totalMargin += margin;
      marketCount++;
    }

    const avgMargin = marketCount > 0 ? totalMargin / marketCount : 0;

    if (avgMargin < 3) return { rating: 'Excellent', margin: avgMargin, description: 'Very competitive odds with low margin' };
    if (avgMargin < 5) return { rating: 'Good', margin: avgMargin, description: 'Competitive odds with reasonable margin' };
    if (avgMargin < 8) return { rating: 'Fair', margin: avgMargin, description: 'Average odds with standard margin' };
    return { rating: 'Poor', margin: avgMargin, description: 'High margin - less favorable for bettors' };
  };

  const valueBets = findValueBets();
  const efficiency = getMarketEfficiency();

  if (!bookmakerOdds) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold text-card-foreground mb-4">📊 Bookmaker Analysis</h2>
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-4xl mb-2">📈</div>
          <p>No bookmaker odds available for analysis</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-card-foreground">📊 Market Analysis</h2>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-primary hover:text-primary/80 underline"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Market Efficiency */}
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className={`text-2xl font-bold ${
            efficiency.rating === 'Excellent' ? 'text-green-600' :
            efficiency.rating === 'Good' ? 'text-blue-600' :
            efficiency.rating === 'Fair' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {efficiency.rating}
          </div>
          <div className="text-sm text-muted-foreground">Market Efficiency</div>
          <div className="text-xs text-muted-foreground mt-1">
            {efficiency.margin.toFixed(1)}% margin
          </div>
        </div>

        {/* Value Opportunities */}
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className={`text-2xl font-bold ${
            valueBets.length > 0 ? 'text-success' : 'text-muted-foreground'
          }`}>
            {valueBets.length}
          </div>
          <div className="text-sm text-muted-foreground">Value Bets Found</div>
          <div className="text-xs text-muted-foreground mt-1">
            {valueBets.length > 0 ? 'Opportunities available' : 'No clear value'}
          </div>
        </div>

        {/* Best Edge */}
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className={`text-2xl font-bold ${
            valueBets.length > 0 ? 'text-primary' : 'text-muted-foreground'
          }`}>
            {valueBets.length > 0 ? `+${valueBets[0].edge.toFixed(1)}%` : '0%'}
          </div>
          <div className="text-sm text-muted-foreground">Best Edge</div>
          <div className="text-xs text-muted-foreground mt-1">
            {valueBets.length > 0 ? valueBets[0].outcome : 'No edges found'}
          </div>
        </div>
      </div>

      {/* Simple Summary */}
      <div className="bg-muted/30 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-card-foreground mb-2">📈 Quick Summary</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {efficiency.description}. 
          {valueBets.length > 0 
            ? ` Found ${valueBets.length} potential value bet${valueBets.length > 1 ? 's' : ''}, with the best edge being ${valueBets[0].edge.toFixed(1)}% on ${valueBets[0].outcome}.`
            : ' No significant value opportunities detected at current odds.'
          }
        </p>
      </div>

      {/* Value Opportunities */}
      {valueBets.length > 0 && (
        <div>
          <h3 className="font-semibold text-card-foreground mb-3">🎯 Value Opportunities</h3>
          <div className="space-y-2">
            {valueBets.slice(0, 3).map((bet, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-success/5 border border-success/20 rounded-lg">
                <div>
                  <div className="font-medium text-card-foreground">{bet.outcome}</div>
                  <div className="text-xs text-muted-foreground">{bet.market}</div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${
                    bet.quality === 'Excellent' ? 'text-green-600' :
                    bet.quality === 'Good' ? 'text-blue-600' : 'text-yellow-600'
                  }`}>
                    +{bet.edge.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">{bet.quality} Value</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Analysis (collapsible) */}
      {showDetails && (
        <div className="mt-6 pt-4 border-t border-border">
          <h3 className="font-semibold text-card-foreground mb-3">📋 Detailed Breakdown</h3>
          <div className="space-y-4 text-sm">
            <div>
              <strong>Market Margin:</strong> {efficiency.margin.toFixed(2)}% 
              <span className="text-muted-foreground ml-2">
                (Lower is better - indicates how much bookmaker builds in)
              </span>
            </div>
            
            {valueBets.length > 0 && (
              <div>
                <strong>Value Analysis:</strong>
                <ul className="mt-2 space-y-1 ml-4">
                  {valueBets.map((bet, index) => (
                    <li key={index} className="text-muted-foreground">
                      • <strong>{bet.outcome}:</strong> True probability {bet.trueProb.toFixed(1)}% vs 
                      bookmaker {bet.bookmakerProb.toFixed(1)}% = <strong className="text-success">+{bet.edge.toFixed(1)}% edge</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default SimplifiedBookmakerAnalysis;