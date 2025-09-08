-- EXODIA FINAL Database Schema V2 - CLEAN VERSION
-- Monte Carlo Sports Betting Simulation with League Intelligence System
-- CLEAN SLATE: No pre-populated data, ready for step-by-step addition

-- ========================================
-- LEAGUES MANAGEMENT SYSTEM
-- ========================================

CREATE TABLE leagues (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,              -- "Premier League", "Argentina Primera", etc.
    country TEXT NOT NULL,                  -- "England", "Argentina", etc.
    avg_goals_home REAL DEFAULT 1.5,        -- League-specific home goal averages
    avg_goals_away REAL DEFAULT 1.2,        -- League-specific away goal averages  
    over25_frequency REAL DEFAULT 0.55,     -- Historical O2.5 hit rate (will learn)
    market_efficiency REAL DEFAULT 0.85,    -- Bookmaker efficiency (0-1, will learn)
    home_advantage_factor REAL DEFAULT 0.20, -- League-specific home advantage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TEAMS WITH LEAGUE CONTEXT
-- ========================================

CREATE TABLE teams (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    league_id INTEGER NOT NULL,             -- REQUIRED: Every team must have a league
    auto_suggest_priority INTEGER DEFAULT 100, -- For autocomplete ordering
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE,
    UNIQUE(name, league_id)                 -- Same name allowed in different leagues
);

-- ========================================
-- HOME/AWAY PERFORMANCE SEPARATION (Chelsea Fix)
-- ========================================

-- Home performance tracking (separate from away)
CREATE TABLE team_home_performance (
    id INTEGER PRIMARY KEY,
    team_id INTEGER NOT NULL,
    goals_for_avg REAL DEFAULT 0,           -- Rolling average goals scored at home
    goals_against_avg REAL DEFAULT 0,       -- Rolling average goals conceded at home
    matches_played INTEGER DEFAULT 0,
    last_6_form TEXT DEFAULT '',            -- "WWDLWW" format
    streak_type TEXT,                       -- "unbeaten", "losing", "winning", NULL
    streak_length INTEGER DEFAULT 0,
    form_reliability REAL DEFAULT 0.5,     -- How reliable is this data (0-1)
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Away performance tracking (separate from home)
CREATE TABLE team_away_performance (
    id INTEGER PRIMARY KEY,
    team_id INTEGER NOT NULL,
    goals_for_avg REAL DEFAULT 0,           -- Rolling average goals scored away
    goals_against_avg REAL DEFAULT 0,       -- Rolling average goals conceded away
    matches_played INTEGER DEFAULT 0,
    last_6_form TEXT DEFAULT '',            -- "WWDLWW" format  
    streak_type TEXT,                       -- "unbeaten", "losing", "winning", NULL
    streak_length INTEGER DEFAULT 0,
    form_reliability REAL DEFAULT 0.5,     -- How reliable is this data (0-1)
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- ========================================
-- HISTORICAL MATCHES (Enhanced)
-- ========================================

CREATE TABLE historical_matches (
    id INTEGER PRIMARY KEY,
    home_team_id INTEGER NOT NULL,
    away_team_id INTEGER NOT NULL,
    home_score_ht INTEGER NOT NULL,
    away_score_ht INTEGER NOT NULL,
    home_score_ft INTEGER NOT NULL,
    away_score_ft INTEGER NOT NULL,
    match_type TEXT NOT NULL,               -- 'h2h', 'home_home', 'away_away', etc.
    match_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- ========================================
-- SIMULATIONS (Enhanced)
-- ========================================

CREATE TABLE simulations (
    id INTEGER PRIMARY KEY,
    home_team_id INTEGER NOT NULL,
    away_team_id INTEGER NOT NULL,
    league_id INTEGER NOT NULL,             -- NEW: Track league context
    match_date DATE,
    distribution_type TEXT NOT NULL,        -- 'poisson', 'negative_binomial'
    iterations INTEGER NOT NULL,
    home_boost DECIMAL DEFAULT 0,
    away_boost DECIMAL DEFAULT 0,
    home_advantage DECIMAL DEFAULT 0.20,
    true_odds TEXT,                         -- JSON string of calculated true odds
    value_bets TEXT,                        -- JSON string of detected value opportunities
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE
);

-- ========================================
-- BOOKMAKER ODDS (Enhanced)
-- ========================================

CREATE TABLE bookmaker_odds (
    id INTEGER PRIMARY KEY,
    simulation_id INTEGER NOT NULL,
    market_type TEXT NOT NULL,              -- '1x2', 'ou25', 'ou35', 'ou45', 'ou55', 'btts', 'gg_1h'
    home_odds DECIMAL,
    draw_odds DECIMAL,
    away_odds DECIMAL,
    over_odds DECIMAL,
    under_odds DECIMAL,
    yes_odds DECIMAL,                       -- for GG markets
    no_odds DECIMAL,                        -- for NG markets
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE
);

-- ========================================
-- MATCH RESULTS (Enhanced)
-- ========================================

CREATE TABLE match_results (
    id INTEGER PRIMARY KEY,
    simulation_id INTEGER NOT NULL,
    home_score_ht INTEGER NOT NULL,
    away_score_ht INTEGER NOT NULL,
    home_score_ft INTEGER NOT NULL,
    away_score_ft INTEGER NOT NULL,
    accuracy_metrics TEXT,                  -- JSON string of accuracy calculations
    result_entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE
);

-- ========================================
-- MARKET ACCURACY TRACKING
-- ========================================

CREATE TABLE market_accuracy (
    id INTEGER PRIMARY KEY,
    league_id INTEGER NOT NULL,
    market_type TEXT NOT NULL,              -- "1x2", "ou25", "btts", etc.
    market_option TEXT,                     -- "home", "over", "yes", etc.
    total_predictions INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    accuracy_percentage REAL DEFAULT 0,
    total_edge_captured REAL DEFAULT 0,     -- Sum of profitable edges
    confidence_level REAL DEFAULT 0,        -- Statistical confidence (0-1)
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE
);

-- ========================================
-- LEAGUE MARKET INTELLIGENCE (Argentina O2.5 Discovery System)
-- ========================================

CREATE TABLE league_market_intelligence (
    id INTEGER PRIMARY KEY,
    league_id INTEGER NOT NULL,
    market_type TEXT NOT NULL,              -- "1x2", "ou25", "btts", etc.
    market_option TEXT NOT NULL,            -- "home", "over", "yes", etc.
    
    -- Statistical tracking of ALL odds inputs
    odds_count INTEGER DEFAULT 0,           -- How many times this market was entered
    odds_sum REAL DEFAULT 0,                -- Sum for average calculation
    odds_min REAL DEFAULT 999,              -- Lowest odds seen
    odds_max REAL DEFAULT 0,                -- Highest odds seen  
    odds_avg REAL DEFAULT 0,                -- Current average (Argentina O2.5 = 2.85)
    odds_stddev REAL DEFAULT 0,             -- Market volatility
    
    -- Value detection intelligence
    value_opportunities INTEGER DEFAULT 0,  -- Times this showed value
    avg_edge_when_value REAL DEFAULT 0,    -- Average edge when valuable
    hit_rate REAL DEFAULT 0,               -- Win rate when we bet this
    total_profit_loss REAL DEFAULT 0,      -- Cumulative P&L
    
    -- Market efficiency insights  
    market_efficiency REAL DEFAULT 0.85,   -- How sharp (0-1)
    opportunity_frequency REAL DEFAULT 0,  -- How often value appears (0-1)
    seasonal_pattern TEXT DEFAULT 'unknown', -- Pattern discovery
    trend_direction TEXT DEFAULT 'stable', -- "improving", "declining", "stable"
    
    -- Metadata
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE,
    UNIQUE(league_id, market_type, market_option)
);

-- ========================================
-- MATCH-SPECIFIC ODDS ANALYSIS (Real-time Learning)
-- ========================================

CREATE TABLE match_odds_analysis (
    id INTEGER PRIMARY KEY,
    simulation_id INTEGER,
    league_id INTEGER NOT NULL,
    market_type TEXT NOT NULL,
    market_option TEXT NOT NULL,
    
    -- Input vs Intelligence comparison
    input_odds REAL NOT NULL,              -- What you entered
    league_avg_odds REAL,                  -- League historical average
    deviation_percentage REAL,             -- Difference from norm
    value_probability REAL DEFAULT 0,      -- Likelihood of value (0-1)
    confidence_score REAL DEFAULT 0,       -- Confidence in prediction (0-1)
    
    -- Context for better learning
    team_tier_context TEXT,                -- "big_vs_small", "relegation_battle"  
    seasonal_context TEXT,                 -- "winter", "summer", "end_season"
    fixture_context TEXT,                  -- "midweek", "weekend", "cup"
    form_context TEXT,                     -- "both_good_form", "home_struggling"
    
    -- Learning outcomes (filled after match)
    predicted_value BOOLEAN,               -- Did we predict value?
    actual_result BOOLEAN,                 -- Did it hit?
    edge_realized REAL,                    -- Actual profit/loss %
    learning_weight REAL DEFAULT 1.0,     -- Weight for learning algorithm
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    result_confirmed_at TIMESTAMP,
    
    FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE,
    FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE
);

-- ========================================
-- PERFORMANCE INDEXES
-- ========================================

-- Core table indexes
CREATE INDEX idx_leagues_name ON leagues(name);
CREATE INDEX idx_leagues_country ON leagues(country);
CREATE INDEX idx_teams_league ON teams(league_id);
CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_priority ON teams(auto_suggest_priority);

-- Performance tracking indexes  
CREATE INDEX idx_team_home_performance_team ON team_home_performance(team_id);
CREATE INDEX idx_team_away_performance_team ON team_away_performance(team_id);

-- Historical data indexes
CREATE INDEX idx_historical_matches_teams ON historical_matches(home_team_id, away_team_id);
CREATE INDEX idx_historical_matches_type ON historical_matches(match_type);
CREATE INDEX idx_historical_matches_date ON historical_matches(match_date);

-- Simulation indexes
CREATE INDEX idx_simulations_teams ON simulations(home_team_id, away_team_id);
CREATE INDEX idx_simulations_league ON simulations(league_id);
CREATE INDEX idx_simulations_date ON simulations(match_date);
CREATE INDEX idx_bookmaker_odds_simulation ON bookmaker_odds(simulation_id);
CREATE INDEX idx_match_results_simulation ON match_results(simulation_id);

-- Market accuracy indexes
CREATE INDEX idx_market_accuracy_league ON market_accuracy(league_id);
CREATE INDEX idx_market_accuracy_market ON market_accuracy(league_id, market_type);

-- League intelligence indexes (CRITICAL for performance)
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
-- DATA INTEGRITY & VALIDATION
-- ========================================

-- Validate market types
CREATE TRIGGER validate_market_type_insert
BEFORE INSERT ON league_market_intelligence
WHEN NEW.market_type NOT IN ('1x2', 'double_chance', 'ou25', 'ou35', 'ou45', 'ou55', 'btts', 'gg_1h')
BEGIN
    SELECT RAISE(ABORT, 'Invalid market_type. Must be: 1x2, double_chance, ou25, ou35, ou45, ou55, btts, gg_1h');
END;

-- Validate market options
CREATE TRIGGER validate_market_option_insert  
BEFORE INSERT ON league_market_intelligence
WHEN (NEW.market_type = '1x2' AND NEW.market_option NOT IN ('home', 'draw', 'away')) OR
     (NEW.market_type = 'double_chance' AND NEW.market_option NOT IN ('dc_1x', 'dc_12', 'dc_x2')) OR
     (NEW.market_type LIKE 'ou%' AND NEW.market_option NOT IN ('over', 'under')) OR
     (NEW.market_type IN ('btts', 'gg_1h') AND NEW.market_option NOT IN ('yes', 'no'))
BEGIN
    SELECT RAISE(ABORT, 'Invalid market_option for market_type');
END;

-- Validate positive odds
CREATE TRIGGER validate_positive_odds_insert
BEFORE INSERT ON match_odds_analysis  
WHEN NEW.input_odds <= 1.0
BEGIN
    SELECT RAISE(ABORT, 'Odds must be greater than 1.0');
END;

-- Auto-update timestamps
CREATE TRIGGER update_league_intelligence_timestamp
AFTER UPDATE ON league_market_intelligence
BEGIN
    UPDATE league_market_intelligence 
    SET last_updated = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- Auto-update league timestamp when teams added
CREATE TRIGGER update_league_on_team_add
AFTER INSERT ON teams
BEGIN
    UPDATE leagues 
    SET last_updated = CURRENT_TIMESTAMP 
    WHERE id = NEW.league_id;
END;

-- ========================================
-- UTILITY VIEWS FOR EASY ACCESS
-- ========================================

-- Team summary with performance context
CREATE VIEW team_summary AS
SELECT 
    t.id,
    t.name as team_name,
    l.name as league_name,
    l.country,
    hp.goals_for_avg as home_attack,
    hp.goals_against_avg as home_defense,  
    ap.goals_for_avg as away_attack,
    ap.goals_against_avg as away_defense,
    hp.last_6_form as home_form,
    ap.last_6_form as away_form,
    COALESCE(hp.matches_played, 0) + COALESCE(ap.matches_played, 0) as total_matches
FROM teams t
JOIN leagues l ON t.league_id = l.id
LEFT JOIN team_home_performance hp ON t.id = hp.team_id
LEFT JOIN team_away_performance ap ON t.id = ap.team_id;

-- League opportunities (Argentina-style discoveries)
CREATE VIEW league_opportunities AS
SELECT 
    l.name as league_name,
    l.country,
    lmi.market_type,
    lmi.market_option,
    lmi.odds_avg,
    lmi.opportunity_frequency,
    lmi.market_efficiency,
    lmi.hit_rate,
    lmi.avg_edge_when_value,
    CASE 
        WHEN lmi.opportunity_frequency > 0.6 THEN 'HIGH VALUE'
        WHEN lmi.opportunity_frequency > 0.4 THEN 'MEDIUM VALUE'  
        WHEN lmi.opportunity_frequency > 0.2 THEN 'LOW VALUE'
        ELSE 'AVOID'
    END as value_rating
FROM leagues l
JOIN league_market_intelligence lmi ON l.id = lmi.league_id
WHERE lmi.odds_count > 5  -- Only show markets with meaningful data
ORDER BY lmi.opportunity_frequency DESC, lmi.avg_edge_when_value DESC;

-- ========================================
-- VERSION TRACKING
-- ========================================

CREATE TABLE schema_version (
    version TEXT PRIMARY KEY,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_version (version, description) 
VALUES ('v2.0', 'Clean league intelligence system with home/away separation and market pattern tracking');