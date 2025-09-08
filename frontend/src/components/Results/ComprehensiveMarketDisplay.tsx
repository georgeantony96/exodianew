'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';

interface ComprehensiveMarketResults {
  main_markets: {
    home_win: number;
    draw: number;
    away_win: number;
    double_chance_1x: number;
    double_chance_12: number;
    double_chance_x2: number;
    draw_no_bet_home: number;
    draw_no_bet_away: number;
  };
  goals_markets: {
    over_under: { [line: string]: { over: number; under: number } };
    btts: { yes: number; no: number };
    goal_ranges: { [range: string]: number };
    exact_scores: { [score: string]: number };
    total_goals_odd_even: { odd: number; even: number };
  };
  halves_markets: {
    ht_result: { home: number; draw: number; away: number };
    ht_over_under: { [line: string]: { over: number; under: number } };
    ft_ht_combinations: { [combo: string]: number };
  };
  asian_markets: {
    handicap_lines: { [line: string]: { home: number; away: number } };
    total_lines: { [line: string]: { over: number; under: number } };
  };
}

interface ComprehensiveMarketDisplayProps {
  comprehensiveMarkets: ComprehensiveMarketResults;
  bookmakerOdds?: any;
  homeTeamName: string;
  awayTeamName: string;
}

type TabType = 'MAIN' | 'GOALS' | 'HALVES' | 'ASIAN';

