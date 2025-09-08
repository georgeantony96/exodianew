-- EXODIA FINAL Database Schema
-- Monte Carlo Sports Betting Simulation

-- Teams table
CREATE TABLE teams (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Historical matches
CREATE TABLE historical_matches (
    id INTEGER PRIMARY KEY,
    home_team_id INTEGER,
    away_team_id INTEGER,
    home_score_ht INTEGER,
    away_score_ht INTEGER,
    home_score_ft INTEGER,
    away_score_ft INTEGER,
    match_type TEXT, -- 'h2h', 'home_home', 'away_away', 'home_away', 'away_home'
    match_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (home_team_id) REFERENCES teams(id),
    FOREIGN KEY (away_team_id) REFERENCES teams(id)
);

-- Simulations
CREATE TABLE simulations (
    id INTEGER PRIMARY KEY,
    home_team_id INTEGER,
    away_team_id INTEGER,
    match_date DATE,
    distribution_type TEXT, -- 'poisson', 'negative_binomial'
    iterations INTEGER,
    home_boost DECIMAL DEFAULT 0,
    away_boost DECIMAL DEFAULT 0,
    home_advantage DECIMAL DEFAULT 0.20,
    true_odds TEXT, -- JSON string of all calculated true odds
    value_bets TEXT, -- JSON string of detected value opportunities
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (home_team_id) REFERENCES teams(id),
    FOREIGN KEY (away_team_id) REFERENCES teams(id)
);

-- Bookmaker odds
CREATE TABLE bookmaker_odds (
    id INTEGER PRIMARY KEY,
    simulation_id INTEGER,
    market_type TEXT, -- '1x2', 'ou25', 'ou35', 'ou45', 'ou55', 'gg', 'gg_1h'
    home_odds DECIMAL,
    draw_odds DECIMAL,
    away_odds DECIMAL,
    over_odds DECIMAL,
    under_odds DECIMAL,
    yes_odds DECIMAL,  -- for GG markets
    no_odds DECIMAL,   -- for NG markets
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (simulation_id) REFERENCES simulations(id)
);

-- Actual results for accuracy tracking
CREATE TABLE match_results (
    id INTEGER PRIMARY KEY,
    simulation_id INTEGER,
    home_score_ht INTEGER,
    away_score_ht INTEGER,
    home_score_ft INTEGER,
    away_score_ft INTEGER,
    accuracy_metrics TEXT, -- JSON string
    result_entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (simulation_id) REFERENCES simulations(id)
);

-- Indexes for better performance
CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_historical_matches_teams ON historical_matches(home_team_id, away_team_id);
CREATE INDEX idx_historical_matches_type ON historical_matches(match_type);
CREATE INDEX idx_simulations_teams ON simulations(home_team_id, away_team_id);
CREATE INDEX idx_simulations_date ON simulations(match_date);
CREATE INDEX idx_bookmaker_odds_simulation ON bookmaker_odds(simulation_id);
CREATE INDEX idx_match_results_simulation ON match_results(simulation_id);