-- ========================================
-- BANKROLL MANAGEMENT & BET TRACKING SYSTEM v2.1
-- Foundation: User-controlled bankroll with Kelly Criterion integration
-- Critical missing piece: Track which bets user actually places + proper bankroll management
-- ========================================

-- ========================================
-- USER BANKROLL MANAGEMENT (Foundation - USER EDITABLE!)
-- ========================================

CREATE TABLE user_bankroll (
    id INTEGER PRIMARY KEY DEFAULT 1,
    
    -- USER-CONTROLLED SETTINGS (fully editable)
    starting_balance DECIMAL NOT NULL DEFAULT 1000.00,     -- User can set to any amount
    current_balance DECIMAL NOT NULL DEFAULT 1000.00,      -- Running balance after bets
    currency TEXT DEFAULT 'USD',                           -- USD, EUR, GBP, etc
    last_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,        -- When they last reset bankroll
    
    -- PERFORMANCE TRACKING (auto-calculated)
    total_profit_loss DECIMAL DEFAULT 0.00,                -- Net P&L: +$200 or -$150
    total_staked DECIMAL DEFAULT 0.00,                     -- Total amount wagered
    total_bets_placed INTEGER DEFAULT 0,                   -- Count of all bets
    winning_bets INTEGER DEFAULT 0,
    losing_bets INTEGER DEFAULT 0,
    pending_bets INTEGER DEFAULT 0,
    
    -- PERFORMANCE METRICS
    win_rate DECIMAL DEFAULT 0.00,                         -- 65.5% win rate
    roi_percentage DECIMAL DEFAULT 0.00,                   -- 15.2% total ROI
    roi_on_turnover DECIMAL DEFAULT 0.00,                  -- ROI vs total staked
    
    -- RISK MANAGEMENT (auto-calculated)
    max_balance DECIMAL DEFAULT 1000.00,                   -- High water mark
    max_drawdown DECIMAL DEFAULT 0.00,                     -- Worst decline % from peak
    max_drawdown_amount DECIMAL DEFAULT 0.00,              -- Worst decline $ amount
    current_drawdown DECIMAL DEFAULT 0.00,                 -- Current decline from peak
    
    -- KELLY CRITERION SETTINGS (user editable)
    kelly_multiplier DECIMAL DEFAULT 0.25,                 -- Conservative 25% Kelly
    max_bet_percentage DECIMAL DEFAULT 5.00,               -- Never bet more than 5% bankroll
    min_edge_required DECIMAL DEFAULT 5.00,                -- Minimum edge % to show bet
    
    -- METADATA
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default bankroll (user can edit everything)
INSERT INTO user_bankroll (id, starting_balance, current_balance) 
VALUES (1, 1000.00, 1000.00);

-- ========================================
-- BET SELECTIONS WITH KELLY INTEGRATION (THE MISSING PIECE!)
-- ========================================

CREATE TABLE user_bet_selections (
    id INTEGER PRIMARY KEY,
    simulation_id INTEGER NOT NULL,
    
    -- BET DETAILS
    market_type TEXT NOT NULL,                              -- "ou25", "1x2", "btts"
    market_option TEXT NOT NULL,                            -- "over", "home", "yes"
    selected_odds DECIMAL NOT NULL,                         -- 2.75 (odds you got)
    bookmaker TEXT DEFAULT 'Unknown',                       -- Bet365, Pinnacle, etc
    
    -- KELLY CRITERION CALCULATIONS
    true_probability DECIMAL NOT NULL,                      -- 0.425 (42.5% from simulation)
    implied_probability DECIMAL NOT NULL,                   -- 0.364 (36.4% from odds)  
    edge_percentage DECIMAL NOT NULL,                       -- 16.8% calculated edge
    kelly_percentage DECIMAL NOT NULL,                      -- 2.5% Kelly recommendation
    
    -- STAKE SIZING (PROPER BANKROLL MANAGEMENT)
    bankroll_when_placed DECIMAL NOT NULL,                  -- $1,200 (bankroll at bet time)
    optimal_kelly_stake DECIMAL NOT NULL,                   -- $30 (2.5% of $1,200)
    actual_stake DECIMAL NOT NULL,                          -- $25 (what you actually bet)
    stake_percentage DECIMAL NOT NULL,                      -- 2.08% (actual vs bankroll)
    
    -- RISK ASSESSMENT
    confidence_level TEXT DEFAULT 'MEDIUM',                -- HIGH, MEDIUM, LOW
    max_loss DECIMAL NOT NULL,                              -- -$25 (stake amount)
    max_win DECIMAL NOT NULL,                               -- +$43.75 (stake * (odds-1))
    
    -- OUTCOME TRACKING (updated after match result)
    bet_status TEXT DEFAULT 'pending',                      -- "pending", "won", "lost", "void"
    actual_result BOOLEAN DEFAULT NULL,                     -- Did the bet win? (NULL = pending)
    profit_loss DECIMAL DEFAULT 0.00,                      -- +$43.75 or -$25.00
    roi_this_bet DECIMAL DEFAULT 0.00,                     -- 75% or -100%
    
    -- LEARNING & IMPROVEMENT DATA
    closing_odds DECIMAL DEFAULT NULL,                      -- Final market odds
    closing_line_value DECIMAL DEFAULT 0.00,               -- Beat the closing line?
    market_movement TEXT DEFAULT 'unknown',                -- "shortened", "drifted", "stable"
    
    -- CONTEXT FOR LEARNING
    league_id INTEGER,                                      -- Which league
    match_date DATE,                                        -- When was the match
    bet_reasoning TEXT,                                     -- "Argentina always over"
    alternative_bets_available INTEGER DEFAULT 0,          -- How many other value bets
    
    -- METADATA
    placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settled_at TIMESTAMP DEFAULT NULL,
    
    FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE,
    FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE SET NULL
);

-- Enhanced match analysis to track bet selection patterns
CREATE TABLE bet_selection_patterns (
    id INTEGER PRIMARY KEY,
    user_id TEXT DEFAULT 'default_user',   -- For future multi-user support
    
    -- Selection preferences learned from behavior
    preferred_markets TEXT,                 -- JSON: ["ou25", "btts"] - what you bet most
    risk_tolerance REAL DEFAULT 0.5,       -- 0-1 scale based on edge thresholds you accept
    avg_stake_percentage REAL DEFAULT 0.02, -- % of bankroll typically bet
    edge_threshold REAL DEFAULT 5.0,       -- Minimum edge % you typically take
    
    -- Performance by market type
    market_performance TEXT,               -- JSON: {"ou25": {"bets": 15, "wins": 9, "roi": 12.3}}
    
    -- Learning evolution
    confidence_calibration REAL DEFAULT 1.0, -- How accurate system predictions vs your results
    learning_rate REAL DEFAULT 0.1,         -- How fast to adapt to your preferences
    
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fixture congestion tracking (IMPLEMENTABLE FEATURE)
CREATE TABLE team_fixture_schedule (
    id INTEGER PRIMARY KEY,
    team_id INTEGER NOT NULL,
    match_date DATE NOT NULL,
    competition TEXT,                       -- "Premier League", "Champions League", "FA Cup"
    is_home BOOLEAN NOT NULL,
    opponent_strength_tier INTEGER,         -- 1=top6, 2=mid, 3=relegation (optional)
    
    -- Auto-calculated fatigue metrics
    days_since_last_match INTEGER,
    matches_in_past_7_days INTEGER DEFAULT 0,
    matches_in_next_7_days INTEGER DEFAULT 0,
    congestion_level TEXT,                 -- "fresh", "normal", "congested", "heavy"
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Function to calculate fixture context (called during simulation)
-- Would be implemented in application logic:
/*
calculateFixtureContext(teamId, matchDate) {
    const recentMatches = getMatchesInDateRange(teamId, matchDate - 7, matchDate);
    const upcomingMatches = getMatchesInDateRange(teamId, matchDate, matchDate + 7);
    
    if (recentMatches >= 3) return "heavy_schedule";
    if (recentMatches >= 2 && upcomingMatches >= 2) return "congested";
    if (recentMatches === 0 && upcomingMatches <= 1) return "fresh";
    return "normal";
}
*/

-- ========================================
-- AUTOMATED BANKROLL UPDATES (Critical!)
-- ========================================

-- Automatically update bankroll when bet is settled
CREATE TRIGGER update_bankroll_after_bet_settlement
AFTER UPDATE OF bet_status, profit_loss ON user_bet_selections
WHEN NEW.bet_status IN ('won', 'lost', 'void') AND OLD.bet_status = 'pending'
BEGIN
    UPDATE user_bankroll SET
        current_balance = current_balance + NEW.profit_loss,
        total_profit_loss = total_profit_loss + NEW.profit_loss,
        total_staked = total_staked + NEW.actual_stake,
        winning_bets = winning_bets + CASE WHEN NEW.bet_status = 'won' THEN 1 ELSE 0 END,
        losing_bets = losing_bets + CASE WHEN NEW.bet_status = 'lost' THEN 1 ELSE 0 END,
        pending_bets = pending_bets - 1,
        win_rate = CAST(winning_bets AS REAL) / NULLIF(winning_bets + losing_bets, 0) * 100,
        roi_percentage = CASE 
            WHEN starting_balance > 0 THEN 
                ((current_balance + NEW.profit_loss) - starting_balance) / starting_balance * 100
            ELSE 0 
        END,
        max_balance = MAX(max_balance, current_balance + NEW.profit_loss),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1;
    
    -- Calculate drawdown
    UPDATE user_bankroll SET
        current_drawdown = CASE 
            WHEN max_balance > current_balance THEN 
                ((max_balance - current_balance) / max_balance) * 100
            ELSE 0 
        END,
        max_drawdown = MAX(max_drawdown, current_drawdown),
        max_drawdown_amount = CASE
            WHEN current_drawdown > max_drawdown THEN max_balance - current_balance
            ELSE max_drawdown_amount
        END
    WHERE id = 1;
END;

-- Update pending bets counter when placing bet
CREATE TRIGGER update_pending_bets_on_placement
AFTER INSERT ON user_bet_selections
BEGIN
    UPDATE user_bankroll SET
        total_bets_placed = total_bets_placed + 1,
        pending_bets = pending_bets + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1;
END;

-- ========================================
-- BANKROLL MANAGEMENT VIEWS (Easy Access!)
-- ========================================

-- Current bankroll status (user dashboard)
CREATE VIEW bankroll_status AS
SELECT 
    ub.*,
    
    -- Calculated performance metrics
    CASE 
        WHEN starting_balance > 0 THEN 
            ROUND(((current_balance - starting_balance) / starting_balance) * 100, 2)
        ELSE 0 
    END as total_roi_percentage,
    
    CASE
        WHEN total_staked > 0 THEN
            ROUND((total_profit_loss / total_staked) * 100, 2)
        ELSE 0
    END as roi_on_turnover_percentage,
    
    ROUND(current_balance - starting_balance, 2) as net_profit_loss,
    
    -- Risk assessment
    CASE
        WHEN max_drawdown < 5 THEN 'LOW RISK'
        WHEN max_drawdown < 15 THEN 'MODERATE RISK'  
        WHEN max_drawdown < 25 THEN 'HIGH RISK'
        ELSE 'VERY HIGH RISK'
    END as risk_level,
    
    -- Kelly stake calculations for common edges
    ROUND(current_balance * (kelly_multiplier * 0.05), 2) as kelly_5pct_edge,
    ROUND(current_balance * (kelly_multiplier * 0.10), 2) as kelly_10pct_edge,
    ROUND(current_balance * (kelly_multiplier * 0.15), 2) as kelly_15pct_edge
    
FROM user_bankroll ub
WHERE id = 1;

-- Recent betting performance by market
CREATE VIEW recent_betting_performance AS
SELECT 
    ubs.market_type,
    COUNT(*) as total_bets,
    SUM(CASE WHEN bet_status = 'won' THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN bet_status = 'lost' THEN 1 ELSE 0 END) as losses,
    ROUND(AVG(CASE WHEN bet_status = 'won' THEN 1.0 WHEN bet_status = 'lost' THEN 0.0 END) * 100, 1) as win_rate,
    ROUND(SUM(profit_loss), 2) as total_pnl,
    ROUND(AVG(profit_loss), 2) as avg_pnl_per_bet,
    ROUND(SUM(actual_stake), 2) as total_staked,
    ROUND((SUM(profit_loss) / NULLIF(SUM(actual_stake), 0)) * 100, 2) as roi_percentage,
    ROUND(AVG(edge_percentage), 2) as avg_edge_taken
FROM user_bet_selections ubs
WHERE bet_status IN ('won', 'lost')
GROUP BY market_type
ORDER BY total_pnl DESC;

-- Indexes for performance
CREATE INDEX idx_bet_selections_simulation ON user_bet_selections(simulation_id);
CREATE INDEX idx_bet_selections_market ON user_bet_selections(market_type, market_option);
CREATE INDEX idx_bet_selections_status ON user_bet_selections(bet_status);
CREATE INDEX idx_bet_selections_date ON user_bet_selections(placed_at);
CREATE INDEX idx_team_fixtures_team_date ON team_fixture_schedule(team_id, match_date);
CREATE INDEX idx_team_fixtures_congestion ON team_fixture_schedule(congestion_level);