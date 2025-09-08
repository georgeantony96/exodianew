-- Initialize missing tables for EXODIA FINAL simulation

-- Create bookmaker_odds table if it doesn't exist
CREATE TABLE IF NOT EXISTS bookmaker_odds (
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

-- Create simulations table if it doesn't exist (with league_id)
CREATE TABLE IF NOT EXISTS simulations (
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

-- Create historical_matches table if it doesn't exist
CREATE TABLE IF NOT EXISTS historical_matches (
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

-- Create match_results table if it doesn't exist
CREATE TABLE IF NOT EXISTS match_results (
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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_bookmaker_odds_simulation ON bookmaker_odds(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulations_teams ON simulations(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_simulations_league ON simulations(league_id);
CREATE INDEX IF NOT EXISTS idx_simulations_date ON simulations(match_date);
CREATE INDEX IF NOT EXISTS idx_historical_matches_teams ON historical_matches(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_match_results_simulation ON match_results(simulation_id);