import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';

interface OddsData {
  '1x2_ft': {
    home: number;
    draw: number;
    away: number;
  };
  'over_under_25': {
    over: number;
    under: number;
  };
  'goal_ranges': {
    'no_goals': number;      // 0 goals
    'range_0_1': number;     // 0-1 goals
    'range_2_3': number;     // 2-3 goals
    'range_4_6': number;     // 4-6 goals
    'range_7_plus': number;  // 7+ goals
  };
  'asian_handicap_0': {
    home: number;            // Home +0 (Draw No Bet)
    away: number;            // Away +0 (Draw No Bet)
  };
}

interface OddsInputProps {
  odds?: OddsData | null;
  onOddsChange: (odds: OddsData) => void;
  homeTeamName: string;
  awayTeamName: string;
}

const OddsInput: React.FC<OddsInputProps> = ({
  odds: initialOdds,
  onOddsChange,
  homeTeamName,
  awayTeamName
}) => {
  const [odds, setOdds] = useState<OddsData>(() => {
    return initialOdds || {
      '1x2_ft': { home: 0, draw: 0, away: 0 },
      'over_under_25': { over: 0, under: 0 },
      'goal_ranges': {
        'no_goals': 0,
        'range_0_1': 0,
        'range_2_3': 0,
        'range_4_6': 0,
        'range_7_plus': 0
      },
      'asian_handicap_0': { home: 0, away: 0 }
    };
  });

  const updateOdds = (market: string, submarket: string, field: string, value: string) => {
    try {
      const numValue = parseFloat(value) || 0;
      const updatedOdds = { ...odds };
      
      if (market === '1x2_ft') {
        if (!updatedOdds[market]) updatedOdds[market] = { home: 0, draw: 0, away: 0 };
        (updatedOdds[market] as any)[field] = numValue;
      } else if (market === 'over_under_25') {
        if (!updatedOdds[market]) updatedOdds[market] = { over: 0, under: 0 };
        (updatedOdds[market] as any)[field] = numValue;
      } else if (market === 'goal_ranges') {
        if (!updatedOdds[market]) {
          updatedOdds[market] = {
            'no_goals': 0,
            'range_0_1': 0,
            'range_2_3': 0,
            'range_4_6': 0,
            'range_7_plus': 0
          };
        }
        (updatedOdds[market] as any)[field] = numValue;
      } else if (market === 'asian_handicap_0') {
        if (!updatedOdds[market]) updatedOdds[market] = { home: 0, away: 0 };
        (updatedOdds[market] as any)[field] = numValue;
      }
      
      setOdds(updatedOdds);
      onOddsChange(updatedOdds);
    } catch (error) {
      console.error('Error in updateOdds:', error, { market, submarket, field, value });
    }
  };

  const calculateMargin = (oddsArray: number[]) => {
    const validOdds = oddsArray.filter(odd => odd > 0);
    if (validOdds.length === 0) return 0;
    
    const impliedProbabilities = validOdds.map(odd => 1 / odd);
    const totalProbability = impliedProbabilities.reduce((sum, prob) => sum + prob, 0);
    return ((totalProbability - 1) * 100).toFixed(2);
  };

  const generateRealisticOdds = () => {
    // Generate match scenario first to ensure realistic relationships
    const matchScenarios = [
      { home: 1.65, draw: 3.60, away: 5.50, type: "home_favorite" },    // Strong home favorite
      { home: 2.20, draw: 3.20, away: 3.40, type: "slight_home_edge" }, // Slight home advantage
      { home: 2.75, draw: 3.00, away: 2.70, type: "even_match" },       // Very even match
      { home: 3.80, draw: 3.30, away: 2.10, type: "away_favorite" },    // Away favorite
      { home: 6.00, draw: 4.20, away: 1.55, type: "strong_away" }       // Strong away favorite
    ];
    
    const scenario = matchScenarios[Math.floor(Math.random() * matchScenarios.length)];
    
    // Add small variance to base odds (±5%)
    const variance = () => 0.95 + Math.random() * 0.1;
    
    // Generate Over/Under odds based on match competitiveness
    const isHighScoring = scenario.type === "even_match" || Math.random() < 0.4;
    
    // BTTS probability based on match type (more goals = more BTTS)
    const bttsProb = isHighScoring ? 0.55 : 0.45;
    const bttsYesOdds = 1 / bttsProb;
    const bttsNoOdds = 1 / (1 - bttsProb);
    
    // Calculate Double Chance odds from 1X2 odds
    const homeProb = 1 / scenario.home;
    const drawProb = 1 / scenario.draw;
    const awayProb = 1 / scenario.away;
    
    // Normalize probabilities
    const totalProb = homeProb + drawProb + awayProb;
    const normHome = homeProb / totalProb;
    const normDraw = drawProb / totalProb;
    const normAway = awayProb / totalProb;
    
    // Double Chance probabilities
    const dc1x = normHome + normDraw; // Home or Draw
    const dc12 = normHome + normAway; // Home or Away
    const dcx2 = normDraw + normAway; // Draw or Away
    
    const randomOdds: OddsData = {
      '1x2': {
        home: Math.round(scenario.home * variance() * 100) / 100,
        draw: Math.round(scenario.draw * variance() * 100) / 100,
        away: Math.round(scenario.away * variance() * 100) / 100
      },
      'double_chance': {
        'dc_1x': Math.round((1 / dc1x) * variance() * 100) / 100,
        'dc_12': Math.round((1 / dc12) * variance() * 100) / 100,
        'dc_x2': Math.round((1 / dcx2) * variance() * 100) / 100
      },
      'over_under': {
        'ou25': { 
          over: Math.round((isHighScoring ? 1.75 : 2.10) * variance() * 100) / 100,
          under: Math.round((isHighScoring ? 2.05 : 1.75) * variance() * 100) / 100
        },
        'ou30': { 
          over: Math.round((isHighScoring ? 2.00 : 2.40) * variance() * 100) / 100,
          under: Math.round((isHighScoring ? 1.80 : 1.60) * variance() * 100) / 100
        },
        'ou35': { 
          over: Math.round((isHighScoring ? 2.40 : 2.80) * variance() * 100) / 100,
          under: Math.round((isHighScoring ? 1.55 : 1.45) * variance() * 100) / 100
        }
      },
      'both_teams_score': {
        yes: Math.round(bttsYesOdds * variance() * 100) / 100,
        no: Math.round(bttsNoOdds * variance() * 100) / 100
      },
      'ah_minus1_plus1': {
        minus1: Math.round((scenario.home * 1.15) * variance() * 100) / 100, // AH-1 (home gives 1 goal)
        plus1: Math.round((scenario.away * 0.85) * variance() * 100) / 100   // AH+1 (away gets 1 goal)
      },
      'ah_plus1_minus1': {
        plus1: Math.round((scenario.home * 0.85) * variance() * 100) / 100,  // AH+1 (home gets 1 goal)
        minus1: Math.round((scenario.away * 1.15) * variance() * 100) / 100  // AH-1 (away gives 1 goal)
      },
      'asian_handicap': {
        home: Math.round((scenario.home * 0.95) * variance() * 100) / 100, // Slightly better than 1X2
        away: Math.round((scenario.away * 0.95) * variance() * 100) / 100
      },
      'first_half_double_chance': {
        'dc_1x_1h': Math.round((1 / (dc1x * 0.8)) * variance() * 100) / 100, // 1H double chance typically higher odds
        'dc_12_1h': Math.round((1 / (dc12 * 0.85)) * variance() * 100) / 100, // 1H less predictable
        'dc_x2_1h': Math.round((1 / (dcx2 * 0.8)) * variance() * 100) / 100
      },
      'first_half_ah_0': {
        'home_ah0_1h': Math.round((scenario.home * 1.05) * variance() * 100) / 100, // 1H Draw No Bet slightly higher than full match
        'away_ah0_1h': Math.round((scenario.away * 1.05) * variance() * 100) / 100
      }
    };

    setOdds(randomOdds);
    onOddsChange(randomOdds);
  };

  if (!homeTeamName || !awayTeamName) {
    return (
      <div className="bg-muted p-6 rounded-lg border border-border">
        <p className="text-muted-foreground">Please select both teams first</p>
      </div>
    );
  }

  return (
    <Card variant="pattern-discovery" padding="lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-card-foreground">Bookmaker Odds</h2>
        <button
          onClick={generateRealisticOdds}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          🎲 Generate Random Odds
        </button>
      </div>
      
      {/* Section 1: 1X2 and Asian Handicap +0 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-card-foreground">Match Result (1X2)</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-card-foreground">
              1 - {homeTeamName} Win
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={odds['1x2']?.home || ''}
              onChange={(e) => updateOdds('1x2', '', 'home', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
              placeholder="e.g. 2.50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-card-foreground">
              X - Draw
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={odds['1x2']?.draw || ''}
              onChange={(e) => updateOdds('1x2', '', 'draw', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
              placeholder="e.g. 3.20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-card-foreground">
              2 - {awayTeamName} Win
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={odds['1x2']?.away || ''}
              onChange={(e) => updateOdds('1x2', '', 'away', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
              placeholder="e.g. 2.80"
            />
          </div>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Margin: {calculateMargin([odds['1x2']?.home || 0, odds['1x2']?.draw || 0, odds['1x2']?.away || 0])}%
        </div>
      </div>

      {/* Double Chance Markets */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-card-foreground">Double Chance</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-card-foreground">
              1X - {homeTeamName} or Draw
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={odds.double_chance?.dc_1x || ''}
              onChange={(e) => updateOdds('double_chance', '', 'dc_1x', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
              placeholder="e.g. 1.35"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-card-foreground">
              12 - {homeTeamName} or {awayTeamName}
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={odds.double_chance?.dc_12 || ''}
              onChange={(e) => updateOdds('double_chance', '', 'dc_12', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
              placeholder="e.g. 1.25"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-card-foreground">
              X2 - Draw or {awayTeamName}
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={odds.double_chance?.dc_x2 || ''}
              onChange={(e) => updateOdds('double_chance', '', 'dc_x2', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
              placeholder="e.g. 1.65"
            />
          </div>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Margin: {calculateMargin([odds.double_chance?.dc_1x || 0, odds.double_chance?.dc_12 || 0, odds.double_chance?.dc_x2 || 0])}%
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-card-foreground">Asian Handicap +0 (Draw No Bet)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-card-foreground">
              Home +0
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={odds.asian_handicap?.home || ''}
              onChange={(e) => updateOdds('asian_handicap', '', 'home', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
              placeholder="e.g. 1.95"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-card-foreground">
              Away +0
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={odds.asian_handicap?.away || ''}
              onChange={(e) => updateOdds('asian_handicap', '', 'away', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
              placeholder="e.g. 1.85"
            />
          </div>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Margin: {calculateMargin([odds.asian_handicap?.home, odds.asian_handicap?.away])}%
        </div>
      </div>

      {/* Asian Handicap -1/+1 and +1/-1 Markets */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-card-foreground">Asian Handicap -1/+1</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-card-foreground">{homeTeamName} AH-1</label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={odds.ah_minus1_plus1?.minus1 || ''}
              onChange={(e) => updateOdds('ah_minus1_plus1', '', 'minus1', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
              placeholder="2.10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-card-foreground">{awayTeamName} AH+1</label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={odds.ah_minus1_plus1?.plus1 || ''}
              onChange={(e) => updateOdds('ah_minus1_plus1', '', 'plus1', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
              placeholder="1.75"
            />
          </div>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Margin: {calculateMargin([odds.ah_minus1_plus1?.minus1, odds.ah_minus1_plus1?.plus1])}%
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-card-foreground">Asian Handicap +1/-1</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-card-foreground">{homeTeamName} AH+1</label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={odds.ah_plus1_minus1?.plus1 || ''}
              onChange={(e) => updateOdds('ah_plus1_minus1', '', 'plus1', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
              placeholder="1.45"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-card-foreground">{awayTeamName} AH-1</label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={odds.ah_plus1_minus1?.minus1 || ''}
              onChange={(e) => updateOdds('ah_plus1_minus1', '', 'minus1', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
              placeholder="2.75"
            />
          </div>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Margin: {calculateMargin([odds.ah_plus1_minus1?.plus1, odds.ah_plus1_minus1?.minus1])}%
        </div>
      </div>

      {/* Section 2: GG/NG and Over/Under Goals */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-card-foreground">Both Teams to Score</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-card-foreground">Yes (GG)</label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={odds.both_teams_score?.yes || ''}
              onChange={(e) => updateOdds('both_teams_score', '', 'yes', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
              placeholder="1.80"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-card-foreground">No (NG)</label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={odds.both_teams_score?.no || ''}
              onChange={(e) => updateOdds('both_teams_score', '', 'no', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
              placeholder="2.00"
            />
          </div>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Margin: {calculateMargin([odds.both_teams_score?.yes, odds.both_teams_score?.no])}%
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-card-foreground">Over/Under Goals</h3>
        <div className="grid grid-cols-2 gap-6">
          {[
            { key: 'ou25', label: '2.5 Goals' },
            { key: 'ou30', label: '3.0 Goals' },
            { key: 'ou35', label: '3.5 Goals' }
          ].map(market => (
            <div key={market.key} className="border rounded-lg p-4">
              <h4 className="font-medium mb-2 text-card-foreground">{market.label}</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs mb-1 text-card-foreground">Over</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={odds.over_under?.[market.key as keyof typeof odds.over_under]?.over || ''}
                    onChange={(e) => updateOdds('over_under', market.key, 'over', e.target.value)}
                    className="w-full p-2 border border-border rounded text-sm bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
                    placeholder="1.90"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1 text-card-foreground">Under</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={odds.over_under?.[market.key as keyof typeof odds.over_under]?.under || ''}
                    onChange={(e) => updateOdds('over_under', market.key, 'under', e.target.value)}
                    className="w-full p-2 border border-border rounded text-sm bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
                    placeholder="1.90"
                  />
                </div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Margin: {calculateMargin([
                  odds.over_under?.[market.key as keyof typeof odds.over_under]?.over,
                  odds.over_under?.[market.key as keyof typeof odds.over_under]?.under
                ])}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* First Half Markets */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-card-foreground">First Half - Double Chance</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-card-foreground">
              1H 1X - {homeTeamName} or Draw
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={odds.first_half_double_chance?.dc_1x_1h || ''}
              onChange={(e) => updateOdds('first_half_double_chance', '', 'dc_1x_1h', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
              placeholder="e.g. 1.60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-card-foreground">
              1H 12 - {homeTeamName} or {awayTeamName}
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={odds.first_half_double_chance?.dc_12_1h || ''}
              onChange={(e) => updateOdds('first_half_double_chance', '', 'dc_12_1h', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
              placeholder="e.g. 1.45"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-card-foreground">
              1H X2 - Draw or {awayTeamName}
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={odds.first_half_double_chance?.dc_x2_1h || ''}
              onChange={(e) => updateOdds('first_half_double_chance', '', 'dc_x2_1h', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
              placeholder="e.g. 1.85"
            />
          </div>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Margin: {calculateMargin([odds.first_half_double_chance?.dc_1x_1h || 0, odds.first_half_double_chance?.dc_12_1h || 0, odds.first_half_double_chance?.dc_x2_1h || 0])}%
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-card-foreground">First Half - Asian Handicap +0 (Draw No Bet)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-card-foreground">
              1H {homeTeamName} +0
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={odds.first_half_ah_0?.home_ah0_1h || ''}
              onChange={(e) => updateOdds('first_half_ah_0', '', 'home_ah0_1h', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
              placeholder="e.g. 1.95"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-card-foreground">
              1H {awayTeamName} +0
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={odds.first_half_ah_0?.away_ah0_1h || ''}
              onChange={(e) => updateOdds('first_half_ah_0', '', 'away_ah0_1h', e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
              placeholder="e.g. 1.85"
            />
          </div>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Margin: {calculateMargin([odds.first_half_ah_0?.home_ah0_1h || 0, odds.first_half_ah_0?.away_ah0_1h || 0])}%
        </div>
      </div>

    </Card>
  );
};

export default OddsInput;