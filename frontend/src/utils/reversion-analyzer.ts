/**
 * ReversionAnalyzer - Advanced Mean Reversion Detection System
 * 
 * Implements sophisticated pattern recognition for football betting:
 * - Form pattern reversion (streak breaking prediction)
 * - Defensive fatigue detection (clean sheet exhaustion)
 * - Attacking drought reversion (goal-scoring regression to mean)
 * - Emotional momentum exhaustion (psychological pressure from streaks)
 * 
 * Mathematical foundation: Mean reversion theory applied to football statistics
 * Competitive advantage: Counter-market overconfidence in obvious patterns
 */

import {
  HistoricalMatch,
  ReversionPattern,
  ReversionConfig,
  ReversionAnalysisResult,
  FormReversionConfig,
  H2HWinReversionConfig,
  H2HOverReversionConfig,
  DefensiveFatigueConfig,
  AttackingDroughtConfig,
  EmotionalMomentumConfig
} from './reversion-config';

export class ReversionAnalyzer {
  
  /**
   * Main analysis entry point - processes all reversion patterns
   */
  static analyzeAllPatterns(
    homeMatches: HistoricalMatch[],
    awayMatches: HistoricalMatch[],
    h2hMatches: HistoricalMatch[],
    homeTeamId: number,
    awayTeamId: number,
    config: ReversionConfig
  ): ReversionAnalysisResult {
    
    if (!config.globalEnabled) {
      return this.createEmptyResult(homeTeamId, awayTeamId, h2hMatches, homeMatches, awayMatches);
    }

    const homeAdjustments: ReversionPattern[] = [];
    const awayAdjustments: ReversionPattern[] = [];

    // Analyze home team patterns
    const homeFormPattern = this.analyzeFormReversion(homeMatches, config.homeForm, 'home', 'home_form');
    const homeAttackingPattern = this.analyzeAttackingDrought(homeMatches, config.attackingDrought, 'home');
    const homeEmotionalPattern = this.analyzeEmotionalMomentum(homeMatches, config.emotionalMomentum, 'home');

    // Analyze away team patterns  
    const awayFormPattern = this.analyzeFormReversion(awayMatches, config.awayForm, 'away', 'away_form');
    const awayAttackingPattern = this.analyzeAttackingDrought(awayMatches, config.attackingDrought, 'away');
    const awayEmotionalPattern = this.analyzeEmotionalMomentum(awayMatches, config.emotionalMomentum, 'away');
    
    // 🔧 DEFENSIVE FATIGUE LOGIC FIX: Apply to OPPONENT'S lambda, not own team
    const homeDefensivePattern = this.analyzeDefensiveFatigue(homeMatches, config.defensiveFatigue, 'home');
    const awayDefensivePattern = this.analyzeDefensiveFatigue(awayMatches, config.defensiveFatigue, 'away');

    // Analyze H2H patterns
    const h2hWinPattern = this.analyzeH2HWins(h2hMatches, homeTeamId, config.h2hWins);
    const h2hOverPattern = this.analyzeH2HOvers(h2hMatches, config.h2hOvers);

    // Collect significant patterns (above confidence threshold)
    [homeFormPattern, homeAttackingPattern, homeEmotionalPattern].forEach(pattern => {
      if (pattern && pattern.confidence >= config.confidenceThreshold) {
        homeAdjustments.push(pattern);
      }
    });

    [awayFormPattern, awayAttackingPattern, awayEmotionalPattern].forEach(pattern => {
      if (pattern && pattern.confidence >= config.confidenceThreshold) {
        awayAdjustments.push(pattern);
      }
    });
    
    // 🔧 DEFENSIVE FATIGUE CROSS-APPLICATION: Tired defense helps opponent score more
    if (homeDefensivePattern && homeDefensivePattern.confidence >= config.confidenceThreshold) {
      // Home defense fatigued → Away team gets boost (positive adjustment)
      const crossAppliedPattern = {...homeDefensivePattern};
      crossAppliedPattern.reversionAdjustment = Math.abs(crossAppliedPattern.reversionAdjustment); // Make positive
      crossAppliedPattern.message = crossAppliedPattern.message.replace('fatigue expected', 'opponent benefits from tired defense');
      awayAdjustments.push(crossAppliedPattern);
    }
    
    if (awayDefensivePattern && awayDefensivePattern.confidence >= config.confidenceThreshold) {
      // Away defense fatigued → Home team gets boost (positive adjustment)
      const crossAppliedPattern = {...awayDefensivePattern};
      crossAppliedPattern.reversionAdjustment = Math.abs(crossAppliedPattern.reversionAdjustment); // Make positive
      crossAppliedPattern.message = crossAppliedPattern.message.replace('fatigue expected', 'opponent benefits from tired defense');
      homeAdjustments.push(crossAppliedPattern);
    }

    // H2H patterns affect both teams differently
    if (h2hWinPattern && h2hWinPattern.confidence >= config.confidenceThreshold) {
      // Apply to home team (pattern suggests home team dominance is due for reversion)
      homeAdjustments.push({...h2hWinPattern, type: 'h2h_wins'});
    }

    if (h2hOverPattern && h2hOverPattern.confidence >= config.confidenceThreshold) {
      // 🔧 H2H OVER PATTERN FIX: Split effect between teams to avoid double-counting
      const halfEffect = h2hOverPattern.reversionAdjustment / 2;
      
      homeAdjustments.push({
        ...h2hOverPattern, 
        type: 'h2h_overs',
        reversionAdjustment: halfEffect,
        message: h2hOverPattern.message.replace('goal reversion expected', 'H2H pattern affects match total (home portion)')
      });
      
      awayAdjustments.push({
        ...h2hOverPattern, 
        type: 'h2h_overs',
        reversionAdjustment: halfEffect,
        message: h2hOverPattern.message.replace('goal reversion expected', 'H2H pattern affects match total (away portion)')
      });
    }

    // Calculate total adjustments with caps
    const totalHomeLambdaAdjustment = this.calculateTotalLambdaAdjustment(homeAdjustments, config.maxTotalAdjustment);
    const totalAwayLambdaAdjustment = this.calculateTotalLambdaAdjustment(awayAdjustments, config.maxTotalAdjustment);
    const totalHomeWinProbAdjustment = this.calculateTotalWinProbAdjustment(homeAdjustments);
    const totalAwayWinProbAdjustment = this.calculateTotalWinProbAdjustment(awayAdjustments);

    return {
      homeAdjustments,
      awayAdjustments,
      totalHomeLambdaAdjustment,
      totalAwayLambdaAdjustment,
      totalHomeWinProbAdjustment,
      totalAwayWinProbAdjustment,
      patternsDetected: homeAdjustments.length + awayAdjustments.length,
      highConfidencePatterns: [...homeAdjustments, ...awayAdjustments].filter(p => p.confidence > 0.80).length,
      analysisMetadata: {
        timestamp: new Date(),
        homeTeamId,
        awayTeamId,
        h2hSampleSize: h2hMatches.length,
        homeFormSampleSize: homeMatches.length,
        awayFormSampleSize: awayMatches.length
      }
    };
  }

