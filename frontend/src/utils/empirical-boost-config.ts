/**
 * Empirical Boost Configuration
 * Data-driven streak thresholds based on 1M+ Monte Carlo iteration analysis
 * 
 * Replaces fixed "5+ streak" thresholds with empirical patterns:
 * - Pure win streaks (consecutive wins only)
 * - Pure loss streaks (consecutive losses only)
 * - Pure draw streaks (consecutive draws only)  
 * - Mixed streaks (unbeaten = wins+draws, winless = losses+draws)
 * - Differentiated home/away thresholds
 */

export interface EmpiricalStreakConfig {
  enabled: boolean;
  
  // Pure streak patterns (more specific, stronger effects)
  pureWinStreak: {
    threshold: number;        // 3+ consecutive wins
    penalty: number;          // -0.25 goal penalty (strong)
    confidenceBonus: number;  // 0.15 confidence boost for rare patterns
  };
  
  pureLossStreak: {
    threshold: number;        // 2+ consecutive losses
    boost: number;            // +0.30 goal boost (strong)
    confidenceBonus: number;  // 0.20 confidence boost for reversion
  };
  
  pureDrawStreak: {
    threshold: number;        // 2+ consecutive draws
    chaosAdjustment: number;  // +0.15 chaos factor (unpredictability)
    varianceMultiplier: number; // 1.2x simulation variance increase
  };
  
  // Mixed streak patterns (broader, moderate effects)
  unbeatenStreak: {
    threshold: number;        // 4+ consecutive unbeaten (wins OR draws)
    penalty: number;          // -0.20 goal penalty (moderate)
    confidenceBonus: number;  // 0.10 confidence boost
  };
  
  winlessStreak: {
    threshold: number;        // 3+ consecutive winless (losses OR draws)
    boost: number;            // +0.25 goal boost (moderate)
    confidenceBonus: number;  // 0.15 confidence boost
  };
  
  // Escalation factors for longer streaks
  escalation: {
    enabled: boolean;
    pureStreakMultiplier: number;   // 0.05 extra per game beyond threshold
    mixedStreakMultiplier: number;  // 0.03 extra per game beyond threshold
    maxTotalAdjustment: number;     // 0.50 maximum total adjustment cap
  };
}

export interface EmpiricalBoostSettings {
  homeStreaks: EmpiricalStreakConfig;
  awayStreaks: EmpiricalStreakConfig;
  
  // Global settings
  minimumSampleSize: number;        // 5 minimum games for streak analysis
  confidenceThreshold: number;      // 0.75 minimum confidence for adjustments
  
  // Integration with existing systems
  enableLegacyStreaks: boolean;     // false - disable old 5+ fixed system
  integrationMode: 'replace' | 'supplement'; // 'replace' old system entirely
}

// Default empirical configuration based on 1M iteration analysis
export const DEFAULT_EMPIRICAL_BOOST_CONFIG: EmpiricalBoostSettings = {
  homeStreaks: {
    enabled: true,
    pureWinStreak: {
      threshold: 3,              // 3+ consecutive pure wins (empirical)
      penalty: -0.25,            // Strong penalty for rare achievement
      confidenceBonus: 0.15
    },
    pureLossStreak: {
      threshold: 2,              // 2+ consecutive pure losses (empirical)
      boost: 0.30,               // Strong boost for reversion opportunity
      confidenceBonus: 0.20
    },
    pureDrawStreak: {
      threshold: 2,              // 2+ consecutive pure draws (empirical)
      chaosAdjustment: 0.15,     // Chaos factor for unpredictability
      varianceMultiplier: 1.2
    },
    unbeatenStreak: {
      threshold: 4,              // 4+ consecutive unbeaten (empirical)
      penalty: -0.20,            // Moderate penalty for mixed success
      confidenceBonus: 0.10
    },
    winlessStreak: {
      threshold: 3,              // 3+ consecutive winless (empirical) 
      boost: 0.25,               // Moderate boost for reversion
      confidenceBonus: 0.15
    },
    escalation: {
      enabled: true,
      pureStreakMultiplier: 0.05, // Extra penalty/boost per game
      mixedStreakMultiplier: 0.03,
      maxTotalAdjustment: 0.50
    }
  },
  
  awayStreaks: {
    enabled: true,
    pureWinStreak: {
      threshold: 3,              // 3+ consecutive pure wins (empirical)
      penalty: -0.22,            // Slightly lower (away wins rarer)
      confidenceBonus: 0.18      // Higher confidence for away achievements
    },
    pureLossStreak: {
      threshold: 2,              // 2+ consecutive pure losses (empirical)
      boost: 0.35,               // Higher boost (away form more volatile)
      confidenceBonus: 0.22
    },
    pureDrawStreak: {
      threshold: 2,              // 2+ consecutive pure draws (empirical)
      chaosAdjustment: 0.18,     // Higher chaos for away draws
      varianceMultiplier: 1.25   // More variance for away teams
    },
    unbeatenStreak: {
      threshold: 4,              // 4+ consecutive unbeaten (empirical)
      penalty: -0.18,            // Lower penalty (away unbeaten impressive)
      confidenceBonus: 0.12
    },
    winlessStreak: {
      threshold: 3,              // 3+ consecutive winless (empirical)
      boost: 0.28,               // Higher boost (away form concerns)
      confidenceBonus: 0.18
    },
    escalation: {
      enabled: true,
      pureStreakMultiplier: 0.05,
      mixedStreakMultiplier: 0.03,
      maxTotalAdjustment: 0.50
    }
  },
  
  // Global settings
  minimumSampleSize: 5,
  confidenceThreshold: 0.75,     // Higher than old system (50%)
  
  // Integration
  enableLegacyStreaks: false,    // Disable old fixed 5+ system
  integrationMode: 'replace'     // Replace entirely with empirical
};

/**
 * Streak pattern result interface
 */
export interface EmpiricalStreakResult {
  streakType: 'pure_win' | 'pure_loss' | 'pure_draw' | 'unbeaten' | 'winless';
  streakLength: number;
  threshold: number;
  adjustment: number;
  confidence: number;
  message: string;
  escalated: boolean;
  rawAdjustment: number;
  escalationBonus: number;
}