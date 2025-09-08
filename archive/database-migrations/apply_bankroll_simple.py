#!/usr/bin/env python3
"""
Simple Bankroll Management Migration Script
Applies the comprehensive bankroll system to EXODIA FINAL database
"""

import sqlite3
import os
import sys
from datetime import datetime

def get_database_path():
    """Find the main database file"""
    possible_paths = [
        'exodia.db',
        '../exodia.db',
        './database/exodia.db',
        './exodia.db'
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return os.path.abspath(path)
    
    print("ERROR: Database not found")
    return None

def apply_bankroll_enhancement(db_path):
    """Apply bankroll enhancement directly"""
    print(f"Connecting to database: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON")
    
    print("Applying bankroll management system...")
    
    # User bankroll table
    try:
        cursor.execute('''
        CREATE TABLE user_bankroll (
            id INTEGER PRIMARY KEY DEFAULT 1,
            starting_balance DECIMAL NOT NULL DEFAULT 1000.00,
            current_balance DECIMAL NOT NULL DEFAULT 1000.00,
            currency TEXT DEFAULT 'USD',
            last_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            total_profit_loss DECIMAL DEFAULT 0.00,
            total_staked DECIMAL DEFAULT 0.00,
            total_bets_placed INTEGER DEFAULT 0,
            winning_bets INTEGER DEFAULT 0,
            losing_bets INTEGER DEFAULT 0,
            pending_bets INTEGER DEFAULT 0,
            win_rate DECIMAL DEFAULT 0.00,
            roi_percentage DECIMAL DEFAULT 0.00,
            roi_on_turnover DECIMAL DEFAULT 0.00,
            max_balance DECIMAL DEFAULT 1000.00,
            max_drawdown DECIMAL DEFAULT 0.00,
            max_drawdown_amount DECIMAL DEFAULT 0.00,
            current_drawdown DECIMAL DEFAULT 0.00,
            kelly_multiplier DECIMAL DEFAULT 0.25,
            max_bet_percentage DECIMAL DEFAULT 5.00,
            min_edge_required DECIMAL DEFAULT 5.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )''')
        print("SUCCESS: user_bankroll table created")
    except sqlite3.Error as e:
        if "already exists" in str(e):
            print("INFO: user_bankroll table already exists")
        else:
            print(f"ERROR: {e}")
    
    # Insert default bankroll
    try:
        cursor.execute("INSERT INTO user_bankroll (id, starting_balance, current_balance) VALUES (1, 1000.00, 1000.00)")
        print("SUCCESS: Default bankroll inserted")
    except sqlite3.Error as e:
        if "UNIQUE constraint failed" in str(e):
            print("INFO: Default bankroll already exists")
        else:
            print(f"ERROR: {e}")
    
    # Enhanced bet selections table
    try:
        cursor.execute('''
        CREATE TABLE user_bet_selections (
            id INTEGER PRIMARY KEY,
            simulation_id INTEGER NOT NULL,
            market_type TEXT NOT NULL,
            market_option TEXT NOT NULL,
            selected_odds DECIMAL NOT NULL,
            bookmaker TEXT DEFAULT 'Unknown',
            true_probability DECIMAL NOT NULL,
            implied_probability DECIMAL NOT NULL,
            edge_percentage DECIMAL NOT NULL,
            kelly_percentage DECIMAL NOT NULL,
            bankroll_when_placed DECIMAL NOT NULL,
            optimal_kelly_stake DECIMAL NOT NULL,
            actual_stake DECIMAL NOT NULL,
            stake_percentage DECIMAL NOT NULL,
            confidence_level TEXT DEFAULT 'MEDIUM',
            max_loss DECIMAL NOT NULL,
            max_win DECIMAL NOT NULL,
            bet_status TEXT DEFAULT 'pending',
            actual_result BOOLEAN DEFAULT NULL,
            profit_loss DECIMAL DEFAULT 0.00,
            roi_this_bet DECIMAL DEFAULT 0.00,
            closing_odds DECIMAL DEFAULT NULL,
            closing_line_value DECIMAL DEFAULT 0.00,
            market_movement TEXT DEFAULT 'unknown',
            league_id INTEGER,
            match_date DATE,
            bet_reasoning TEXT,
            alternative_bets_available INTEGER DEFAULT 0,
            placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            settled_at TIMESTAMP DEFAULT NULL,
            FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE,
            FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE SET NULL
        )''')
        print("SUCCESS: user_bet_selections table created")
    except sqlite3.Error as e:
        if "already exists" in str(e):
            print("INFO: user_bet_selections table already exists")
        else:
            print(f"ERROR: {e}")
    
    # Create bankroll status view
    try:
        cursor.execute('''
        CREATE VIEW bankroll_status AS
        SELECT 
            ub.*,
            CASE 
                WHEN starting_balance > 0 THEN 
                    ROUND(((current_balance - starting_balance) / starting_balance) * 100, 2)
                ELSE 0 
            END as total_roi_percentage,
            ROUND(current_balance - starting_balance, 2) as net_profit_loss,
            CASE
                WHEN max_drawdown < 5 THEN 'LOW RISK'
                WHEN max_drawdown < 15 THEN 'MODERATE RISK'  
                WHEN max_drawdown < 25 THEN 'HIGH RISK'
                ELSE 'VERY HIGH RISK'
            END as risk_level,
            ROUND(current_balance * (kelly_multiplier * 0.10), 2) as kelly_10pct_edge
        FROM user_bankroll ub
        WHERE id = 1
        ''')
        print("SUCCESS: bankroll_status view created")
    except sqlite3.Error as e:
        print(f"INFO: View creation: {e}")
    
    # Commit changes
    conn.commit()
    
    # Test the system
    cursor.execute("SELECT * FROM bankroll_status")
    result = cursor.fetchone()
    
    if result:
        print(f"SUCCESS: Bankroll system working - Balance: ${result[1]}")
        print("COMPLETE: Bankroll management system ready!")
        return True
    else:
        print("ERROR: System not working properly")
        return False

def main():
    print("EXODIA FINAL - Bankroll Management Enhancement")
    print("=" * 50)
    
    db_path = get_database_path()
    if not db_path:
        sys.exit(1)
    
    success = apply_bankroll_enhancement(db_path)
    
    if success:
        print("\nFeatures Available:")
        print("- User-controlled bankroll (edit starting balance)")
        print("- Reset functionality")
        print("- Automatic Kelly Criterion calculations")
        print("- Real-time P&L tracking")
        print("- Drawdown monitoring")
    else:
        print("Migration failed")
        sys.exit(1)

if __name__ == "__main__":
    main()