  /**
   * Analyze form-based reversion patterns (over/under streaks)
   */
  private static analyzeFormReversion(
    matches: HistoricalMatch[],
    config: FormReversionConfig,
    teamType: 'home' | 'away',
    patternType: 'home_form' | 'away_form'
  ): ReversionPattern | null {
    
    if (!config.enabled || matches.length < config.minGames) {
      return null;
    }

    // 🎯 OVERALL PATTERN DOMINANCE ANALYSIS (not consecutive streaks)
    // Count total overs and unders across all games
    let totalOvers = 0;
    let totalUnders = 0;
    
    matches.forEach(match => {
      const totalGoals = match.home_score_ft + match.away_score_ft;
      const isOver = totalGoals > 2.5;
      
      if (isOver) {
        totalOvers++;
      } else {
        totalUnders++;
      }
    });
    
    // Calculate dominance percentages
    const overDominance = totalOvers / matches.length;
    const underDominance = totalUnders / matches.length;

    // Check for OVER DOMINANCE reversion (dynamic majority: 50%+1 games went over → penalty expected)
    const majorityThreshold = Math.ceil(matches.length / 2); // Dynamic: 50% + 1 game
    if (totalOvers >= majorityThreshold) {
      const streakConfidence = Math.min(0.98, 0.70 + (overDominance * 0.3)); // Higher dominance = higher confidence
      const patternStrength = overDominance; // Pattern strength is the dominance percentage
      
      // Calculate escalation based on dominance strength
      let escalationMultiplier = 1.0;
      let escalationMessage = "";
      
      if (overDominance >= 0.90) {
        escalationMultiplier = 2.0;
        escalationMessage = ` (${totalOvers}/${matches.length} games over - MASSIVE dominance, strong reversion expected)`;
      } else if (overDominance >= 0.80) {
        escalationMultiplier = 1.5;
        escalationMessage = ` (${totalOvers}/${matches.length} games over - strong dominance, reversion expected)`;
      } else {
        escalationMessage = ` (${totalOvers}/${matches.length} games over - moderate dominance)`;
      }
      
      const escalatedPenalty = config.goalPenalty * escalationMultiplier;
      
      return {
        type: patternType,
        threshold: majorityThreshold,
        minSampleSize: config.minGames,
        patternStrength: patternStrength,
        reversionAdjustment: escalatedPenalty,
        confidence: streakConfidence,
        message: `${teamType} team has over-dominance pattern${escalationMessage} - reversion expected`,
        detectedCount: totalOvers,
        totalSample: matches.length
      };
    }

    // Check for UNDER DOMINANCE boost (dynamic majority: 50%+1 games went under → boost expected)  
    if (totalUnders >= majorityThreshold) {
      const streakConfidence = Math.min(0.98, 0.70 + (underDominance * 0.3)); // Higher dominance = higher confidence
      const patternStrength = underDominance; // Pattern strength is the dominance percentage
      
      // Calculate escalation based on dominance strength
      let escalationMultiplier = 1.0;
      let escalationMessage = "";
      
      if (underDominance >= 0.90) {
        escalationMultiplier = 2.0;
        escalationMessage = ` (${totalUnders}/${matches.length} games under - MASSIVE dominance, strong boost expected)`;
      } else if (underDominance >= 0.80) {
        escalationMultiplier = 1.5;
        escalationMessage = ` (${totalUnders}/${matches.length} games under - strong dominance, boost expected)`;
      } else {
        escalationMessage = ` (${totalUnders}/${matches.length} games under - majority dominance)`;
      }
      
      const escalatedBoost = config.goalBoost * escalationMultiplier;
      
      return {
        type: patternType,
        threshold: config.underStreakThreshold,
        minSampleSize: config.minGames,
        patternStrength: patternStrength,
        reversionAdjustment: escalatedBoost,
        confidence: streakConfidence,
        message: `${teamType} team has under-dominance pattern${escalationMessage} - boost expected`,
        detectedCount: totalUnders,
        totalSample: matches.length
      };
    }

    return null;
  }

