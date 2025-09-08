/**
 * Mean Reversion Detection Configuration
 * Advanced pattern recognition for football betting analysis
 * 
 * Implements sophisticated reversion logic including:
 * - Form pattern reversion (home/away/h2h)
 * - Defensive fatigue detection
 * - Attacking drought reversion
 * - Emotional momentum exhaustion
 */

export interface HistoricalMatch {
  home_team: string;       // Team names, not IDs
  away_team: string;       // Team names, not IDs
  home_score_ht: number;
  away_score_ht: number;
  home_score_ft: number;
  away_score_ft: number;
  match_date: string;
  match_type?: string;     // Optional as it's not always present
}

export interface ReversionPattern {
  type: 'home_form' | 'away_form' | 'h2h_wins' | 'h2h_overs' | 'defensive_fatigue' | 'attacking_drought' | 'emotional_exhaustion';
  threshold: number;
  minSampleSize: number;
  patternStrength: number;
  reversionAdjustment: number;
  confidence: number;
  message: string;
  detectedCount: number;
  totalSample: number;
}

export interface FormReversionConfig {
  enabled: boolean;
  overStreakThreshold: number;    // 3+ consecutive overs triggers reversion
  underStreakThreshold: number;   // 3+ consecutive unders triggers boost
  minGames: number;              // minimum games required for analysis
  goalPenalty: number;           // -0.18 goal reduction for over patterns (empirical)
  goalBoost: number;             // +0.15 goal boost for under patterns (empirical)
}

export interface H2HWinReversionConfig {
  enabled: boolean;
  winStreakThreshold: number;     // 3+ consecutive H2H wins triggers reversion
  minMatches: number;            // minimum H2H matches required for analysis
  winProbPenalty: number;        // -0.15 win probability reduction (empirical)
}

export interface H2HOverReversionConfig {
  enabled: boolean;
  overStreakThreshold: number;    // 3+ consecutive H2H overs triggers reversion
  underStreakThreshold: number;   // 3+ consecutive H2H unders triggers boost
  minMatches: number;            // minimum H2H matches required for analysis
  goalPenalty: number;           // -0.20 goal adjustment for over patterns (empirical)
  goalBoost: number;             // +0.18 goal boost for under patterns (empirical)
}

export interface DefensiveFatigueConfig {
  enabled: boolean;
  cleanSheetStreakThreshold: number; // 2+ consecutive clean sheets triggers fatigue (empirical)
  minGames: number;                 // minimum games required for analysis
  fatiguePenalty: number;           // -0.32 defensive penalty (empirical)
  consecutiveMultiplier: number;    // 0.02 extra penalty per consecutive clean sheet
}

export interface AttackingDroughtConfig {
  enabled: boolean;
  goallessGames: number;         // 2+ consecutive games without scoring (already streak-based)
  minGames: number;              // minimum sample size
  reversionBoost: number;        // +0.24 base attacking boost (empirical)
  intensityMultiplier: number;   // 0.04 extra boost per additional goalless game
  maxBoost: number;              // +0.30 maximum boost cap (increased)
}

export interface EmotionalMomentumConfig {
  enabled: boolean;
  winStreakThreshold: number;    // 8+ game win streak triggers pressure
  pressureMultiplier: number;    // 1.15 pressure builds exponentially
  psychologicalPenalty: number; // -0.06 base penalty
  maxPenalty: number;           // -0.15 maximum penalty cap
  streakDecayFactor: number;    // 1.2 how quickly pressure builds
}

export interface ReversionConfig {
  // Core form reversion patterns
  homeForm: FormReversionConfig;
  awayForm: FormReversionConfig;
  h2hWins: H2HWinReversionConfig;
  h2hOvers: H2HOverReversionConfig;
  
  // Advanced psychological/physical patterns
  defensiveFatigue: DefensiveFatigueConfig;
  attackingDrought: AttackingDroughtConfig;
  emotionalMomentum: EmotionalMomentumConfig;
  
  // Global settings
  globalEnabled: boolean;
  confidenceThreshold: number;   // 0.65 minimum confidence to apply adjustment
  maxTotalAdjustment: number;    // 0.30 maximum combined adjustment cap
}

