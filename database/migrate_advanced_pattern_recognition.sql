-- EXODIA FINAL: Advanced Pattern Recognition Database Migration
-- Generated: August 28, 2025
-- Phase 1: Complete Database Foundation for Intelligent Learning System

-- =====================================================================
-- TABLE 1: RICH HISTORICAL PATTERNS
-- Purpose: Store complete betting market data auto-calculated from scores
-- =====================================================================

CREATE TABLE IF NOT EXISTS rich_historical_patterns (
  id INTEGER PRIMARY KEY,
  simulation_id INTEGER,
  team_type TEXT CHECK (team_type IN ('home', 'away', 'h2h')),
  game_position INTEGER, -- 1=most recent, 2=second most recent

  -- FULL MATCH DATA (user inputs both H/T and F/T)
  home_score_ft INTEGER NOT NULL,
  away_score_ft INTEGER NOT NULL,
  home_score_ht INTEGER DEFAULT 0,
  away_score_ht INTEGER DEFAULT 0,

  -- AUTO-CALCULATED DERIVED DATA
  total_goals_ft INTEGER GENERATED ALWAYS AS (home_score_ft + away_score_ft),
  total_goals_ht INTEGER GENERATED ALWAYS AS (home_score_ht + away_score_ht),
  second_half_goals INTEGER GENERATED ALWAYS AS ((home_score_ft + away_score_ft) - (home_score_ht + away_score_ht)),
  goal_difference_ft INTEGER GENERATED ALWAYS AS (home_score_ft - away_score_ft),
  goal_difference_ht INTEGER GENERATED ALWAYS AS (home_score_ht - away_score_ht),

  -- MATCH RESULTS
  result_ft TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN home_score_ft > away_score_ft THEN 'W'
      WHEN home_score_ft < away_score_ft THEN 'L'
      ELSE 'D'
    END
  ),
  result_ht TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN home_score_ht > away_score_ht THEN 'W'
      WHEN home_score_ht < away_score_ht THEN 'L'
      ELSE 'D'
    END
  ),

  -- 1. MATCH RESULT MARKETS
  match_1 BOOLEAN GENERATED ALWAYS AS (home_score_ft > away_score_ft),
  match_X BOOLEAN GENERATED ALWAYS AS (home_score_ft = away_score_ft),
  match_2 BOOLEAN GENERATED ALWAYS AS (away_score_ft > home_score_ft),

  -- 2. DOUBLE CHANCE MARKETS
  double_1X BOOLEAN GENERATED ALWAYS AS (home_score_ft >= away_score_ft),
  double_12 BOOLEAN GENERATED ALWAYS AS (home_score_ft != away_score_ft),
  double_X2 BOOLEAN GENERATED ALWAYS AS (away_score_ft >= home_score_ft),

  -- 3. OVER/UNDER GOALS (Dynamic coverage)
  over_0_5 BOOLEAN GENERATED ALWAYS AS ((home_score_ft + away_score_ft) > 0.5),
  over_1_5 BOOLEAN GENERATED ALWAYS AS ((home_score_ft + away_score_ft) > 1.5),
  over_2_5 BOOLEAN GENERATED ALWAYS AS ((home_score_ft + away_score_ft) > 2.5),
  over_3_5 BOOLEAN GENERATED ALWAYS AS ((home_score_ft + away_score_ft) > 3.5),
  over_4_5 BOOLEAN GENERATED ALWAYS AS ((home_score_ft + away_score_ft) > 4.5),
  over_5_5 BOOLEAN GENERATED ALWAYS AS ((home_score_ft + away_score_ft) > 5.5),
  over_6_5 BOOLEAN GENERATED ALWAYS AS ((home_score_ft + away_score_ft) > 6.5),
  over_7_5 BOOLEAN GENERATED ALWAYS AS ((home_score_ft + away_score_ft) > 7.5),
  
  under_2_5 BOOLEAN GENERATED ALWAYS AS ((home_score_ft + away_score_ft) < 2.5),
  under_3_5 BOOLEAN GENERATED ALWAYS AS ((home_score_ft + away_score_ft) < 3.5),
  under_4_5 BOOLEAN GENERATED ALWAYS AS ((home_score_ft + away_score_ft) < 4.5),

  -- 4. BOTH TEAMS TO SCORE (Complete H/T + F/T coverage)
  gg_ft BOOLEAN GENERATED ALWAYS AS (home_score_ft > 0 AND away_score_ft > 0),
  ng_ft BOOLEAN GENERATED ALWAYS AS (NOT (home_score_ft > 0 AND away_score_ft > 0)),
  gg_ht BOOLEAN GENERATED ALWAYS AS (home_score_ht > 0 AND away_score_ht > 0),
  ng_ht BOOLEAN GENERATED ALWAYS AS (NOT (home_score_ht > 0 AND away_score_ht > 0)),
  gg_2h BOOLEAN GENERATED ALWAYS AS (
    (home_score_ft - home_score_ht > 0) AND (away_score_ft - away_score_ht > 0)
  ),
  ng_2h BOOLEAN GENERATED ALWAYS AS (NOT (
    (home_score_ft - home_score_ht > 0) AND (away_score_ft - away_score_ht > 0)
  )),

  -- 5. WIN TO NIL
  home_win_nil BOOLEAN GENERATED ALWAYS AS (home_score_ft > away_score_ft AND away_score_ft = 0),
  away_win_nil BOOLEAN GENERATED ALWAYS AS (away_score_ft > home_score_ft AND home_score_ft = 0),

  -- 6. WINNING MARGIN (Dynamic)
  home_by_1 BOOLEAN GENERATED ALWAYS AS (home_score_ft - away_score_ft = 1),
  home_by_2 BOOLEAN GENERATED ALWAYS AS (home_score_ft - away_score_ft = 2),
  home_by_3 BOOLEAN GENERATED ALWAYS AS (home_score_ft - away_score_ft = 3),
  home_by_4 BOOLEAN GENERATED ALWAYS AS (home_score_ft - away_score_ft = 4),
  home_by_5 BOOLEAN GENERATED ALWAYS AS (home_score_ft - away_score_ft = 5),
  home_by_6_plus BOOLEAN GENERATED ALWAYS AS (home_score_ft - away_score_ft >= 6),
  
  away_by_1 BOOLEAN GENERATED ALWAYS AS (away_score_ft - home_score_ft = 1),
  away_by_2 BOOLEAN GENERATED ALWAYS AS (away_score_ft - home_score_ft = 2),
  away_by_3 BOOLEAN GENERATED ALWAYS AS (away_score_ft - home_score_ft = 3),
  away_by_4 BOOLEAN GENERATED ALWAYS AS (away_score_ft - home_score_ft = 4),
  away_by_5 BOOLEAN GENERATED ALWAYS AS (away_score_ft - home_score_ft = 5),
  away_by_6_plus BOOLEAN GENERATED ALWAYS AS (away_score_ft - home_score_ft >= 6),

  -- 7. ASIAN HANDICAP (Quarter lines)
  home_ah_minus_0_5 BOOLEAN GENERATED ALWAYS AS ((home_score_ft - 0.5) > away_score_ft),
  home_ah_minus_1_0 BOOLEAN GENERATED ALWAYS AS ((home_score_ft - 1.0) > away_score_ft),
  home_ah_minus_1_5 BOOLEAN GENERATED ALWAYS AS ((home_score_ft - 1.5) > away_score_ft),
  home_ah_minus_2_0 BOOLEAN GENERATED ALWAYS AS ((home_score_ft - 2.0) > away_score_ft),
  home_ah_minus_2_5 BOOLEAN GENERATED ALWAYS AS ((home_score_ft - 2.5) > away_score_ft),
  
  away_ah_plus_0_5 BOOLEAN GENERATED ALWAYS AS ((away_score_ft + 0.5) > home_score_ft),
  away_ah_plus_1_0 BOOLEAN GENERATED ALWAYS AS ((away_score_ft + 1.0) > home_score_ft),
  away_ah_plus_1_5 BOOLEAN GENERATED ALWAYS AS ((away_score_ft + 1.5) > home_score_ft),
  away_ah_plus_2_0 BOOLEAN GENERATED ALWAYS AS ((away_score_ft + 2.0) > home_score_ft),
  away_ah_plus_2_5 BOOLEAN GENERATED ALWAYS AS ((away_score_ft + 2.5) > home_score_ft),

  -- 8. HALF-TIME MARKETS
  ht_over_0_5 BOOLEAN GENERATED ALWAYS AS ((home_score_ht + away_score_ht) > 0.5),
  ht_over_1_5 BOOLEAN GENERATED ALWAYS AS ((home_score_ht + away_score_ht) > 1.5),
  ht_over_2_5 BOOLEAN GENERATED ALWAYS AS ((home_score_ht + away_score_ht) > 2.5),
  ht_under_1_5 BOOLEAN GENERATED ALWAYS AS ((home_score_ht + away_score_ht) < 1.5),
  ht_under_2_5 BOOLEAN GENERATED ALWAYS AS ((home_score_ht + away_score_ht) < 2.5),
  ht_1 BOOLEAN GENERATED ALWAYS AS (home_score_ht > away_score_ht),
  ht_X BOOLEAN GENERATED ALWAYS AS (home_score_ht = away_score_ht),
  ht_2 BOOLEAN GENERATED ALWAYS AS (away_score_ht > home_score_ht),

  -- 9. SECOND HALF MARKETS
  sh_over_0_5 BOOLEAN GENERATED ALWAYS AS (((home_score_ft + away_score_ft) - (home_score_ht + away_score_ht)) > 0.5),
  sh_over_1_5 BOOLEAN GENERATED ALWAYS AS (((home_score_ft + away_score_ft) - (home_score_ht + away_score_ht)) > 1.5),
  sh_over_2_5 BOOLEAN GENERATED ALWAYS AS (((home_score_ft + away_score_ft) - (home_score_ht + away_score_ht)) > 2.5),

  -- 10. HALF-TIME/FULL-TIME COMBINATIONS (9 total)
  ht_ft_1_1 BOOLEAN GENERATED ALWAYS AS (home_score_ht > away_score_ht AND home_score_ft > away_score_ft),
  ht_ft_1_X BOOLEAN GENERATED ALWAYS AS (home_score_ht > away_score_ht AND home_score_ft = away_score_ft),
  ht_ft_1_2 BOOLEAN GENERATED ALWAYS AS (home_score_ht > away_score_ht AND away_score_ft > home_score_ft),
  ht_ft_X_1 BOOLEAN GENERATED ALWAYS AS (home_score_ht = away_score_ht AND home_score_ft > away_score_ft),
  ht_ft_X_X BOOLEAN GENERATED ALWAYS AS (home_score_ht = away_score_ht AND home_score_ft = away_score_ft),
  ht_ft_X_2 BOOLEAN GENERATED ALWAYS AS (home_score_ht = away_score_ht AND away_score_ft > home_score_ft),
  ht_ft_2_1 BOOLEAN GENERATED ALWAYS AS (away_score_ht > home_score_ht AND home_score_ft > away_score_ft),
  ht_ft_2_X BOOLEAN GENERATED ALWAYS AS (away_score_ht > home_score_ht AND home_score_ft = away_score_ft),
  ht_ft_2_2 BOOLEAN GENERATED ALWAYS AS (away_score_ht > home_score_ht AND away_score_ft > home_score_ft),

  -- 11. CORRECT SCORE
  exact_score_ft TEXT GENERATED ALWAYS AS (home_score_ft || '-' || away_score_ft),
  exact_score_ht TEXT GENERATED ALWAYS AS (home_score_ht || '-' || away_score_ht),

  -- 12. RICH PATTERN FINGERPRINTS (Team-agnostic for pattern matching)
  rich_fingerprint_ft TEXT, -- Will be calculated in application logic
  rich_fingerprint_ht TEXT, -- Will be calculated in application logic  
  rich_fingerprint_combined TEXT, -- Will be calculated in application logic

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE
);