  /**
   * Analyze H2H win pattern reversion
   */
  private static analyzeH2HWins(
    h2hMatches: HistoricalMatch[],
    homeTeamId: number,
    config: H2HWinReversionConfig
  ): ReversionPattern | null {
    
    if (!config.enabled || h2hMatches.length < config.minMatches) {
      return null;
    }

    // Get home team name from first home match (assumes consistent naming)
    const homeTeamName = h2hMatches.length > 0 ? h2hMatches[0].home_team : '';
    
    if (!homeTeamName) {
      console.log('[REVERSION] ⚠️ Cannot determine home team name from H2H data');
      return null;
    }

    // 🎯 H2H WIN DOMINANCE ANALYSIS (not consecutive streaks)
    // Count total wins across all H2H matches
    let totalWins = 0;
    let totalDraws = 0;
    let totalLosses = 0;
    
    h2hMatches.forEach(match => {
      // Check if current home team won this H2H match
      const playedHome = match.home_team === homeTeamName && match.home_score_ft > match.away_score_ft;
      const playedAway = match.away_team === homeTeamName && match.away_score_ft > match.home_score_ft;
      const playedHomeDraw = match.home_team === homeTeamName && match.home_score_ft === match.away_score_ft;
      const playedAwayDraw = match.away_team === homeTeamName && match.away_score_ft === match.home_score_ft;
      
      if (playedHome || playedAway) {
        totalWins++;
      } else if (playedHomeDraw || playedAwayDraw) {
        totalDraws++;
      } else {
        totalLosses++;
      }
    });
    
    // Calculate dominance percentages
    const winDominance = totalWins / h2hMatches.length;

    // Check for H2H WIN DOMINANCE (dynamic majority: 50%+1 wins → penalty expected)
    const h2hMajorityThreshold = Math.ceil(h2hMatches.length / 2); // Dynamic: 50% + 1 game
    if (totalWins >= h2hMajorityThreshold) {
      const streakConfidence = this.calculateStreakConfidence(maxWinStreak, config.winStreakThreshold, h2hMatches.length);
      const patternStrength = maxWinStreak / h2hMatches.length; // Streak density
      
      // 🔥 EXTREME H2H WIN ESCALATION: Calculate total home team H2H win percentage
      const totalH2HWins = h2hMatches.filter(match => {
        const homeGoals = match.home_score_ft || 0;
        const awayGoals = match.away_score_ft || 0;
        return homeGoals > awayGoals; // Home team won
      }).length;
      const h2hWinPercentage = totalH2HWins / h2hMatches.length;
      
      // Apply escalation based on extreme H2H win percentages
      let escalationMultiplier = 1.0;
      let escalationMessage = "";
      
      if (h2hWinPercentage >= 0.95) {
        escalationMultiplier = 2.5;
        escalationMessage = ` (PERFECT ${(h2hWinPercentage * 100).toFixed(0)}% H2H win rate - MAXIMUM reversion)`;
      } else if (h2hWinPercentage >= 0.90) {
        escalationMultiplier = 2.0;
        escalationMessage = ` (MASSIVE ${(h2hWinPercentage * 100).toFixed(0)}% H2H win rate - huge reversion)`;
      } else if (h2hWinPercentage >= 0.80) {
        escalationMultiplier = 1.5;
        escalationMessage = ` (EXTREME ${(h2hWinPercentage * 100).toFixed(0)}% H2H win rate - strong reversion)`;
      }
      
      const escalatedPenalty = config.winProbPenalty * escalationMultiplier;
      
      return {
        type: 'h2h_wins',
        threshold: config.winStreakThreshold,
        minSampleSize: config.minMatches,
        patternStrength: patternStrength,
        reversionAdjustment: escalatedPenalty,
        confidence: streakConfidence,
        message: `Home team (${homeTeamName}) has ${maxWinStreak}-game H2H win streak${escalationMessage} - reversion expected`,
        detectedCount: maxWinStreak,
        totalSample: h2hMatches.length
      };
    }

    return null;
  }