export interface ReversionAnalysisResult {
  homeAdjustments: ReversionPattern[];
  awayAdjustments: ReversionPattern[];
  totalHomeLambdaAdjustment: number;
  totalAwayLambdaAdjustment: number;
  totalHomeWinProbAdjustment: number;
  totalAwayWinProbAdjustment: number;
  patternsDetected: number;
  highConfidencePatterns: number;
  analysisMetadata: {
    timestamp: Date;
    homeTeamId: number;
    awayTeamId: number;
    h2hSampleSize: number;
    homeFormSampleSize: number;
    awayFormSampleSize: number;
  };
}

export interface ReversionEvent {
  simulationId: number;
  timestamp: Date;
  patternType: string;
  patternStrength: number;
  confidence: number;
  lambdaAdjustment: number;
  winProbAdjustment?: number;
  teamName: string;
  matchContext: string;
  historicalData: {
    sampleSize: number;
    patternRate: number;
    consecutiveCount?: number;
  };
  actualOutcome?: boolean;
  profitabilityIndex?: number;
}

// Default configuration - low thresholds for sensitive detection, moderate penalties
export const DEFAULT_REVERSION_CONFIG: ReversionConfig = {
  homeForm: {
    enabled: true,
    overStreakThreshold: 3,   // 3+ consecutive overs triggers reversion (empirical)
    underStreakThreshold: 3,  // 3+ consecutive unders triggers boost (empirical)
    minGames: 5,              // minimum games for analysis
    goalPenalty: -0.25,       // -25% goal reduction (moderate with normalized baselines)
    goalBoost: 0.20           // +20% goal boost (balanced)
  },
  
  awayForm: {
    enabled: true,
    overStreakThreshold: 3,   // 3+ consecutive overs triggers reversion (empirical)
    underStreakThreshold: 2,  // 2+ consecutive unders triggers boost (empirical - away more sensitive)
    minGames: 5,              // minimum games for analysis
    goalPenalty: -0.25,       // -25% goal reduction (moderate with normalized baselines)
    goalBoost: 0.20           // +20% goal boost (balanced)
  },
  
  h2hWins: {
    enabled: true,
    winStreakThreshold: 3,    // 3+ consecutive H2H wins triggers reversion (empirical)
    minMatches: 5,            // minimum matches for analysis
    winProbPenalty: -0.15     // -15% win probability reduction (empirical - stronger)
  },
  
  h2hOvers: {
    enabled: true,
    overStreakThreshold: 3,   // 3+ consecutive H2H overs triggers reversion (empirical)
    underStreakThreshold: 3,  // 3+ consecutive H2H unders triggers boost (empirical)
    minMatches: 5,            // minimum matches for analysis
    goalPenalty: -0.30,       // -30% goal penalty (strongest signal, but moderate with normalized baselines)
    goalBoost: 0.22           // +22% goal boost (balanced for H2H)
  },
  
  defensiveFatigue: {
    enabled: true,
    cleanSheetStreakThreshold: 2, // 2+ consecutive clean sheets triggers fatigue (empirical)
    minGames: 4,                  // minimum games for analysis
    fatiguePenalty: -0.32,        // -32% defensive penalty (empirical - very strong)
    consecutiveMultiplier: 0.02   // +2% per consecutive clean sheet
  },
  
  attackingDrought: {
    enabled: true,
    goallessGames: 2,         // 2+ consecutive goalless games (already optimal - empirical)
    minGames: 3,              // minimum games for analysis
    reversionBoost: 0.24,     // +24% base boost (empirical - stronger)
    intensityMultiplier: 0.04, // +4% per additional goalless game
    maxBoost: 0.30            // +30% maximum boost (increased)
  },
  
  emotionalMomentum: {
    enabled: true,
    winStreakThreshold: 6,    // 6+ game win streak (LOW threshold)
    pressureMultiplier: 1.15, // Exponential pressure build
    psychologicalPenalty: -0.06, // -6% base penalty (MODERATE)
    maxPenalty: -0.15,        // -15% maximum penalty
    streakDecayFactor: 1.2    // Pressure build rate
  },
  
  // Global controls
  globalEnabled: true,
  confidenceThreshold: 0.70, // 70% minimum confidence (empirical - higher threshold)
  maxTotalAdjustment: 0.40   // 40% maximum total adjustment (increased for stronger penalties)
};