const ComprehensiveMarketDisplay: React.FC<ComprehensiveMarketDisplayProps> = ({
  comprehensiveMarkets,
  bookmakerOdds = {},
  homeTeamName,
  awayTeamName
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('MAIN');

  // Helper function to calculate true odds from probability
  const getTrueOdds = (probability: number): number => {
    return probability > 0 ? +(1 / probability).toFixed(2) : 0;
  };

  // Helper function to detect value bets
  const getValueInfo = (trueProbability: number, bookmakerOdd?: number) => {
    if (!bookmakerOdd || !trueProbability) return null;
    
    const trueOdd = getTrueOdds(trueProbability);
    const edge = ((bookmakerOdd / trueOdd) - 1) * 100;
    
    return {
      edge,
      isValue: edge > 5, // 5%+ edge considered value
      isMassiveValue: edge > 15 // 15%+ edge considered massive value
    };
  };

  // Tab configuration
  const tabs = [
    { id: 'MAIN' as TabType, label: 'Main', icon: '🎯', description: 'Core betting markets' },
    { id: 'GOALS' as TabType, label: 'Goals', icon: '⚽', description: 'All goal-related markets' },
    { id: 'HALVES' as TabType, label: 'Halves', icon: '⏱️', description: 'Half-time markets' },
    { id: 'ASIAN' as TabType, label: 'Asian', icon: '🎌', description: 'Asian handicap & totals' }
  ];

  // Market row component for consistent styling
  const MarketRow = ({ label, trueProbability, trueOdds, bookmakerOdd, description }: {
    label: string;
    trueProbability: number;
    trueOdds: number;
    bookmakerOdd?: number;
    description?: string;
  }) => {
    const valueInfo = getValueInfo(trueProbability, bookmakerOdd);
    
    return (
      <div className={`flex items-center justify-between p-3 border-b border-border hover:bg-accent/10 transition-colors ${
        valueInfo?.isMassiveValue ? 'bg-green-50 border-green-200' :
        valueInfo?.isValue ? 'bg-blue-50 border-blue-200' : ''
      }`}>
        <div className="flex-1">
          <div className="font-medium text-card-foreground">{label}</div>
          {description && <div className="text-xs text-muted-foreground">{description}</div>}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-sm font-medium text-card-foreground">{(trueProbability * 100).toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Probability</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm font-bold text-primary">{trueOdds}</div>
            <div className="text-xs text-muted-foreground">True Odds</div>
          </div>
          
          {bookmakerOdd && (
            <div className="text-center">
              <div className="text-sm font-medium">{bookmakerOdd}</div>
              <div className="text-xs text-muted-foreground">Bookmaker</div>
            </div>
          )}
          
          {valueInfo && (
            <div className={`text-center px-2 py-1 rounded text-xs font-bold ${
              valueInfo.isMassiveValue ? 'bg-green-500 text-white' :
              valueInfo.isValue ? 'bg-blue-500 text-white' :
              'bg-red-100 text-red-700'
            }`}>
              {valueInfo.edge > 0 ? '+' : ''}{valueInfo.edge.toFixed(1)}%
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render MAIN markets tab
  const renderMainMarkets = () => (
    <div className="space-y-4">
      <div className="bg-muted/20 rounded-lg p-4">
        <h4 className="font-semibold mb-3 text-card-foreground">Match Outcome</h4>
        <div className="space-y-0">
          <MarketRow
            label={`${homeTeamName} Win`}
            trueProbability={comprehensiveMarkets.main_markets.home_win}
            trueOdds={getTrueOdds(comprehensiveMarkets.main_markets.home_win)}
            bookmakerOdd={bookmakerOdds?.['1x2']?.home}
          />
          <MarketRow
            label="Draw"
            trueProbability={comprehensiveMarkets.main_markets.draw}
            trueOdds={getTrueOdds(comprehensiveMarkets.main_markets.draw)}
            bookmakerOdd={bookmakerOdds?.['1x2']?.draw}
          />
          <MarketRow
            label={`${awayTeamName} Win`}
            trueProbability={comprehensiveMarkets.main_markets.away_win}
            trueOdds={getTrueOdds(comprehensiveMarkets.main_markets.away_win)}
            bookmakerOdd={bookmakerOdds?.['1x2']?.away}
          />
        </div>
      </div>

      <div className="bg-muted/20 rounded-lg p-4">
        <h4 className="font-semibold mb-3 text-card-foreground">Double Chance</h4>
        <div className="space-y-0">
          <MarketRow
            label={`${homeTeamName} or Draw`}
            trueProbability={comprehensiveMarkets.main_markets.double_chance_1x}
            trueOdds={getTrueOdds(comprehensiveMarkets.main_markets.double_chance_1x)}
            bookmakerOdd={bookmakerOdds?.double_chance?.['1x']}
            description="Home win or draw"
          />
          <MarketRow
            label={`${homeTeamName} or ${awayTeamName}`}
            trueProbability={comprehensiveMarkets.main_markets.double_chance_12}
            trueOdds={getTrueOdds(comprehensiveMarkets.main_markets.double_chance_12)}
            bookmakerOdd={bookmakerOdds?.double_chance?.['12']}
            description="No draw"
          />
          <MarketRow
            label={`Draw or ${awayTeamName}`}
            trueProbability={comprehensiveMarkets.main_markets.double_chance_x2}
            trueOdds={getTrueOdds(comprehensiveMarkets.main_markets.double_chance_x2)}
            bookmakerOdd={bookmakerOdds?.double_chance?.['2x']}
            description="Draw or away win"
          />
        </div>
      </div>

      <div className="bg-muted/20 rounded-lg p-4">
        <h4 className="font-semibold mb-3 text-card-foreground">Draw No Bet</h4>
        <div className="space-y-0">
          <MarketRow
            label={`${homeTeamName} DNB`}
            trueProbability={comprehensiveMarkets.main_markets.draw_no_bet_home}
            trueOdds={getTrueOdds(comprehensiveMarkets.main_markets.draw_no_bet_home)}
            description="Stake refunded if draw"
          />
          <MarketRow
            label={`${awayTeamName} DNB`}
            trueProbability={comprehensiveMarkets.main_markets.draw_no_bet_away}
            trueOdds={getTrueOdds(comprehensiveMarkets.main_markets.draw_no_bet_away)}
            description="Stake refunded if draw"
          />
        </div>
      </div>
    </div>
  );

  // Render GOALS markets tab
  const renderGoalsMarkets = () => (
    <div className="space-y-4">
      <div className="bg-muted/20 rounded-lg p-4">
        <h4 className="font-semibold mb-3 text-card-foreground">Over/Under Goals</h4>
        <div className="space-y-0">
          {Object.entries(comprehensiveMarkets.goals_markets.over_under).map(([line, data]) => (
            <div key={line} className="flex">
              <div className="flex-1">
                <MarketRow
                  label={`Over ${line}`}
                  trueProbability={data.over}
                  trueOdds={getTrueOdds(data.over)}
                  bookmakerOdd={bookmakerOdds?.[`over_under_${line.replace('.', '_')}`]?.over}
                />
              </div>
              <div className="flex-1">
                <MarketRow
                  label={`Under ${line}`}
                  trueProbability={data.under}
                  trueOdds={getTrueOdds(data.under)}
                  bookmakerOdd={bookmakerOdds?.[`over_under_${line.replace('.', '_')}`]?.under}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-muted/20 rounded-lg p-4">
        <h4 className="font-semibold mb-3 text-card-foreground">Both Teams To Score</h4>
        <div className="space-y-0">
          <MarketRow
            label="Both Teams Score - Yes"
            trueProbability={comprehensiveMarkets.goals_markets.btts.yes}
            trueOdds={getTrueOdds(comprehensiveMarkets.goals_markets.btts.yes)}
            bookmakerOdd={bookmakerOdds?.both_teams_score?.yes}
          />
          <MarketRow
            label="Both Teams Score - No"
            trueProbability={comprehensiveMarkets.goals_markets.btts.no}
            trueOdds={getTrueOdds(comprehensiveMarkets.goals_markets.btts.no)}
            bookmakerOdd={bookmakerOdds?.both_teams_score?.no}
          />
        </div>
      </div>

      <div className="bg-muted/20 rounded-lg p-4">
        <h4 className="font-semibold mb-3 text-card-foreground">Goal Ranges</h4>
        <div className="space-y-0">
          {Object.entries(comprehensiveMarkets.goals_markets.goal_ranges).map(([range, probability]) => (
            <MarketRow
              key={range}
              label={`${range} Goals`}
              trueProbability={probability}
              trueOdds={getTrueOdds(probability)}
            />
          ))}
        </div>
      </div>

      <div className="bg-muted/20 rounded-lg p-4">
        <h4 className="font-semibold mb-3 text-card-foreground">Total Goals Odd/Even</h4>
        <div className="space-y-0">
          <MarketRow
            label="Total Goals Odd"
            trueProbability={comprehensiveMarkets.goals_markets.total_goals_odd_even.odd}
            trueOdds={getTrueOdds(comprehensiveMarkets.goals_markets.total_goals_odd_even.odd)}
          />
          <MarketRow
            label="Total Goals Even"
            trueProbability={comprehensiveMarkets.goals_markets.total_goals_odd_even.even}
            trueOdds={getTrueOdds(comprehensiveMarkets.goals_markets.total_goals_odd_even.even)}
          />
        </div>
      </div>

      {/* Top Exact Scores */}
      <div className="bg-muted/20 rounded-lg p-4">
        <h4 className="font-semibold mb-3 text-card-foreground">Most Likely Exact Scores</h4>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(comprehensiveMarkets.goals_markets.exact_scores)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 9)
            .map(([score, probability]) => (
              <div key={score} className="text-center p-2 bg-background rounded border border-border">
                <div className="font-bold text-primary">{score}</div>
                <div className="text-xs text-muted-foreground">{(probability * 100).toFixed(1)}%</div>
                <div className="text-xs font-medium">{getTrueOdds(probability)}</div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );

  // Render HALVES markets tab
  const renderHalvesMarkets = () => (
    <div className="space-y-4">
      <div className="bg-muted/20 rounded-lg p-4">
        <h4 className="font-semibold mb-3 text-card-foreground">Half-Time Result</h4>
        <div className="space-y-0">
          <MarketRow
            label={`${homeTeamName} Leading at HT`}
            trueProbability={comprehensiveMarkets.halves_markets.ht_result.home}
            trueOdds={getTrueOdds(comprehensiveMarkets.halves_markets.ht_result.home)}
            bookmakerOdd={bookmakerOdds?.['1x2_ht']?.home}
          />
          <MarketRow
            label="Draw at Half-Time"
            trueProbability={comprehensiveMarkets.halves_markets.ht_result.draw}
            trueOdds={getTrueOdds(comprehensiveMarkets.halves_markets.ht_result.draw)}
            bookmakerOdd={bookmakerOdds?.['1x2_ht']?.draw}
          />
          <MarketRow
            label={`${awayTeamName} Leading at HT`}
            trueProbability={comprehensiveMarkets.halves_markets.ht_result.away}
            trueOdds={getTrueOdds(comprehensiveMarkets.halves_markets.ht_result.away)}
            bookmakerOdd={bookmakerOdds?.['1x2_ht']?.away}
          />
        </div>
      </div>

      <div className="bg-muted/20 rounded-lg p-4">
        <h4 className="font-semibold mb-3 text-card-foreground">Full-Time/Half-Time Combinations</h4>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(comprehensiveMarkets.halves_markets.ft_ht_combinations)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 9)
            .map(([combo, probability]) => {
              const [ft, ht] = combo.split('/');
              const ftLabel = ft === '1' ? homeTeamName.slice(0,3) : ft === '2' ? awayTeamName.slice(0,3) : 'Draw';
              const htLabel = ht === '1' ? homeTeamName.slice(0,3) : ht === '2' ? awayTeamName.slice(0,3) : 'Draw';
              
              return (
                <div key={combo} className="text-center p-2 bg-background rounded border border-border">
                  <div className="font-bold text-primary text-xs">{ftLabel}/{htLabel}</div>
                  <div className="text-xs text-muted-foreground">{(probability * 100).toFixed(1)}%</div>
                  <div className="text-xs font-medium">{getTrueOdds(probability)}</div>
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  );

  // Render ASIAN markets tab
  const renderAsianMarkets = () => (
    <div className="space-y-4">
      <div className="bg-muted/20 rounded-lg p-4">
        <h4 className="font-semibold mb-3 text-card-foreground">Asian Handicap</h4>
        <div className="space-y-0">
          {Object.entries(comprehensiveMarkets.asian_markets.handicap_lines).map(([line, data]) => (
            <div key={line} className="flex">
              <div className="flex-1">
                <MarketRow
                  label={`${homeTeamName} (${line})`}
                  trueProbability={data.home}
                  trueOdds={getTrueOdds(data.home)}
                  description={`Home ${parseFloat(line) >= 0 ? 'starts +' + line : 'starts ' + line} goals`}
                />
              </div>
              <div className="flex-1">
                <MarketRow
                  label={`${awayTeamName} (${parseFloat(line) > 0 ? '-' + line : '+' + Math.abs(parseFloat(line))})`}
                  trueProbability={data.away}
                  trueOdds={getTrueOdds(data.away)}
                  description={`Away ${parseFloat(line) <= 0 ? 'starts +' + Math.abs(parseFloat(line)) : 'starts -' + line} goals`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-muted/20 rounded-lg p-4">
        <h4 className="font-semibold mb-3 text-card-foreground">Asian Total Goals</h4>
        <div className="space-y-0">
          {Object.entries(comprehensiveMarkets.asian_markets.total_lines).map(([line, data]) => (
            <div key={line} className="flex">
              <div className="flex-1">
                <MarketRow
                  label={`Over ${line}`}
                  trueProbability={data.over}
                  trueOdds={getTrueOdds(data.over)}
                  description="Asian total line"
                />
              </div>
              <div className="flex-1">
                <MarketRow
                  label={`Under ${line}`}
                  trueProbability={data.under}
                  trueOdds={getTrueOdds(data.under)}
                  description="Asian total line"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Card variant="pattern-discovery" padding="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-card-foreground mb-2">
            🎯 Comprehensive Market Analysis
          </h3>
          <p className="text-sm text-muted-foreground">
            50+ goal-based betting markets calculated automatically from simulation
          </p>
        </div>

        {/* Professional Tab Navigation */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-card-foreground hover:bg-accent/10'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <div className="text-left">
                <div className="font-semibold">{tab.label}</div>
                <div className="text-xs opacity-75">{tab.description}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Value Legend */}
        <div className="flex items-center justify-center gap-4 p-3 bg-muted/10 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-xs">Massive Value (15%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-xs">Good Value (5%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-xs">Poor Value</span>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'MAIN' && renderMainMarkets()}
          {activeTab === 'GOALS' && renderGoalsMarkets()}
          {activeTab === 'HALVES' && renderHalvesMarkets()}
          {activeTab === 'ASIAN' && renderAsianMarkets()}
        </div>
      </div>
    </Card>
  );
};

export default ComprehensiveMarketDisplay;