  /**
   * Analyze H2H over/under pattern reversion
   */
  private static analyzeH2HOvers(
    h2hMatches: HistoricalMatch[],
    config: H2HOverReversionConfig
  ): ReversionPattern | null {
    
    if (!config.enabled || h2hMatches.length < config.minMatches) {
      return null;
    }

    // Track consecutive H2H over/under streaks (empirical approach)
    let maxOverStreak = 0;
    let maxUnderStreak = 0;
    let currentOverStreak = 0;
    let currentUnderStreak = 0;
    
    // Analyze H2H matches chronologically for over/under streaks
    h2hMatches.forEach(match => {
      const totalGoals = match.home_score_ft + match.away_score_ft;
      const isOver = totalGoals > 2.5;
      
      if (isOver) {
        currentOverStreak++;
        maxOverStreak = Math.max(maxOverStreak, currentOverStreak);
        currentUnderStreak = 0; // Reset under streak
      } else {
        currentUnderStreak++;
        maxUnderStreak = Math.max(maxUnderStreak, currentUnderStreak);
        currentOverStreak = 0; // Reset over streak
      }
    });

    // Check for H2H over streak reversion (empirical: 3+ consecutive overs)
    if (maxOverStreak >= config.overStreakThreshold) {
      const streakConfidence = this.calculateStreakConfidence(maxOverStreak, config.overStreakThreshold, h2hMatches.length);
      const patternStrength = maxOverStreak / h2hMatches.length; // Streak density
      
      // 🔥 EXTREME H2H PATTERN ESCALATION: Calculate total H2H over percentage
      const totalH2HOvers = h2hMatches.filter(match => 
        (match.home_score_ft + match.away_score_ft) > 2.5
      ).length;
      const h2hOverPercentage = totalH2HOvers / h2hMatches.length;
      
      // Apply escalation based on extreme H2H percentages
      let escalationMultiplier = 1.0;
      let escalationMessage = "";
      
      if (h2hOverPercentage >= 0.95) {
        escalationMultiplier = 2.5;
        escalationMessage = ` (PERFECT ${(h2hOverPercentage * 100).toFixed(0)}% H2H over rate - MAXIMUM reversion)`;
      } else if (h2hOverPercentage >= 0.90) {
        escalationMultiplier = 2.0;
        escalationMessage = ` (MASSIVE ${(h2hOverPercentage * 100).toFixed(0)}% H2H over rate - huge reversion)`;
      } else if (h2hOverPercentage >= 0.80) {
        escalationMultiplier = 1.5;
        escalationMessage = ` (EXTREME ${(h2hOverPercentage * 100).toFixed(0)}% H2H over rate - strong reversion)`;
      }
      
      const escalatedPenalty = config.goalPenalty * escalationMultiplier;
      
      return {
        type: 'h2h_overs',
        threshold: config.overStreakThreshold,
        minSampleSize: config.minMatches,
        patternStrength: patternStrength,
        reversionAdjustment: escalatedPenalty,
        confidence: streakConfidence,
        message: `H2H shows ${maxOverStreak}-game over 2.5 streak${escalationMessage} - goal reversion expected`,
        detectedCount: maxOverStreak,
        totalSample: h2hMatches.length
      };
    }

    // Check for H2H under streak boost (empirical: 3+ consecutive unders)
    if (maxUnderStreak >= config.underStreakThreshold) {
      const streakConfidence = this.calculateStreakConfidence(maxUnderStreak, config.underStreakThreshold, h2hMatches.length);
      const patternStrength = maxUnderStreak / h2hMatches.length; // Streak density
      
      // 🔥 EXTREME H2H UNDER ESCALATION: Calculate total H2H under percentage
      const totalH2HUnders = h2hMatches.filter(match => 
        (match.home_score_ft + match.away_score_ft) <= 2.5
      ).length;
      const h2hUnderPercentage = totalH2HUnders / h2hMatches.length;
      
      // Apply escalation based on extreme H2H under percentages
      let escalationMultiplier = 1.0;
      let escalationMessage = "";
      
      if (h2hUnderPercentage >= 0.95) {
        escalationMultiplier = 2.5;
        escalationMessage = ` (PERFECT ${(h2hUnderPercentage * 100).toFixed(0)}% H2H under rate - MAXIMUM boost)`;
      } else if (h2hUnderPercentage >= 0.90) {
        escalationMultiplier = 2.0;
        escalationMessage = ` (MASSIVE ${(h2hUnderPercentage * 100).toFixed(0)}% H2H under rate - huge boost)`;
      } else if (h2hUnderPercentage >= 0.80) {
        escalationMultiplier = 1.5;
        escalationMessage = ` (EXTREME ${(h2hUnderPercentage * 100).toFixed(0)}% H2H under rate - strong boost)`;
      }
      
      const escalatedBoost = config.goalBoost * escalationMultiplier;
      
      return {
        type: 'h2h_overs',
        threshold: config.underStreakThreshold,
        minSampleSize: config.minMatches,
        patternStrength: patternStrength,
        reversionAdjustment: escalatedBoost,
        confidence: streakConfidence,
        message: `H2H shows ${maxUnderStreak}-game under 2.5 streak${escalationMessage} - goal boost expected`,
        detectedCount: maxUnderStreak,
        totalSample: h2hMatches.length
      };
    }

    return null;
  }

