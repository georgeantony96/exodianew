import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { DEFAULT_CHAOS_CONFIG, CHAOS_PRESETS, ChaosConfig } from '@/utils/chaos-config';
import type { ChaosPresetName } from '@/utils/chaos-config';
import { DEFAULT_REVERSION_CONFIG, ReversionConfig } from '@/utils/reversion-config';

interface BoostSettings {
  home_advantage: number;
  custom_home_boost: number;
  custom_away_boost: number;
  enable_streak_analysis: boolean;
  chaos_config?: ChaosConfig;
  reversion_config?: ReversionConfig;
}

interface Team {
  id: number;
  name: string;
}

interface BoostSettingsProps {
  homeTeam: Team | null;
  awayTeam: Team | null;
  historicalMatches: any;
  boosts: any;
  onBoostsChange: (boosts: BoostSettings) => void;
}

const BoostSettings: React.FC<BoostSettingsProps> = ({
  homeTeam,
  awayTeam,
  historicalMatches,
  boosts: initialBoosts,
  onBoostsChange
}) => {
  
  const homeTeamName = homeTeam?.name || '';
  const awayTeamName = awayTeam?.name || '';
  const [settings, setSettings] = useState<BoostSettings>(() => {
    // Ensure all fields have proper default values to prevent uncontrolled->controlled warnings
    const defaultSettings = {
      home_advantage: 0.10,
      custom_home_boost: 0.0,
      custom_away_boost: 0.0,
      enable_streak_analysis: true,
      chaos_config: CHAOS_PRESETS.MODERATE,
      reversion_config: DEFAULT_REVERSION_CONFIG
    };
    
    // Merge with any provided initial boosts, ensuring all fields exist
    if (initialBoosts) {
      return {
        home_advantage: initialBoosts.home_advantage ?? defaultSettings.home_advantage,
        custom_home_boost: initialBoosts.custom_home_boost ?? defaultSettings.custom_home_boost,
        custom_away_boost: initialBoosts.custom_away_boost ?? defaultSettings.custom_away_boost,
        enable_streak_analysis: initialBoosts.enable_streak_analysis ?? defaultSettings.enable_streak_analysis,
        chaos_config: CHAOS_PRESETS.MODERATE, // Always use moderate chaos
        reversion_config: initialBoosts.reversion_config ?? defaultSettings.reversion_config
      };
    }
    
    return defaultSettings;
  });

  const [streakInfo, setStreakInfo] = useState({
    home_streak: { type: 'none', length: 0, boost: 0, draws: 0, detail: '' },
    away_streak: { type: 'none', length: 0, boost: 0, draws: 0, detail: '' }
  });

  // Call onBoostsChange when settings change (but not on initial mount)
  const [hasInitializedSettings, setHasInitializedSettings] = React.useState(false);
  
  React.useEffect(() => {
    if (hasInitializedSettings) {
      onBoostsChange(settings);
    }
  }, [settings, onBoostsChange, hasInitializedSettings]);

  React.useEffect(() => {
    // Mark as initialized after first render
    setHasInitializedSettings(true);
  }, []);

  useEffect(() => {
    if (historicalMatches && settings.enable_streak_analysis) {
      analyzeStreaks();
    }
  }, [historicalMatches, settings.enable_streak_analysis]);

  const analyzeStreaks = () => {
    if (!historicalMatches) return;

    const homeRecentMatches = historicalMatches.home_home || [];
    const awayRecentMatches = historicalMatches.away_away || [];

    const homeStreak = calculateStreak(homeRecentMatches, true);
    const awayStreak = calculateStreak(awayRecentMatches, false);

    setStreakInfo({
      home_streak: homeStreak,
      away_streak: awayStreak
    });
  };

  // 🧮 EXPONENTIAL BOOST CALCULATOR - Stronger regression for longer streaks
  const calculateExponentialBoost = (baseBoost: number, games: number, isPositive: boolean = false): number => {
    if (games < 5) return 0; // No boost for short streaks
    
    let boost = baseBoost; // Base boost at 5 games
    
    // Exponential scaling for 6+ games: 20% increase per additional game
    if (games > 5) {
      const multiplier = Math.pow(1.2, games - 5);
      boost = baseBoost * multiplier;
    }
    
    // FIXED: Remove boost cap that was causing under bias for high-scoring teams
    // Let extreme teams have extreme boosts - that's the whole point!
    const cappedBoost = boost; // No more artificial 0.4 cap!
    
    return isPositive ? cappedBoost : -cappedBoost;
  };

  const calculateStreak = (matches: any[], isHomeTeam: boolean) => {
    let streak = { type: 'none', length: 0, boost: 0, draws: 0, detail: '' };
    
    if (!matches || matches.length < 3) return streak;

    let winStreak = 0;        // Pure wins only
    let unbeatenStreak = 0;   // Wins + draws
    let losingStreak = 0;     // Pure losses
    let winlessStreak = 0;    // Losses + draws
    
    // Track draws consistently for both unbeaten and winless streaks
    let drawsInUnbeatenStreak = 0;  // Total draws in unbeaten streak
    let drawsInWinlessStreak = 0;   // Total draws in winless streak

    // 🔄 CRITICAL FIX: Process matches from most recent to oldest to detect current streaks
    // REVERSE the array to process most recent matches first
    const reversedMatches = [...matches].reverse(); // Process from newest to oldest
    
    // Track detailed composition for accurate display
    let totalLossesInStreak = 0;
    
    for (const match of reversedMatches) {
      const homeScore = match.home_score_ft;
      const awayScore = match.away_score_ft;
      
      const won = isHomeTeam ? homeScore > awayScore : awayScore > homeScore;
      const drew = homeScore === awayScore;
      const lost = isHomeTeam ? homeScore < awayScore : awayScore < homeScore;

      if (won) {
        winStreak++;
        unbeatenStreak++;
        losingStreak = 0;
        winlessStreak = 0;
        drawsInWinlessStreak = 0;
        totalLossesInStreak = 0;
        // Don't reset drawsInUnbeatenStreak - keep counting total draws in unbeaten run
      } else if (drew) {
        winStreak = 0; // Reset pure win streak
        unbeatenStreak++;
        winlessStreak++;
        drawsInUnbeatenStreak++; // Count draws in unbeaten streak
        drawsInWinlessStreak++;  // Count draws in winless streak
        losingStreak = 0;
      } else if (lost) {
        winStreak = 0;
        unbeatenStreak = 0;
        drawsInUnbeatenStreak = 0; // Reset unbeaten streak counters
        losingStreak++;
        winlessStreak++;
        // Don't increment drawsInWinlessStreak here - losses are not draws
        totalLossesInStreak++;
      } else {
        break;
      }
    }

    // 🏆 PURE WIN STREAK (5+ wins, 0 draws) - Exponential regression penalty
    if (winStreak >= 5 && drawsInUnbeatenStreak === 0) {
      streak = {
        type: 'winning',
        length: winStreak,
        boost: calculateExponentialBoost(0.120, winStreak, false), // Exponential penalty for pure dominance
        draws: 0,
        detail: `${winStreak}W-0D (pure wins)`
      };
    }
    // 🔥 MIXED UNBEATEN STREAK (5+ unbeaten with draws) - Exponential light penalty  
    else if (unbeatenStreak >= 5 && drawsInUnbeatenStreak > 0) {
      const wins = unbeatenStreak - drawsInUnbeatenStreak;
      streak = {
        type: 'unbeaten',
        length: unbeatenStreak,
        boost: calculateExponentialBoost(0.060, unbeatenStreak, false), // Exponential light penalty for mixed
        draws: drawsInUnbeatenStreak,
        detail: `${wins}W-${drawsInUnbeatenStreak}D (mixed unbeaten)`
      };
    }
    // 📉 PURE LOSING STREAK (5+ losses, 0 draws) - Exponential boost for regression  
    else if (losingStreak >= 5) {
      const drawsInWinless = winlessStreak - losingStreak;
      if (drawsInWinless === 0) {
        streak = {
          type: 'losing',
          length: losingStreak,
          boost: calculateExponentialBoost(0.120, losingStreak, true), // Exponential boost for pure underperformance
          draws: 0,
          detail: `${losingStreak}L-0D (pure losses)`
        };
      }
    }
    // ⚫ MIXED WINLESS STREAK (5+ winless with draws) - Exponential light boost
    else if (winlessStreak >= 5 && drawsInWinlessStreak > 0) {
      streak = {
        type: 'winless',
        length: winlessStreak,
        boost: calculateExponentialBoost(0.060, winlessStreak, true), // Exponential light boost for mixed underperformance
        draws: drawsInWinlessStreak,
        detail: `${totalLossesInStreak}L-${drawsInWinlessStreak}D (mixed winless)`
      };
    }

    return streak;
  };

  const updateSetting = (key: keyof BoostSettings, value: number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getStreakColor = (streakType: string) => {
    switch (streakType) {
      case 'winning': return 'text-amber-600';  // Pure wins - amber for heavy penalty
      case 'unbeaten': return 'text-green-600'; // Mixed unbeaten - green for light penalty  
      case 'winless': return 'text-orange-600'; // Mixed winless - orange for light boost
      case 'losing': return 'text-red-600';     // Pure losses - red for heavy boost
      default: return 'text-muted-foreground';
    }
  };

  const getStreakIcon = (streakType: string) => {
    switch (streakType) {
      case 'winning': return '🏆';  // Crown for pure dominance
      case 'unbeaten': return '🔥'; // Fire for mixed unbeaten
      case 'winless': return '⚫';   // Black circle for mixed underperformance
      case 'losing': return '📉';   // Chart down for pure losses  
      default: return '➖';
    }
  };

  return (
    <Card variant="pattern-discovery" padding="lg">
      <h2 className="text-xl font-bold mb-4 text-card-foreground">Boost Settings & Adjustments</h2>
      
      {/* Basic Boosts */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Manual Adjustments</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Home Advantage Boost
              <span className="text-xs text-muted-foreground ml-1">(default: 0.10)</span>
            </label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="0.5"
              value={settings.home_advantage ?? 0.10}
              onChange={(e) => updateSetting('home_advantage', parseFloat(e.target.value) || 0)}
              className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Additional {homeTeamName} Boost
            </label>
            <input
              type="number"
              step="0.05"
              min="-0.3"
              max="0.3"
              value={settings.custom_home_boost ?? 0}
              onChange={(e) => updateSetting('custom_home_boost', parseFloat(e.target.value) || 0)}
              className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Additional {awayTeamName} Boost
            </label>
            <input
              type="number"
              step="0.05"
              min="-0.3"
              max="0.3"
              value={settings.custom_away_boost ?? 0}
              onChange={(e) => updateSetting('custom_away_boost', parseFloat(e.target.value) || 0)}
              className="w-full p-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Automatic Analysis Options */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Automatic Analysis</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={Boolean(settings.enable_streak_analysis)}
              onChange={(e) => updateSetting('enable_streak_analysis', e.target.checked)}
              className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-card-foreground">
              Enable Streak Analysis (5+ game streaks - penalties for winning, boosts for losing)
            </span>
          </label>
          
        </div>
      </div>

      {/* Streak Analysis Results */}
      {settings.enable_streak_analysis && (homeTeamName && awayTeamName) && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Detected Streaks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-border rounded-lg bg-muted">
              <h4 className="font-medium mb-2">{homeTeamName} (Home Form)</h4>
              <div className={`flex items-center gap-2 ${getStreakColor(streakInfo.home_streak.type)}`}>
                <span className="text-lg">{getStreakIcon(streakInfo.home_streak.type)}</span>
                <div>
                  {streakInfo.home_streak.type === 'none' ? (
                    <span>No significant streak detected</span>
                  ) : (
                    <div>
                      <div className="capitalize font-semibold">
                        {streakInfo.home_streak.type} streak: {streakInfo.home_streak.length} games
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {streakInfo.home_streak.detail}
                      </div>
                      <div className="text-sm">
                        Auto {streakInfo.home_streak.boost >= 0 ? 'boost' : 'penalty'}: {streakInfo.home_streak.boost >= 0 ? '+' : ''}{streakInfo.home_streak.boost.toFixed(3)} goals
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border border-border rounded-lg bg-muted">
              <h4 className="font-medium mb-2">{awayTeamName} (Away Form)</h4>
              <div className={`flex items-center gap-2 ${getStreakColor(streakInfo.away_streak.type)}`}>
                <span className="text-lg">{getStreakIcon(streakInfo.away_streak.type)}</span>
                <div>
                  {streakInfo.away_streak.type === 'none' ? (
                    <span>No significant streak detected</span>
                  ) : (
                    <div>
                      <div className="capitalize font-semibold">
                        {streakInfo.away_streak.type} streak: {streakInfo.away_streak.length} games
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {streakInfo.away_streak.detail}
                      </div>
                      <div className="text-sm">
                        Auto {streakInfo.away_streak.boost >= 0 ? 'boost' : 'penalty'}: {streakInfo.away_streak.boost >= 0 ? '+' : ''}{streakInfo.away_streak.boost.toFixed(3)} goals
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mathematical Chaos Engine Controls */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-card-foreground">
          🧮 Mathematical Unpredictability Engine
          <span className="text-xs text-muted-foreground ml-2">(Levy Flights, Fractal Variance, Stochastic Shocks)</span>
        </h3>
        
        <div className="space-y-4">
          {/* Chaos Enable/Disable */}
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={Boolean(settings.chaos_config?.enabled)}
              onChange={(e) => {
                const newConfig = { ...settings.chaos_config!, enabled: e.target.checked };
                setSettings(prev => ({ ...prev, chaos_config: newConfig }));
              }}
              className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-card-foreground">
              Enable Mathematical Chaos (captures football's inherent unpredictability)
            </span>
          </label>

          {settings.chaos_config?.enabled && (
            <>
              {/* Simplified Chaos Display */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>🎯 Moderate Chaos Configuration Active</strong>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mean Reversion Detection System */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-card-foreground">
          🔄 Mean Reversion Detection System
          <span className="text-xs text-muted-foreground ml-2">(Pattern Breaking Prediction)</span>
        </h3>
        
        <div className="space-y-4">
          {/* Global Reversion Enable/Disable */}
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={Boolean(settings.reversion_config?.globalEnabled)}
              onChange={(e) => {
                const newConfig = { ...settings.reversion_config!, globalEnabled: e.target.checked };
                setSettings(prev => ({ ...prev, reversion_config: newConfig }));
              }}
              className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-card-foreground">
              Enable Mean Reversion Analysis (counter market overconfidence in streaks)
            </span>
          </label>

          {settings.reversion_config?.globalEnabled && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-sm text-green-800 dark:text-green-200">
                <strong>🔄 Mean Reversion System Active</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
        <h4 className="font-medium text-primary mb-2">📊 Total Expected Boosts</h4>
        <div className="text-sm text-card-foreground space-y-1">
          <div>
            <strong>{homeTeamName}:</strong> +
            {(
              settings.home_advantage + 
              settings.custom_home_boost + 
              (settings.enable_streak_analysis ? streakInfo.home_streak.boost : 0)
            ).toFixed(2)} goals
          </div>
          <div>
            <strong>{awayTeamName}:</strong> +
            {(
              settings.custom_away_boost + 
              (settings.enable_streak_analysis ? streakInfo.away_streak.boost : 0)
            ).toFixed(2)} goals
          </div>
        </div>
        
      </div>
    </Card>
  );
};

export default BoostSettings;