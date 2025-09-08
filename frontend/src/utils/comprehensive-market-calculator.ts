/**
 * COMPREHENSIVE MARKET CALCULATOR
 * 
 * Revolutionary utility that auto-calculates 100+ betting markets from simple H/T + F/T scores
 * This enables the Advanced Pattern Recognition System to learn from complete market context
 * 
 * Key Features:
 * - Auto-calculate 50+ market outcomes from any score combination
 * - Generate rich pattern fingerprints for team-agnostic learning
 * - Support dynamic market ranges (no artificial limits)
 * - Half-time intelligence integration
 * - Performance optimized for high-volume learning (100+ games/week)
 * 
 * Usage:
 * const calculator = new ComprehensiveMarketCalculator();
 * const markets = calculator.calculateCompleteMarkets(2, 1, 1, 0); // 2-1 FT, 1-0 HT
 * console.log(markets.over_2_5); // true
 * console.log(markets.rich_fingerprint_combined); // "W(1-0,ng,u1.5)→W(2-1,gg,o2.5,2h2)"
 */

export interface CompleteMarketData {
  // Basic match data
  home_score_ft: number;
  away_score_ft: number;
  home_score_ht: number;
  away_score_ht: number;
  total_goals_ft: number;
  total_goals_ht: number;
  second_half_goals: number;
  goal_difference_ft: number;
  goal_difference_ht: number;

  // Match results
  result_ft: 'W' | 'L' | 'D';
  result_ht: 'W' | 'L' | 'D';

  // 1. MATCH RESULT MARKETS
  match_1: boolean; // Home win
  match_X: boolean; // Draw
  match_2: boolean; // Away win

  // 2. DOUBLE CHANCE MARKETS
  double_1X: boolean; // Home win or draw
  double_12: boolean; // Home win or away win
  double_X2: boolean; // Draw or away win

  // 3. OVER/UNDER GOALS (Dynamic - extends based on actual goals)
  over_0_5: boolean;
  over_1_5: boolean;
  over_2_5: boolean;
  over_3_5: boolean;
  over_4_5: boolean;
  over_5_5: boolean;
  over_6_5: boolean;
  over_7_5: boolean;
  under_2_5: boolean;
  under_3_5: boolean;
  under_4_5: boolean;
  [key: `over_${string}`]: boolean; // Dynamic over markets
  [key: `under_${string}`]: boolean; // Dynamic under markets

  // 4. BOTH TEAMS TO SCORE (Complete H/T + F/T coverage)
  gg_ft: boolean; // Both score full-time
  ng_ft: boolean; // Not both score full-time
  gg_ht: boolean; // Both score half-time
  ng_ht: boolean; // Not both score half-time
  gg_2h: boolean; // Both score second half
  ng_2h: boolean; // Not both score second half

  // 5. WIN TO NIL
  home_win_nil: boolean; // Home wins without conceding
  away_win_nil: boolean; // Away wins without conceding

  // 6. WINNING MARGIN (Dynamic)
  home_by_1: boolean;
  home_by_2: boolean;
  home_by_3: boolean;
  home_by_4: boolean;
  home_by_5: boolean;
  home_by_6_plus: boolean;
  away_by_1: boolean;
  away_by_2: boolean;
  away_by_3: boolean;
  away_by_4: boolean;
  away_by_5: boolean;
  away_by_6_plus: boolean;

  // 7. ASIAN HANDICAP (Quarter lines)
  home_ah_minus_0_5: boolean;
  home_ah_minus_1_0: boolean;
  home_ah_minus_1_5: boolean;
  home_ah_minus_2_0: boolean;
  home_ah_minus_2_5: boolean;
  home_ah_minus_3_0: boolean;
  away_ah_plus_0_5: boolean;
  away_ah_plus_1_0: boolean;
  away_ah_plus_1_5: boolean;
  away_ah_plus_2_0: boolean;
  away_ah_plus_2_5: boolean;
  away_ah_plus_3_0: boolean;