  /**
   * Analyze defensive fatigue from clean sheet streaks
   */
  private static analyzeDefensiveFatigue(
    matches: HistoricalMatch[],
    config: DefensiveFatigueConfig,
    teamType: 'home' | 'away'
  ): ReversionPattern | null {
    
    if (!config.enabled || matches.length < config.minGames) {
      return null;
    }

    // Track CONSECUTIVE clean sheet streaks from MOST RECENT games only
    let currentCleanSheetStreak = 0;
    
    // 🏈 CRITICAL FIX: Process matches from NEWEST to OLDEST to detect current consecutive streaks
    // Reverse the array to start from most recent match
    const recentMatches = [...matches].reverse();
    
    for (const match of recentMatches) {
      const goalsConceded = teamType === 'home' ? match.away_score_ft : match.home_score_ft;
      
      if (goalsConceded === 0) {
        currentCleanSheetStreak++;
      } else {
        // 🚨 STREAK BROKEN - stop counting immediately (don't look at older games)
        break;
      }
    }

    // Check for defensive fatigue (empirical: 2+ consecutive clean sheets triggers fatigue)
    if (currentCleanSheetStreak >= config.cleanSheetStreakThreshold) {
      // Calculate fatigue intensity based on streak length (stronger penalty for longer streaks)
      const fatigueIntensity = Math.abs(config.fatiguePenalty) + 
                             (currentCleanSheetStreak * config.consecutiveMultiplier);
      
      const streakConfidence = this.calculateStreakConfidence(currentCleanSheetStreak, config.cleanSheetStreakThreshold, matches.length);
      const patternStrength = currentCleanSheetStreak / matches.length; // Current streak density
      
      // 🔥 EXTREME DEFENSIVE ESCALATION: Calculate total clean sheet percentage
      const totalCleanSheets = matches.filter(match => {
        const goalsConceded = teamType === 'home' ? match.away_score_ft : match.home_score_ft;
        return goalsConceded === 0;
      }).length;
      const cleanSheetPercentage = totalCleanSheets / matches.length;
      
      // Apply escalation based on extreme clean sheet percentages
      let escalationMultiplier = 1.0;
      let escalationMessage = "";
      
      if (cleanSheetPercentage >= 0.95) {
        escalationMultiplier = 2.5;
        escalationMessage = ` (PERFECT ${(cleanSheetPercentage * 100).toFixed(0)}% clean sheet rate - MAXIMUM fatigue)`;
      } else if (cleanSheetPercentage >= 0.90) {
        escalationMultiplier = 2.0;
        escalationMessage = ` (MASSIVE ${(cleanSheetPercentage * 100).toFixed(0)}% clean sheet rate - huge fatigue)`;
      } else if (cleanSheetPercentage >= 0.80) {
        escalationMultiplier = 1.5;
        escalationMessage = ` (EXTREME ${(cleanSheetPercentage * 100).toFixed(0)}% clean sheet rate - strong fatigue)`;
      }
      
      const escalatedFatigue = fatigueIntensity * escalationMultiplier;

      return {
        type: 'defensive_fatigue',
        threshold: config.cleanSheetStreakThreshold,
        minSampleSize: config.minGames,
        patternStrength: patternStrength,
        reversionAdjustment: -escalatedFatigue,
        confidence: streakConfidence,
        message: `${teamType} defense has ${currentCleanSheetStreak}-game consecutive clean sheet streak${escalationMessage} - fatigue expected`,
        detectedCount: currentCleanSheetStreak,
        totalSample: matches.length
      };
    }

    return null;
  }

