/**
 * Pure TypeScript/Node.js Monte Carlo Simulation Engine
 * Eliminates Python dependency and Windows permission issues
 * Enhanced with Mathematical Chaos Engine for unpredictability
 */

import { ChaosEngine, CHAOS_PRESETS } from './chaos-engine';
import { DEFAULT_CHAOS_CONFIG, ChaosConfig, ChaosConfigValidator } from './chaos-config';
import { ReversionAnalyzer } from './reversion-analyzer';
import { DEFAULT_REVERSION_CONFIG, ReversionConfig, ReversionAnalysisResult } from './reversion-config';
import { adaptiveThresholdEngine } from './adaptive-threshold-engine';
import { DEFAULT_EMPIRICAL_BOOST_CONFIG, EmpiricalStreakResult } from './empirical-boost-config';
import { calculatePatternBasedStreakBoosts } from './pattern-integrated-engine';
import { comprehensiveMarketCalculator } from './comprehensive-market-calculator';

interface MatchResult {
  homeGoals: number;
  awayGoals: number;
}

// Comprehensive market interface for professional betting analysis
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

interface SimulationResults {
  probabilities: {
    match_outcomes: {
      home_win: number;
      draw: number;
      away_win: number;
    };
    goal_markets: {
      over_1_5: number;
      under_1_5: number;
      over_2_5: number;
      under_2_5: number;
      over_3_0: number;
      under_3_0: number;
      push_3_0: number;
      over_3_5: number;
      under_3_5: number;
      over_4_5: number;
      under_4_5: number;
    };
    btts: {
      yes: number;
      no: number;
    };
  };
  true_odds: any;
  avg_home_goals: number;
  avg_away_goals: number;
  avg_total_goals: number;
  value_bets: any;
  comprehensive_markets?: ComprehensiveMarketResults; // NEW: All betting markets calculated automatically
  simulation_id?: number;
  rps_score?: number;
  confidence_score?: number;
  iterations?: number;
  engine_version?: string;
  reversion_analysis?: ReversionAnalysisResult;
}

class MonteCarloEngine {
  // Check for unbeaten streak (wins + draws) in recent matches
  private checkUnbeatenStreak(matches: any[], isHomeTeam: boolean): number {
    let streak = 0;
    console.log(`[DEBUG] 🔍 STREAK ANALYSIS: Checking unbeaten streak for ${isHomeTeam ? 'HOME' : 'AWAY'} team`);
    console.log(`[DEBUG] 📊 Raw matches data:`, matches);
    console.log(`[DEBUG] 📊 Filtered matches count: ${matches.length}`);
    
    if (matches.length === 0) {
      console.log(`[DEBUG] ❌ NO MATCHES FOUND - Cannot analyze streak`);
      return 0;
    }
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const homeScore = match.home_score_ft || 0;
      const awayScore = match.away_score_ft || 0;
      
      console.log(`[DEBUG] 📋 Match ${i+1}: Score ${homeScore}-${awayScore} | Home: "${match.home_team}" vs Away: "${match.away_team}"`);
      
      if (isHomeTeam) {
        const result = homeScore > awayScore ? 'WIN' : homeScore === awayScore ? 'DRAW' : 'LOSS';
        if (homeScore >= awayScore) { // Win or draw for home team
          streak++;
          console.log(`[DEBUG] ✅ Match ${i+1}: Home ${result} (${homeScore}-${awayScore}), streak now: ${streak}`);
        } else {
          console.log(`[DEBUG] ❌ Match ${i+1}: Home LOST (${homeScore}-${awayScore}), streak BROKEN at: ${streak}`);
          break;
        }
      } else {
        const result = awayScore > homeScore ? 'WIN' : awayScore === homeScore ? 'DRAW' : 'LOSS';
        if (awayScore >= homeScore) { // Win or draw for away team
          streak++;
          console.log(`[DEBUG] ✅ Match ${i+1}: Away ${result} (${homeScore}-${awayScore}), streak now: ${streak}`);
        } else {
          console.log(`[DEBUG] ❌ Match ${i+1}: Away LOST (${homeScore}-${awayScore}), streak BROKEN at: ${streak}`);
          break;
        }
      }
    }
    