-- =====================================================================
-- TABLE 2: PATTERN LEARNING OUTCOMES
-- Purpose: Track prediction accuracy for adaptive learning
-- =====================================================================

CREATE TABLE IF NOT EXISTS pattern_learning_outcomes (
  id INTEGER PRIMARY KEY,
  pattern_fingerprint TEXT NOT NULL, -- Full pattern: "W(2-1,gg)-W(1-0,ng)-D(3-3,gg)_vs_L(0-2,ng)-W(4-1,gg)"
  pattern_length INTEGER NOT NULL, -- 3, 5, 6, 8 games
  market_type TEXT NOT NULL, -- 'over_2_5', 'gg_ft', 'home_ah_minus_1_5', 'ht_under_1_5'
  predicted_outcome BOOLEAN NOT NULL, -- What we predicted
  actual_outcome BOOLEAN, -- What actually happened (NULL until result known)
  confidence_level REAL NOT NULL CHECK (confidence_level >= 0.0 AND confidence_level <= 1.0),
  
  -- Learning metrics (auto-updated via triggers)
  success_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 1,
  success_rate REAL DEFAULT 0.0,
  
  -- Metadata
  simulation_id INTEGER, -- Reference to original simulation
  prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  result_date TIMESTAMP, -- When actual outcome was recorded
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE SET NULL
);