  /**
   * Analyze attacking drought reversion (goalless games)
   */
  private static analyzeAttackingDrought(
    matches: HistoricalMatch[],
    config: AttackingDroughtConfig,
    teamType: 'home' | 'away'
  ): ReversionPattern | null {
    
    if (!config.enabled || matches.length < config.minGames) {
      return null;
    }

    // Count CONSECUTIVE goalless games from MOST RECENT games only
    let consecutiveGoalless = 0;
    
    // 🏈 CRITICAL FIX: Process matches from NEWEST to OLDEST to detect current consecutive droughts
    // Reverse the array to start from most recent match
    const recentMatches = [...matches].reverse();
    
    for (const match of recentMatches) {
      const goalsScored = teamType === 'home' ? match.home_score_ft : match.away_score_ft;
      
      if (goalsScored === 0) {
        consecutiveGoalless++;
      } else {
        // 🚨 DROUGHT BROKEN - stop counting immediately (scored goals, streak ends)
        break;
      }
    }

    if (consecutiveGoalless >= config.goallessGames) {
      // Calculate drought intensity
      const droughtIntensity = Math.min(
        config.reversionBoost + (consecutiveGoalless * config.intensityMultiplier),
        config.maxBoost
      );

      const patternStrength = consecutiveGoalless / matches.length;
      const streakConfidence = this.calculateStreakConfidence(consecutiveGoalless, config.goallessGames, matches.length);
      
      // 🎯 CONSECUTIVE DROUGHT: No escalation - just consecutive game intensity
      let escalationMessage = "";
      if (consecutiveGoalless >= 4) {
        escalationMessage = ` (${consecutiveGoalless}-game drought - strong reversion signal)`;
      } else {
        escalationMessage = ` (${consecutiveGoalless}-game drought)`;
      }
      
      const escalatedBoost = droughtIntensity;

      return {
        type: 'attacking_drought',
        threshold: config.goallessGames,
        minSampleSize: config.minGames,
        patternStrength: patternStrength,
        reversionAdjustment: escalatedBoost,
        confidence: streakConfidence,
        message: `${teamType} attack in drought: ${consecutiveGoalless} consecutive goalless games${escalationMessage} - due for goals`,
        detectedCount: consecutiveGoalless,
        totalSample: matches.length
      };
    }

    return null;
  }

