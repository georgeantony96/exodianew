import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';

interface OddsData {
  // Full Time Markets
  '1x2_ft': {
    home: number;
    draw: number;
    away: number;
  };
  'over_under_25': {
    over: number;
    under: number;
  };
  'over_under_3': {
    over: number;
    under: number;
  };
  'over_under_35': {
    over: number;
    under: number;
  };
  'gg_ng': {
    gg: number;   // Both teams to score
    ng: number;   // No goal (one or both teams don't score)
  };
  'double_chance': {
    '1x': number;  // Home or Draw
    '12': number;  // Home or Away
    '2x': number;  // Away or Draw
  };
  'asian_handicap_0': {
    home: number;
    away: number;
  };
  'asian_handicap_minus1_plus1': {
    home: number;  // Home -1
    away: number;  // Away +1
  };
  'asian_handicap_plus1_minus1': {
    home: number;  // Home +1
    away: number;  // Away -1
  };
  
  // Half Time Markets
  '1x2_ht': {
    home: number;
    draw: number;
    away: number;
  };
  'asian_handicap_0_ht': {
    home: number;
    away: number;
  };
  'over_under_15_ht': {
    over: number;
    under: number;
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
      // Full Time Markets
      '1x2_ft': { home: 0, draw: 0, away: 0 },
      'over_under_25': { over: 0, under: 0 },
      'over_under_3': { over: 0, under: 0 },
      'over_under_35': { over: 0, under: 0 },
      'gg_ng': { gg: 0, ng: 0 },
      'double_chance': { '1x': 0, '12': 0, '2x': 0 },
      'asian_handicap_0': { home: 0, away: 0 },
      'asian_handicap_minus1_plus1': { home: 0, away: 0 },
      'asian_handicap_plus1_minus1': { home: 0, away: 0 },
      
      // Half Time Markets
      '1x2_ht': { home: 0, draw: 0, away: 0 },
      'asian_handicap_0_ht': { home: 0, away: 0 },
      'over_under_15_ht': { over: 0, under: 0 }
    };
  });

  const updateOdds = (market: string, field: string, value: string) => {
    try {
      const numValue = parseFloat(value) || 0;
      const updatedOdds = { ...odds };
      
      // Handle all market types
      if (!updatedOdds[market as keyof OddsData]) {
        // Initialize market based on type
        if (market === '1x2_ft' || market === '1x2_ht') {
          (updatedOdds as any)[market] = { home: 0, draw: 0, away: 0 };
        } else if (market.includes('over_under') || market === 'gg_ng') {
          (updatedOdds as any)[market] = { [Object.keys((updatedOdds as any)[market] || {})[0] || 'over']: 0, [Object.keys((updatedOdds as any)[market] || {})[1] || 'under']: 0 };
        } else if (market === 'double_chance') {
          (updatedOdds as any)[market] = { '1x': 0, '12': 0, '2x': 0 };
        } else {
          (updatedOdds as any)[market] = { home: 0, away: 0 };
        }
      }
      
      (updatedOdds as any)[market][field] = numValue;
      
      setOdds(updatedOdds);
      onOddsChange(updatedOdds);
    } catch (error) {
      console.error('Error in updateOdds:', error, { market, field, value });
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
    // Generate match scenario first
    const matchScenarios = [
      { home: 1.65, draw: 3.60, away: 5.50, type: "home_favorite" },
      { home: 2.20, draw: 3.20, away: 3.40, type: "slight_home_edge" },
      { home: 2.75, draw: 3.00, away: 2.70, type: "even_match" },
      { home: 3.80, draw: 3.30, away: 2.10, type: "away_favorite" },
      { home: 6.00, draw: 4.20, away: 1.55, type: "strong_away" }
    ];

    const scenario = matchScenarios[Math.floor(Math.random() * matchScenarios.length)];
    const variance = () => 0.85 + Math.random() * 0.3; // ±15% variation
    
    const isHighScoring = scenario.home < 2.5 || scenario.away < 2.5;
    
    const randomOdds: OddsData = {
      // Full Time Markets
      '1x2_ft': {
        home: Math.round(scenario.home * variance() * 100) / 100,
        draw: Math.round(scenario.draw * variance() * 100) / 100,
        away: Math.round(scenario.away * variance() * 100) / 100
      },
      'over_under_25': {
        over: Math.round((isHighScoring ? 1.75 : 2.10) * variance() * 100) / 100,
        under: Math.round((isHighScoring ? 2.05 : 1.75) * variance() * 100) / 100
      },
      'over_under_3': {
        over: Math.round((isHighScoring ? 2.20 : 2.60) * variance() * 100) / 100,
        under: Math.round((isHighScoring ? 1.65 : 1.50) * variance() * 100) / 100
      },
      'over_under_35': {
        over: Math.round((isHighScoring ? 2.80 : 3.40) * variance() * 100) / 100,
        under: Math.round((isHighScoring ? 1.40 : 1.30) * variance() * 100) / 100
      },
      'gg_ng': {
        gg: Math.round(1.80 * variance() * 100) / 100,
        ng: Math.round(1.95 * variance() * 100) / 100
      },
      'double_chance': {
        '1x': Math.round(1.25 * variance() * 100) / 100,
        '12': Math.round(1.15 * variance() * 100) / 100,
        '2x': Math.round(1.30 * variance() * 100) / 100
      },
      'asian_handicap_0': {
        home: Math.round((scenario.home * 0.95) * variance() * 100) / 100,
        away: Math.round((scenario.away * 0.95) * variance() * 100) / 100
      },
      'asian_handicap_minus1_plus1': {
        home: Math.round((scenario.home * 1.15) * variance() * 100) / 100,
        away: Math.round((scenario.away * 0.85) * variance() * 100) / 100
      },
      'asian_handicap_plus1_minus1': {
        home: Math.round((scenario.home * 0.85) * variance() * 100) / 100,
        away: Math.round((scenario.away * 1.15) * variance() * 100) / 100
      },
      
      // Half Time Markets
      '1x2_ht': {
        home: Math.round((scenario.home * 1.20) * variance() * 100) / 100,
        draw: Math.round(2.20 * variance() * 100) / 100,
        away: Math.round((scenario.away * 1.20) * variance() * 100) / 100
      },
      'asian_handicap_0_ht': {
        home: Math.round((scenario.home * 1.10) * variance() * 100) / 100,
        away: Math.round((scenario.away * 1.10) * variance() * 100) / 100
      },
      'over_under_15_ht': {
        over: Math.round(2.40 * variance() * 100) / 100,
        under: Math.round(1.55 * variance() * 100) / 100
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
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-card-foreground">Bookmaker Odds</h2>
        <button
          onClick={generateRealisticOdds}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
        >
          Generate Sample Odds
        </button>
      </div>

      {/* Full Time Markets */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-card-foreground">⚽ Full Time Markets</h2>
        
        {/* 1X2 Full Time */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-card-foreground">1X2 Full Time</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-card-foreground">
                1 - {homeTeamName}
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={odds['1x2_ft']?.home || ''}
                onChange={(e) => updateOdds('1x2_ft', 'home', e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                placeholder="e.g. 2.15"
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
                value={odds['1x2_ft']?.draw || ''}
                onChange={(e) => updateOdds('1x2_ft', 'draw', e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                placeholder="e.g. 3.25"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-card-foreground">
                2 - {awayTeamName}
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={odds['1x2_ft']?.away || ''}
                onChange={(e) => updateOdds('1x2_ft', 'away', e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                placeholder="e.g. 3.80"
              />
            </div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Margin: {calculateMargin([odds['1x2_ft']?.home || 0, odds['1x2_ft']?.draw || 0, odds['1x2_ft']?.away || 0])}%
          </div>
        </div>

        {/* Over/Under Goals */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-card-foreground">Over/Under Goals</h3>
          <div className="space-y-4">
            {/* Over/Under 2.5 */}
            <div>
              <h4 className="font-medium text-card-foreground mb-2">Over/Under 2.5</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-card-foreground">Over 2.5</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={odds.over_under_25?.over || ''}
                    onChange={(e) => updateOdds('over_under_25', 'over', e.target.value)}
                    className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                    placeholder="e.g. 1.85"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-card-foreground">Under 2.5</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={odds.over_under_25?.under || ''}
                    onChange={(e) => updateOdds('over_under_25', 'under', e.target.value)}
                    className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                    placeholder="e.g. 1.95"
                  />
                </div>
              </div>
            </div>

            {/* Over/Under 3.0 */}
            <div>
              <h4 className="font-medium text-card-foreground mb-2">Over/Under 3.0</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-card-foreground">Over 3.0</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={odds.over_under_3?.over || ''}
                    onChange={(e) => updateOdds('over_under_3', 'over', e.target.value)}
                    className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                    placeholder="e.g. 2.20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-card-foreground">Under 3.0</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={odds.over_under_3?.under || ''}
                    onChange={(e) => updateOdds('over_under_3', 'under', e.target.value)}
                    className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                    placeholder="e.g. 1.65"
                  />
                </div>
              </div>
            </div>

            {/* Over/Under 3.5 */}
            <div>
              <h4 className="font-medium text-card-foreground mb-2">Over/Under 3.5</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-card-foreground">Over 3.5</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={odds.over_under_35?.over || ''}
                    onChange={(e) => updateOdds('over_under_35', 'over', e.target.value)}
                    className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                    placeholder="e.g. 2.80"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-card-foreground">Under 3.5</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={odds.over_under_35?.under || ''}
                    onChange={(e) => updateOdds('over_under_35', 'under', e.target.value)}
                    className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                    placeholder="e.g. 1.40"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GG/NG */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-card-foreground">Both Teams To Score</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-card-foreground">GG (Both Score)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={odds.gg_ng?.gg || ''}
                onChange={(e) => updateOdds('gg_ng', 'gg', e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                placeholder="e.g. 1.80"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-card-foreground">NG (No Goal)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={odds.gg_ng?.ng || ''}
                onChange={(e) => updateOdds('gg_ng', 'ng', e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                placeholder="e.g. 1.95"
              />
            </div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Margin: {calculateMargin([odds.gg_ng?.gg || 0, odds.gg_ng?.ng || 0])}%
          </div>
        </div>

        {/* Double Chance */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-card-foreground">Double Chance</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-card-foreground">1X ({homeTeamName} or Draw)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={odds.double_chance?.['1x'] || ''}
                onChange={(e) => updateOdds('double_chance', '1x', e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                placeholder="e.g. 1.25"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-card-foreground">12 ({homeTeamName} or {awayTeamName})</label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={odds.double_chance?.['12'] || ''}
                onChange={(e) => updateOdds('double_chance', '12', e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                placeholder="e.g. 1.15"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-card-foreground">2X ({awayTeamName} or Draw)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={odds.double_chance?.['2x'] || ''}
                onChange={(e) => updateOdds('double_chance', '2x', e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                placeholder="e.g. 1.30"
              />
            </div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Margin: {calculateMargin([odds.double_chance?.['1x'] || 0, odds.double_chance?.['12'] || 0, odds.double_chance?.['2x'] || 0])}%
          </div>
        </div>

        {/* Asian Handicaps */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-card-foreground">Asian Handicaps</h3>
          <div className="grid grid-cols-3 gap-4">
            {/* AH +0 */}
            <div className="space-y-4">
              <h4 className="font-medium text-card-foreground">AH +0 (Draw No Bet)</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-card-foreground">{homeTeamName} +0</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={odds.asian_handicap_0?.home || ''}
                  onChange={(e) => updateOdds('asian_handicap_0', 'home', e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                  placeholder="e.g. 1.95"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-card-foreground">{awayTeamName} +0</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={odds.asian_handicap_0?.away || ''}
                  onChange={(e) => updateOdds('asian_handicap_0', 'away', e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                  placeholder="e.g. 1.85"
                />
              </div>
            </div>

            {/* AH -1/+1 */}
            <div className="space-y-4">
              <h4 className="font-medium text-card-foreground">AH -1/+1</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-card-foreground">{homeTeamName} -1</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={odds.asian_handicap_minus1_plus1?.home || ''}
                  onChange={(e) => updateOdds('asian_handicap_minus1_plus1', 'home', e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                  placeholder="e.g. 2.50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-card-foreground">{awayTeamName} +1</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={odds.asian_handicap_minus1_plus1?.away || ''}
                  onChange={(e) => updateOdds('asian_handicap_minus1_plus1', 'away', e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                  placeholder="e.g. 1.50"
                />
              </div>
            </div>

            {/* AH +1/-1 */}
            <div className="space-y-4">
              <h4 className="font-medium text-card-foreground">AH +1/-1</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-card-foreground">{homeTeamName} +1</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={odds.asian_handicap_plus1_minus1?.home || ''}
                  onChange={(e) => updateOdds('asian_handicap_plus1_minus1', 'home', e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                  placeholder="e.g. 1.50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-card-foreground">{awayTeamName} -1</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={odds.asian_handicap_plus1_minus1?.away || ''}
                  onChange={(e) => updateOdds('asian_handicap_plus1_minus1', 'away', e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                  placeholder="e.g. 2.50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Half Time Markets */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4 text-card-foreground">⏰ Half Time Markets</h2>
        
        {/* 1X2 Half Time */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-card-foreground">1X2 Half Time</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-card-foreground">
                1 - {homeTeamName}
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={odds['1x2_ht']?.home || ''}
                onChange={(e) => updateOdds('1x2_ht', 'home', e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                placeholder="e.g. 2.60"
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
                value={odds['1x2_ht']?.draw || ''}
                onChange={(e) => updateOdds('1x2_ht', 'draw', e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                placeholder="e.g. 2.20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-card-foreground">
                2 - {awayTeamName}
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={odds['1x2_ht']?.away || ''}
                onChange={(e) => updateOdds('1x2_ht', 'away', e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                placeholder="e.g. 3.20"
              />
            </div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Margin: {calculateMargin([odds['1x2_ht']?.home || 0, odds['1x2_ht']?.draw || 0, odds['1x2_ht']?.away || 0])}%
          </div>
        </div>

        {/* AH +0 Half Time */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-card-foreground">AH +0 Half Time</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-card-foreground">
                {homeTeamName} +0 HT
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={odds.asian_handicap_0_ht?.home || ''}
                onChange={(e) => updateOdds('asian_handicap_0_ht', 'home', e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                placeholder="e.g. 2.10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-card-foreground">
                {awayTeamName} +0 HT
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={odds.asian_handicap_0_ht?.away || ''}
                onChange={(e) => updateOdds('asian_handicap_0_ht', 'away', e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                placeholder="e.g. 1.75"
              />
            </div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Margin: {calculateMargin([odds.asian_handicap_0_ht?.home || 0, odds.asian_handicap_0_ht?.away || 0])}%
          </div>
        </div>

        {/* Over/Under 1.5 Half Time */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-card-foreground">Over/Under 1.5 Half Time</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-card-foreground">Over 1.5 HT</label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={odds.over_under_15_ht?.over || ''}
                onChange={(e) => updateOdds('over_under_15_ht', 'over', e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                placeholder="e.g. 2.40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-card-foreground">Under 1.5 HT</label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={odds.over_under_15_ht?.under || ''}
                onChange={(e) => updateOdds('over_under_15_ht', 'under', e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring"
                placeholder="e.g. 1.55"
              />
            </div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Margin: {calculateMargin([odds.over_under_15_ht?.over || 0, odds.over_under_15_ht?.under || 0])}%
          </div>
        </div>
      </div>

    </Card>
  );
};

export default OddsInput;