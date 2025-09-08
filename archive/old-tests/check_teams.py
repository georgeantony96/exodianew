#!/usr/bin/env python3
"""
Check teams in the database
"""

import sqlite3
import os

def check_teams():
    """Check what teams exist in the database"""
    
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
        
        print("Checking teams in database...")
        
        # Get all teams with league info
        cursor.execute("""
            SELECT t.id, t.name, l.name as league_name, l.id as league_id
            FROM teams t
            JOIN leagues l ON t.league_id = l.id
            ORDER BY t.id
        """)
        teams = cursor.fetchall()
        
        print(f"\nFound {len(teams)} teams:")
        for team in teams:
            # Safely encode team names to avoid unicode issues
            team_name = team[1].encode('ascii', 'replace').decode('ascii')
            league_name = team[2].encode('ascii', 'replace').decode('ascii')
            print(f"  ID: {team[0]}, Name: {team_name}, League: {league_name} (ID: {team[3]})")
        
        # Get all leagues
        cursor.execute("SELECT id, name, country FROM leagues ORDER BY id")
        leagues = cursor.fetchall()
        
        print(f"\nFound {len(leagues)} leagues:")
        for league in leagues:
            # Safely encode league names to avoid unicode issues
            league_name = league[1].encode('ascii', 'replace').decode('ascii')
            country = league[2].encode('ascii', 'replace').decode('ascii')
            print(f"  ID: {league[0]}, Name: {league_name}, Country: {country}")
            
        conn.close()
        
        if len(teams) == 0:
            print("\n[WARNING] No teams found in database! This could cause simulation errors.")
            return False
        else:
            print(f"\n[SUCCESS] Database has {len(teams)} teams in {len(leagues)} leagues")
            return True
        
    except Exception as e:
        print(f"[ERROR] Error checking teams: {e}")
        return False

if __name__ == "__main__":
    success = check_teams()
    exit(0 if success else 1)