  /**
   * Analyze emotional momentum exhaustion from win streaks
   */
  private static analyzeEmotionalMomentum(
    matches: HistoricalMatch[],
    config: EmotionalMomentumConfig,
    teamType: 'home' | 'away'
  ): ReversionPattern | null {
    
    if (!config.enabled || matches.length < 8) {
      return null;
    }

    // Count consecutive wins from most recent
    let consecutiveWins = 0;
    let totalWins = 0;

    matches.forEach((match, index) => {
      const isWin = this.isMatchWin(match, teamType);
      
      if (isWin) {
        totalWins++;
        if (index === consecutiveWins) {
          consecutiveWins++;
        }
      } else {
        // Break consecutive streak but continue counting total wins
      }
    });

    if (consecutiveWins >= config.winStreakThreshold) {
      // Calculate psychological pressure (exponential build-up)
      const pressureBuildUp = config.psychologicalPenalty * 
                             Math.pow(config.streakDecayFactor, consecutiveWins - config.winStreakThreshold);
      
      const totalPenalty = Math.max(pressureBuildUp, config.maxPenalty);
      const patternStrength = consecutiveWins / matches.length;
      
      // 🔥 EXTREME EMOTIONAL MOMENTUM ESCALATION: Calculate total win percentage
      const winPercentage = totalWins / matches.length;
      
      // Apply escalation based on extreme win percentages
      let escalationMultiplier = 1.0;
      let escalationMessage = "";
      
      if (winPercentage >= 0.95) {
        escalationMultiplier = 2.5;
        escalationMessage = ` (PERFECT ${(winPercentage * 100).toFixed(0)}% win rate - MAXIMUM pressure)`;
      } else if (winPercentage >= 0.90) {
        escalationMultiplier = 2.0;
        escalationMessage = ` (MASSIVE ${(winPercentage * 100).toFixed(0)}% win rate - huge pressure)`;
      } else if (winPercentage >= 0.80) {
        escalationMultiplier = 1.5;
        escalationMessage = ` (EXTREME ${(winPercentage * 100).toFixed(0)}% win rate - strong pressure)`;
      }
      
      const escalatedPenalty = Math.max(totalPenalty * escalationMultiplier, config.maxPenalty * 2.5);

      return {
        type: 'emotional_exhaustion',
        threshold: config.winStreakThreshold,
        minSampleSize: 8,
        patternStrength: patternStrength,
        reversionAdjustment: escalatedPenalty,
        confidence: this.calculateMomentumConfidence(consecutiveWins, totalWins, matches.length),
        message: `${teamType} team under pressure: ${consecutiveWins}-game win streak${escalationMessage} creates psychological burden`,
        detectedCount: consecutiveWins,
        totalSample: matches.length
      };
    }

    return null;
  }

  // Helper methods for confidence calculations
  
