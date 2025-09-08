#!/usr/bin/env python3
"""
Test database connection from backend
"""

import os
import sqlite3
import sys

def test_database_connection():
    """Test database connection and check for tables"""
    
    # Get the same path the simulation_runner uses
    script_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(script_dir, '..', 'database', 'exodia.db')
    
    print(f"Backend script directory: {script_dir}")
    print(f"Database path: {db_path}")
    print(f"Absolute database path: {os.path.abspath(db_path)}")
    print(f"Database exists: {os.path.exists(db_path)}")
    
    if not os.path.exists(db_path):
        print("[ERROR] Database file not found at expected path!")
        return False
        
    try:
        # Test connection
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check for bookmaker_odds table
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='bookmaker_odds'")
        bookmaker_odds_exists = cursor.fetchone()
        
        if bookmaker_odds_exists:
            print("[SUCCESS] bookmaker_odds table found")
            
            # Test the exact query that might be failing
            cursor.execute("SELECT COUNT(*) FROM bookmaker_odds")
            count = cursor.fetchone()[0]
            print(f"bookmaker_odds row count: {count}")
            
            # Check schema
            cursor.execute("PRAGMA table_info(bookmaker_odds)")
            columns = cursor.fetchall()
            print("bookmaker_odds columns:")
            for col in columns:
                print(f"  - {col[1]} ({col[2]})")
        else:
            print("[ERROR] bookmaker_odds table NOT FOUND")
            
        # List all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = cursor.fetchall()
        print(f"All tables found ({len(tables)}):")
        for table in tables:
            print(f"  - {table[0]}")
            
        conn.close()
        
        return bookmaker_odds_exists is not None
        
    except Exception as e:
        print(f"[ERROR] Database connection failed: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    success = test_database_connection()
    sys.exit(0 if success else 1)