    console.log(`[DEBUG] 🎯 FINAL UNBEATEN STREAK: ${streak} games`);
    if (streak >= 5) {
      console.log(`[DEBUG] 🚨 STREAK ALERT: ${streak}-game unbeaten streak detected! Should apply penalty.`);
    }
    return streak;
  }

  // Check for losing streak in recent matches (FIXED: Enhanced debugging)
  private checkLosingStreak(matches: any[], isHomeTeam: boolean): number {
    let streak = 0;
    console.log(`[DEBUG] 💀 LOSING STREAK ANALYSIS: Checking for ${isHomeTeam ? 'HOME' : 'AWAY'} team losing streak`);
    console.log(`[DEBUG] 💀 Input matches:`, matches);
    
    if (matches.length === 0) {
      console.log(`[DEBUG] ❌ NO MATCHES FOUND for losing streak analysis`);
      return 0;
    }
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const homeScore = match.home_score_ft || 0;
      const awayScore = match.away_score_ft || 0;
      
      console.log(`[DEBUG] 💀 Match ${i+1}: ${homeScore}-${awayScore} | "${match.home_team}" vs "${match.away_team}"`);
      
      if (isHomeTeam) {
        if (homeScore < awayScore) { // Loss for home team
          streak++;
          console.log(`[DEBUG] ✅ Match ${i+1}: HOME LOST (${homeScore}-${awayScore}), losing streak now: ${streak}`);
        } else {
          const result = homeScore > awayScore ? 'WON' : 'DREW';
          console.log(`[DEBUG] ❌ Match ${i+1}: HOME ${result} (${homeScore}-${awayScore}), losing streak BROKEN at: ${streak}`);
          break;
        }
      } else {
        if (awayScore < homeScore) { // Loss for away team
          streak++;
          console.log(`[DEBUG] ✅ Match ${i+1}: AWAY LOST (${homeScore}-${awayScore}), losing streak now: ${streak}`);
        } else {
          const result = awayScore > homeScore ? 'WON' : 'DREW';
          console.log(`[DEBUG] ❌ Match ${i+1}: AWAY ${result} (${homeScore}-${awayScore}), losing streak BROKEN at: ${streak}`);
          break;
        }
      }
    }
    
    console.log(`[DEBUG] 🎯 FINAL LOSING STREAK: ${streak} games`);
    if (streak >= 5) {
      const expectedBoost = streak * 0.024; // REMOVED 0.12 cap for debug logging consistency
      console.log(`[DEBUG] 🚨 LOSING STREAK DETECTED: ${streak} games = +${expectedBoost.toFixed(3)} boost expected (NO CAP)`);
    }
    return streak;
  }

  // 🧬 REVOLUTIONARY: Quick pattern assessment (synchronous for compatibility)
  private calculateQuickPatternAdjustments(historicalData: any): {
    confidence: number;
    homeAdjustment: number;
    awayAdjustment: number;
    patternReasoning: string;
  } {
    try {
      const h2h = historicalData.h2h || [];
      const homeHome = historicalData.home_home || [];
      const awayAway = historicalData.away_away || [];
      
      // Quick pattern recognition without full database lookup
      let confidence = 0;
      let homeAdjustment = 0;
      let awayAdjustment = 0;
      let reasoning = "";
      
      // PATTERN 1: H2H Goal Patterns
      if (h2h.length >= 4) {
        const h2hGoals = h2h.slice(0, 4).map(match => 
          (match.home_score_ft || 0) + (match.away_score_ft || 0)
        );
        const avgH2HGoals = h2hGoals.reduce((sum, goals) => sum + goals, 0) / h2hGoals.length;
        const baseline = 2.5;
        
        if (Math.abs(avgH2HGoals - baseline) > 0.5) {
          const goalAdjustment = (avgH2HGoals - baseline) * 0.3;
          homeAdjustment += goalAdjustment * 0.6;
          awayAdjustment += goalAdjustment * 0.4;
          confidence += 0.25;
          reasoning += `H2H avg: ${avgH2HGoals.toFixed(1)} goals vs ${baseline} baseline. `;
        }
      }
      
      // PATTERN 2: Home Team Form Pattern
      if (homeHome.length >= 5) {
        const homeGoalsFor = homeHome.slice(0, 5).map(match => match.home_score_ft || 0);
        const homeGoalsAgainst = homeHome.slice(0, 5).map(match => match.away_score_ft || 0);
        const homeAvgFor = homeGoalsFor.reduce((sum, goals) => sum + goals, 0) / homeGoalsFor.length;
        const homeAvgAgainst = homeGoalsAgainst.reduce((sum, goals) => sum + goals, 0) / homeGoalsAgainst.length;
        
        if (homeAvgFor > 2.2 || homeAvgAgainst < 0.8) {
          homeAdjustment += 0.15;
          confidence += 0.2;
          reasoning += `Home form: ${homeAvgFor.toFixed(1)} for, ${homeAvgAgainst.toFixed(1)} against. `;
        }
      }
      
      // PATTERN 3: Away Team Form Pattern
      if (awayAway.length >= 5) {
        const awayGoalsFor = awayAway.slice(0, 5).map(match => match.away_score_ft || 0);
        const awayGoalsAgainst = awayAway.slice(0, 5).map(match => match.home_score_ft || 0);
        const awayAvgFor = awayGoalsFor.reduce((sum, goals) => sum + goals, 0) / awayGoalsFor.length;
        const awayAvgAgainst = awayGoalsAgainst.reduce((sum, goals) => sum + goals, 0) / awayGoalsAgainst.length;
        
        if (awayAvgFor > 2.0 || awayAvgAgainst < 1.0) {
          awayAdjustment += 0.12;
          confidence += 0.2;
          reasoning += `Away form: ${awayAvgFor.toFixed(1)} for, ${awayAvgAgainst.toFixed(1)} against. `;
        }
      }
      
      // PATTERN 4: Recent Momentum (last 3 games)
      if (homeHome.length >= 3) {
        const recentHomeResults = homeHome.slice(0, 3).map(match => {
          const homeGoals = match.home_score_ft || 0;
          const awayGoals = match.away_score_ft || 0;
          return homeGoals > awayGoals ? 'W' : homeGoals < awayGoals ? 'L' : 'D';
        });
        
        const winStreak = recentHomeResults.every(result => result === 'W' || result === 'D');
        const lossStreak = recentHomeResults.every(result => result === 'L');
        
        if (winStreak && recentHomeResults.filter(r => r === 'W').length >= 2) {
          homeAdjustment += 0.08;
          confidence += 0.15;
          reasoning += `Home momentum: recent wins. `;
        } else if (lossStreak) {
          homeAdjustment -= 0.05;
          confidence += 0.1;
          reasoning += `Home struggling: recent losses. `;
        }
      }
      
      // Apply dampening to prevent extreme adjustments
      homeAdjustment = Math.max(-0.4, Math.min(0.4, homeAdjustment));
      awayAdjustment = Math.max(-0.4, Math.min(0.4, awayAdjustment));
      
      return {
        confidence: Math.min(0.95, confidence),
        homeAdjustment,
        awayAdjustment,
        patternReasoning: reasoning.trim() || "Pattern analysis complete"
      };
      
    } catch (error) {
      console.error(`[QUICK-PATTERN] Error in pattern assessment:`, error);
      return {
        confidence: 0,
        homeAdjustment: 0,
        awayAdjustment: 0,
        patternReasoning: "Pattern assessment failed"
      };
    }
  }

  // 🧬 REVOLUTIONARY: Generate pattern-specific reversion configuration with ADAPTIVE LEARNING
  private generatePatternSpecificReversionConfig(data: any): ReversionConfig {
    // Start with user's config from boost settings, fallback to default
    let config = data.boost_settings?.reversion_config ? 
      { ...data.boost_settings.reversion_config } : 
      { ...DEFAULT_REVERSION_CONFIG };

    // 🧠 ADAPTIVE THRESHOLD INTEGRATION: Replace fixed penalties with learned ones
    console.log('[ADAPTIVE-LEARNING] 🧠 Integrating AdaptiveThresholdEngine with Monte Carlo...');
    
    try {
      // Map reversion config penalty names to adaptive pattern types
      const homeOverDominanceConfidence = 0.75; // Typical confidence for form patterns
      const awayOverDominanceConfidence = 0.75;
      const h2hOverPatternConfidence = 0.80; // H2H patterns typically have higher confidence
      const h2hUnderPatternConfidence = 0.80;
      
      // Get learned penalties from AdaptiveThresholdEngine
      const homeOverDominancePenalty = adaptiveThresholdEngine.getLearnedPenalty('home_over_dominance', homeOverDominanceConfidence);
      const awayOverDominancePenalty = adaptiveThresholdEngine.getLearnedPenalty('away_over_dominance', awayOverDominanceConfidence);
      const h2hOverPatternPenalty = adaptiveThresholdEngine.getLearnedPenalty('h2h_over_pattern', h2hOverPatternConfidence);
      const h2hUnderPatternBoost = adaptiveThresholdEngine.getLearnedPenalty('h2h_under_pattern', h2hUnderPatternConfidence);

      // Apply learned penalties if available (non-zero means learning has occurred)
      if (homeOverDominancePenalty !== 0) {
        config.homeForm.goalPenalty = homeOverDominancePenalty;
        console.log(`[ADAPTIVE-LEARNING] ✅ Home over dominance: ${config.homeForm.goalPenalty.toFixed(3)} (learned vs ${DEFAULT_REVERSION_CONFIG.homeForm.goalPenalty} default)`);
      }
      
      if (awayOverDominancePenalty !== 0) {
        config.awayForm.goalPenalty = awayOverDominancePenalty;
        console.log(`[ADAPTIVE-LEARNING] ✅ Away over dominance: ${config.awayForm.goalPenalty.toFixed(3)} (learned vs ${DEFAULT_REVERSION_CONFIG.awayForm.goalPenalty} default)`);
      }
      
      if (h2hOverPatternPenalty !== 0) {
        config.h2hOvers.goalPenalty = h2hOverPatternPenalty;
        console.log(`[ADAPTIVE-LEARNING] ✅ H2H over pattern: ${config.h2hOvers.goalPenalty.toFixed(3)} (learned vs ${DEFAULT_REVERSION_CONFIG.h2hOvers.goalPenalty} default)`);
      }
      
      if (h2hUnderPatternBoost !== 0) {
        config.h2hOvers.goalBoost = Math.abs(h2hUnderPatternBoost); // Ensure positive for boost
        console.log(`[ADAPTIVE-LEARNING] ✅ H2H under pattern boost: ${config.h2hOvers.goalBoost.toFixed(3)} (learned vs ${DEFAULT_REVERSION_CONFIG.h2hOvers.goalBoost} default)`);
      }

      // Get learning statistics for monitoring
      const learningStats = adaptiveThresholdEngine.getLearningStats();
      console.log(`[ADAPTIVE-LEARNING] 📊 Learning Status: ${learningStats.learning_patterns}/${learningStats.total_patterns} patterns learning, ${learningStats.total_adjustments} total adjustments`);
      console.log(`[ADAPTIVE-LEARNING] 🏆 Best: ${learningStats.best_performer}, Worst: ${learningStats.worst_performer}`);
      
    } catch (error) {
      console.error('[ADAPTIVE-LEARNING] ❌ Error integrating adaptive thresholds:', error.message);
      console.log('[ADAPTIVE-LEARNING] ⚠️ Falling back to default penalties');
    }

    // If we have pattern analysis data AND reversion is enabled, use it to personalize thresholds
    if (config.globalEnabled && data.pattern_analysis && data.pattern_analysis.patternInsights) {
      console.log('[PATTERN-REVERSION] 🎯 Using pattern analysis for personalized reversion thresholds');
      
      const insights = data.pattern_analysis.patternInsights;
      const confidence = data.pattern_analysis.patternConfidence || 0.5;
      
      // Adjust thresholds based on pattern confidence and data quality
      const confidenceMultiplier = Math.max(0.5, Math.min(1.5, confidence * 2));
      const dataQuality = insights.dataQuality || {};
      
      // SMART THRESHOLD CALCULATION: Based on sample size percentage, not fixed numbers
      const h2hCount = dataQuality.h2hMatches || 0;
      const homeCount = dataQuality.homeMatches || 0;
      const awayCount = dataQuality.awayMatches || 0;
      
      // Calculate thresholds as percentage of available data (35-40% for sensitivity)
      if (h2hCount >= 4) {
        const baseThreshold = Math.max(3, Math.ceil(h2hCount * 0.35)); // 35% of H2H games
        config.h2hOvers.overStreakThreshold = Math.max(3, Math.round(baseThreshold / confidenceMultiplier));
        config.h2hOvers.underStreakThreshold = Math.max(3, Math.round(baseThreshold / confidenceMultiplier));
        config.h2hWins.winStreakThreshold = Math.max(3, Math.round(baseThreshold / confidenceMultiplier));
      }
      
      if (homeCount >= 6) {
        const baseThreshold = Math.max(3, Math.ceil(homeCount * 0.40)); // 40% of home games
        config.homeForm.overStreakThreshold = Math.max(3, Math.round(baseThreshold / confidenceMultiplier));
        config.homeForm.underStreakThreshold = Math.max(3, Math.round(baseThreshold / confidenceMultiplier));
      }
      
      if (awayCount >= 6) {
        const baseThreshold = Math.max(3, Math.ceil(awayCount * 0.37)); // 37% of away games (slightly more sensitive)
        config.awayForm.overStreakThreshold = Math.max(3, Math.round(baseThreshold / confidenceMultiplier));
        config.awayForm.underStreakThreshold = Math.max(3, Math.round(baseThreshold / confidenceMultiplier));
      }

      // Adjust penalty/boost strengths based on pattern confidence
      const strengthMultiplier = Math.max(0.7, Math.min(1.3, confidence * 1.5));
      
      config.homeForm.goalPenalty *= strengthMultiplier;
      config.homeForm.goalBoost *= strengthMultiplier;
      config.awayForm.goalPenalty *= strengthMultiplier;  
      config.awayForm.goalBoost *= strengthMultiplier;
      config.h2hOvers.goalPenalty *= strengthMultiplier;
      config.h2hOvers.goalBoost *= strengthMultiplier;
      
      // 🔥 EXTREME PATTERN ESCALATION: Add escalation for extreme percentages
      config.extremePatternEscalation = {
        enabled: true,
        percentageThresholds: {
          extreme: 0.80, // 80%+ of games = extreme pattern
          massive: 0.90, // 90%+ of games = massive pattern  
          perfect: 0.95  // 95%+ of games = perfect pattern
        },
        escalationMultipliers: {
          extreme: 1.5,  // 1.5x penalty/boost
          massive: 2.0,  // 2.0x penalty/boost
          perfect: 2.5   // 2.5x penalty/boost
        },
        maxEscalation: 3.0 // Maximum escalation multiplier
      };
      
      console.log('[PATTERN-REVERSION] 📊 Personalized thresholds:', {
        h2hOverThreshold: config.h2hOvers.overStreakThreshold,
        homeOverThreshold: config.homeForm.overStreakThreshold,
        awayOverThreshold: config.awayForm.overStreakThreshold,
        confidenceMultiplier,
        strengthMultiplier
      });
      
    } else if (!config.globalEnabled) {
      console.log('[PATTERN-REVERSION] ❌ Mean Reversion DISABLED by user setting');
    } else {
      console.log('[PATTERN-REVERSION] ⚠️ No pattern analysis available, using default generic thresholds');
    }
    
    return config;
  }

  // 🧬 REVOLUTIONARY: Generate pattern-specific empirical streak config instead of generic defaults
  private generatePatternSpecificEmpiricalConfig(historicalData: any): any {
    // Start with default config as baseline
    let config = { ...DEFAULT_EMPIRICAL_BOOST_CONFIG };

    // Get sample sizes for intelligent threshold calculation
    const homeCount = (historicalData.home_home || []).length;
    const awayCount = (historicalData.away_away || []).length;
    
    console.log('[PATTERN-EMPIRICAL] 🎯 Generating pattern-specific streak thresholds');
    console.log('[PATTERN-EMPIRICAL] 📊 Data: Home=' + homeCount + ', Away=' + awayCount);

    // SMART THRESHOLDS: Based on data size, not fixed values
    if (homeCount >= 6) {
      // For 9 games: 35% = 3.15 → 3+ streak threshold
      // For 12 games: 35% = 4.2 → 4+ streak threshold
      const pureWinThreshold = Math.max(3, Math.ceil(homeCount * 0.33)); // 33% for rare pure wins
      const unbeatenThreshold = Math.max(3, Math.ceil(homeCount * 0.40)); // 40% for common unbeaten
      const lossThreshold = Math.max(2, Math.ceil(homeCount * 0.25)); // 25% for loss rebounds
      
      config.homeStreaks.pureWinStreak.threshold = pureWinThreshold;
      config.homeStreaks.unbeatenStreak.threshold = unbeatenThreshold;
      config.homeStreaks.pureLossStreak.threshold = lossThreshold;
      config.homeStreaks.winlessStreak.threshold = Math.max(3, Math.ceil(homeCount * 0.35));
      
      console.log('[PATTERN-EMPIRICAL] 🏠 HOME thresholds: PureWin=' + pureWinThreshold + 
                  ', Unbeaten=' + unbeatenThreshold + ', Loss=' + lossThreshold);
    }
    
    if (awayCount >= 6) {
      const pureWinThreshold = Math.max(2, Math.ceil(awayCount * 0.30)); // Away more sensitive (30%)
      const unbeatenThreshold = Math.max(3, Math.ceil(awayCount * 0.37)); // 37% for away unbeaten
      const lossThreshold = Math.max(2, Math.ceil(awayCount * 0.25)); // Same loss threshold
      
      config.awayStreaks.pureWinStreak.threshold = pureWinThreshold;
      config.awayStreaks.unbeatenStreak.threshold = unbeatenThreshold;
      config.awayStreaks.pureLossStreak.threshold = lossThreshold;
      config.awayStreaks.winlessStreak.threshold = Math.max(2, Math.ceil(awayCount * 0.33));
      
      console.log('[PATTERN-EMPIRICAL] ✈️ AWAY thresholds: PureWin=' + pureWinThreshold + 
                  ', Unbeaten=' + unbeatenThreshold + ', Loss=' + lossThreshold);
    }
    
    return config;
  }

  // 🧬 REVOLUTIONARY: Pattern-based adjustments with empirical fallback (synchronous)
  private calculateStreakBoosts(historicalData: any): { homeStreakBoost: number; awayStreakBoost: number } {
    console.log(`[REVOLUTIONARY] 🧬 PATTERN-BASED SYSTEM INTEGRATION ACTIVE!`);
    console.log(`[REVOLUTIONARY] 🔄 Attempting intelligent pattern matching for personalized adjustments`);
    
    try {
      // Quick pattern-based assessment (synchronous version)
      const quickPatternResult = this.calculateQuickPatternAdjustments(historicalData);
      
      if (quickPatternResult.confidence > 0.7) {
        console.log(`[REVOLUTIONARY] ✅ High confidence pattern match found!`);
        console.log(`[REVOLUTIONARY] 🎯 Pattern confidence: ${(quickPatternResult.confidence * 100).toFixed(1)}%`);
        console.log(`[REVOLUTIONARY] 🎯 Unique adjustments: Home=${quickPatternResult.homeAdjustment>=0?'+':''}${quickPatternResult.homeAdjustment.toFixed(3)}, Away=${quickPatternResult.awayAdjustment>=0?'+':''}${quickPatternResult.awayAdjustment.toFixed(3)}`);
        
        return {
          homeStreakBoost: quickPatternResult.homeAdjustment,
          awayStreakBoost: quickPatternResult.awayAdjustment
        };
      } else {
        console.log(`[REVOLUTIONARY] ⚠️ Pattern confidence too low (${(quickPatternResult.confidence * 100).toFixed(1)}%) - using empirical fallback`);
      }
      
    } catch (error) {
      console.error(`[REVOLUTIONARY] ❌ Pattern system error, falling back to empirical:`, error);
    }
    
    // Fallback to enhanced empirical system
    console.log(`[FALLBACK-ENHANCED] 🔄 Using enhanced empirical system with pattern insights`);
    console.log(`[FALLBACK-ORIGINAL] 🧬 Starting empirical streak analysis...`);
    
    // Filter out empty/invalid matches (both scores 0 and no team names)
    const homeRecentRaw = (historicalData.home_home || []).slice(0, 8);
    const awayRecentRaw = (historicalData.away_away || []).slice(0, 8);
    
    // FIXED: Only filter out truly empty placeholder matches, preserve 0-0 and all losses
    const homeRecent = homeRecentRaw.filter(match => 
      match.home_team && match.away_team && 
      match.home_team.trim() !== '' && match.away_team.trim() !== '' &&
      match.home_team !== match.away_team
    );
    
    const awayRecent = awayRecentRaw.filter(match => 
      match.home_team && match.away_team && 
      match.home_team.trim() !== '' && match.away_team.trim() !== '' &&
      match.home_team !== match.away_team
    );
    
    // 🧬 PATTERN-BASED EMPIRICAL CONFIG: Replace generic thresholds with pattern-specific ones
    const config = this.generatePatternSpecificEmpiricalConfig(historicalData);
    let homeStreakBoost = 0;
    let awayStreakBoost = 0;

    // Home team empirical streak analysis
    console.log(`[EMPIRICAL-STREAKS] 🏠 HOME ANALYSIS: ${homeRecent.length} matches (min: ${config.minimumSampleSize})`);
    if (homeRecent.length >= config.minimumSampleSize && config.homeStreaks.enabled) {
      const homeStreaks = this.analyzeEmpiricalStreaks(homeRecent, true, config.homeStreaks);
      
      homeStreaks.forEach(streak => {
        if (streak.confidence >= config.confidenceThreshold) {
          homeStreakBoost += streak.adjustment;
          console.log(`[EMPIRICAL-STREAKS] 🚨 HOME ${streak.streakType.toUpperCase()}: ${streak.message}`);
          console.log(`[EMPIRICAL-STREAKS] 📊 Adjustment: ${streak.adjustment >= 0 ? '+' : ''}${streak.adjustment.toFixed(3)} goals (confidence: ${(streak.confidence * 100).toFixed(1)}%)`);
        } else {
          console.log(`[EMPIRICAL-STREAKS] 🏠 HOME ${streak.streakType}: Low confidence (${(streak.confidence * 100).toFixed(1)}%) - skipped`);
        }
      });
    } else {
      console.log(`[EMPIRICAL-STREAKS] 🏠 HOME: Insufficient data or disabled`);
    }

    // Away team empirical streak analysis  
    console.log(`[EMPIRICAL-STREAKS] ✈️ AWAY ANALYSIS: ${awayRecent.length} matches (min: ${config.minimumSampleSize})`);
    if (awayRecent.length >= config.minimumSampleSize && config.awayStreaks.enabled) {
      const awayStreaks = this.analyzeEmpiricalStreaks(awayRecent, false, config.awayStreaks);
      
      awayStreaks.forEach(streak => {
        if (streak.confidence >= config.confidenceThreshold) {
          awayStreakBoost += streak.adjustment;
          console.log(`[EMPIRICAL-STREAKS] 🚨 AWAY ${streak.streakType.toUpperCase()}: ${streak.message}`);
          console.log(`[EMPIRICAL-STREAKS] 📊 Adjustment: ${streak.adjustment >= 0 ? '+' : ''}${streak.adjustment.toFixed(3)} goals (confidence: ${(streak.confidence * 100).toFixed(1)}%)`);
        } else {
          console.log(`[EMPIRICAL-STREAKS] ✈️ AWAY ${streak.streakType}: Low confidence (${(streak.confidence * 100).toFixed(1)}%) - skipped`);
        }
      });
    } else {
      console.log(`[EMPIRICAL-STREAKS] ✈️ AWAY: Insufficient data or disabled`);
    }

    // Apply maximum total adjustment cap
    const maxCap = Math.max(config.homeStreaks.escalation.maxTotalAdjustment, config.awayStreaks.escalation.maxTotalAdjustment);
    homeStreakBoost = Math.max(-maxCap, Math.min(maxCap, homeStreakBoost));
    awayStreakBoost = Math.max(-maxCap, Math.min(maxCap, awayStreakBoost));

    console.log(`[EMPIRICAL-STREAKS] 🎯 FINAL EMPIRICAL BOOSTS: Home=${homeStreakBoost>=0?'+':''}${homeStreakBoost.toFixed(3)}, Away=${awayStreakBoost>=0?'+':''}${awayStreakBoost.toFixed(3)}`);
    console.log(`[EMPIRICAL-STREAKS] 🧬 Replaced fixed 5+ thresholds with data-driven consecutive patterns`);

    return { homeStreakBoost, awayStreakBoost };
  }

  // NEW: Empirical streak analysis using data-driven thresholds
  private analyzeEmpiricalStreaks(matches: any[], isHomeTeam: boolean, config: any): EmpiricalStreakResult[] {
    const results: EmpiricalStreakResult[] = [];
    
    if (matches.length < config.pureWinStreak.threshold) {
      return results; // Insufficient data
    }

    // Analyze consecutive patterns
    const outcomes = matches.map(match => {
      if (isHomeTeam) {
        // Home team perspective
        const homeGoals = match.home_score_ft || 0;
        const awayGoals = match.away_score_ft || 0;
        
        if (homeGoals > awayGoals) return 'win';
        else if (homeGoals < awayGoals) return 'loss';
        else return 'draw';
      } else {
        // Away team perspective  
        const homeGoals = match.home_score_ft || 0;
        const awayGoals = match.away_score_ft || 0;
        
        if (awayGoals > homeGoals) return 'win';
        else if (awayGoals < homeGoals) return 'loss';
        else return 'draw';
      }
    });

    // Check pure win streak
    const pureWinStreak = this.calculateMaxConsecutive(outcomes, ['win']);
    if (pureWinStreak >= config.pureWinStreak.threshold) {
      const escalationBonus = config.escalation.enabled ? 
        (pureWinStreak - config.pureWinStreak.threshold) * config.escalation.pureStreakMultiplier : 0;
      let totalAdjustment = Math.max(-config.escalation.maxTotalAdjustment, 
        config.pureWinStreak.penalty - escalationBonus);
      
      // 🔥 EXTREME EMPIRICAL ESCALATION: Calculate win percentage for additional scaling
      const totalWins = outcomes.filter(outcome => outcome === 'win').length;
      const winPercentage = totalWins / outcomes.length;
      
      let percentageMultiplier = 1.0;
      let escalationMessage = "";
      
      if (winPercentage >= 0.95) {
        percentageMultiplier = 2.5;
        escalationMessage = ` (PERFECT ${(winPercentage * 100).toFixed(0)}% win rate - MAXIMUM penalty)`;
      } else if (winPercentage >= 0.90) {
        percentageMultiplier = 2.0;
        escalationMessage = ` (MASSIVE ${(winPercentage * 100).toFixed(0)}% win rate - huge penalty)`;
      } else if (winPercentage >= 0.80) {
        percentageMultiplier = 1.5;
        escalationMessage = ` (EXTREME ${(winPercentage * 100).toFixed(0)}% win rate - strong penalty)`;
      }
      
      totalAdjustment = Math.max(-config.escalation.maxTotalAdjustment * 2.5, totalAdjustment * percentageMultiplier);
        
      results.push({
        streakType: 'pure_win',
        streakLength: pureWinStreak,
        threshold: config.pureWinStreak.threshold,
        adjustment: totalAdjustment,
        confidence: Math.min(0.95, 0.65 + (pureWinStreak * 0.08) + config.pureWinStreak.confidenceBonus),
        message: `${pureWinStreak} consecutive pure wins${escalationMessage} → ${totalAdjustment.toFixed(3)} penalty (rare achievement)`,
        escalated: escalationBonus > 0 || percentageMultiplier > 1.0,
        rawAdjustment: config.pureWinStreak.penalty,
        escalationBonus: escalationBonus
      });
    }

    // Check pure loss streak
    const pureLossStreak = this.calculateMaxConsecutive(outcomes, ['loss']);
    if (pureLossStreak >= config.pureLossStreak.threshold) {
      const escalationBonus = config.escalation.enabled ? 
        (pureLossStreak - config.pureLossStreak.threshold) * config.escalation.pureStreakMultiplier : 0;
      let totalAdjustment = Math.min(config.escalation.maxTotalAdjustment, 
        config.pureLossStreak.boost + escalationBonus);
      
      // 🔥 EXTREME LOSS ESCALATION: Calculate loss percentage for additional scaling
      const totalLosses = outcomes.filter(outcome => outcome === 'loss').length;
      const lossPercentage = totalLosses / outcomes.length;
      
      let percentageMultiplier = 1.0;
      let escalationMessage = "";
      
      if (lossPercentage >= 0.95) {
        percentageMultiplier = 2.5;
        escalationMessage = ` (PERFECT ${(lossPercentage * 100).toFixed(0)}% loss rate - MAXIMUM boost)`;
      } else if (lossPercentage >= 0.90) {
        percentageMultiplier = 2.0;
        escalationMessage = ` (MASSIVE ${(lossPercentage * 100).toFixed(0)}% loss rate - huge boost)`;
      } else if (lossPercentage >= 0.80) {
        percentageMultiplier = 1.5;
        escalationMessage = ` (EXTREME ${(lossPercentage * 100).toFixed(0)}% loss rate - strong boost)`;
      }
      
      totalAdjustment = Math.min(config.escalation.maxTotalAdjustment * 2.5, totalAdjustment * percentageMultiplier);
        
      results.push({
        streakType: 'pure_loss',
        streakLength: pureLossStreak,
        threshold: config.pureLossStreak.threshold,
        adjustment: totalAdjustment,
        confidence: Math.min(0.95, 0.70 + (pureLossStreak * 0.10) + config.pureLossStreak.confidenceBonus),
        message: `${pureLossStreak} consecutive pure losses${escalationMessage} → +${totalAdjustment.toFixed(3)} reversion boost`,
        escalated: escalationBonus > 0 || percentageMultiplier > 1.0,
        rawAdjustment: config.pureLossStreak.boost,
        escalationBonus: escalationBonus
      });
    }

    // Check pure draw streak
    const pureDrawStreak = this.calculateMaxConsecutive(outcomes, ['draw']);
    if (pureDrawStreak >= config.pureDrawStreak.threshold) {
      results.push({
        streakType: 'pure_draw',
        streakLength: pureDrawStreak,
        threshold: config.pureDrawStreak.threshold,
        adjustment: config.pureDrawStreak.chaosAdjustment,
        confidence: Math.min(0.85, 0.60 + (pureDrawStreak * 0.12)),
        message: `${pureDrawStreak} consecutive pure draws → +${config.pureDrawStreak.chaosAdjustment.toFixed(3)} chaos factor`,
        escalated: false,
        rawAdjustment: config.pureDrawStreak.chaosAdjustment,
        escalationBonus: 0
      });
    }

    // Check unbeaten streak (wins + draws)
    const unbeatenStreak = this.calculateMaxConsecutive(outcomes, ['win', 'draw']);
    if (unbeatenStreak >= config.unbeatenStreak.threshold) {
      const escalationBonus = config.escalation.enabled ? 
        (unbeatenStreak - config.unbeatenStreak.threshold) * config.escalation.mixedStreakMultiplier : 0;
      let totalAdjustment = Math.max(-config.escalation.maxTotalAdjustment, 
        config.unbeatenStreak.penalty - escalationBonus);
      
      // 🔥 EXTREME UNBEATEN ESCALATION: Calculate unbeaten percentage for additional scaling  
      const totalUnbeaten = outcomes.filter(outcome => outcome === 'win' || outcome === 'draw').length;
      const unbeatenPercentage = totalUnbeaten / outcomes.length;
      
      let percentageMultiplier = 1.0;
      let escalationMessage = "";
      
      if (unbeatenPercentage >= 0.95) {
        percentageMultiplier = 2.5;
        escalationMessage = ` (PERFECT ${(unbeatenPercentage * 100).toFixed(0)}% unbeaten rate - MAXIMUM penalty)`;
      } else if (unbeatenPercentage >= 0.90) {
        percentageMultiplier = 2.0;
        escalationMessage = ` (MASSIVE ${(unbeatenPercentage * 100).toFixed(0)}% unbeaten rate - huge penalty)`;
      } else if (unbeatenPercentage >= 0.80) {
        percentageMultiplier = 1.5;
        escalationMessage = ` (EXTREME ${(unbeatenPercentage * 100).toFixed(0)}% unbeaten rate - strong penalty)`;
      }
      
      totalAdjustment = Math.max(-config.escalation.maxTotalAdjustment * 2.5, totalAdjustment * percentageMultiplier);
        
      results.push({
        streakType: 'unbeaten',
        streakLength: unbeatenStreak,
        threshold: config.unbeatenStreak.threshold,
        adjustment: totalAdjustment,
        confidence: Math.min(0.90, 0.60 + (unbeatenStreak * 0.06) + config.unbeatenStreak.confidenceBonus),
        message: `${unbeatenStreak} consecutive unbeaten${escalationMessage} → ${totalAdjustment.toFixed(3)} penalty (mixed success)`,
        escalated: escalationBonus > 0 || percentageMultiplier > 1.0,
        rawAdjustment: config.unbeatenStreak.penalty,
        escalationBonus: escalationBonus
      });
    }

    // Check winless streak (losses + draws)
    const winlessStreak = this.calculateMaxConsecutive(outcomes, ['loss', 'draw']);
    if (winlessStreak >= config.winlessStreak.threshold) {
      const escalationBonus = config.escalation.enabled ? 
        (winlessStreak - config.winlessStreak.threshold) * config.escalation.mixedStreakMultiplier : 0;
      let totalAdjustment = Math.min(config.escalation.maxTotalAdjustment, 
        config.winlessStreak.boost + escalationBonus);
      
      // 🔥 EXTREME WINLESS ESCALATION: Calculate winless percentage for additional scaling
      const totalWinless = outcomes.filter(outcome => outcome === 'loss' || outcome === 'draw').length;
      const winlessPercentage = totalWinless / outcomes.length;
      
      let percentageMultiplier = 1.0;
      let escalationMessage = "";
      
      if (winlessPercentage >= 0.95) {
        percentageMultiplier = 2.5;
        escalationMessage = ` (PERFECT ${(winlessPercentage * 100).toFixed(0)}% winless rate - MAXIMUM boost)`;
      } else if (winlessPercentage >= 0.90) {
        percentageMultiplier = 2.0;
        escalationMessage = ` (MASSIVE ${(winlessPercentage * 100).toFixed(0)}% winless rate - huge boost)`;
      } else if (winlessPercentage >= 0.80) {
        percentageMultiplier = 1.5;
        escalationMessage = ` (EXTREME ${(winlessPercentage * 100).toFixed(0)}% winless rate - strong boost)`;
      }
      
      totalAdjustment = Math.min(config.escalation.maxTotalAdjustment * 2.5, totalAdjustment * percentageMultiplier);
        
      results.push({
        streakType: 'winless',
        streakLength: winlessStreak,
        threshold: config.winlessStreak.threshold,
        adjustment: totalAdjustment,
        confidence: Math.min(0.90, 0.65 + (winlessStreak * 0.08) + config.winlessStreak.confidenceBonus),
        message: `${winlessStreak} consecutive winless${escalationMessage} → +${totalAdjustment.toFixed(3)} reversion boost`,
        escalated: escalationBonus > 0 || percentageMultiplier > 1.0,
        rawAdjustment: config.winlessStreak.boost,
        escalationBonus: escalationBonus
      });
    }

    return results;
  }

  // Helper method to calculate maximum consecutive occurrences
  private calculateMaxConsecutive(outcomes: string[], targetOutcomes: string[]): number {
    let maxStreak = 0;
    let currentStreak = 0;
    
    for (const outcome of outcomes) {
      if (targetOutcomes.includes(outcome)) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return maxStreak;
  }

  // NEW: Calculate win rate adjustments from streak data (separate from goal lambda adjustments)
  private calculateStreakWinRateAdjustments(historicalData: any, boostSettings?: any): { homeWinRateAdjustment: number; awayWinRateAdjustment: number } {
    let homeWinRateAdjustment = 0;
    let awayWinRateAdjustment = 0;

    // Skip if streak analysis is disabled
    if (boostSettings?.enable_streak_analysis === false) {
      console.log(`[WIN RATE STREAKS] Streak analysis disabled by user setting`);
      return { homeWinRateAdjustment: 0, awayWinRateAdjustment: 0 };
    }

    console.log(`[WIN RATE STREAKS] Calculating win rate adjustments from streak data...`);

    // Use same streak calculation logic but convert to win rate adjustments
    const streakBoosts = this.calculateStreakBoosts(historicalData);
    
    // Convert goal-based streak boosts to win rate adjustments using the formula: winRateAdjustment = goalAdjustment * 0.05
    const CONVERSION_FACTOR = 0.05;
    
    homeWinRateAdjustment = streakBoosts.homeStreakBoost * CONVERSION_FACTOR;
    awayWinRateAdjustment = streakBoosts.awayStreakBoost * CONVERSION_FACTOR;
    
    console.log(`[WIN RATE STREAKS] Goal-based adjustments: Home=${streakBoosts.homeStreakBoost.toFixed(3)}, Away=${streakBoosts.awayStreakBoost.toFixed(3)}`);
    console.log(`[WIN RATE STREAKS] Win rate adjustments: Home=${(homeWinRateAdjustment >= 0 ? '+' : '')}${(homeWinRateAdjustment * 100).toFixed(1)}%, Away=${(awayWinRateAdjustment >= 0 ? '+' : '')}${(awayWinRateAdjustment * 100).toFixed(1)}%`);

    return { homeWinRateAdjustment, awayWinRateAdjustment };
  }

  // Apply win rate adjustments to match outcome probabilities
  private applyWinRateAdjustments(baseProbabilities: any, homeAdjustment: number, awayAdjustment: number): any {
    console.log(`[WIN RATE ADJUSTMENT] Base probabilities: Home=${(baseProbabilities.home_win*100).toFixed(1)}%, Draw=${(baseProbabilities.draw*100).toFixed(1)}%, Away=${(baseProbabilities.away_win*100).toFixed(1)}%`);

    // Apply percentage adjustments to home and away win rates
    let adjustedHomeWin = baseProbabilities.home_win * (1 + homeAdjustment);
    let adjustedAwayWin = baseProbabilities.away_win * (1 + awayAdjustment);
    let adjustedDraw = baseProbabilities.draw; // Draw probability unchanged

    // Normalize probabilities to ensure they sum to 1.0
    const total = adjustedHomeWin + adjustedDraw + adjustedAwayWin;
    
    const normalizedProbabilities = {
      home_win: adjustedHomeWin / total,
      draw: adjustedDraw / total,
      away_win: adjustedAwayWin / total
    };

    console.log(`[WIN RATE ADJUSTMENT] After adjustments: Home=${(normalizedProbabilities.home_win*100).toFixed(1)}%, Draw=${(normalizedProbabilities.draw*100).toFixed(1)}%, Away=${(normalizedProbabilities.away_win*100).toFixed(1)}%`);
    console.log(`[WIN RATE ADJUSTMENT] Changes: Home ${(homeAdjustment >= 0 ? '+' : '')}${((normalizedProbabilities.home_win - baseProbabilities.home_win)*100).toFixed(1)}%, Away ${(awayAdjustment >= 0 ? '+' : '')}${((normalizedProbabilities.away_win - baseProbabilities.away_win)*100).toFixed(1)}%`);

    return normalizedProbabilities;
  }

  // Poisson distribution random number generator
  private poissonRandom(lambda: number): number {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    
    return k - 1;
  }

  // Calculate lambda parameters from historical data with boost application
  private calculateLambdas(historicalData: any, boostSettings?: any, skipStreakBoosts: boolean = false): { homeLambda: number; awayLambda: number } {
    const h2hMatches = historicalData.h2h || [];
    const homeMatches = historicalData.home_home || [];
    const awayMatches = historicalData.away_away || [];

    console.log(`[WEIGHTED] Data samples: H2H=${h2hMatches.length}, Home=${homeMatches.length}, Away=${awayMatches.length}`);

    // 🎯 ADVANCED OFFENSIVE + DEFENSIVE ANALYSIS SYSTEM
    // Calculate individual SCORING averages (goals FOR)
    const h2hHomeScoring = h2hMatches.length > 0 
      ? h2hMatches.reduce((sum: number, match: any) => sum + (match.home_score_ft || 0), 0) / h2hMatches.length
      : null;
    const h2hAwayScoring = h2hMatches.length > 0
      ? h2hMatches.reduce((sum: number, match: any) => sum + (match.away_score_ft || 0), 0) / h2hMatches.length
      : null;

    const homeFormScoring = homeMatches.length > 0
      ? homeMatches.reduce((sum: number, match: any) => sum + (match.home_score_ft || 0), 0) / homeMatches.length
      : null;

    const awayFormScoring = awayMatches.length > 0
      ? awayMatches.reduce((sum: number, match: any) => sum + (match.away_score_ft || 0), 0) / awayMatches.length
      : null;

    // 🛡️ CRITICAL NEW: Calculate individual DEFENSIVE averages (goals AGAINST)
    const h2hHomeDefensive = h2hMatches.length > 0
      ? h2hMatches.reduce((sum: number, match: any) => sum + (match.away_score_ft || 0), 0) / h2hMatches.length
      : null;
    const h2hAwayDefensive = h2hMatches.length > 0
      ? h2hMatches.reduce((sum: number, match: any) => sum + (match.home_score_ft || 0), 0) / h2hMatches.length
      : null;

    const homeDefensive = homeMatches.length > 0
      ? homeMatches.reduce((sum: number, match: any) => sum + (match.away_score_ft || 0), 0) / homeMatches.length
      : null;

    const awayDefensive = awayMatches.length > 0
      ? awayMatches.reduce((sum: number, match: any) => sum + (match.home_score_ft || 0), 0) / awayMatches.length
      : null;

    // 📊 PURE DATA-BASED WEIGHTING (NO DEFAULTS)
    // Calculate raw weights based on data availability with dynamic H2H adjustment
    let rawH2hWeight = h2hMatches.length > 0 
      ? Math.min(h2hMatches.length / 8 * 0.20, 0.20)
      : 0;
    
    // 🎯 DYNAMIC H2H WEIGHTING: Reduce influence when limited H2H data (newcomers, different divisions)
    if (h2hMatches.length > 0 && h2hMatches.length <= 4) {
      rawH2hWeight = rawH2hWeight * 0.9; // -10% weight penalty for limited H2H data
      console.log(`[DYNAMIC H2H] Limited H2H data (${h2hMatches.length} matches) - applying -10% weight penalty`);
    }

    const rawHomeWeight = homeMatches.length > 0 
      ? Math.min(homeMatches.length / 10 * 0.40, 0.40)
      : 0;

    const rawAwayWeight = awayMatches.length > 0 
      ? Math.min(awayMatches.length / 10 * 0.40, 0.40)
      : 0;

    // Calculate total available weight from actual data
    const totalRawWeight = rawH2hWeight + rawHomeWeight + rawAwayWeight;
    
    // 🚨 MAJOR FIX: Remove default lambda bias - scale existing weights to 100%
    const h2hWeight = totalRawWeight > 0 ? rawH2hWeight / totalRawWeight : 0;
    const homeWeight = totalRawWeight > 0 ? rawHomeWeight / totalRawWeight : 0;
    const awayWeight = totalRawWeight > 0 ? rawAwayWeight / totalRawWeight : 0;

    // 🧮 FIXED: CORRECT OFFENSIVE + DEFENSIVE LAMBDA CALCULATION
    // Home team lambda = Home team scoring ability + (Away team defensive weakness × 0.5)
    // Away team lambda = Away team scoring ability + (Home team defensive weakness × 0.5)
    
    let homeOffensiveLambda = 0;
    let homeDefensiveConceded = 0;  // FIXED: Goals HOME team concedes (their weakness)
    let awayOffensiveLambda = 0;
    let awayDefensiveConceded = 0;  // FIXED: Goals AWAY team concedes (their weakness)

    // HOME TEAM OFFENSIVE ABILITY (goals they score)
    if (h2hHomeScoring !== null) homeOffensiveLambda += h2hHomeScoring * h2hWeight;
    if (homeFormScoring !== null) homeOffensiveLambda += homeFormScoring * homeWeight;
    
    // AWAY TEAM OFFENSIVE ABILITY (goals they score) 
    if (h2hAwayScoring !== null) awayOffensiveLambda += h2hAwayScoring * h2hWeight;
    if (awayFormScoring !== null) awayOffensiveLambda += awayFormScoring * awayWeight;
    
    // FIXED: HOME TEAM DEFENSIVE WEAKNESS (goals HOME team concedes)
    if (h2hHomeDefensive !== null) homeDefensiveConceded += h2hHomeDefensive * h2hWeight;
    if (homeDefensive !== null) homeDefensiveConceded += homeDefensive * homeWeight;
    
    // FIXED: AWAY TEAM DEFENSIVE WEAKNESS (goals AWAY team concedes)
    if (h2hAwayDefensive !== null) awayDefensiveConceded += h2hAwayDefensive * h2hWeight;
    if (awayDefensive !== null) awayDefensiveConceded += awayDefensive * awayWeight;

    // FIXED: CORRECT LAMBDA CALCULATION - Attack meets Opponent's Defense
    let homeLambda = 0;
    let awayLambda = 0;
    
    if (totalRawWeight > 0) {
      // 🚨 CRITICAL FIX: Increased defensive impact for more realistic results
      // Teams get FULL benefit of their attack + significant benefit from opponent's defensive weakness
      homeLambda = homeOffensiveLambda + (awayDefensiveConceded * 0.5); // 50% defensive impact (was 30%)
      awayLambda = awayOffensiveLambda + (homeDefensiveConceded * 0.5); // 50% defensive impact (was 30%)
      console.log(`[🚨 FIXED] Increased defensive impact to 50% - more realistic high-scoring games`);
    }

    // Fallback only if NO data exists at all (emergency minimum)
    if (totalRawWeight === 0) {
      console.log(`[WARNING] No historical data available - using emergency fallback`);
      homeLambda = 1.50; // Higher than old defaults
      awayLambda = 1.30;
    }

    console.log(`[OFFENSIVE+DEFENSIVE] Weights: H2H=${(h2hWeight*100).toFixed(1)}%, Home=${(homeWeight*100).toFixed(1)}%, Away=${(awayWeight*100).toFixed(1)}% (No defaults!)`);
    console.log(`[OFFENSIVE] Home Scoring=${homeOffensiveLambda?.toFixed(2)}, Away Scoring=${awayOffensiveLambda?.toFixed(2)}`);
    console.log(`[DEFENSIVE] Home Concedes=${homeDefensiveConceded?.toFixed(2)}, Away Concedes=${awayDefensiveConceded?.toFixed(2)}`);
    console.log(`[COMBINED] Raw lambdas: Home=${homeLambda.toFixed(3)} (HomeAttack:${homeOffensiveLambda?.toFixed(2)}+AwayDefense:${awayDefensiveConceded?.toFixed(2)}×0.5), Away=${awayLambda.toFixed(3)} (AwayAttack:${awayOffensiveLambda?.toFixed(2)}+HomeDefense:${homeDefensiveConceded?.toFixed(2)}×0.5)`);
    console.log(`[✅ FIXED] Defensive analysis now correctly applied!`);

    // Store raw lambdas for debugging
    const rawHomeLambda = homeLambda;
    const rawAwayLambda = awayLambda;

    // 🏠 FIXED: INCREASED ADDITIVE HOME ADVANTAGE (More Realistic for High-Scoring Teams)
    const homeAdvantageBoost = boostSettings?.home_advantage ?? 0.30; // INCREASED to +0.30 goals additive
    homeLambda += homeAdvantageBoost;
    console.log(`[HOME ADVANTAGE] Applied +${homeAdvantageBoost.toFixed(2)} goals boost (additive, not multiplicative)`);

    // Apply manual custom boosts (additive to lambda)
    const customHomeBoost = boostSettings?.custom_home_boost ?? 0;
    const customAwayBoost = boostSettings?.custom_away_boost ?? 0;
    homeLambda += customHomeBoost;
    awayLambda += customAwayBoost;

    // Apply automatic streak boosts if enabled (unless skipStreakBoosts is true for win-rate system)
    let homeStreakBoost = 0;
    let awayStreakBoost = 0;
    
    console.log(`[DEBUG] Streak analysis check:`, {
      enable_streak_analysis: boostSettings?.enable_streak_analysis,
      boostSettingsExists: !!boostSettings,
      skipStreakBoosts: skipStreakBoosts,
      shouldRunStreakAnalysis: boostSettings?.enable_streak_analysis !== false && !skipStreakBoosts
    });
    
    if (boostSettings?.enable_streak_analysis !== false && !skipStreakBoosts) { // Default true if not specified, but skip if requested
      console.log(`[DEBUG] Running streak analysis for lambda adjustment...`);
      const streakBoosts = this.calculateStreakBoosts(historicalData);
      homeStreakBoost = streakBoosts.homeStreakBoost;
      awayStreakBoost = streakBoosts.awayStreakBoost;
      homeLambda += homeStreakBoost;
      awayLambda += awayStreakBoost;
    } else {
      if (skipStreakBoosts) {
        console.log(`[DEBUG] Streak analysis skipped - using win-rate adjustment system instead`);
      } else {
        console.log(`[DEBUG] Streak analysis disabled by user setting`);
      }
    }

    // FIXED: Remove artificial lambda caps that were causing under bias
    // Only enforce minimum to prevent impossible scenarios (0 goals)
    const MIN_LAMBDA = 0.3; // Minimum 0.3 goals per game average
    // REMOVED MAX_LAMBDA cap - let high-scoring teams be high-scoring!
    
    homeLambda = Math.max(MIN_LAMBDA, homeLambda);
    awayLambda = Math.max(MIN_LAMBDA, awayLambda);
    
    console.log(`[🚨 FIXED] Removed 4.0 lambda cap - no more artificial constraints on high-scoring teams!`);
    
    // Enhanced debugging with boost breakdown
    console.log(`[DEBUG] Lambda calculation breakdown:`);
    console.log(`  Raw from Offensive+Defensive: Home=${rawHomeLambda.toFixed(3)}, Away=${rawAwayLambda.toFixed(3)}`);
    console.log(`  Home advantage boost: +${homeAdvantageBoost.toFixed(3)} goals (ADDITIVE, not multiplicative)`);
    console.log(`  Custom boosts: Home=${customHomeBoost>=0?'+':''}${customHomeBoost.toFixed(3)}, Away=${customAwayBoost>=0?'+':''}${customAwayBoost.toFixed(3)}`);
    console.log(`  Streak boosts: Home=${homeStreakBoost>=0?'+':''}${homeStreakBoost.toFixed(3)}, Away=${awayStreakBoost>=0?'+':''}${awayStreakBoost.toFixed(3)}`);
    console.log(`  Final lambdas: Home=${homeLambda.toFixed(3)}, Away=${awayLambda.toFixed(3)}`);
    console.log(`  [✅ VERIFIED] All calculations use new v2.23.0 system`);

    return { homeLambda, awayLambda };
  }

  // Calculate lambda parameters from raw historical data (preserves extreme patterns for reversion)
  private calculateLambdasRaw(historicalData: any, boostSettings?: any, skipStreakBoosts: boolean = false): { homeLambda: number; awayLambda: number } {
    const h2hMatches = historicalData.h2h || [];
    const homeMatches = historicalData.home_home || [];
    const awayMatches = historicalData.away_away || [];

    console.log(`[RAW-DATA] 🎯 Pattern-First Mode: Using raw data samples - H2H=${h2hMatches.length}, Home=${homeMatches.length}, Away=${awayMatches.length}`);

    // 🧮 NORMALIZED RAW DATA CALCULATION - Preserve patterns but realistic baselines
    // Calculate averages with football reality normalization
    
    // FOOTBALL REALITY: Average professional football game = 2.5-2.8 total goals
    const REALISTIC_FOOTBALL_BASELINE = 2.6; // Total goals per game
    const REALISTIC_HOME_LAMBDA = 1.4; // Home team goals
    const REALISTIC_AWAY_LAMBDA = 1.2; // Away team goals
    
    // Home team offensive ability (goals they score)
    const h2hHomeScoring = h2hMatches.length > 0 
      ? h2hMatches.reduce((sum: number, match: any) => sum + (match.home_score_ft || 0), 0) / h2hMatches.length
      : null;
    
    const homeFormScoring = homeMatches.length > 0
      ? homeMatches.reduce((sum: number, match: any) => sum + (match.home_score_ft || 0), 0) / homeMatches.length
      : null;

    // Away team offensive ability (goals they score)
    const h2hAwayScoring = h2hMatches.length > 0
      ? h2hMatches.reduce((sum: number, match: any) => sum + (match.away_score_ft || 0), 0) / h2hMatches.length
      : null;
      
    const awayFormScoring = awayMatches.length > 0
      ? awayMatches.reduce((sum: number, match: any) => sum + (match.away_score_ft || 0), 0) / awayMatches.length
      : null;

    // Defensive weaknesses (goals they concede)
    const h2hHomeDefensive = h2hMatches.length > 0
      ? h2hMatches.reduce((sum: number, match: any) => sum + (match.away_score_ft || 0), 0) / h2hMatches.length
      : null;
      
    const h2hAwayDefensive = h2hMatches.length > 0
      ? h2hMatches.reduce((sum: number, match: any) => sum + (match.home_score_ft || 0), 0) / h2hMatches.length
      : null;

    const homeDefensive = homeMatches.length > 0
      ? homeMatches.reduce((sum: number, match: any) => sum + (match.away_score_ft || 0), 0) / homeMatches.length
      : null;

    const awayDefensive = awayMatches.length > 0
      ? awayMatches.reduce((sum: number, match: any) => sum + (match.home_score_ft || 0), 0) / awayMatches.length
      : null;

    // 🎯 PATTERN-FIRST APPROACH: Use most relevant data source without dilution
    let homeLambda = 0;
    let awayLambda = 0;
    let dataSource = "";

    // Priority 1: H2H data (most relevant for patterns like 8/8 home wins)
    if (h2hMatches.length >= 6 && h2hHomeScoring !== null && h2hAwayScoring !== null && 
        h2hHomeDefensive !== null && h2hAwayDefensive !== null) {
      
      // 🏈 NORMALIZED H2H CALCULATION: Preserve patterns but realistic scale
      const h2hTotalGoals = h2hHomeScoring + h2hAwayScoring;
      const normalizationFactor = REALISTIC_FOOTBALL_BASELINE / Math.max(h2hTotalGoals, 1.5);
      
      // Apply normalization but preserve relative strength differences
      const normalizedHomeScoring = h2hHomeScoring * normalizationFactor;
      const normalizedAwayScoring = h2hAwayScoring * normalizationFactor;
      const normalizedHomeDefensive = h2hHomeDefensive * normalizationFactor;
      const normalizedAwayDefensive = h2hAwayDefensive * normalizationFactor;
      
      // Calculate lambdas with realistic baselines (reduced defensive impact)
      homeLambda = normalizedHomeScoring + (normalizedAwayDefensive * 0.3);
      awayLambda = normalizedAwayScoring + (normalizedHomeDefensive * 0.3);
      
      dataSource = "H2H-NORMALIZED";
      console.log(`[RAW-DATA] 📊 H2H raw total: ${h2hTotalGoals.toFixed(2)}, normalized: ${(normalizedHomeScoring + normalizedAwayScoring).toFixed(2)}, factor: ${normalizationFactor.toFixed(3)}`);
      console.log(`[RAW-DATA] 🎯 Using H2H-PURE approach (${h2hMatches.length} matches)`);
      
    } else if ((homeMatches.length >= 5 || awayMatches.length >= 5) && 
               (homeFormScoring !== null || awayFormScoring !== null)) {
      // Use form data with minimal combination
      const homeOffensive = homeFormScoring || 1.5;
      const awayOffensive = awayFormScoring || 1.3;
      const homeDefensiveWeak = homeDefensive || 1.2;
      const awayDefensiveWeak = awayDefensive || 1.2;
      
      homeLambda = homeOffensive + (awayDefensiveWeak * 0.5);
      awayLambda = awayOffensive + (homeDefensiveWeak * 0.5);
      dataSource = "FORM-BASED";
      console.log(`[RAW-DATA] 📊 Using FORM-BASED approach (Home=${homeMatches.length}, Away=${awayMatches.length})`);
      
    } else {
      // Emergency fallback - slightly higher than weighted defaults
      homeLambda = 1.6;
      awayLambda = 1.4;
      dataSource = "FALLBACK";
      console.log(`[RAW-DATA] ⚠️ Using FALLBACK approach (insufficient data)`);
    }

    console.log(`[RAW-DATA] Pre-boost lambdas: Home=${homeLambda.toFixed(3)}, Away=${awayLambda.toFixed(3)} (${dataSource})`);
    console.log(`[RAW-DATA] 🔥 Raw data preserved - no weighted averaging dilution!`);

    // Apply home advantage (same as weighted approach for consistency)
    const homeAdvantageBoost = boostSettings?.home_advantage ?? 0.30;
    homeLambda += homeAdvantageBoost;

    // Apply custom boosts
    const customHomeBoost = boostSettings?.custom_home_boost ?? 0;
    const customAwayBoost = boostSettings?.custom_away_boost ?? 0;
    homeLambda += customHomeBoost;
    awayLambda += customAwayBoost;

    // Apply streak boosts if enabled (same logic as weighted)
    let homeStreakBoost = 0;
    let awayStreakBoost = 0;
    
    if (boostSettings?.enable_streak_analysis !== false && !skipStreakBoosts) {
      const streakBoosts = this.calculateStreakBoosts(historicalData);
      homeStreakBoost = streakBoosts.homeStreakBoost;
      awayStreakBoost = streakBoosts.awayStreakBoost;
      homeLambda += homeStreakBoost;
      awayLambda += awayStreakBoost;
      console.log(`[RAW-DATA] Streak boosts applied: Home=${homeStreakBoost>=0?'+':''}${homeStreakBoost.toFixed(3)}, Away=${awayStreakBoost>=0?'+':''}${awayStreakBoost.toFixed(3)}`);
    }

    // Enforce minimum only (no maximum caps to preserve extremes)
    const MIN_LAMBDA = 0.3;
    homeLambda = Math.max(MIN_LAMBDA, homeLambda);
    awayLambda = Math.max(MIN_LAMBDA, awayLambda);

    console.log(`[RAW-DATA] ✅ Final raw lambdas: Home=${homeLambda.toFixed(3)}, Away=${awayLambda.toFixed(3)} (${dataSource} + boosts)`);
    console.log(`[RAW-DATA] 🎯 Extreme patterns preserved for reversion analysis!`);

    return { homeLambda, awayLambda };
  }

  // Helper function to safely calculate odds - prevents division by zero and null values
  private safeCalculateOdds(probability: number): number | null {
    const MIN_PROBABILITY = 0.0001; // Minimum 0.01% probability 
    if (!probability || probability <= 0 || probability < MIN_PROBABILITY) {
      return null; // Return null for impossible outcomes instead of Infinity
    }
    return 1 / probability;
  }

  // Calculate value bets
  private calculateValueBets(probabilities: any, bookmakerOdds: any): any {
    const valueBets: any = {};
    const EDGE_THRESHOLD = 0.02; // 2% minimum edge
    
    console.log('[DEBUG] Monte Carlo - calculateValueBets input:', {
      bookmakerOdds: JSON.stringify(bookmakerOdds, null, 2),
      hasAsianHandicap0: !!bookmakerOdds?.asian_handicap_0,
      hasOverUnder25: !!bookmakerOdds?.over_under_25,
      hasGoalRanges: !!bookmakerOdds?.goal_ranges,
      hasNewMarkets: {
        over_under_3: !!bookmakerOdds?.over_under_3,
        over_under_35: !!bookmakerOdds?.over_under_35,
        gg_ng: !!bookmakerOdds?.gg_ng,
        double_chance: !!bookmakerOdds?.double_chance,
        asian_handicap_minus1_plus1: !!bookmakerOdds?.asian_handicap_minus1_plus1,
        asian_handicap_plus1_minus1: !!bookmakerOdds?.asian_handicap_plus1_minus1,
        '1x2_ht': !!bookmakerOdds?.['1x2_ht'],
        asian_handicap_0_ht: !!bookmakerOdds?.asian_handicap_0_ht,
        over_under_15_ht: !!bookmakerOdds?.over_under_15_ht
      },
      oddsWithValues: {
        over_under_3: bookmakerOdds?.over_under_3?.over > 0 && bookmakerOdds?.over_under_3?.under > 0,
        over_under_35: bookmakerOdds?.over_under_35?.over > 0 && bookmakerOdds?.over_under_35?.under > 0,
        gg_ng: bookmakerOdds?.gg_ng?.gg > 0 && bookmakerOdds?.gg_ng?.ng > 0,
        double_chance: bookmakerOdds?.double_chance?.['1x'] > 0 && bookmakerOdds?.double_chance?.['12'] > 0 && bookmakerOdds?.double_chance?.['2x'] > 0
      }
    });

    // Helper function to create value bet entry
    const createValueBet = (edge: number, trueProbability: number, bookmakerOdd: number) => ({
      edge: edge * 100,
      true_odds: 1 / trueProbability,
      bookmaker_odds: bookmakerOdd,
      true_probability: trueProbability,
      confidence: edge > 0.15 ? 'High' : edge > 0.05 ? 'Medium' : 'Low'
    });

    // === FULL TIME MARKETS ===

    // 1X2 Full Time
    if (bookmakerOdds?.['1x2_ft']) {
      const homeEdge = (probabilities.match_outcomes.home_win * bookmakerOdds['1x2_ft'].home) - 1;
      const drawEdge = (probabilities.match_outcomes.draw * bookmakerOdds['1x2_ft'].draw) - 1;
      const awayEdge = (probabilities.match_outcomes.away_win * bookmakerOdds['1x2_ft'].away) - 1;

      if (homeEdge > EDGE_THRESHOLD) {
        valueBets['1x2_ft'] = valueBets['1x2_ft'] || {};
        valueBets['1x2_ft']['home'] = createValueBet(homeEdge, probabilities.match_outcomes.home_win, bookmakerOdds['1x2_ft'].home);
      }
      if (drawEdge > EDGE_THRESHOLD) {
        valueBets['1x2_ft'] = valueBets['1x2_ft'] || {};
        valueBets['1x2_ft']['draw'] = createValueBet(drawEdge, probabilities.match_outcomes.draw, bookmakerOdds['1x2_ft'].draw);
      }
      if (awayEdge > EDGE_THRESHOLD) {
        valueBets['1x2_ft'] = valueBets['1x2_ft'] || {};
        valueBets['1x2_ft']['away'] = createValueBet(awayEdge, probabilities.match_outcomes.away_win, bookmakerOdds['1x2_ft'].away);
      }
    }

    // Over/Under 2.5
    if (bookmakerOdds?.over_under_25) {
      const overEdge = (probabilities.over_under_25.over * bookmakerOdds.over_under_25.over) - 1;
      const underEdge = (probabilities.over_under_25.under * bookmakerOdds.over_under_25.under) - 1;

      if (overEdge > EDGE_THRESHOLD) {
        valueBets['over_under_25'] = valueBets['over_under_25'] || {};
        valueBets['over_under_25']['over'] = createValueBet(overEdge, probabilities.over_under_25.over, bookmakerOdds.over_under_25.over);
      }
      if (underEdge > EDGE_THRESHOLD) {
        valueBets['over_under_25'] = valueBets['over_under_25'] || {};
        valueBets['over_under_25']['under'] = createValueBet(underEdge, probabilities.over_under_25.under, bookmakerOdds.over_under_25.under);
      }
    }

    // Over/Under 3.0
    if (bookmakerOdds?.over_under_3 && bookmakerOdds.over_under_3.over > 0 && bookmakerOdds.over_under_3.under > 0) {
      // Approximate probabilities based on goal distribution
      const over3Prob = probabilities.goal_ranges?.range_4_6 + probabilities.goal_ranges?.range_7_plus || 0.4;
      const under3Prob = 1 - over3Prob;
      
      const overEdge = (over3Prob * bookmakerOdds.over_under_3.over) - 1;
      const underEdge = (under3Prob * bookmakerOdds.over_under_3.under) - 1;

      if (overEdge > EDGE_THRESHOLD) {
        valueBets['over_under_3'] = valueBets['over_under_3'] || {};
        valueBets['over_under_3']['over'] = createValueBet(overEdge, over3Prob, bookmakerOdds.over_under_3.over);
      }
      if (underEdge > EDGE_THRESHOLD) {
        valueBets['over_under_3'] = valueBets['over_under_3'] || {};
        valueBets['over_under_3']['under'] = createValueBet(underEdge, under3Prob, bookmakerOdds.over_under_3.under);
      }
    }

    // Over/Under 3.5
    if (bookmakerOdds?.over_under_35 && bookmakerOdds.over_under_35.over > 0 && bookmakerOdds.over_under_35.under > 0) {
      // Approximate probabilities based on goal distribution
      const over35Prob = probabilities.goal_ranges?.range_4_6 + probabilities.goal_ranges?.range_7_plus || 0.3;
      const under35Prob = 1 - over35Prob;
      
      const overEdge = (over35Prob * bookmakerOdds.over_under_35.over) - 1;
      const underEdge = (under35Prob * bookmakerOdds.over_under_35.under) - 1;

      if (overEdge > EDGE_THRESHOLD) {
        valueBets['over_under_35'] = valueBets['over_under_35'] || {};
        valueBets['over_under_35']['over'] = createValueBet(overEdge, over35Prob, bookmakerOdds.over_under_35.over);
      }
      if (underEdge > EDGE_THRESHOLD) {
        valueBets['over_under_35'] = valueBets['over_under_35'] || {};
        valueBets['over_under_35']['under'] = createValueBet(underEdge, under35Prob, bookmakerOdds.over_under_35.under);
      }
    }

    // Both Teams to Score (GG/NG)
    if (bookmakerOdds?.gg_ng && bookmakerOdds.gg_ng.gg > 0 && bookmakerOdds.gg_ng.ng > 0) {
      // Approximate BTTS probability (both teams score > 0)
      const bttsProb = probabilities.btts_probability || 0.6; // Fallback approximation
      const noBttsProb = 1 - bttsProb;
      
      const ggEdge = (bttsProb * bookmakerOdds.gg_ng.gg) - 1;
      const ngEdge = (noBttsProb * bookmakerOdds.gg_ng.ng) - 1;

      if (ggEdge > EDGE_THRESHOLD) {
        valueBets['gg_ng'] = valueBets['gg_ng'] || {};
        valueBets['gg_ng']['gg'] = createValueBet(ggEdge, bttsProb, bookmakerOdds.gg_ng.gg);
      }
      if (ngEdge > EDGE_THRESHOLD) {
        valueBets['gg_ng'] = valueBets['gg_ng'] || {};
        valueBets['gg_ng']['ng'] = createValueBet(ngEdge, noBttsProb, bookmakerOdds.gg_ng.ng);
      }
    }

    // Double Chance
    if (bookmakerOdds?.double_chance && bookmakerOdds.double_chance['1x'] > 0 && bookmakerOdds.double_chance['12'] > 0 && bookmakerOdds.double_chance['2x'] > 0) {
      const homeOrDrawProb = probabilities.match_outcomes.home_win + probabilities.match_outcomes.draw;
      const homeOrAwayProb = probabilities.match_outcomes.home_win + probabilities.match_outcomes.away_win;
      const awayOrDrawProb = probabilities.match_outcomes.away_win + probabilities.match_outcomes.draw;
      
      const edge1x = (homeOrDrawProb * bookmakerOdds.double_chance['1x']) - 1;
      const edge12 = (homeOrAwayProb * bookmakerOdds.double_chance['12']) - 1;
      const edge2x = (awayOrDrawProb * bookmakerOdds.double_chance['2x']) - 1;

      if (edge1x > EDGE_THRESHOLD) {
        valueBets['double_chance'] = valueBets['double_chance'] || {};
        valueBets['double_chance']['1x'] = createValueBet(edge1x, homeOrDrawProb, bookmakerOdds.double_chance['1x']);
      }
      if (edge12 > EDGE_THRESHOLD) {
        valueBets['double_chance'] = valueBets['double_chance'] || {};
        valueBets['double_chance']['12'] = createValueBet(edge12, homeOrAwayProb, bookmakerOdds.double_chance['12']);
      }
      if (edge2x > EDGE_THRESHOLD) {
        valueBets['double_chance'] = valueBets['double_chance'] || {};
        valueBets['double_chance']['2x'] = createValueBet(edge2x, awayOrDrawProb, bookmakerOdds.double_chance['2x']);
      }
    }

    // Asian Handicap +0 (Draw No Bet)
    if (bookmakerOdds?.asian_handicap_0) {
      const ahHomeProb = probabilities.asian_handicap_0?.home || probabilities.match_outcomes.home_win;
      const ahAwayProb = probabilities.asian_handicap_0?.away || probabilities.match_outcomes.away_win;

      const homeEdge = (ahHomeProb * bookmakerOdds.asian_handicap_0.home) - 1;
      const awayEdge = (ahAwayProb * bookmakerOdds.asian_handicap_0.away) - 1;

      if (homeEdge > EDGE_THRESHOLD) {
        valueBets['asian_handicap_0'] = valueBets['asian_handicap_0'] || {};
        valueBets['asian_handicap_0']['home'] = createValueBet(homeEdge, ahHomeProb, bookmakerOdds.asian_handicap_0.home);
      }
      if (awayEdge > EDGE_THRESHOLD) {
        valueBets['asian_handicap_0'] = valueBets['asian_handicap_0'] || {};
        valueBets['asian_handicap_0']['away'] = createValueBet(awayEdge, ahAwayProb, bookmakerOdds.asian_handicap_0.away);
      }
    }

    // Asian Handicap -1/+1
    if (bookmakerOdds?.asian_handicap_minus1_plus1) {
      // Home -1 needs to win by 2+ goals, Away +1 wins if loses by 0 or wins
      const homeMinus1Prob = 0.3; // Approximation
      const awayPlus1Prob = 0.7;

      const homeEdge = (homeMinus1Prob * bookmakerOdds.asian_handicap_minus1_plus1.home) - 1;
      const awayEdge = (awayPlus1Prob * bookmakerOdds.asian_handicap_minus1_plus1.away) - 1;

      if (homeEdge > EDGE_THRESHOLD) {
        valueBets['asian_handicap_minus1_plus1'] = valueBets['asian_handicap_minus1_plus1'] || {};
        valueBets['asian_handicap_minus1_plus1']['home'] = createValueBet(homeEdge, homeMinus1Prob, bookmakerOdds.asian_handicap_minus1_plus1.home);
      }
      if (awayEdge > EDGE_THRESHOLD) {
        valueBets['asian_handicap_minus1_plus1'] = valueBets['asian_handicap_minus1_plus1'] || {};
        valueBets['asian_handicap_minus1_plus1']['away'] = createValueBet(awayEdge, awayPlus1Prob, bookmakerOdds.asian_handicap_minus1_plus1.away);
      }
    }

    // Asian Handicap +1/-1
    if (bookmakerOdds?.asian_handicap_plus1_minus1) {
      // Home +1 wins if loses by 0 or wins, Away -1 needs to win by 2+ goals
      const homePlus1Prob = 0.7; // Approximation
      const awayMinus1Prob = 0.3;

      const homeEdge = (homePlus1Prob * bookmakerOdds.asian_handicap_plus1_minus1.home) - 1;
      const awayEdge = (awayMinus1Prob * bookmakerOdds.asian_handicap_plus1_minus1.away) - 1;

      if (homeEdge > EDGE_THRESHOLD) {
        valueBets['asian_handicap_plus1_minus1'] = valueBets['asian_handicap_plus1_minus1'] || {};
        valueBets['asian_handicap_plus1_minus1']['home'] = createValueBet(homeEdge, homePlus1Prob, bookmakerOdds.asian_handicap_plus1_minus1.home);
      }
      if (awayEdge > EDGE_THRESHOLD) {
        valueBets['asian_handicap_plus1_minus1'] = valueBets['asian_handicap_plus1_minus1'] || {};
        valueBets['asian_handicap_plus1_minus1']['away'] = createValueBet(awayEdge, awayMinus1Prob, bookmakerOdds.asian_handicap_plus1_minus1.away);
      }
    }

    // === HALF TIME MARKETS ===

    // 1X2 Half Time
    if (bookmakerOdds?.['1x2_ht']) {
      // Approximate HT probabilities (less decisive than FT)
      const htHomeProb = probabilities.match_outcomes.home_win * 0.6; // Reduced probability for HT
      const htDrawProb = 0.5; // Higher draw probability at HT
      const htAwayProb = probabilities.match_outcomes.away_win * 0.6;

      const homeEdge = (htHomeProb * bookmakerOdds['1x2_ht'].home) - 1;
      const drawEdge = (htDrawProb * bookmakerOdds['1x2_ht'].draw) - 1;
      const awayEdge = (htAwayProb * bookmakerOdds['1x2_ht'].away) - 1;

      if (homeEdge > EDGE_THRESHOLD) {
        valueBets['1x2_ht'] = valueBets['1x2_ht'] || {};
        valueBets['1x2_ht']['home'] = createValueBet(homeEdge, htHomeProb, bookmakerOdds['1x2_ht'].home);
      }
      if (drawEdge > EDGE_THRESHOLD) {
        valueBets['1x2_ht'] = valueBets['1x2_ht'] || {};
        valueBets['1x2_ht']['draw'] = createValueBet(drawEdge, htDrawProb, bookmakerOdds['1x2_ht'].draw);
      }
      if (awayEdge > EDGE_THRESHOLD) {
        valueBets['1x2_ht'] = valueBets['1x2_ht'] || {};
        valueBets['1x2_ht']['away'] = createValueBet(awayEdge, htAwayProb, bookmakerOdds['1x2_ht'].away);
      }
    }

    // Asian Handicap +0 Half Time
    if (bookmakerOdds?.asian_handicap_0_ht) {
      const htHomeProb = probabilities.match_outcomes.home_win * 0.6;
      const htAwayProb = probabilities.match_outcomes.away_win * 0.6;

      const homeEdge = (htHomeProb * bookmakerOdds.asian_handicap_0_ht.home) - 1;
      const awayEdge = (htAwayProb * bookmakerOdds.asian_handicap_0_ht.away) - 1;

      if (homeEdge > EDGE_THRESHOLD) {
        valueBets['asian_handicap_0_ht'] = valueBets['asian_handicap_0_ht'] || {};
        valueBets['asian_handicap_0_ht']['home'] = createValueBet(homeEdge, htHomeProb, bookmakerOdds.asian_handicap_0_ht.home);
      }
      if (awayEdge > EDGE_THRESHOLD) {
        valueBets['asian_handicap_0_ht'] = valueBets['asian_handicap_0_ht'] || {};
        valueBets['asian_handicap_0_ht']['away'] = createValueBet(awayEdge, htAwayProb, bookmakerOdds.asian_handicap_0_ht.away);
      }
    }

    // Over/Under 1.5 Half Time
    if (bookmakerOdds?.over_under_15_ht) {
      // Approximate HT goal probabilities
      const htOver15Prob = 0.4; // Lower probability for HT goals
      const htUnder15Prob = 0.6;

      const overEdge = (htOver15Prob * bookmakerOdds.over_under_15_ht.over) - 1;
      const underEdge = (htUnder15Prob * bookmakerOdds.over_under_15_ht.under) - 1;

      if (overEdge > EDGE_THRESHOLD) {
        valueBets['over_under_15_ht'] = valueBets['over_under_15_ht'] || {};
        valueBets['over_under_15_ht']['over'] = createValueBet(overEdge, htOver15Prob, bookmakerOdds.over_under_15_ht.over);
      }
      if (underEdge > EDGE_THRESHOLD) {
        valueBets['over_under_15_ht'] = valueBets['over_under_15_ht'] || {};
        valueBets['over_under_15_ht']['under'] = createValueBet(underEdge, htUnder15Prob, bookmakerOdds.over_under_15_ht.under);
      }
    }

    // === LEGACY SUPPORT ===
    
    // Goal Ranges markets (legacy support)
    if (bookmakerOdds?.goal_ranges) {
      const ranges = ['no_goals', 'range_0_1', 'range_2_3', 'range_4_6', 'range_7_plus'];
      
      ranges.forEach(range => {
        if (bookmakerOdds.goal_ranges[range] && probabilities.goal_ranges?.[range]) {
          const edge = (probabilities.goal_ranges[range] * bookmakerOdds.goal_ranges[range]) - 1;
          
          if (edge > EDGE_THRESHOLD) {
            valueBets['goal_ranges'] = valueBets['goal_ranges'] || {};
            valueBets['goal_ranges'][range] = createValueBet(edge, probabilities.goal_ranges[range], bookmakerOdds.goal_ranges[range]);
          }
        }
      });
    }

    return valueBets;
  }

  // Main simulation function
  simulate(data: any): SimulationResults {
    console.log('🚀 Starting Enhanced Monte Carlo simulation with Chaos Engine...');
    
    const iterations = data.iterations || 100000;
    
    // Chaos configuration setup
    const chaosConfig: ChaosConfig = data.chaos_config ? 
      ChaosConfigValidator.sanitizeConfig(data.chaos_config) : 
      DEFAULT_CHAOS_CONFIG;
    
    console.log('[CHAOS] Configuration:', {
      enabled: chaosConfig.enabled,
      levy_intensity: chaosConfig.levyFlights.intensity,
      fractal_intensity: chaosConfig.fractalVariance.intensity,
      shock_probabilities: chaosConfig.stochasticShocks
    });
    
    // Enhanced boost settings logging
    console.log('[DEBUG] Received simulation data structure:', Object.keys(data));
    console.log('[DEBUG] Received boost settings:', JSON.stringify(data.boost_settings, null, 2));
    console.log('[DEBUG] Historical data structure:', {
      h2h_count: data.historical_data?.h2h?.length || 0,
      home_home_count: data.historical_data?.home_home?.length || 0,
      away_away_count: data.historical_data?.away_away?.length || 0
    });
    
    // 🧠 REVOLUTIONARY PATTERN-BASED REVERSION: Use pattern analysis for personalized thresholds
    const reversionConfig: ReversionConfig = this.generatePatternSpecificReversionConfig(data);
    let reversionAnalysis: ReversionAnalysisResult | null = null;
    let usePatternFirstApproach = false;
    
    // PHASE 1: Pre-analyze patterns to determine calculation strategy
    if (reversionConfig.globalEnabled && data.historical_data) {
      console.log('[REVERSION] ✅ Mean Reversion ENABLED - running pattern analysis...');
      console.log('[SMART-LOGIC] 🔍 Pre-analyzing patterns to determine calculation strategy...');
      
      try {
        reversionAnalysis = ReversionAnalyzer.analyzeAllPatterns(
          data.historical_data.home_home || [],
          data.historical_data.away_away || [],
          data.historical_data.h2h || [],
          data.home_team_id || 0,
          data.away_team_id || 0,
          reversionConfig
        );
        
        // Determine if significant patterns warrant pattern-first approach
        const significantPatterns = reversionAnalysis.highConfidencePatterns;
        const totalAdjustmentMagnitude = Math.abs(reversionAnalysis.totalHomeLambdaAdjustment) + 
                                       Math.abs(reversionAnalysis.totalAwayLambdaAdjustment);
        
        // Use pattern-first approach if we have significant patterns with meaningful adjustments
        usePatternFirstApproach = significantPatterns >= 2 || totalAdjustmentMagnitude > 0.15;
        
        console.log(`[SMART-LOGIC] 📊 Analysis: ${significantPatterns} high-confidence patterns, total adjustment: ${totalAdjustmentMagnitude.toFixed(3)}`);
        console.log(`[SMART-LOGIC] 🎯 Strategy: ${usePatternFirstApproach ? 'PATTERN-FIRST' : 'BALANCED-WEIGHTED'} approach selected`);
        
      } catch (error) {
        console.error('[SMART-LOGIC] ❌ Pattern pre-analysis failed, defaulting to weighted approach:', error);
        usePatternFirstApproach = false;
      }
    } else if (!reversionConfig.globalEnabled) {
      console.log('[REVERSION] ❌ Mean Reversion DISABLED by user - no pattern analysis will run');
    }
    
    // PHASE 2: Calculate base lambdas using chosen strategy
    let baseHomeLambda: number;
    let baseAwayLambda: number;
    
    if (usePatternFirstApproach) {
      // PATTERN-FIRST MODE: Use raw data to preserve extreme patterns for reversion
      console.log('[SMART-LOGIC] 🎯 Using PATTERN-FIRST calculation (raw data preservation)');
      const rawResult = this.calculateLambdasRaw(data.historical_data, data.boost_settings, true);
      baseHomeLambda = rawResult.homeLambda;
      baseAwayLambda = rawResult.awayLambda;
    } else {
      // BALANCED MODE: Use weighted approach for stability
      console.log('[SMART-LOGIC] ⚖️ Using BALANCED-WEIGHTED calculation (stability focus)');
      const weightedResult = this.calculateLambdas(data.historical_data, data.boost_settings, true);
      baseHomeLambda = weightedResult.homeLambda;
      baseAwayLambda = weightedResult.awayLambda;
    }
    
    // Calculate streak-based win rate adjustments separately
    const { homeWinRateAdjustment, awayWinRateAdjustment } = this.calculateStreakWinRateAdjustments(data.historical_data, data.boost_settings);
    
    // PHASE 3: Apply reversion adjustments to chosen base lambdas
    let finalHomeLambda = baseHomeLambda;
    let finalAwayLambda = baseAwayLambda;
    let finalHomeWinRateAdjustment = homeWinRateAdjustment;
    let finalAwayWinRateAdjustment = awayWinRateAdjustment;
    
    if (reversionAnalysis) {
      console.log('[REVERSION] 🔄 Applying Mean Reversion adjustments to base lambdas...');
      
      try {
        // Apply lambda adjustments from reversion analysis
        finalHomeLambda = Math.max(0.1, baseHomeLambda + reversionAnalysis.totalHomeLambdaAdjustment);
        finalAwayLambda = Math.max(0.1, baseAwayLambda + reversionAnalysis.totalAwayLambdaAdjustment);
        
        // Apply win probability adjustments
        finalHomeWinRateAdjustment += reversionAnalysis.totalHomeWinProbAdjustment;
        finalAwayWinRateAdjustment += reversionAnalysis.totalAwayWinProbAdjustment;
        
        console.log('[REVERSION] 📊 Analysis Results:', {
          patterns_detected: reversionAnalysis.patternsDetected,
          high_confidence: reversionAnalysis.highConfidencePatterns,
          home_lambda_adjustment: reversionAnalysis.totalHomeLambdaAdjustment.toFixed(3),
          away_lambda_adjustment: reversionAnalysis.totalAwayLambdaAdjustment.toFixed(3),
          home_win_prob_adjustment: reversionAnalysis.totalHomeWinProbAdjustment.toFixed(3),
          away_win_prob_adjustment: reversionAnalysis.totalAwayWinProbAdjustment.toFixed(3)
        });
        
        // Log detected patterns
        [...reversionAnalysis.homeAdjustments, ...reversionAnalysis.awayAdjustments].forEach(pattern => {
          console.log(`[REVERSION] 🎯 Pattern: ${pattern.type} | Strength: ${(pattern.patternStrength * 100).toFixed(1)}% | Adjustment: ${pattern.reversionAdjustment >= 0 ? '+' : ''}${pattern.reversionAdjustment.toFixed(3)} | Confidence: ${(pattern.confidence * 100).toFixed(1)}%`);
          console.log(`[REVERSION] 💬 ${pattern.message}`);
        });
        
      } catch (error) {
        console.error('[REVERSION] ❌ Error in reversion analysis:', error);
        // Continue with original values if reversion fails
      }
    } else {
      console.log('[REVERSION] ⏸️ Mean Reversion Analysis disabled or insufficient data');
    }
    
    console.log(`Final lambdas (with reversion): Home: ${finalHomeLambda.toFixed(3)}, Away: ${finalAwayLambda.toFixed(3)}`);
    console.log(`Final win rate adjustments: Home: ${(finalHomeWinRateAdjustment >= 0 ? '+' : '')}${(finalHomeWinRateAdjustment * 100).toFixed(1)}%, Away: ${(finalAwayWinRateAdjustment >= 0 ? '+' : '')}${(finalAwayWinRateAdjustment * 100).toFixed(1)}%`);

    let homeWins = 0;
    let draws = 0;
    let awayWins = 0;
    let totalHomeGoals = 0;
    let totalAwayGoals = 0;
    let over15 = 0, over25 = 0, over30 = 0, over35 = 0, over45 = 0;
    let exactly30 = 0; // Track exactly 3 goals for Over/Under 3.0 push scenarios
    let bttsYes = 0;
    
    // Asian Handicap +0 (Draw No Bet) - home/away wins only
    let ahHomeWins = 0;
    let ahAwayWins = 0;
    
    // Goal range counters
    let range01 = 0;        // 0-1 goals
    let range23 = 0;        // 2-3 goals
    let range46 = 0;        // 4-6 goals
    let range7Plus = 0;     // 7+ goals

    // Chaos tracking variables
    let levyFlightsTriggered = 0;
    let fractalVarianceSum = 0;
    let stochasticShocksApplied = 0;
    
    // 🚀 NEW: Store all match results for comprehensive market analysis
    const matchResults: MatchResult[] = [];

    // Run Enhanced Monte Carlo simulation with Chaos Engine + Mean Reversion
    for (let i = 0; i < iterations; i++) {
      let homeLambda = finalHomeLambda; // Use reversion-adjusted lambdas
      let awayLambda = finalAwayLambda;
      
      // 🎯 APPLY MATHEMATICAL CHAOS THEORIES
      if (chaosConfig.enabled) {
        
        // 1. STOCHASTIC SHOCK THEORY (discrete random events)
        if (chaosConfig.stochasticShocks.enabled) {
          const shockResult = ChaosEngine.applyStochasticShocks(
            homeLambda, 
            awayLambda, 
            chaosConfig.stochasticShocks
          );
          
          // Track if shocks were applied
          if (shockResult.homeLambda !== homeLambda || shockResult.awayLambda !== awayLambda) {
            stochasticShocksApplied++;
          }
          
          homeLambda = shockResult.homeLambda;
          awayLambda = shockResult.awayLambda;
        }
        
        // 2. FRACTAL VARIANCE THEORY (self-similar patterns)
        if (chaosConfig.fractalVariance.enabled) {
          const randomSeed = Math.random();
          const fractalNoise = ChaosEngine.generateFractalNoise(
            randomSeed, 
            chaosConfig.fractalVariance.intensity
          );
          
          // Track fractal variance impact
          fractalVarianceSum += Math.abs(fractalNoise);
          
          // Apply fractal patterns to both teams
          homeLambda *= (1 + fractalNoise);
          awayLambda *= (1 + fractalNoise);
        }
      }
      
      // Generate goals using potentially modified lambdas
      let homeGoals = this.poissonRandom(homeLambda);
      let awayGoals = this.poissonRandom(awayLambda);
      
      // 3. LEVY FLIGHT DISTRIBUTIONS (rare impactful events)
      if (chaosConfig.enabled && chaosConfig.levyFlights.enabled) {
        const originalHomeGoals = homeGoals;
        const originalAwayGoals = awayGoals;
        
        const homeWithLevy = ChaosEngine.applyLevyFlightToGoals(
          homeGoals, 
          chaosConfig.levyFlights.intensity
        );
        const awayWithLevy = ChaosEngine.applyLevyFlightToGoals(
          awayGoals, 
          chaosConfig.levyFlights.intensity
        );
        
        homeGoals = Math.round(homeWithLevy);
        awayGoals = Math.round(awayWithLevy);
        
        // Track Levy flight applications (before rounding to detect actual changes)
        if (homeWithLevy !== originalHomeGoals || awayWithLevy !== originalAwayGoals) {
          levyFlightsTriggered++;
        }
      }
      
      totalHomeGoals += homeGoals;
      totalAwayGoals += awayGoals;
      
      const totalGoals = homeGoals + awayGoals;
      
      // 🚀 Store match result for comprehensive market analysis
      matchResults.push({ homeGoals, awayGoals });
      
      // Match outcomes
      if (homeGoals > awayGoals) homeWins++;
      else if (homeGoals < awayGoals) awayWins++;
      else draws++;
      
      // Asian Handicap +0 (Draw No Bet - draws are refunded)
      if (homeGoals > awayGoals) ahHomeWins++;
      else if (awayGoals > homeGoals) ahAwayWins++;
      // Draws don't count for AH+0
      
      // COMPREHENSIVE OVER/UNDER COUNTING - CORRECT DEFINITIONS
      if (totalGoals > 1.5) over15++;  // Over 1.5: 2+ goals
      if (totalGoals > 2.5) over25++;  // Over 2.5: 3+ goals
      
      // ASIAN OVER 3.0: Wins with 4+ goals, Push with exactly 3, Loses with 0-2
      if (totalGoals > 3) over30++;    // Over 3.0: 4+ goals (excludes exactly 3 = push)
      
      // EUROPEAN OVER 3.5: Wins with 4+ goals, Loses with 0-3
      if (totalGoals > 3.5) over35++;  // Over 3.5: 4+ goals
      if (totalGoals > 4.5) over45++;  // Over 4.5: 5+ goals
      
      // Track exactly 3.0 goals for push scenarios
      if (totalGoals === 3) exactly30++;
      
      // Both Teams to Score (BTTS/GG-NG)
      if (homeGoals > 0 && awayGoals > 0) bttsYes++;
      
      // Goal ranges counting
      if (totalGoals <= 1) {
        range01++;
      } else if (totalGoals <= 3) {
        range23++;
      } else if (totalGoals <= 6) {
        range46++;
      } else {
        range7Plus++;
      }
    }

    // Calculate base probabilities from simulation
    let baseProbabilities = {
      home_win: homeWins / iterations,
      draw: draws / iterations,
      away_win: awayWins / iterations,
    };

    // Apply win rate adjustments from streak analysis + mean reversion
    const adjustedMatchOutcomes = this.applyWinRateAdjustments(baseProbabilities, finalHomeWinRateAdjustment, finalAwayWinRateAdjustment);

    // Calculate probabilities - COMPREHENSIVE structure with ALL markets
    const probabilities = {
      match_outcomes: adjustedMatchOutcomes,
      
      // INTERFACE-COMPATIBLE goal_markets structure
      goal_markets: {
        over_1_5: over15 / iterations,
        under_1_5: (iterations - over15) / iterations,
        over_2_5: over25 / iterations,
        under_2_5: (iterations - over25) / iterations,
        over_3_0: over30 / iterations,  // Asian Over 3.0: wins with 4+ goals only
        under_3_0: (iterations - over30 - exactly30) / iterations,  // Asian Under 3.0: wins with 0-2 goals (excludes 3-goal push)
        push_3_0: exactly30 / iterations,
        over_3_5: over35 / iterations,
        under_3_5: (iterations - over35) / iterations,
        over_4_5: over45 / iterations,
        under_4_5: (iterations - over45) / iterations,
      },
      
      // INTERFACE-COMPATIBLE btts structure  
      btts: {
        yes: bttsYes / iterations,
        no: (iterations - bttsYes) / iterations,
      },
      
      // COMPREHENSIVE OVER/UNDER MARKETS (for display compatibility)
      over_under_15: {
        over: over15 / iterations,
        under: (iterations - over15) / iterations,
      },
      over_under_25: {
        over: over25 / iterations,
        under: (iterations - over25) / iterations,
      },
      over_under_3: {
        over: over30 / iterations,  // Asian Over 3.0: wins with 4+ goals only
        under: (iterations - over30 - exactly30) / iterations,  // Asian Under 3.0: wins with 0-2 goals (excludes push)
        push: exactly30 / iterations,  // Asian 3.0 push probability on exactly 3 goals
      },
      over_under_35: {
        over: over35 / iterations,
        under: (iterations - over35) / iterations,
      },
      over_under_45: {
        over: over45 / iterations,
        under: (iterations - over45) / iterations,
      },
      
      // BOTH TEAMS TO SCORE (GG/NG) - for display compatibility
      gg_ng: {
        gg: bttsYes / iterations,
        ng: (iterations - bttsYes) / iterations,
      },
      
      // DOUBLE CHANCE MARKETS (calculated from match outcomes)
      double_chance: {
        dc_1x: adjustedMatchOutcomes.home_win + adjustedMatchOutcomes.draw, // Home or Draw
        dc_12: adjustedMatchOutcomes.home_win + adjustedMatchOutcomes.away_win, // Home or Away
        dc_x2: adjustedMatchOutcomes.draw + adjustedMatchOutcomes.away_win, // Draw or Away
      },
      
      // ASIAN HANDICAP MARKETS
      asian_handicap_0: {
        home: ahHomeWins / (ahHomeWins + ahAwayWins), // Exclude draws
        away: ahAwayWins / (ahHomeWins + ahAwayWins),
      },
      // For AH -1/+1 and +1/-1, use approximations based on match outcomes
      asian_handicap_minus1_plus1: {
        home: adjustedMatchOutcomes.home_win * 0.85, // Home wins by 2+ goals (approximate)
        away: adjustedMatchOutcomes.away_win * 1.1 + adjustedMatchOutcomes.draw * 0.5, // Away +1 covers draws
      },
      asian_handicap_plus1_minus1: {
        home: adjustedMatchOutcomes.home_win * 1.1 + adjustedMatchOutcomes.draw * 0.5, // Home +1 covers draws
        away: adjustedMatchOutcomes.away_win * 0.85, // Away wins by 2+ goals (approximate)
      },
      
      // HALF-TIME MARKETS (approximations based on full-time results)
      '1x2_ht': {
        home: adjustedMatchOutcomes.home_win * 0.6, // Roughly 60% of FT home wins lead at HT
        draw: adjustedMatchOutcomes.draw * 1.5 + adjustedMatchOutcomes.home_win * 0.2 + adjustedMatchOutcomes.away_win * 0.2, // Higher HT draw probability
        away: adjustedMatchOutcomes.away_win * 0.6, // Roughly 60% of FT away wins lead at HT
      },
      asian_handicap_0_ht: {
        home: adjustedMatchOutcomes.home_win * 0.65, // HT home advantage
        away: adjustedMatchOutcomes.away_win * 0.65, // HT away advantage
      },
      over_under_15_ht: {
        over: over15 / iterations * 0.45, // Roughly 45% of FT over 1.5 happens in HT
        under: 1 - (over15 / iterations * 0.45),
      },
      
      // LEGACY GOAL RANGES
      goal_ranges: {
        range_0_1: range01 / iterations,
        range_2_3: range23 / iterations,
        range_4_6: range46 / iterations,
        range_7_plus: range7Plus / iterations,
      },
    };

    // Calculate true odds - COMPREHENSIVE structure with ALL markets
    const true_odds = {
      '1x2_ft': {
        home: this.safeCalculateOdds(probabilities.match_outcomes.home_win),
        draw: this.safeCalculateOdds(probabilities.match_outcomes.draw),
        away: this.safeCalculateOdds(probabilities.match_outcomes.away_win),
      },
      over_under_25: {
        over: this.safeCalculateOdds(probabilities.over_under_25.over),
        under: this.safeCalculateOdds(probabilities.over_under_25.under),
      },
      // COMPREHENSIVE MARKETS - ADDED ALL MISSING MARKETS
      over_under_3: {
        over: this.safeCalculateOdds(this.calculateAsianEquivalentProbability(probabilities.over_under_3.over, probabilities.over_under_3.push)),
        under: this.safeCalculateOdds(this.calculateAsianEquivalentProbability(probabilities.over_under_3.under, probabilities.over_under_3.push)),
      },
      over_under_35: {
        over: this.safeCalculateOdds(probabilities.over_under_35.over),
        under: this.safeCalculateOdds(probabilities.over_under_35.under),
      },
      gg_ng: {
        gg: this.safeCalculateOdds(probabilities.gg_ng.gg),
        ng: this.safeCalculateOdds(probabilities.gg_ng.ng),
      },
      double_chance: {
        dc_1x: this.safeCalculateOdds(probabilities.double_chance.dc_1x),
        dc_12: this.safeCalculateOdds(probabilities.double_chance.dc_12),
        dc_x2: this.safeCalculateOdds(probabilities.double_chance.dc_x2),
      },
      asian_handicap_minus1_plus1: {
        home: this.safeCalculateOdds(probabilities.asian_handicap_minus1_plus1.home),
        away: this.safeCalculateOdds(probabilities.asian_handicap_minus1_plus1.away),
      },
      asian_handicap_plus1_minus1: {
        home: this.safeCalculateOdds(probabilities.asian_handicap_plus1_minus1.home),
        away: this.safeCalculateOdds(probabilities.asian_handicap_plus1_minus1.away),
      },
      // HALF TIME MARKETS
      '1x2_ht': {
        home: this.safeCalculateOdds(probabilities['1x2_ht'].home),
        draw: this.safeCalculateOdds(probabilities['1x2_ht'].draw),
        away: this.safeCalculateOdds(probabilities['1x2_ht'].away),
      },
      asian_handicap_0_ht: {
        home: this.safeCalculateOdds(probabilities.asian_handicap_0_ht.home),
        away: this.safeCalculateOdds(probabilities.asian_handicap_0_ht.away),
      },
      over_under_15_ht: {
        over: this.safeCalculateOdds(probabilities.over_under_15_ht.over),
        under: this.safeCalculateOdds(probabilities.over_under_15_ht.under),
      },
      // LEGACY MARKETS
      goal_ranges: {
        range_0_1: this.safeCalculateOdds(probabilities.goal_ranges.range_0_1),
        range_2_3: this.safeCalculateOdds(probabilities.goal_ranges.range_2_3),
        range_4_6: this.safeCalculateOdds(probabilities.goal_ranges.range_4_6),
        range_7_plus: this.safeCalculateOdds(probabilities.goal_ranges.range_7_plus),
      },
      asian_handicap_0: {
        home: this.safeCalculateOdds(probabilities.asian_handicap_0.home),
        away: this.safeCalculateOdds(probabilities.asian_handicap_0.away),
      },
    };

    // Calculate value bets
    const value_bets = this.calculateValueBets(probabilities, data.bookmaker_odds);

    // Calculate basic RPS score approximation
    const rpsScore = this.calculateSimpleRPS(probabilities);
    
    // Calculate confidence based on iterations and match balance
    const confidenceScore = this.calculateConfidence(iterations, data);

    // 🚀 REVOLUTIONARY: Calculate ALL possible goal-based betting markets
    console.log('🎯 COMPREHENSIVE MARKET ANALYSIS: Calculating all goal-based betting markets...');
    const comprehensiveMarkets = this.calculateComprehensiveMarkets(
      homeWins, draws, awayWins,
      totalHomeGoals, totalAwayGoals, iterations,
      matchResults
    );
    console.log(`✅ COMPREHENSIVE MARKETS: Calculated ${Object.keys(comprehensiveMarkets.main_markets).length + Object.keys(comprehensiveMarkets.goals_markets.over_under).length + Object.keys(comprehensiveMarkets.asian_markets.handicap_lines).length}+ markets automatically`);

    const results: SimulationResults = {
      probabilities,
      true_odds,
      avg_home_goals: totalHomeGoals / iterations,
      avg_away_goals: totalAwayGoals / iterations,
      avg_total_goals: (totalHomeGoals + totalAwayGoals) / iterations,
      value_bets,
      comprehensive_markets: comprehensiveMarkets, // NEW: All betting markets calculated automatically
      rps_score: rpsScore,
      confidence_score: confidenceScore,
      iterations: iterations,
      engine_version: chaosConfig.enabled && reversionConfig.globalEnabled ? '3.1_nodejs_chaos_reversion' : 
                   chaosConfig.enabled ? '3.0_nodejs_chaos' : 
                   reversionConfig.globalEnabled ? '3.1_nodejs_reversion' : '3.0_nodejs',
      reversion_analysis: reversionAnalysis,
      metadata: {
        iterations: iterations,
        home_lambda: baseHomeLambda,
        away_lambda: baseAwayLambda,
        simulation_time_seconds: 0,
        iterations_per_second: 0,
        calibration_optimized: false,
        engine_version: chaosConfig.enabled ? '3.0_nodejs_chaos' : '3.0_nodejs',
        expected_advantage: 'moderate',
        chaos_enabled: chaosConfig.enabled,
        chaos_config: chaosConfig,
        chaos_impact: chaosConfig.enabled ? {
          levy_flights_triggered: levyFlightsTriggered,
          fractal_variance_avg: fractalVarianceSum / iterations,
          stochastic_shocks_applied: stochasticShocksApplied
        } : undefined
      }
    };

    // 🧠 ADAPTIVE LEARNING: Record predictions for learning if we have a simulation ID
    if (data.simulation_id && reversionAnalysis && reversionAnalysis.patternsDetected > 0) {
      console.log('[ADAPTIVE-LEARNING] 📝 Recording Monte Carlo predictions for learning...');
      
      try {
        // Record predictions for each detected reversion pattern
        const allPatterns = [...reversionAnalysis.homeAdjustments, ...reversionAnalysis.awayAdjustments];
        const avgTotalGoals = results.avg_total_goals;
        
        for (const pattern of allPatterns) {
          // Map pattern types to adaptive threshold pattern names
          let adaptivePatternType = '';
          switch (pattern.type) {
            case 'home_form':
              adaptivePatternType = 'home_over_dominance';
              break;
            case 'away_form':
              adaptivePatternType = 'away_over_dominance';
              break;
            case 'h2h_overs':
              adaptivePatternType = avgTotalGoals > 2.5 ? 'h2h_over_pattern' : 'h2h_under_pattern';
              break;
            default:
              continue; // Skip patterns we don't track in adaptive learning
          }
          
          // Record the prediction for this pattern (fire-and-forget)
          adaptiveThresholdEngine.recordPrediction(
            adaptivePatternType,
            avgTotalGoals,
            pattern.confidence,
            data.simulation_id
          ).catch(error => {
            console.error('[ADAPTIVE-LEARNING] ❌ Error recording individual prediction:', error.message);
          });
        }
        
        console.log(`[ADAPTIVE-LEARNING] ✅ Recorded ${allPatterns.length} pattern predictions for future learning`);
        
      } catch (error) {
        console.error('[ADAPTIVE-LEARNING] ❌ Error recording predictions:', error.message);
      }
    }

    console.log('✅ Enhanced Monte Carlo simulation completed successfully');
    console.log(`Found ${Object.keys(value_bets).length} value betting opportunities`);
    
    // CHAOS ENGINE RESULTS
    if (chaosConfig.enabled) {
      console.log('🎯 CHAOS ENGINE IMPACT:');
      console.log(`  Levy Flights Triggered: ${levyFlightsTriggered}/${iterations} (${(levyFlightsTriggered/iterations*100).toFixed(1)}%)`);
      console.log(`  Fractal Variance Avg: ${(fractalVarianceSum/iterations).toFixed(4)}`);
      console.log(`  Stochastic Shocks Applied: ${stochasticShocksApplied}/${iterations} (${(stochasticShocksApplied/iterations*100).toFixed(1)}%)`);
      console.log(`  Overall Chaos Intensity: ${((levyFlightsTriggered + stochasticShocksApplied)/(iterations*2)*100).toFixed(1)}%`);
    } else {
      console.log('🎯 CHAOS ENGINE: Disabled (Pure H2H Analysis)');
    }
    
    // DEBUGGING: Log simplified market structure
    // 🔄 MEAN REVERSION RESULTS SUMMARY
    if (reversionAnalysis && reversionConfig.globalEnabled) {
      console.log('🔄 MEAN REVERSION ANALYSIS SUMMARY:');
      console.log(`📊 Patterns Detected: ${reversionAnalysis.patternsDetected} total (${reversionAnalysis.highConfidencePatterns} high confidence)`);
      console.log(`🎯 Lambda Adjustments Applied: Home ${reversionAnalysis.totalHomeLambdaAdjustment >= 0 ? '+' : ''}${reversionAnalysis.totalHomeLambdaAdjustment.toFixed(3)}, Away ${reversionAnalysis.totalAwayLambdaAdjustment >= 0 ? '+' : ''}${reversionAnalysis.totalAwayLambdaAdjustment.toFixed(3)}`);
      console.log(`🏆 Win Probability Adjustments: Home ${reversionAnalysis.totalHomeWinProbAdjustment >= 0 ? '+' : ''}${(reversionAnalysis.totalHomeWinProbAdjustment * 100).toFixed(1)}%, Away ${reversionAnalysis.totalAwayWinProbAdjustment >= 0 ? '+' : ''}${(reversionAnalysis.totalAwayWinProbAdjustment * 100).toFixed(1)}%`);
      
      if (reversionAnalysis.patternsDetected > 0) {
        console.log('🔍 Detected Patterns:');
        [...reversionAnalysis.homeAdjustments, ...reversionAnalysis.awayAdjustments].forEach((pattern, index) => {
          console.log(`  ${index + 1}. ${pattern.type}: ${(pattern.confidence * 100).toFixed(1)}% confidence, ${pattern.reversionAdjustment >= 0 ? '+' : ''}${pattern.reversionAdjustment.toFixed(3)} adjustment`);
        });
      }
    } else {
      console.log('🔄 Mean Reversion Analysis: DISABLED');
    }
    
    console.log('🔍 Simplified Market Structure Debug Info:');
    console.log(`Over 2.5: ${(probabilities.over_under_25.over * 100).toFixed(1)}% | True odds: ${true_odds.over_under_25.over?.toFixed(2) || 'N/A'}`);
    console.log(`Under 2.5: ${(probabilities.over_under_25.under * 100).toFixed(1)}% | True odds: ${true_odds.over_under_25.under?.toFixed(2) || 'N/A'}`);
    console.log(`Goal Ranges - 0-1: ${(probabilities.goal_ranges.range_0_1 * 100).toFixed(1)}%, 2-3: ${(probabilities.goal_ranges.range_2_3 * 100).toFixed(1)}%, 4-6: ${(probabilities.goal_ranges.range_4_6 * 100).toFixed(1)}%, 7+: ${(probabilities.goal_ranges.range_7_plus * 100).toFixed(1)}%`);
    console.log(`AH+0 - Home: ${(probabilities.asian_handicap_0.home * 100).toFixed(1)}%, Away: ${(probabilities.asian_handicap_0.away * 100).toFixed(1)}%`);

    return results;
  }

  // Calculate equivalent probability for Asian markets (includes push protection)
  private calculateAsianEquivalentProbability(winProb: number, pushProb: number): number {
    // Asian markets have push protection, making them effectively safer
    // Expected return: winProb * 1 + pushProb * 0 + loseProb * (-1)
    // For equivalent European probability: equivProb * 1 + (1-equivProb) * (-1) = asianExpectedReturn
    // Solving: equivProb = (asianExpectedReturn + 1) / 2
    
    const loseProb = 1 - winProb - pushProb;
    const asianExpectedReturn = winProb * 1 + pushProb * 0 + loseProb * (-1);
    const equivalentProbability = (asianExpectedReturn + 1) / 2;
    
    return Math.max(0.01, Math.min(0.99, equivalentProbability)); // Clamp to valid range
  }

  // Simple RPS (Ranked Probability Score) calculation
  private calculateSimpleRPS(probabilities: any): number {
    const matchProbs = probabilities.match_outcomes;
    const sum = matchProbs.home_win + matchProbs.draw + matchProbs.away_win;
    
    // Normalized probabilities
    const p1 = matchProbs.home_win / sum;
    const p2 = matchProbs.draw / sum;
    const p3 = matchProbs.away_win / sum;
    
    // Simple RPS approximation (lower is better)
    const rps = Math.pow(p1 - 1, 2) + Math.pow(p1 + p2 - 1, 2) + Math.pow(p1 + p2 + p3 - 1, 2);
    
    return Math.min(rps / 3, 0.5); // Cap at 0.5 for reasonable display
  }

  // Calculate confidence based on iterations and data quality (reflects new weighted system)
  private calculateConfidence(iterations: number, data: any): number {
    let confidence = 0.55; // INCREASED base confidence (was too conservative at 45%)
    
    // Boost confidence with higher iterations
    if (iterations >= 100000) confidence += 0.25;
    else if (iterations >= 50000) confidence += 0.15;
    else if (iterations >= 10000) confidence += 0.08;
    
    // 🎯 WEIGHTED DATA QUALITY ASSESSMENT (matches new lambda calculation)
    const h2hCount = data.historical_data?.h2h?.length || 0;
    const homeCount = data.historical_data?.home_home?.length || 0;
    const awayCount = data.historical_data?.away_away?.length || 0;
    
    // H2H confidence boost (diminishing returns, max 8% boost)
    const h2hBoost = Math.min(h2hCount / 8 * 0.08, 0.08);
    
    // Home form confidence boost (primary data source, max 12% boost)
    const homeBoost = Math.min(homeCount / 10 * 0.12, 0.12);
    
    // Away form confidence boost (important secondary data, max 10% boost)
    const awayBoost = Math.min(awayCount / 10 * 0.10, 0.10);
    
    confidence += h2hBoost + homeBoost + awayBoost;
    
    console.log(`[CONFIDENCE] Base: 45%, H2H: +${(h2hBoost*100).toFixed(1)}%, Home: +${(homeBoost*100).toFixed(1)}%, Away: +${(awayBoost*100).toFixed(1)}%, Total: ${(confidence*100).toFixed(1)}%`);
    
    return Math.min(confidence, 0.92); // Cap at 92% (more realistic than 95%)
  }

  /**
   * 🚀 REVOLUTIONARY: Calculate ALL goal-based betting markets automatically
   * Transforms Monte Carlo from reactive to proactive market intelligence
   */
  private calculateComprehensiveMarkets(
    homeWins: number,
    draws: number, 
    awayWins: number,
    totalHomeGoals: number,
    totalAwayGoals: number,
    iterations: number,
    matchResults: MatchResult[]
  ): ComprehensiveMarketResults {

    console.log('🎯 CALCULATING COMPREHENSIVE MARKETS...');
    
    // MAIN MARKETS - Core betting markets
    const main_markets = {
      home_win: homeWins / iterations,
      draw: draws / iterations,
      away_win: awayWins / iterations,
      double_chance_1x: (homeWins + draws) / iterations, // Home or Draw
      double_chance_12: (homeWins + awayWins) / iterations, // No Draw
      double_chance_x2: (draws + awayWins) / iterations, // Draw or Away
      draw_no_bet_home: homeWins / (homeWins + awayWins), // Exclude draws
      draw_no_bet_away: awayWins / (homeWins + awayWins)  // Exclude draws
    };

    // GOALS MARKETS - All goal-related betting
    const goals_markets = {
      over_under: {} as { [line: string]: { over: number; under: number } },
      btts: { yes: 0, no: 0 },
      goal_ranges: {} as { [range: string]: number },
      exact_scores: {} as { [score: string]: number },
      total_goals_odd_even: { odd: 0, even: 0 }
    };

    // Calculate Over/Under lines from match results
    const goalLines = ['0.5', '1.5', '2.5', '3.5', '4.5', '5.5'];
    goalLines.forEach(line => {
      const threshold = parseFloat(line);
      let over = 0, under = 0;
      
      matchResults.forEach(match => {
        const totalGoals = match.homeGoals + match.awayGoals;
        if (totalGoals > threshold) over++;
        else under++;
      });
      
      goals_markets.over_under[line] = {
        over: over / iterations,
        under: under / iterations
      };
    });

    // Calculate BTTS, Goal Ranges, Exact Scores, Odd/Even
    const goalRanges = { '0-1': 0, '2-3': 0, '4-6': 0, '7+': 0 };
    const exactScores = {} as { [score: string]: number };
    
    matchResults.forEach(match => {
      const homeGoals = match.homeGoals;
      const awayGoals = match.awayGoals;
      const totalGoals = homeGoals + awayGoals;
      
      // BTTS calculation
      if (homeGoals > 0 && awayGoals > 0) {
        goals_markets.btts.yes++;
      } else {
        goals_markets.btts.no++;
      }
      
      // Goal ranges
      if (totalGoals <= 1) goalRanges['0-1']++;
      else if (totalGoals <= 3) goalRanges['2-3']++;
      else if (totalGoals <= 6) goalRanges['4-6']++;
      else goalRanges['7+']++;
      
      // Exact scores (top 15 most common)
      const scoreKey = `${homeGoals}-${awayGoals}`;
      exactScores[scoreKey] = (exactScores[scoreKey] || 0) + 1;
      
      // Odd/Even total goals
      if (totalGoals % 2 === 0) {
        goals_markets.total_goals_odd_even.even++;
      } else {
        goals_markets.total_goals_odd_even.odd++;
      }
    });

    // Normalize percentages
    goals_markets.btts.yes /= iterations;
    goals_markets.btts.no /= iterations;
    goals_markets.total_goals_odd_even.odd /= iterations;
    goals_markets.total_goals_odd_even.even /= iterations;
    
    Object.keys(goalRanges).forEach(range => {
      goals_markets.goal_ranges[range] = goalRanges[range] / iterations;
    });
    
    Object.keys(exactScores).forEach(score => {
      goals_markets.exact_scores[score] = exactScores[score] / iterations;
    });

    // HALVES MARKETS - Half-time analysis
    const halves_markets = {
      ht_result: { home: 0, draw: 0, away: 0 },
      ht_over_under: {} as { [line: string]: { over: number; under: number } },
      ft_ht_combinations: {} as { [combo: string]: number }
    };

    // Generate half-time results (simplified estimation)
    matchResults.forEach(match => {
      const htHome = Math.floor(match.homeGoals * 0.6); // ~60% of goals in 2nd half
      const htAway = Math.floor(match.awayGoals * 0.6);
      
      // HT Result
      if (htHome > htAway) halves_markets.ht_result.home++;
      else if (htHome < htAway) halves_markets.ht_result.away++;
      else halves_markets.ht_result.draw++;
      
      // FT/HT combinations
      const ftResult = match.homeGoals > match.awayGoals ? '1' : 
                      match.homeGoals < match.awayGoals ? '2' : 'X';
      const htResult = htHome > htAway ? '1' : htHome < htAway ? '2' : 'X';
      const combo = `${ftResult}/${htResult}`;
      halves_markets.ft_ht_combinations[combo] = (halves_markets.ft_ht_combinations[combo] || 0) + 1;
    });

    // Normalize halves markets
    halves_markets.ht_result.home /= iterations;
    halves_markets.ht_result.draw /= iterations;
    halves_markets.ht_result.away /= iterations;
    
    Object.keys(halves_markets.ft_ht_combinations).forEach(combo => {
      halves_markets.ft_ht_combinations[combo] /= iterations;
    });

    // ASIAN MARKETS - Handicap and totals
    const asian_markets = {
      handicap_lines: {} as { [line: string]: { home: number; away: number } },
      total_lines: {} as { [line: string]: { over: number; under: number } }
    };

    // Asian Handicap lines
    const handicapLines = ['-2.5', '-2.0', '-1.5', '-1.0', '-0.5', '0.0', '+0.5', '+1.0', '+1.5', '+2.0', '+2.5'];
    handicapLines.forEach(line => {
      const handicap = parseFloat(line);
      let homeWinsAH = 0, awayWinsAH = 0;
      
      matchResults.forEach(match => {
        const adjustedHomeGoals = match.homeGoals + handicap;
        if (adjustedHomeGoals > match.awayGoals) homeWinsAH++;
        else if (adjustedHomeGoals < match.awayGoals) awayWinsAH++;
        // Pushes are handled by quarter lines in real betting
      });
      
      asian_markets.handicap_lines[line] = {
        home: homeWinsAH / iterations,
        away: awayWinsAH / iterations
      };
    });

    // Asian Total lines (same as Over/Under but with quarter lines)
    const asianTotalLines = ['1.75', '2.25', '2.75', '3.25', '3.75'];
    asianTotalLines.forEach(line => {
      const threshold = parseFloat(line);
      let over = 0, under = 0;
      
      matchResults.forEach(match => {
        const totalGoals = match.homeGoals + match.awayGoals;
        if (totalGoals > threshold) over++;
        else under++;
      });
      
      asian_markets.total_lines[line] = {
        over: over / iterations,
        under: under / iterations
      };
    });

    console.log('✅ COMPREHENSIVE MARKETS CALCULATED:', {
      main: Object.keys(main_markets).length,
      goals: Object.keys(goals_markets.over_under).length + 4, // +BTTS, ranges, exact, odd/even
      halves: Object.keys(halves_markets.ft_ht_combinations).length + 2,
      asian: Object.keys(asian_markets.handicap_lines).length + Object.keys(asian_markets.total_lines).length
    });

    return {
      main_markets,
      goals_markets,
      halves_markets,
      asian_markets
    };
  }
}

export default MonteCarloEngine;