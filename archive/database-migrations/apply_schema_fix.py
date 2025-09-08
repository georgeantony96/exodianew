#!/usr/bin/env python3
"""
Apply missing database schema for EXODIA FINAL simulation
"""

import sqlite3
import os

def apply_schema_fix():
    """Apply missing schema to existing database"""
    
    # Find the database file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(script_dir, 'exodia.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at: {db_path}")
        return False
        
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("Applying missing schema to database...")
        
        # Read and execute the schema fix
        schema_file = os.path.join(script_dir, 'init_full_schema.sql')
        with open(schema_file, 'r') as f:
            schema_sql = f.read()
        
        # Execute all schema statements
        cursor.executescript(schema_sql)
        
        # Verify tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = [row[0] for row in cursor.fetchall()]
        
        print("Tables in database:")
        for table in tables:
            print(f"  [OK] {table}")
        
        # Check if critical tables exist
        required_tables = ['bookmaker_odds', 'simulations', 'historical_matches', 'match_results']
        missing_tables = [table for table in required_tables if table not in tables]
        
        if missing_tables:
            print(f"[ERROR] Missing required tables: {missing_tables}")
            return False
        else:
            print("[SUCCESS] All required tables exist!")
            
        conn.commit()
        conn.close()
        
        print("Schema fix applied successfully!")
        return True
        
    except Exception as e:
        print(f"[ERROR] Error applying schema fix: {e}")
        return False

if __name__ == "__main__":
    success = apply_schema_fix()
    exit(0 if success else 1)