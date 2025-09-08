-- EXODIA FINAL Database Schema V2
-- Monte Carlo Sports Betting Simulation with League Intelligence System
-- CRITICAL UPDATE: Adding League System, Home/Away Separation, Market Intelligence

-- ========================================
-- STEP 1: LEAGUES MANAGEMENT SYSTEM
-- ========================================

-- Leagues table with intelligence tracking
CREATE TABLE leagues (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,        -- "Premier League", "La Liga", "Serie A"
    country TEXT NOT NULL,            -- "England", "Spain", "Italy"
    avg_goals_home REAL DEFAULT 1.5,  -- League-specific home averages
    avg_goals_away REAL DEFAULT 1.2,  -- League-specific away averages
    over25_frequency REAL,            -- Historical O2.5 hit rate (Argentina: 0.75)
    market_efficiency REAL DEFAULT 0.9, -- Bookmaker efficiency rating (0-1)
    home_advantage_factor REAL DEFAULT 0.20, -- League-specific home advantage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- STEP 2: TEAMS TABLE ENHANCEMENT
-- ========================================

-- Add league context to existing teams table (ALTER TABLE approach)
-- Note: This will be handled in migration script for existing data

-- ========================================
-- STEP 3: HOME/AWAY PERFORMANCE SEPARATION
-- ========================================

-- Separate home performance tracking (solving Chelsea concern)
CREATE TABLE team_home_performance (
    id INTEGER PRIMARY KEY,
    team_id INTEGER NOT NULL,
    goals_for_avg REAL DEFAULT 0,               -- Rolling average goals scored at home
    goals_against_avg REAL DEFAULT 0,           -- Rolling average goals conceded at home
    matches_played INTEGER DEFAULT 0,
    last_6_form TEXT DEFAULT '',                -- "WWDLWW" format
    streak_type TEXT,                           -- "unbeaten", "losing", "winning", NULL
    streak_length INTEGER DEFAULT 0,
    form_reliability REAL DEFAULT 0.5,         -- How reliable is this form data (0-1)
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Separate away performance tracking
CREATE TABLE team_away_performance (
    id INTEGER PRIMARY KEY,
    team_id INTEGER NOT NULL,
    goals_for_avg REAL DEFAULT 0,               -- Rolling average goals scored away
    goals_against_avg REAL DEFAULT 0,           -- Rolling average goals conceded away
    matches_played INTEGER DEFAULT 0,
    last_6_form TEXT DEFAULT '',                -- "WWDLWW" format
    streak_type TEXT,                           -- "unbeaten", "losing", "winning", NULL
    streak_length INTEGER DEFAULT 0,
    form_reliability REAL DEFAULT 0.5,         -- How reliable is this form data (0-1)
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- ========================================
-- STEP 4: MARKET INTELLIGENCE SYSTEM
-- ========================================

-- Market-specific accuracy tracking by league
CREATE TABLE market_accuracy (
    id INTEGER PRIMARY KEY,
    league_id INTEGER NOT NULL,
    market_type TEXT NOT NULL,                 -- "1x2", "ou25", "btts", "gg_1h"
    market_option TEXT,                        -- "home", "over", "yes", etc.
    total_predictions INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    accuracy_percentage REAL DEFAULT 0,
    total_edge_captured REAL DEFAULT 0,        -- Sum of profitable edges
    confidence_level REAL DEFAULT 0,           -- Statistical confidence (0-1)
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE
);

-- ========================================
-- STEP 5: LEAGUE MARKET INTELLIGENCE (CRITICAL ADDITION)
-- ========================================

-- Track all odds patterns by league/market for Argentina-style discoveries
CREATE TABLE league_market_intelligence (
    id INTEGER PRIMARY KEY,
    league_id INTEGER NOT NULL,
    market_type TEXT NOT NULL,                    -- "1x2", "ou25", "btts", etc.
    market_option TEXT NOT NULL,                  -- "home", "over", "yes", etc.
    
    -- Statistical tracking of all odds inputs
    odds_count INTEGER DEFAULT 0,               -- How many times this market was input
    odds_sum REAL DEFAULT 0,                    -- Sum of all odds (for average calculation)
    odds_min REAL DEFAULT 999,                  -- Lowest odds seen
    odds_max REAL DEFAULT 0,                    -- Highest odds seen  
    odds_avg REAL DEFAULT 0,                    -- Rolling average odds
    odds_stddev REAL DEFAULT 0,                 -- Standard deviation (market volatility)
    
    -- Value detection intelligence
    value_opportunities INTEGER DEFAULT 0,      -- How many times this showed value
    avg_edge_when_value REAL DEFAULT 0,        -- Average edge when value detected
    hit_rate REAL DEFAULT 0,                   -- Win rate when we bet this market
    total_profit_loss REAL DEFAULT 0,          -- Cumulative P&L from this market
    
    -- Market efficiency insights
    market_efficiency REAL DEFAULT 0.9,        -- How sharp is this market (0-1)?
    opportunity_frequency REAL DEFAULT 0,      -- How often does value appear (0-1)?
    seasonal_pattern TEXT,                     -- "higher_in_winter", "consistent", etc.
    trend_direction TEXT DEFAULT 'stable',     -- "improving", "declining", "stable"
    
    -- Metadata
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE,
    UNIQUE(league_id, market_type, market_option)
);

-- ========================================
-- STEP 6: MATCH-SPECIFIC ODDS ANALYSIS (PATTERN RECOGNITION)
-- ========================================

-- Real-time learning from every odds input
CREATE TABLE match_odds_analysis (
    id INTEGER PRIMARY KEY,
    simulation_id INTEGER,
    league_id INTEGER NOT NULL,
    market_type TEXT NOT NULL,
    market_option TEXT NOT NULL,
    
    -- Input vs League Intelligence comparison
    input_odds REAL NOT NULL,                  -- What user entered
    league_avg_odds REAL,                      -- League historical average at time of input
    deviation_percentage REAL,                 -- How different from league norm
    value_probability REAL DEFAULT 0,          -- Likelihood this is value (0-1)
    confidence_score REAL DEFAULT 0,           -- How confident are we (0-1)
    
    -- Context enrichment for better predictions
    team_tier_context TEXT,                    -- "big6_vs_mid", "relegation_battle", "top_vs_bottom"
    seasonal_context TEXT,                     -- "winter", "summer", "end_of_season"
    fixture_context TEXT,                      -- "midweek", "weekend", "cup", "derby"
    form_context TEXT,                         -- "both_good_form", "home_poor_form", etc.
    
    -- Learning outcomes (filled after match completion)
    predicted_value BOOLEAN,                   -- Did we think this was value?
    actual_result BOOLEAN,                     -- Did the bet hit?
    edge_realized REAL,                        -- Actual profit/loss percentage
    learning_weight REAL DEFAULT 1.0,          -- How much to weight this result for learning
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    result_confirmed_at TIMESTAMP,
    
    FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE,
    FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE
);

-- ========================================
-- PERFORMANCE INDEXES FOR NEW TABLES
-- ========================================

-- Leagues indexes
CREATE INDEX idx_leagues_name ON leagues(name);
CREATE INDEX idx_leagues_country ON leagues(country);

-- Performance tracking indexes
CREATE INDEX idx_team_home_performance_team ON team_home_performance(team_id);
CREATE INDEX idx_team_away_performance_team ON team_away_performance(team_id);

-- Market accuracy indexes
CREATE INDEX idx_market_accuracy_league_market ON market_accuracy(league_id, market_type);
CREATE INDEX idx_market_accuracy_league ON market_accuracy(league_id);

-- League market intelligence indexes (critical for performance)
CREATE INDEX idx_league_intelligence_league ON league_market_intelligence(league_id);
CREATE INDEX idx_league_intelligence_market ON league_market_intelligence(league_id, market_type);
CREATE INDEX idx_league_intelligence_full ON league_market_intelligence(league_id, market_type, market_option);
CREATE INDEX idx_league_intelligence_efficiency ON league_market_intelligence(market_efficiency);
CREATE INDEX idx_league_intelligence_opportunities ON league_market_intelligence(opportunity_frequency DESC);

-- Match analysis indexes
CREATE INDEX idx_match_analysis_simulation ON match_odds_analysis(simulation_id);
CREATE INDEX idx_match_analysis_league ON match_odds_analysis(league_id);
CREATE INDEX idx_match_analysis_market ON match_odds_analysis(league_id, market_type);
CREATE INDEX idx_match_analysis_value ON match_odds_analysis(predicted_value);
CREATE INDEX idx_match_analysis_date ON match_odds_analysis(created_at);

-- ========================================
-- DATA INTEGRITY CONSTRAINTS
-- ========================================

-- Ensure valid market types
CREATE TRIGGER validate_market_type
BEFORE INSERT ON league_market_intelligence
WHEN NEW.market_type NOT IN ('1x2', 'ou25', 'ou35', 'ou45', 'ou55', 'btts', 'gg_1h')
BEGIN
    SELECT RAISE(ABORT, 'Invalid market_type. Must be one of: 1x2, ou25, ou35, ou45, ou55, btts, gg_1h');
END;

-- Ensure valid market options
CREATE TRIGGER validate_market_option
BEFORE INSERT ON league_market_intelligence
WHEN (NEW.market_type = '1x2' AND NEW.market_option NOT IN ('home', 'draw', 'away')) OR
     (NEW.market_type LIKE 'ou%' AND NEW.market_option NOT IN ('over', 'under')) OR
     (NEW.market_type IN ('btts', 'gg_1h') AND NEW.market_option NOT IN ('yes', 'no'))
BEGIN
    SELECT RAISE(ABORT, 'Invalid market_option for given market_type');
END;

-- Ensure positive odds
CREATE TRIGGER validate_positive_odds
BEFORE INSERT ON match_odds_analysis
WHEN NEW.input_odds <= 1.0
BEGIN
    SELECT RAISE(ABORT, 'Odds must be greater than 1.0');
END;

-- Auto-update league intelligence last_updated timestamp
CREATE TRIGGER update_league_intelligence_timestamp
AFTER UPDATE ON league_market_intelligence
BEGIN
    UPDATE league_market_intelligence 
    SET last_updated = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;