  // 8. HALF-TIME MARKETS
  ht_over_0_5: boolean;
  ht_over_1_5: boolean;
  ht_over_2_5: boolean;
  ht_under_1_5: boolean;
  ht_under_2_5: boolean;
  ht_1: boolean; // Home leading at HT
  ht_X: boolean; // Draw at HT
  ht_2: boolean; // Away leading at HT

  // 9. SECOND HALF MARKETS
  sh_over_0_5: boolean;
  sh_over_1_5: boolean;
  sh_over_2_5: boolean;
  sh_gg: boolean; // Both score in second half
  sh_home_win: boolean; // Home wins second half
  sh_away_win: boolean; // Away wins second half
  sh_draw: boolean; // Second half draw

  // 10. HALF-TIME/FULL-TIME COMBINATIONS (9 total)
  ht_ft_1_1: boolean; // Home leading HT, Home wins FT
  ht_ft_1_X: boolean; // Home leading HT, Draw FT
  ht_ft_1_2: boolean; // Home leading HT, Away wins FT
  ht_ft_X_1: boolean; // Draw HT, Home wins FT
  ht_ft_X_X: boolean; // Draw HT, Draw FT
  ht_ft_X_2: boolean; // Draw HT, Away wins FT
  ht_ft_2_1: boolean; // Away leading HT, Home wins FT
  ht_ft_2_X: boolean; // Away leading HT, Draw FT
  ht_ft_2_2: boolean; // Away leading HT, Away wins FT

  // 11. CORRECT SCORE
  exact_score_ft: string; // "2-1", "0-0", etc.
  exact_score_ht: string; // "1-0", "0-0", etc.

  // 12. RICH PATTERN FINGERPRINTS (Team-agnostic for pattern matching)
  rich_fingerprint_ft: string; // Full-time pattern
  rich_fingerprint_ht: string; // Half-time pattern
  rich_fingerprint_combined: string; // Complete H/T → F/T transition pattern
}

export interface OverUnderMarkets {
  [key: string]: boolean;
}

export interface AsianHandicapMarkets {
  [key: string]: boolean;
}

export interface HTFTCombinations {
  [key: string]: boolean;
}