  /**
   * Calculate confidence for streak-based patterns (empirical approach)
   * Higher confidence for longer streaks and sufficient sample sizes
   */
  private static calculateStreakConfidence(streakLength: number, threshold: number, sampleSize: number): number {
    // Base confidence increases with streak length beyond threshold
    const streakBonus = Math.min((streakLength - threshold + 1) * 0.15, 0.30); // Up to 30% bonus
    
    // Sample size bonus for statistical significance
    const sampleBonus = Math.min(sampleSize / 10, 0.20); // Up to 20% bonus for 10+ samples
    
    // Rarity bonus - longer streaks are rarer and more significant
    const rarityBonus = Math.min(streakLength * 0.05, 0.25); // Up to 25% bonus
    
    // Base confidence starts at 75% for empirical streak detection
    const baseConfidence = 0.75;
    
    return Math.min(baseConfidence + streakBonus + sampleBonus + rarityBonus, 0.98);
  }

  // Legacy confidence methods (kept for compatibility with existing streak-based patterns)
  private static calculateFormConfidence(sampleSize: number, rate: number, threshold: number): number {
    const sampleBonus = Math.min(sampleSize / 10, 1.0);
    const strengthBonus = (rate - threshold) * 2;
    return Math.min(0.60 + sampleBonus * 0.20 + strengthBonus * 0.15, 0.95);
  }

  private static calculateH2HConfidence(sampleSize: number, rate: number, threshold: number): number {
    const sampleBonus = Math.min(sampleSize / 8, 1.0);
    const strengthBonus = (rate - threshold) * 1.5;
    return Math.min(0.65 + sampleBonus * 0.20 + strengthBonus * 0.12, 0.92);
  }

  private static calculateDefensiveConfidence(sampleSize: number, rate: number, consecutive: number): number {
    const sampleBonus = Math.min(sampleSize / 8, 1.0);
    const consecutiveBonus = Math.min(consecutive * 0.08, 0.25);
    return Math.min(0.70 + sampleBonus * 0.15 + consecutiveBonus, 0.93);
  }

  private static calculateDroughtConfidence(consecutive: number, sampleSize: number): number {
    const consecutiveBonus = Math.min(consecutive * 0.12, 0.30);
    const sampleBonus = Math.min(sampleSize / 10, 0.15);
    return Math.min(0.75 + consecutiveBonus + sampleBonus, 0.95);
  }

  private static calculateMomentumConfidence(consecutive: number, total: number, sampleSize: number): number {
    const streakBonus = Math.min(consecutive * 0.06, 0.25);
    const consistencyBonus = (total / sampleSize) * 0.10;
    return Math.min(0.72 + streakBonus + consistencyBonus, 0.94);
  }

  // Helper method to determine if match was a win
  private static isMatchWin(match: HistoricalMatch, teamType: 'home' | 'away'): boolean {
    if (teamType === 'home') {
      return match.home_score_ft > match.away_score_ft;
    } else {
      return match.away_score_ft > match.home_score_ft;
    }
  }

  // Calculate total adjustments with caps
  private static calculateTotalLambdaAdjustment(patterns: ReversionPattern[], maxAdjustment: number): number {
    const total = patterns.reduce((sum, pattern) => sum + pattern.reversionAdjustment, 0);
    return Math.max(Math.min(total, maxAdjustment), -maxAdjustment);
  }

  private static calculateTotalWinProbAdjustment(patterns: ReversionPattern[]): number {
    return patterns
      .filter(p => p.type === 'h2h_wins' || p.type === 'emotional_exhaustion')
      .reduce((sum, pattern) => sum + pattern.reversionAdjustment, 0);
  }

  // Create empty result for disabled analysis
  private static createEmptyResult(
    homeTeamId: number,
    awayTeamId: number,
    h2hMatches: HistoricalMatch[],
    homeMatches: HistoricalMatch[],
    awayMatches: HistoricalMatch[]
  ): ReversionAnalysisResult {
    return {
      homeAdjustments: [],
      awayAdjustments: [],
      totalHomeLambdaAdjustment: 0,
      totalAwayLambdaAdjustment: 0,
      totalHomeWinProbAdjustment: 0,
      totalAwayWinProbAdjustment: 0,
      patternsDetected: 0,
      highConfidencePatterns: 0,
      analysisMetadata: {
        timestamp: new Date(),
        homeTeamId,
        awayTeamId,
        h2hSampleSize: h2hMatches.length,
        homeFormSampleSize: homeMatches.length,
        awayFormSampleSize: awayMatches.length
      }
    };
  }
}