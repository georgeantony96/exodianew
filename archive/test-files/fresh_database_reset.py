#!/usr/bin/env python3
"""
EXODIA FINAL - Complete Database Reset Script
Completely clears all data for fresh production start
"""

import sqlite3
import os
import shutil
from datetime import datetime

def fresh_database_reset():
    """Complete database reset for fresh start"""
    
    db_path = "database/exodia.db"
    backup_path = f"database/backup_before_fresh_reset_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
    
    print("EXODIA FINAL - Complete Database Reset")
    print("=" * 50)
    
    # Create backup
    if os.path.exists(db_path):
        print(f"Creating backup: {backup_path}")
        shutil.copy2(db_path, backup_path)
        print("Backup created successfully")
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("\nClearing all data tables...")
        
        # Clear all data tables (preserving structure)
        tables_to_clear = [
            'simulations',
            'bets', 
            'match_results',
            'bookmaker_odds',
            'league_market_intelligence',
            'betting_analytics',
            'teams',
            'leagues'
        ]
        
        for table in tables_to_clear:
            try:
                cursor.execute(f"DELETE FROM {table}")
                print(f"Cleared: {table}")
            except sqlite3.Error as e:
                print(f"Warning clearing {table}: {e}")
        
        # Reset bankroll to fresh $5,000
        print("\nResetting bankroll...")
        cursor.execute("""
            INSERT OR REPLACE INTO betting_analytics 
            (id, total_bankroll, available_bankroll, total_wagered, total_winnings, net_profit, last_updated)
            VALUES (1, 5000.0, 5000.0, 0.0, 0.0, 0.0, datetime('now'))
        """)
        print("Fresh $5,000 bankroll initialized")
        
        # Reset auto-increment sequences
        print("\nResetting ID sequences...")
        cursor.execute("DELETE FROM sqlite_sequence")
        print("All ID sequences reset")
        
        # Commit all changes
        conn.commit()
        print("\nDatabase reset completed successfully!")
        print("Fresh bankroll: $5,000.00")
        print("Ready for production use!")
        
        # Verify reset
        cursor.execute("SELECT total_bankroll FROM betting_analytics WHERE id = 1")
        result = cursor.fetchone()
        if result:
            print(f"Verification: Bankroll = ${result[0]:,.2f}")
        
    except Exception as e:
        print(f"Error during reset: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    fresh_database_reset()