export class ComprehensiveMarketCalculator {
  /**
   * Calculate ALL betting markets from H/T and F/T scores
   * This is the core method that transforms simple score inputs into comprehensive market analysis
   */
  calculateCompleteMarkets(
    homeScoreFT: number,
    awayScoreFT: number,
    homeScoreHT: number = 0,
    awayScoreHT: number = 0
  ): CompleteMarketData {
    // Basic calculations
    const totalFT = homeScoreFT + awayScoreFT;
    const totalHT = homeScoreHT + awayScoreHT;
    const secondHalfGoals = totalFT - totalHT;
    const goalDiffFT = homeScoreFT - awayScoreFT;
    const goalDiffHT = homeScoreHT - awayScoreHT;
    const homeSecondHalf = homeScoreFT - homeScoreHT;
    const awaySecondHalf = awayScoreFT - awayScoreHT;

    // Results
    const resultFT: 'W' | 'L' | 'D' = goalDiffFT > 0 ? 'W' : goalDiffFT < 0 ? 'L' : 'D';
    const resultHT: 'W' | 'L' | 'D' = goalDiffHT > 0 ? 'W' : goalDiffHT < 0 ? 'L' : 'D';

    // Build complete market data
    const markets: CompleteMarketData = {
      // Basic data
      home_score_ft: homeScoreFT,
      away_score_ft: awayScoreFT,
      home_score_ht: homeScoreHT,
      away_score_ht: awayScoreHT,
      total_goals_ft: totalFT,
      total_goals_ht: totalHT,
      second_half_goals: secondHalfGoals,
      goal_difference_ft: goalDiffFT,
      goal_difference_ht: goalDiffHT,

      // Results
      result_ft: resultFT,
      result_ht: resultHT,

      // 1. MATCH RESULT MARKETS
      match_1: homeScoreFT > awayScoreFT,
      match_X: homeScoreFT === awayScoreFT,
      match_2: awayScoreFT > homeScoreFT,

      // 2. DOUBLE CHANCE
      double_1X: homeScoreFT >= awayScoreFT,
      double_12: homeScoreFT !== awayScoreFT,
      double_X2: awayScoreFT >= homeScoreFT,

      // 3. OVER/UNDER GOALS - Start with base markets, then add dynamic ones
      over_0_5: totalFT > 0.5,
      over_1_5: totalFT > 1.5,
      over_2_5: totalFT > 2.5,
      over_3_5: totalFT > 3.5,
      over_4_5: totalFT > 4.5,
      over_5_5: totalFT > 5.5,
      over_6_5: totalFT > 6.5,
      over_7_5: totalFT > 7.5,
      under_2_5: totalFT < 2.5,
      under_3_5: totalFT < 3.5,
      under_4_5: totalFT < 4.5,

      // 4. BOTH TEAMS TO SCORE
      gg_ft: homeScoreFT > 0 && awayScoreFT > 0,
      ng_ft: !(homeScoreFT > 0 && awayScoreFT > 0),
      gg_ht: homeScoreHT > 0 && awayScoreHT > 0,
      ng_ht: !(homeScoreHT > 0 && awayScoreHT > 0),
      gg_2h: homeSecondHalf > 0 && awaySecondHalf > 0,
      ng_2h: !(homeSecondHalf > 0 && awaySecondHalf > 0),

      // 5. WIN TO NIL
      home_win_nil: homeScoreFT > awayScoreFT && awayScoreFT === 0,
      away_win_nil: awayScoreFT > homeScoreFT && homeScoreFT === 0,

      // 6. WINNING MARGIN
      home_by_1: goalDiffFT === 1,
      home_by_2: goalDiffFT === 2,
      home_by_3: goalDiffFT === 3,
      home_by_4: goalDiffFT === 4,
      home_by_5: goalDiffFT === 5,
      home_by_6_plus: goalDiffFT >= 6,
      away_by_1: goalDiffFT === -1,
      away_by_2: goalDiffFT === -2,
      away_by_3: goalDiffFT === -3,
      away_by_4: goalDiffFT === -4,
      away_by_5: goalDiffFT === -5,
      away_by_6_plus: goalDiffFT <= -6,

      // 7. ASIAN HANDICAP
      home_ah_minus_0_5: (homeScoreFT - 0.5) > awayScoreFT,
      home_ah_minus_1_0: (homeScoreFT - 1.0) > awayScoreFT,
      home_ah_minus_1_5: (homeScoreFT - 1.5) > awayScoreFT,
      home_ah_minus_2_0: (homeScoreFT - 2.0) > awayScoreFT,
      home_ah_minus_2_5: (homeScoreFT - 2.5) > awayScoreFT,
      home_ah_minus_3_0: (homeScoreFT - 3.0) > awayScoreFT,
      away_ah_plus_0_5: (awayScoreFT + 0.5) > homeScoreFT,
      away_ah_plus_1_0: (awayScoreFT + 1.0) > homeScoreFT,
      away_ah_plus_1_5: (awayScoreFT + 1.5) > homeScoreFT,
      away_ah_plus_2_0: (awayScoreFT + 2.0) > homeScoreFT,
      away_ah_plus_2_5: (awayScoreFT + 2.5) > homeScoreFT,
      away_ah_plus_3_0: (awayScoreFT + 3.0) > homeScoreFT,

      // 8. HALF-TIME MARKETS
      ht_over_0_5: totalHT > 0.5,
      ht_over_1_5: totalHT > 1.5,
      ht_over_2_5: totalHT > 2.5,
      ht_under_1_5: totalHT < 1.5,
      ht_under_2_5: totalHT < 2.5,
      ht_1: homeScoreHT > awayScoreHT,
      ht_X: homeScoreHT === awayScoreHT,
      ht_2: awayScoreHT > homeScoreHT,

      // 9. SECOND HALF MARKETS
      sh_over_0_5: secondHalfGoals > 0.5,
      sh_over_1_5: secondHalfGoals > 1.5,
      sh_over_2_5: secondHalfGoals > 2.5,
      sh_gg: homeSecondHalf > 0 && awaySecondHalf > 0,
      sh_home_win: homeSecondHalf > awaySecondHalf,
      sh_away_win: awaySecondHalf > homeSecondHalf,
      sh_draw: homeSecondHalf === awaySecondHalf,

      // 10. HALF-TIME/FULL-TIME COMBINATIONS
      ...this.generateHTFTCombinations(homeScoreHT, awayScoreHT, homeScoreFT, awayScoreFT),

      // 11. CORRECT SCORE
      exact_score_ft: `${homeScoreFT}-${awayScoreFT}`,
      exact_score_ht: `${homeScoreHT}-${awayScoreHT}`,

      // 12. RICH FINGERPRINTS - Generate team-agnostic patterns for learning
      rich_fingerprint_ft: this.generateFTFingerprint(homeScoreFT, awayScoreFT),
      rich_fingerprint_ht: this.generateHTFingerprint(homeScoreHT, awayScoreHT),
      rich_fingerprint_combined: this.generateCombinedFingerprint(homeScoreHT, awayScoreHT, homeScoreFT, awayScoreFT)
    };

    // Add dynamic over/under markets (extend beyond standard ranges based on actual goals)
    const dynamicOverUnder = this.generateDynamicOverUnderMarkets(totalFT);
    Object.assign(markets, dynamicOverUnder);

    return markets;
  }

