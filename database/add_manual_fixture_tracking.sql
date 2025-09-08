-- ========================================
-- MANUAL FIXTURE TRACKING SYSTEM
-- Simple, user-controlled fixture congestion detection
-- ========================================

-- Manual fixture schedule input (simple and reliable)
CREATE TABLE team_fixture_schedule (
    id INTEGER PRIMARY KEY,
    team_id INTEGER NOT NULL,
    match_date DATE NOT NULL,
    competition TEXT NOT NULL,              -- "Premier League", "Champions League", "FA Cup", etc.
    is_home BOOLEAN NOT NULL DEFAULT true,
    opponent_name TEXT,                     -- Optional: track opponent for context
    
    -- Auto-calculated congestion metrics (updated when fixtures added/removed)
    days_since_last_match INTEGER,
    days_until_next_match INTEGER, 
    matches_in_past_7_days INTEGER DEFAULT 0,
    matches_in_next_7_days INTEGER DEFAULT 0,
    congestion_level TEXT DEFAULT 'normal', -- 'fresh', 'normal', 'congested', 'heavy'
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE(team_id, match_date, competition) -- Prevent duplicate fixtures
);

-- Enhanced bet selection tracking (the critical missing piece)
CREATE TABLE user_bet_selections (
    id INTEGER PRIMARY KEY,
    simulation_id INTEGER NOT NULL,
    market_type TEXT NOT NULL,              -- "1x2", "ou25", "btts", etc.
    market_option TEXT NOT NULL,            -- "home", "over", "yes", etc.
    
    -- Bet details when placed
    selected_odds REAL NOT NULL,            -- Odds you actually got
    recommended_edge REAL,                  -- What system calculated
    stake_amount REAL,                      -- How much you bet
    system_confidence TEXT,                 -- "High", "Medium", "Low"
    
    -- Context when bet was placed
    alternative_bets_count INTEGER DEFAULT 0, -- How many other value bets were available
    fixture_context_home TEXT,              -- "fresh", "congested", etc.
    fixture_context_away TEXT,              -- "fresh", "congested", etc.
    
    -- Outcome tracking (filled after match result)
    actual_result BOOLEAN,                  -- Did the bet win?
    profit_loss REAL,                      -- Actual profit/loss amount
    roi_percentage REAL,                   -- Return on investment %
    
    -- Learning metadata
    bet_rationale TEXT,                     -- Optional: why you chose this bet
    placement_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    result_timestamp TIMESTAMP,             -- When result was entered
    
    FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE
);

-- User betting patterns and preferences (learned from selections)
CREATE TABLE user_betting_profile (
    id INTEGER PRIMARY KEY,
    user_id TEXT DEFAULT 'default_user',   -- For future multi-user support
    
    -- Learned preferences from bet selections
    total_bets_placed INTEGER DEFAULT 0,
    total_profit_loss REAL DEFAULT 0,
    overall_roi_percentage REAL DEFAULT 0,
    
    -- Market preferences (JSON format)
    preferred_markets TEXT DEFAULT '{}',    -- {"ou25": 45, "btts": 30, "1x2": 25} (percentages)
    market_performance TEXT DEFAULT '{}',   -- {"ou25": {"bets": 15, "wins": 9, "roi": 12.3}}
    
    -- Risk profile learned from behavior
    avg_edge_threshold REAL DEFAULT 5.0,   -- Minimum edge % typically accepted
    kelly_multiplier REAL DEFAULT 0.25,    -- Kelly fraction multiplier (0.25 = quarter Kelly)
    risk_tolerance TEXT DEFAULT 'medium',  -- 'conservative', 'medium', 'aggressive'
    
    -- Performance tracking
    best_performing_market TEXT,           -- Market with highest ROI
    most_frequent_market TEXT,             -- Most commonly bet market
    
    -- Learning evolution
    confidence_calibration REAL DEFAULT 1.0, -- How accurate system predictions vs actual results
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Congestion level calculation rules (implemented in application logic)
-- fresh: 0 games in past 7 days
-- normal: 1 game in past 7 days  
-- congested: 2 games in past 7 days
-- heavy: 3+ games in past 7 days

-- Fatigue adjustment suggestions based on congestion:
-- fresh: +0.05 boost (well rested)
-- normal: no adjustment
-- congested: -0.10 boost (some fatigue)  
-- heavy: -0.20 boost (significant fatigue)

-- Indexes for performance
CREATE INDEX idx_fixtures_team_date ON team_fixture_schedule(team_id, match_date);
CREATE INDEX idx_fixtures_congestion ON team_fixture_schedule(congestion_level);
CREATE INDEX idx_bet_selections_simulation ON user_bet_selections(simulation_id);
CREATE INDEX idx_bet_selections_market ON user_bet_selections(market_type, market_option);
CREATE INDEX idx_bet_selections_timestamp ON user_bet_selections(placement_timestamp);