-- =====================================================================
-- TABLE 3: ADAPTIVE THRESHOLDS
-- Purpose: Self-improving pattern penalties based on outcomes
-- =====================================================================

CREATE TABLE IF NOT EXISTS adaptive_thresholds (
  id INTEGER PRIMARY KEY,
  pattern_type TEXT UNIQUE NOT NULL, -- 'home_over_dominance', 'away_unbeaten_streak', 'h2h_over_pattern'
  current_penalty REAL NOT NULL, -- e.g., -0.25 (starts with fixed values, learns over time)
  original_penalty REAL NOT NULL, -- e.g., -0.25 (never changes, for comparison)
  
  -- Learning history
  total_predictions INTEGER DEFAULT 0,
  successful_predictions INTEGER DEFAULT 0,
  total_error REAL DEFAULT 0.0, -- Cumulative prediction error
  avg_error REAL DEFAULT 0.0, -- Average error over all predictions
  recent_avg_error REAL DEFAULT 0.0, -- Average error over last 20 predictions
  
  -- Adjustment tracking
  last_adjustment REAL DEFAULT 0.0, -- Last change made
  last_adjusted_at TIMESTAMP,
  adjustment_count INTEGER DEFAULT 0, -- How many times adjusted
  learning_rate REAL DEFAULT 0.02, -- How quickly to adapt (conservative)
  confidence_threshold REAL DEFAULT 0.7, -- Minimum confidence to learn from
  
  -- Boundaries
  min_penalty REAL DEFAULT -0.50, -- Maximum penalty cap
  max_penalty REAL DEFAULT 0.00, -- Don't allow positive penalties
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- TABLE 4: SEQUENCE PATTERNS
-- Purpose: Psychological momentum analysis (WWWWW vs WLWLW)
-- =====================================================================

CREATE TABLE IF NOT EXISTS sequence_patterns (
  id INTEGER PRIMARY KEY,
  sequence_fingerprint TEXT UNIQUE NOT NULL, -- 'WWWWW', 'LLWWW', 'WLWLW'
  momentum_state TEXT NOT NULL CHECK (momentum_state IN ('peak', 'building', 'fragile', 'declining', 'neutral')),
  psychological_modifier REAL NOT NULL CHECK (psychological_modifier >= -0.20 AND psychological_modifier <= 0.20),
  confidence REAL NOT NULL CHECK (confidence >= 0.1 AND confidence <= 0.95),
  explanation TEXT NOT NULL, -- Human-readable reasoning
  
  -- Performance tracking (updated as we learn)
  times_detected INTEGER DEFAULT 0,
  successful_predictions INTEGER DEFAULT 0,
  total_predictions INTEGER DEFAULT 0,
  accuracy_rate REAL DEFAULT 0.0,
  
  -- Learning metrics
  avg_goal_impact REAL DEFAULT 0.0, -- Average actual impact on goals
  avg_probability_impact REAL DEFAULT 0.0, -- Average impact on win probability
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- PERFORMANCE INDEXES
-- =====================================================================

-- Rich Historical Patterns indexes
CREATE INDEX IF NOT EXISTS idx_rich_patterns_simulation ON rich_historical_patterns(simulation_id);
CREATE INDEX IF NOT EXISTS idx_rich_patterns_team_type ON rich_historical_patterns(team_type, game_position);
CREATE INDEX IF NOT EXISTS idx_rich_patterns_fingerprint ON rich_historical_patterns(rich_fingerprint_combined);
CREATE INDEX IF NOT EXISTS idx_rich_patterns_result ON rich_historical_patterns(result_ft, team_type);
CREATE INDEX IF NOT EXISTS idx_rich_patterns_score_lookup ON rich_historical_patterns(home_score_ft, away_score_ft, home_score_ht, away_score_ht);

-- Pattern Learning Outcomes indexes
CREATE INDEX IF NOT EXISTS idx_pattern_learning_fingerprint ON pattern_learning_outcomes(pattern_fingerprint);
CREATE INDEX IF NOT EXISTS idx_pattern_learning_market ON pattern_learning_outcomes(market_type);
CREATE INDEX IF NOT EXISTS idx_pattern_learning_performance ON pattern_learning_outcomes(pattern_fingerprint, market_type, success_rate);
CREATE INDEX IF NOT EXISTS idx_pattern_learning_confidence ON pattern_learning_outcomes(confidence_level, total_count);
CREATE INDEX IF NOT EXISTS idx_pattern_learning_simulation ON pattern_learning_outcomes(simulation_id);

-- Adaptive Thresholds indexes
CREATE INDEX IF NOT EXISTS idx_adaptive_thresholds_type ON adaptive_thresholds(pattern_type);
CREATE INDEX IF NOT EXISTS idx_adaptive_thresholds_performance ON adaptive_thresholds(pattern_type, avg_error, adjustment_count);

-- Sequence Patterns indexes
CREATE INDEX IF NOT EXISTS idx_sequence_patterns_fingerprint ON sequence_patterns(sequence_fingerprint);
CREATE INDEX IF NOT EXISTS idx_sequence_patterns_momentum ON sequence_patterns(momentum_state, confidence);
CREATE INDEX IF NOT EXISTS idx_sequence_patterns_accuracy ON sequence_patterns(sequence_fingerprint, accuracy_rate);

-- =====================================================================
-- TRIGGERS FOR AUTOMATIC MAINTENANCE
-- =====================================================================

-- Update pattern learning success rates when actual outcomes are recorded
CREATE TRIGGER IF NOT EXISTS update_pattern_learning_stats
  AFTER UPDATE ON pattern_learning_outcomes
  WHEN NEW.actual_outcome IS NOT NULL AND OLD.actual_outcome IS NULL
BEGIN
  UPDATE pattern_learning_outcomes 
  SET 
    success_count = CASE WHEN NEW.predicted_outcome = NEW.actual_outcome THEN success_count + 1 ELSE success_count END,
    success_rate = CAST(success_count AS REAL) / total_count,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

-- Update adaptive threshold statistics
CREATE TRIGGER IF NOT EXISTS update_adaptive_threshold_stats
  AFTER INSERT ON pattern_learning_outcomes
BEGIN
  UPDATE adaptive_thresholds 
  SET 
    total_predictions = total_predictions + 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE pattern_type = NEW.pattern_fingerprint;
END;

-- =====================================================================
-- INITIALIZE ADAPTIVE THRESHOLDS WITH CURRENT SYSTEM VALUES
-- =====================================================================

INSERT OR IGNORE INTO adaptive_thresholds (
  pattern_type, current_penalty, original_penalty, learning_rate, confidence_threshold
) VALUES 
  ('home_over_dominance', -0.25, -0.25, 0.03, 0.7),
  ('away_over_dominance', -0.25, -0.25, 0.03, 0.7),
  ('home_unbeaten_streak', -0.18, -0.18, 0.02, 0.7),
  ('away_unbeaten_streak', -0.18, -0.18, 0.02, 0.7),
  ('h2h_over_pattern', -0.30, -0.30, 0.02, 0.7),
  ('h2h_under_pattern', 0.20, 0.20, 0.02, 0.7),
  ('home_win_dominance', -0.13, -0.13, 0.02, 0.7),
  ('away_win_dominance', -0.13, -0.13, 0.02, 0.7);

-- =====================================================================
-- INITIALIZE SEQUENCE PATTERNS WITH PSYCHOLOGICAL LIBRARY
-- =====================================================================

INSERT OR IGNORE INTO sequence_patterns (
  sequence_fingerprint, momentum_state, psychological_modifier, confidence, explanation
) VALUES 
  ('WWWWW', 'peak', -0.12, 0.85, 'Perfect run creates pressure and opponent motivation - regression risk'),
  ('WWWWD', 'fragile', -0.15, 0.80, 'Recent draw breaks perfect momentum, creates mental doubt'),
  ('LLWWW', 'building', 0.15, 0.75, 'Strong recovery builds authentic confidence and team cohesion'),
  ('LLLWW', 'building', 0.10, 0.65, 'Early recovery phase - confidence building but not fully established'),
  ('WLWLW', 'fragile', -0.10, 0.70, 'Inconsistent results suggest mental or tactical fragility'),
  ('DWDWD', 'fragile', -0.05, 0.60, 'Draw habit formation - losing killer instinct and decisiveness'),
  ('WWWDD', 'declining', -0.08, 0.65, 'Momentum loss after strong period - confidence draining'),
  ('WDDDD', 'declining', -0.12, 0.70, 'Drawing habit after winning start - mental weakness developing'),
  ('LLLLL', 'declining', 0.18, 0.80, 'Extended losing streak creates motivation for turnaround'),
  ('DDDDW', 'building', 0.12, 0.70, 'Breaking draw habit with win - confidence boost'),
  ('WDWDW', 'fragile', -0.08, 0.65, 'Win-draw alternation shows inconsistency'),
  ('LDWLD', 'fragile', -0.06, 0.60, 'Mixed results indicate instability');

-- =====================================================================
-- VALIDATION VIEWS FOR DEBUGGING
-- =====================================================================

-- View to check rich pattern calculations
CREATE VIEW IF NOT EXISTS v_pattern_validation AS
SELECT 
  id,
  home_score_ft, away_score_ft, home_score_ht, away_score_ht,
  total_goals_ft, total_goals_ht, second_half_goals,
  result_ft, result_ht,
  over_2_5, under_2_5, gg_ft, ng_ft,
  exact_score_ft, exact_score_ht
FROM rich_historical_patterns
ORDER BY created_at DESC
LIMIT 10;

-- View to check learning progress
CREATE VIEW IF NOT EXISTS v_learning_progress AS
SELECT 
  pattern_type,
  current_penalty,
  original_penalty,
  (current_penalty - original_penalty) as adjustment,
  total_predictions,
  successful_predictions,
  CASE 
    WHEN total_predictions > 0 THEN CAST(successful_predictions AS REAL) / total_predictions 
    ELSE 0 
  END as success_rate,
  avg_error,
  adjustment_count
FROM adaptive_thresholds
ORDER BY total_predictions DESC;

-- Migration completed successfully
-- Next: Implement ComprehensiveMarketCalculator utility class