  /**
   * Generate dynamic over/under markets with no artificial limits
   * Extends market range based on actual match totals for comprehensive learning
   */
  private generateDynamicOverUnderMarkets(totalGoals: number): OverUnderMarkets {
    const markets: OverUnderMarkets = {};
    
    // Always go at least 2.5 goals beyond actual total for complete market coverage
    const maxLine = Math.max(7.5, totalGoals + 2.5);
    
    // Generate all 0.5 increment lines
    for (let line = 0.5; line <= maxLine; line += 0.5) {
      const overKey = `over_${line.toString().replace('.', '_')}`;
      const underKey = `under_${line.toString().replace('.', '_')}`;
      
      markets[overKey] = totalGoals > line;
      markets[underKey] = totalGoals < line;
    }
    
    return markets;
  }

  /**
   * Generate Half-Time/Full-Time combination markets (9 total combinations)
   */
  private generateHTFTCombinations(htHome: number, htAway: number, ftHome: number, ftAway: number): HTFTCombinations {
    const htResult = htHome > htAway ? '1' : htHome < htAway ? '2' : 'X';
    const ftResult = ftHome > ftAway ? '1' : ftHome < ftAway ? '2' : 'X';
    
    return {
      ht_ft_1_1: htResult === '1' && ftResult === '1',
      ht_ft_1_X: htResult === '1' && ftResult === 'X',
      ht_ft_1_2: htResult === '1' && ftResult === '2',
      ht_ft_X_1: htResult === 'X' && ftResult === '1',
      ht_ft_X_X: htResult === 'X' && ftResult === 'X',
      ht_ft_X_2: htResult === 'X' && ftResult === '2',
      ht_ft_2_1: htResult === '2' && ftResult === '1',
      ht_ft_2_X: htResult === '2' && ftResult === 'X',
      ht_ft_2_2: htResult === '2' && ftResult === '2'
    };
  }

  /**
   * Generate full-time pattern fingerprint for team-agnostic learning
   * Example: "W(2-1,gg,o2.5,m1)" = Win, 2-1 score, both scored, over 2.5, margin 1
   */
  private generateFTFingerprint(homeScore: number, awayScore: number): string {
    const total = homeScore + awayScore;
    const result = homeScore > awayScore ? 'W' : homeScore < awayScore ? 'L' : 'D';
    const gg = homeScore > 0 && awayScore > 0 ? 'gg' : 'ng';
    const over25 = total > 2.5 ? 'o2.5' : 'u2.5';
    const margin = Math.abs(homeScore - awayScore);
    
    return `${result}(${homeScore}-${awayScore},${gg},${over25},m${margin})`;
  }

