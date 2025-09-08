#!/usr/bin/env python3
"""
Sync the main database with the corrected frontend database structure
"""

import sqlite3
import os

def sync_main_db():
    """Sync main database with frontend database structure"""
    
    # Database paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    main_db_path = os.path.join(script_dir, 'exodia.db')
    frontend_db_path = os.path.join(os.path.dirname(script_dir), 'frontend', 'exodia.db')
    
    if not os.path.exists(frontend_db_path):
        print(f"Frontend database not found at: {frontend_db_path}")
        return False
        
    if not os.path.exists(main_db_path):
        print(f"Main database not found at: {main_db_path}")
        return False
        
    try:
        # Connect to both databases
        frontend_conn = sqlite3.connect(frontend_db_path)
        main_conn = sqlite3.connect(main_db_path)
        
        frontend_cursor = frontend_conn.cursor()
        main_cursor = main_conn.cursor()
        
        print("Syncing main database with frontend database...")
        print("=" * 60)
        
        # Get leagues from frontend
        frontend_cursor.execute("SELECT id, name, country FROM leagues ORDER BY id")
        frontend_leagues = frontend_cursor.fetchall()
        
        print(f"Frontend has {len(frontend_leagues)} leagues")
        
        # Get leagues from main
        main_cursor.execute("SELECT id, name, country FROM leagues ORDER BY id")
        main_leagues = main_cursor.fetchall()
        
        print(f"Main database has {len(main_leagues)} leagues")
        
        # Add missing leagues to main database
        for league in frontend_leagues:
            league_id, name, country = league
            
            # Check if league exists in main
            main_cursor.execute("SELECT id FROM leagues WHERE id = ?", [league_id])
            exists = main_cursor.fetchone()
            
            if not exists:
                print(f"Adding league to main DB: {name} ({country})")
                main_cursor.execute(
                    "INSERT INTO leagues (id, name, country) VALUES (?, ?, ?)",
                    [league_id, name, country]
                )
        
        main_conn.commit()
        
        # Get teams from frontend (only the correctly assigned ones)
        frontend_cursor.execute("""
            SELECT t.id, t.name, t.league_id, l.name as league_name
            FROM teams t
            LEFT JOIN leagues l ON t.league_id = l.id
            ORDER BY t.id
        """)
        frontend_teams = frontend_cursor.fetchall()
        
        print(f"\nFrontend has {len(frontend_teams)} teams:")
        for team in frontend_teams:
            team_name = team[1].encode('ascii', 'replace').decode('ascii')
            league_name = team[3].encode('ascii', 'replace').decode('ascii') if team[3] else "NO LEAGUE"
            print(f"  ID: {team[0]}, Name: {team_name}, League: {league_name} (ID: {team[2]})")
        
        # Check if we need to clear and resync teams in main database
        main_cursor.execute("SELECT COUNT(*) FROM teams")
        main_team_count = main_cursor.fetchone()[0]
        
        if main_team_count > 0:
            print(f"\nMain database has {main_team_count} teams. Checking for conflicts...")
            
            # For simplicity, let's just report what's different rather than auto-sync
            main_cursor.execute("""
                SELECT t.id, t.name, t.league_id
                FROM teams t
                ORDER BY t.id
            """)
            main_teams = main_cursor.fetchall()
            
            print(f"Main database teams:")
            for team in main_teams:
                team_name = team[1].encode('ascii', 'replace').decode('ascii')
                print(f"  ID: {team[0]}, Name: {team_name}, League ID: {team[2]}")
        
        frontend_conn.close()
        main_conn.close()
        
        print(f"\n[SUCCESS] Main database league sync completed")
        print("Note: Team sync was checked but not automatically performed to avoid conflicts")
        return True
        
    except Exception as e:
        print(f"[ERROR] Error syncing databases: {e}")
        return False

if __name__ == "__main__":
    success = sync_main_db()
    exit(0 if success else 1)