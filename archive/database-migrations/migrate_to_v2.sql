-- EXODIA FINAL Database Migration to V2
-- SAFE MIGRATION: Preserve existing data while adding league intelligence
-- Run this script to upgrade from V1 to V2 schema

-- ========================================
-- MIGRATION STEP 1: ADD LEAGUE CONTEXT TO EXISTING TEAMS
-- ========================================

-- First, add the league_id column to teams table
ALTER TABLE teams ADD COLUMN league_id INTEGER REFERENCES leagues(id);
ALTER TABLE teams ADD COLUMN auto_suggest_priority INTEGER DEFAULT 100;

-- ========================================
-- MIGRATION STEP 2: POPULATE LEAGUES WITH INITIAL DATA
-- ========================================

-- Insert major leagues with initial intelligence parameters
INSERT INTO leagues (name, country, avg_goals_home, avg_goals_away, over25_frequency, market_efficiency, home_advantage_factor) VALUES
-- Top European Leagues (High efficiency)
('Premier League', 'England', 1.52, 1.18, 0.54, 0.96, 0.18),
('La Liga', 'Spain', 1.45, 1.12, 0.51, 0.94, 0.22),
('Serie A', 'Italy', 1.38, 1.05, 0.48, 0.91, 0.25),
('Bundesliga', 'Germany', 1.68, 1.35, 0.62, 0.89, 0.15),
('Ligue 1', 'France', 1.42, 1.15, 0.52, 0.87, 0.20),

-- Second Tier European (Medium-High efficiency)
('Championship', 'England', 1.35, 1.22, 0.56, 0.82, 0.16),
('Eredivisie', 'Netherlands', 1.75, 1.48, 0.68, 0.78, 0.18),
('Primeira Liga', 'Portugal', 1.48, 1.18, 0.55, 0.79, 0.23),

-- South American Leagues (Lower efficiency - VALUE OPPORTUNITIES)
('Argentina Primera', 'Argentina', 1.65, 1.42, 0.68, 0.76, 0.28),
('Brasileirão', 'Brazil', 1.58, 1.38, 0.64, 0.74, 0.25),
('Liga MX', 'Mexico', 1.62, 1.35, 0.61, 0.73, 0.22),

-- Lower European Leagues (Medium efficiency)
('Belgian Pro League', 'Belgium', 1.55, 1.28, 0.58, 0.75, 0.19),
('Scottish Premiership', 'Scotland', 1.48, 1.25, 0.57, 0.72, 0.21),
('Austrian Bundesliga', 'Austria', 1.72, 1.45, 0.65, 0.71, 0.17),

-- Eastern European (Lower efficiency - MORE VALUE)
('Russian Premier League', 'Russia', 1.42, 1.18, 0.53, 0.69, 0.24),
('Ukrainian Premier League', 'Ukraine', 1.38, 1.15, 0.51, 0.67, 0.26);

-- ========================================
-- MIGRATION STEP 3: ASSIGN EXISTING TEAMS TO LEAGUES
-- ========================================

-- Update existing teams with appropriate league assignments
-- Based on the current teams in the database (Premier League teams)
UPDATE teams SET league_id = (SELECT id FROM leagues WHERE name = 'Premier League'), auto_suggest_priority = 90
WHERE name IN ('Manchester United', 'Liverpool', 'Chelsea', 'Arsenal', 'Manchester City', 'Tottenham');

-- ========================================
-- MIGRATION STEP 4: INITIALIZE PERFORMANCE DATA FOR EXISTING TEAMS
-- ========================================

-- Create home performance records for existing teams
INSERT INTO team_home_performance (team_id, goals_for_avg, goals_against_avg, matches_played, last_6_form, form_reliability)
SELECT 
    t.id,
    1.50, -- Default Premier League home attack
    1.10, -- Default Premier League home defense  
    0,    -- Will be updated as data is entered
    '',   -- Empty form to start
    0.5   -- Medium reliability initially
FROM teams t 
WHERE t.league_id IS NOT NULL;

-- Create away performance records for existing teams
INSERT INTO team_away_performance (team_id, goals_for_avg, goals_against_avg, matches_played, last_6_form, form_reliability)
SELECT 
    t.id,
    1.15, -- Default Premier League away attack
    1.35, -- Default Premier League away defense
    0,    -- Will be updated as data is entered
    '',   -- Empty form to start
    0.5   -- Medium reliability initially
FROM teams t 
WHERE t.league_id IS NOT NULL;

-- ========================================
-- MIGRATION STEP 5: INITIALIZE MARKET INTELLIGENCE
-- ========================================

-- Initialize league market intelligence for Premier League (existing data)
-- This will be populated as odds are input, but we'll set up the structure

INSERT INTO league_market_intelligence (league_id, market_type, market_option, odds_avg, market_efficiency, opportunity_frequency)
SELECT 
    l.id,
    market_combinations.market_type,
    market_combinations.market_option,
    market_combinations.default_avg_odds,
    l.market_efficiency,
    CASE 
        WHEN l.market_efficiency > 0.9 THEN 0.15  -- Low opportunity frequency for sharp leagues
        WHEN l.market_efficiency > 0.8 THEN 0.25  -- Medium for semi-sharp
        ELSE 0.35                                  -- Higher for soft leagues
    END as opportunity_frequency