  /**
   * Generate half-time pattern fingerprint
   * Example: "W(1-0,ng,u1.5)" = Win at HT, 1-0, no both teams score, under 1.5
   */
  private generateHTFingerprint(homeScore: number, awayScore: number): string {
    const total = homeScore + awayScore;
    const result = homeScore > awayScore ? 'W' : homeScore < awayScore ? 'L' : 'D';
    const gg = homeScore > 0 && awayScore > 0 ? 'gg' : 'ng';
    const over15 = total > 1.5 ? 'o1.5' : 'u1.5';
    
    return `${result}(${homeScore}-${awayScore},${gg},${over15})`;
  }

  /**
   * Generate combined H/T → F/T transition pattern for advanced learning
   * This captures the complete narrative of a match for pattern recognition
   * Example: "W(1-0,ng,u1.5)→W(2-1,gg,o2.5,2h2)"
   */
  private generateCombinedFingerprint(htHome: number, htAway: number, ftHome: number, ftAway: number): string {
    const htFingerprint = this.generateHTFingerprint(htHome, htAway);
    const ftFingerprint = this.generateFTFingerprint(ftHome, ftAway);
    const secondHalfGoals = (ftHome + ftAway) - (htHome + htAway);
    
    // Add second half context to the pattern
    const shContext = `2h${secondHalfGoals}`;
    const ftWithSH = ftFingerprint.slice(0, -1) + `,${shContext})`;
    
    return `${htFingerprint}→${ftWithSH}`;
  }

  /**
   * Get all market types for a given CompleteMarketData
   * Useful for learning system to iterate over all available markets
   */
  getAvailableMarkets(marketData: CompleteMarketData): string[] {
    return Object.keys(marketData).filter(key => 
      typeof marketData[key as keyof CompleteMarketData] === 'boolean'
    );
  }

  /**
   * Get market outcome by name
   * Safe accessor for dynamic market keys
   */
  getMarketOutcome(marketData: CompleteMarketData, marketName: string): boolean | undefined {
    const outcome = marketData[marketName as keyof CompleteMarketData];
    return typeof outcome === 'boolean' ? outcome : undefined;
  }

  /**
   * Calculate market coverage statistics
   * For monitoring system performance and learning opportunities
   */
  getMarketCoverageStats(marketData: CompleteMarketData): {
    totalMarkets: number;
    trueOutcomes: number;
    falseOutcomes: number;
    coveragePercentage: number;
  } {
    const availableMarkets = this.getAvailableMarkets(marketData);
    const trueOutcomes = availableMarkets.filter(market => 
      this.getMarketOutcome(marketData, market) === true
    ).length;
    
    return {
      totalMarkets: availableMarkets.length,
      trueOutcomes,
      falseOutcomes: availableMarkets.length - trueOutcomes,
      coveragePercentage: (trueOutcomes / availableMarkets.length) * 100
    };
  }

  /**
   * Validate market data consistency
   * Ensures calculated markets are logically consistent
   */
  validateMarketConsistency(marketData: CompleteMarketData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate basic score consistency
    if (marketData.total_goals_ft !== marketData.home_score_ft + marketData.away_score_ft) {
      errors.push('Total goals FT calculation error');
    }

    // Validate result consistency
    const expectedResultFT = marketData.home_score_ft > marketData.away_score_ft ? 'W' : 
                             marketData.home_score_ft < marketData.away_score_ft ? 'L' : 'D';
    if (marketData.result_ft !== expectedResultFT) {
      errors.push('Full-time result calculation error');
    }

    // Validate over/under consistency
    if (marketData.over_2_5 === marketData.under_2_5) {
      errors.push('Over/Under 2.5 mutual exclusivity error');
    }

    // Validate GG/NG consistency
    if (marketData.gg_ft === marketData.ng_ft) {
      errors.push('GG/NG mutual exclusivity error');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance for consistent usage across the application
export const comprehensiveMarketCalculator = new ComprehensiveMarketCalculator();

// Export types for TypeScript support
export type { CompleteMarketData, OverUnderMarkets, AsianHandicapMarkets, HTFTCombinations };