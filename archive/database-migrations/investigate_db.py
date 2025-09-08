#!/usr/bin/env python3
"""
Investigate database schema and tables
"""

import sqlite3
import os

def investigate_database():
    """Investigate what tables exist in the database and their schemas"""
    
    # Check all database files
    database_files = [
        'exodia.db',
        'exodia_backup_20250807_205111.db'
    ]
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    for db_file in database_files:
        db_path = os.path.join(script_dir, db_file)
        print(f"\n{'='*60}")
        print(f"INVESTIGATING: {db_file}")
        print(f"{'='*60}")
        
        if not os.path.exists(db_path):
            print(f"[ERROR] Database file not found: {db_path}")
            continue
            
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Get all tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
            tables = cursor.fetchall()
            
            print(f"Found {len(tables)} tables:")
            for table in tables:
                print(f"  - {table[0]}")
            
            # Check specifically for bookmaker_odds table
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='bookmaker_odds'")
            bookmaker_odds_exists = cursor.fetchone()
            
            if bookmaker_odds_exists:
                print(f"\n[SUCCESS] bookmaker_odds table EXISTS")
                
                # Get schema for bookmaker_odds
                cursor.execute("PRAGMA table_info(bookmaker_odds)")
                columns = cursor.fetchall()
                print("   Columns:")
                for col in columns:
                    print(f"     - {col[1]} ({col[2]})")
                    
                # Get row count
                cursor.execute("SELECT COUNT(*) FROM bookmaker_odds")
                count = cursor.fetchone()[0]
                print(f"   Row count: {count}")
                
            else:
                print(f"\n[ERROR] bookmaker_odds table MISSING")
            
            # Check for other critical tables
            critical_tables = ['leagues', 'teams', 'simulations']
            print(f"\nChecking critical tables:")
            
            for table_name in critical_tables:
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
                exists = cursor.fetchone()
                
                if exists:
                    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                    count = cursor.fetchone()[0]
                    print(f"  [OK] {table_name}: {count} rows")
                else:
                    print(f"  [ERROR] {table_name}: MISSING")
            
            # Get schema version if it exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'")
            if cursor.fetchone():
                cursor.execute("SELECT version, description FROM schema_version ORDER BY created_at DESC LIMIT 1")
                version_info = cursor.fetchone()
                if version_info:
                    print(f"\nSchema version: {version_info[0]} - {version_info[1]}")
                else:
                    print(f"\nSchema version table exists but is empty")
            else:
                print(f"\nNo schema version table found")
                
            conn.close()
            
        except Exception as e:
            print(f"[ERROR] Error investigating {db_file}: {e}")

    # Also check the frontend database
    frontend_db = os.path.join(os.path.dirname(script_dir), 'frontend', 'exodia.db')
    if os.path.exists(frontend_db):
        print(f"\n{'='*60}")
        print(f"INVESTIGATING: frontend/exodia.db")
        print(f"{'='*60}")
        
        try:
            conn = sqlite3.connect(frontend_db)
            cursor = conn.cursor()
            
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
            tables = cursor.fetchall()
            
            print(f"Found {len(tables)} tables:")
            for table in tables:
                print(f"  - {table[0]}")
                
            conn.close()
            
        except Exception as e:
            print(f"[ERROR] Error investigating frontend database: {e}")

if __name__ == "__main__":
    investigate_database()