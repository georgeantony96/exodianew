// Simulation API Types - Enhanced for 2025 compatibility
// Based on backend calibrated simulation engine and frontend requirements
// Now includes Mathematical Chaos Engine support

import { ChaosConfig } from '@/utils/chaos-config';

export interface Team {
  id: number;
  name: string;
  league_id?: number;
  league_name?: string;
  country?: string;
}

export interface League {
  id: number;
  name: string;
  country: string;
  season?: string;
  intelligence_enabled?: boolean;
  avg_efficiency_rating?: number;
  team_count?: number;
}

export interface HistoricalMatch {
  id?: number;
  home_team_id: number;
  away_team_id: number;
  home_score_ht: number;
  away_score_ht: number;
  home_score_ft: number;
  away_score_ft: number;
  match_type: 'h2h' | 'home_home' | 'away_away' | 'home_away' | 'away_home';
  match_date: string;
  home_team?: string;
  away_team?: string;
}

export interface BoostSettings {
  home_advantage: number;
  custom_home_boost: number;
  custom_away_boost: number;
  enable_streak_analysis?: boolean;
}

export interface BookmakerOdds {
  '1x2'?: {
    home: number;
    draw: number;
    away: number;
  };
  over_under?: {
    ou15?: { over: number; under: number; };
    ou25?: { over: number; under: number; };
    ou35?: { over: number; under: number; };
    ou45?: { over: number; under: number; };
    ou55?: { over: number; under: number; };
  };
  both_teams_score?: {
    yes: number;
    no: number;
  };
  first_half?: {
    gg_1h?: { yes: number; no: number; };
  };
  [key: string]: any; // Allow additional markets
}

// Backend format (from calibrated engine)
export interface ValueOpportunity {
  market: string;
  true_probability: number;
  calibrated_probability: number;
  bookmaker_odds: number;
  bookmaker_probability: number;
  edge: number;
  edge_percentage: number;
  kelly_fraction: number;
  recommended_stake_percent: number;
  recommended_stake_amount: number;
  expected_value: number;
  expected_roi_percent: number;
  confidence: number;
  calibration_factor: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  professional_grade: boolean;
  kelly_compliant: boolean;
}

// Frontend format (simplified for display)
export interface ValueBet {
  edge: number;
  true_odds: number;
  bookmaker_odds: number;
  true_probability: number;
  confidence: 'High' | 'Medium' | 'Low';
}

export interface ValueBets {
  [marketCategory: string]: {
    [outcome: string]: ValueBet;
  };
}

export interface SimulationProbabilities {
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
    over_3_5: number;
    under_3_5: number;
    over_4_5: number;
    under_4_5: number;
  };
  btts: {
    yes: number;
    no: number;
  };
  first_half?: {
    over_0_5: number;
    under_0_5: number;
    over_1_5: number;
    under_1_5: number;
  };
}

export interface TrueOdds {
  match_outcomes: {
    home_win: number;
    draw: number;
    away_win: number;
  };
  goal_markets: {
    [key: string]: number;
  };
  btts: {
    yes: number;
    no: number;
  };
  [key: string]: any;
}

export interface ProfessionalBenchmark {
  target_rps: number;
  achieved_rps: number;
  benchmark_met: boolean;
  performance_vs_target?: number;
}

export interface SimulationMetadata {
  iterations: number;
  home_lambda: number;
  away_lambda: number;
  simulation_time_seconds: number;
  iterations_per_second: number;
  calibration_optimized: boolean;
  engine_version: string;
  expected_advantage: string;
  chaos_enabled?: boolean;
  chaos_config?: ChaosConfig;
  chaos_impact?: {
    levy_flights_triggered: number;
    fractal_variance_avg: number;
    stochastic_shocks_applied: number;
  };
}

// Main simulation results (from backend)
export interface SimulationResults {
  probabilities: SimulationProbabilities;
  true_odds: TrueOdds;
  calibration_factor: number;
  confidence_score: number;
  rps_score: number;
  professional_grade: boolean;
  avg_home_goals: number;
  avg_away_goals: number;
  avg_total_goals: number;
  professional_benchmark: ProfessionalBenchmark;
  value_bets: ValueBets; // Frontend-compatible format
  home_team?: string;
  away_team?: string;
  metadata: SimulationMetadata;
}

// Complete API response from /api/simulate
export interface SimulationApiResponse {
  success: boolean;
  simulation_id?: number;
  results: SimulationResults;
  value_opportunities?: ValueOpportunity[]; // Backend format
  professional_benchmark: ProfessionalBenchmark;
  calibration_optimized: boolean;
  engine_version: string;
  kelly_criterion_enabled: boolean;
  total_execution_time: number;
  metadata: SimulationMetadata;
  // Error fields (when success: false)
  error?: string;
  details?: string;
  debug?: any;
}

// API Request format
export interface SimulationRequest {
  home_team_id: number;
  away_team_id: number;
  league_id: number;
  match_date: string;
  distribution_type: 'poisson' | 'negative_binomial';
  iterations: number;
  boost_settings: BoostSettings;
  historical_data: {
    h2h: HistoricalMatch[];
    home_home: HistoricalMatch[];
    away_away: HistoricalMatch[];
  };
  bookmaker_odds: BookmakerOdds;
  use_calibrated_engine?: boolean;
  chaos_config?: ChaosConfig;
}

// Frontend analysis format (used by ValueOpportunities component)
export interface ValueAnalysis {
  opportunities: Array<{
    market: string;
    trueOdds: number;
    bookmakerOdds: number;
    edge: number;
    probability: number;
    confidence: number;
    kellyStake?: number;
  }>;
  analysis: {
    highestProbability: {
      market: string;
      probability: number;
      trueOdds: number;
    };
    highestEdge: {
      market: string;
      edge: number;
      probability: number;
    };
    hasConflict: boolean;
    recommendation?: {
      primary: string;
      reason: string;
      secondary: string;
    };
  };
}

// League context for components
export interface LeagueContext {
  name: string;
  country: string;
  userAccuracy: number;
  leagueAverage: number;
  marketSpecificAccuracy: {
    [market: string]: number;
  };
}

// Health check types
export interface DatabaseHealthStatus {
  status: 'healthy' | 'error';
  database_responsive: boolean;
  query_time_ms: number;
  cache_size_mb: number;
  performance_grade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  table_count?: number;
  error?: string;
}

// Utility type for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}