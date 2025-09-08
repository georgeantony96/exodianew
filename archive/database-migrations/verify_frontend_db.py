#!/usr/bin/env python3
"""
Verify what tables exist in the frontend database
"""

import sqlite3
import os

def verify_frontend_database():
    """Check what's in the frontend database"""
    
    frontend_db = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'exodia.db')
    
    print(f"Checking frontend database: {frontend_db}")
    print(f"Exists: {os.path.exists(frontend_db)}")
    
    if not os.path.exists(frontend_db):
        print("Frontend database doesn't exist!")
        return
        
    try:
        conn = sqlite3.connect(frontend_db)
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = cursor.fetchall()
        
        print(f"Frontend database has {len(tables)} tables:")
        for table in tables:
            print(f"  - {table[0]}")
            
        # Check specifically for bookmaker_odds
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='bookmaker_odds'")
        bookmaker_odds_exists = cursor.fetchone()
        
        if not bookmaker_odds_exists:
            print("\n[ISSUE FOUND] Frontend database is MISSING bookmaker_odds table!")
            print("This is likely the cause of the 'SQLITE_ERROR: no such table: bookmaker_odds' error.")
        else:
            print("\n[OK] Frontend database has bookmaker_odds table")
            
        conn.close()
        
    except Exception as e:
        print(f"Error checking frontend database: {e}")

if __name__ == "__main__":
    verify_frontend_database()