FROM leagues l
CROSS JOIN (
    -- All possible market type/option combinations
    SELECT '1x2' as market_type, 'home' as market_option, 2.20 as default_avg_odds UNION ALL
    SELECT '1x2' as market_type, 'draw' as market_option, 3.20 as default_avg_odds UNION ALL
    SELECT '1x2' as market_type, 'away' as market_option, 3.10 as default_avg_odds UNION ALL
    
    SELECT 'ou25' as market_type, 'over' as market_option, 1.95 as default_avg_odds UNION ALL
    SELECT 'ou25' as market_type, 'under' as market_option, 1.90 as default_avg_odds UNION ALL
    
    SELECT 'ou35' as market_type, 'over' as market_option, 2.85 as default_avg_odds UNION ALL
    SELECT 'ou35' as market_type, 'under' as market_option, 1.42 as default_avg_odds UNION ALL
    
    SELECT 'btts' as market_type, 'yes' as market_option, 1.83 as default_avg_odds UNION ALL
    SELECT 'btts' as market_type, 'no' as market_option, 1.95 as default_avg_odds UNION ALL
    
    SELECT 'gg_1h' as market_type, 'yes' as market_option, 3.75 as default_avg_odds UNION ALL
    SELECT 'gg_1h' as market_type, 'no' as market_option, 1.25 as default_avg_odds
) market_combinations;

-- ========================================
-- MIGRATION STEP 6: UPDATE ARGENTINA PRIMERA WITH YOUR INSIGHTS
-- ========================================

-- Apply your discovered Argentina O2.5 pattern
UPDATE league_market_intelligence 
SET odds_avg = 2.85,           -- Your observed average
    opportunity_frequency = 0.73, -- High opportunity based on your success
    market_efficiency = 0.65      -- Lower efficiency = more value
WHERE league_id = (SELECT id FROM leagues WHERE name = 'Argentina Primera')
AND market_type = 'ou25' 
AND market_option = 'over';

-- Also update BTTS for Argentina based on goal-scoring tendency
UPDATE league_market_intelligence 
SET odds_avg = 2.12,           -- Higher than EPL's 1.83
    opportunity_frequency = 0.67,
    market_efficiency = 0.70
WHERE league_id = (SELECT id FROM leagues WHERE name = 'Argentina Primera')
AND market_type = 'btts' 
AND market_option = 'yes';

-- ========================================
-- MIGRATION STEP 7: CREATE VIEWS FOR EASY ACCESS
-- ========================================

-- View for team performance summary
CREATE VIEW team_performance_summary AS
SELECT 
    t.name as team_name,
    l.name as league_name,
    l.country,
    hp.goals_for_avg as home_attack,
    hp.goals_against_avg as home_defense,
    ap.goals_for_avg as away_attack,
    ap.goals_against_avg as away_defense,
    hp.last_6_form as home_form,
    ap.last_6_form as away_form,
    hp.streak_type as home_streak_type,
    hp.streak_length as home_streak_length,
    ap.streak_type as away_streak_type,
    ap.streak_length as away_streak_length
FROM teams t
LEFT JOIN leagues l ON t.league_id = l.id
LEFT JOIN team_home_performance hp ON t.id = hp.team_id
LEFT JOIN team_away_performance ap ON t.id = ap.team_id;

-- View for league market opportunities (Argentina-style discoveries)
CREATE VIEW league_value_opportunities AS
SELECT 
    l.name as league_name,
    l.country,
    lmi.market_type,
    lmi.market_option,
    lmi.odds_avg,
    lmi.opportunity_frequency,
    lmi.market_efficiency,
    CASE 
        WHEN lmi.opportunity_frequency > 0.6 THEN 'HIGH VALUE'
        WHEN lmi.opportunity_frequency > 0.4 THEN 'MEDIUM VALUE'  
        WHEN lmi.opportunity_frequency > 0.2 THEN 'LOW VALUE'
        ELSE 'AVOID'
    END as value_rating,
    lmi.hit_rate,
    lmi.avg_edge_when_value
FROM leagues l
JOIN league_market_intelligence lmi ON l.id = lmi.league_id
WHERE lmi.odds_count > 0  -- Only show markets with data
ORDER BY lmi.opportunity_frequency DESC, lmi.avg_edge_when_value DESC;

-- ========================================
-- MIGRATION VERIFICATION
-- ========================================

-- Count verification queries to ensure migration worked
SELECT 'Leagues created' as step, COUNT(*) as count FROM leagues;
SELECT 'Teams with leagues assigned' as step, COUNT(*) as count FROM teams WHERE league_id IS NOT NULL;
SELECT 'Home performance records' as step, COUNT(*) as count FROM team_home_performance;
SELECT 'Away performance records' as step, COUNT(*) as count FROM team_away_performance;
SELECT 'Market intelligence records' as step, COUNT(*) as count FROM league_market_intelligence;

-- Show Argentina opportunities
SELECT 'Argentina VALUE opportunities' as insight, market_type, market_option, odds_avg, opportunity_frequency
FROM league_market_intelligence lmi
JOIN leagues l ON lmi.league_id = l.id
WHERE l.name = 'Argentina Primera' AND lmi.opportunity_frequency > 0.5
ORDER BY lmi.opportunity_frequency DESC;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

-- Add migration timestamp
CREATE TABLE IF NOT EXISTS migration_history (
    id INTEGER PRIMARY KEY,
    version TEXT,
    description TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO migration_history (version, description) 
VALUES ('v2.0', 'Added league intelligence system, home/away separation, market pattern tracking');