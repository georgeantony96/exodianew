#!/usr/bin/env python3
"""
Check if Barcelona exists in the database and what league it's assigned to
"""

import sqlite3
import os

def check_barcelona():
    """Check if Barcelona exists and its league assignment"""
    
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
        
        print("Searching for Barcelona in database...")
        
        # Search for Barcelona (case insensitive)
        cursor.execute("""
            SELECT t.id, t.name, t.league_id, l.name as league_name, l.country
            FROM teams t
            LEFT JOIN leagues l ON t.league_id = l.id
            WHERE LOWER(t.name) LIKE '%barcelona%' OR LOWER(t.name) LIKE '%barça%' OR LOWER(t.name) = 'barca'
        """)
        barcelona_teams = cursor.fetchall()
        
        if barcelona_teams:
            print(f"\nFound {len(barcelona_teams)} Barcelona-related teams:")
            for team in barcelona_teams:
                team_name = team[1].encode('ascii', 'replace').decode('ascii')
                league_name = team[3].encode('ascii', 'replace').decode('ascii') if team[3] else "NO LEAGUE"
                country = team[4].encode('ascii', 'replace').decode('ascii') if team[4] else "NO COUNTRY"
                print(f"  ID: {team[0]}, Name: {team_name}, League: {league_name} (ID: {team[2]}), Country: {country}")
        else:
            print("\nNo Barcelona teams found in database")
        
        # Get all teams for reference
        cursor.execute("""
            SELECT t.id, t.name, t.league_id, l.name as league_name, l.country
            FROM teams t
            LEFT JOIN leagues l ON t.league_id = l.id
            ORDER BY t.id
        """)
        all_teams = cursor.fetchall()
        
        print(f"\nAll teams in database ({len(all_teams)}):")
        for team in all_teams:
            team_name = team[1].encode('ascii', 'replace').decode('ascii')
            league_name = team[3].encode('ascii', 'replace').decode('ascii') if team[3] else "NO LEAGUE"
            country = team[4].encode('ascii', 'replace').decode('ascii') if team[4] else "NO COUNTRY"
            print(f"  ID: {team[0]}, Name: {team_name}, League: {league_name} (ID: {team[2]}), Country: {country}")
        
        # Get all leagues for reference
        cursor.execute("SELECT id, name, country FROM leagues ORDER BY id")
        leagues = cursor.fetchall()
        
        print(f"\nAll leagues in database ({len(leagues)}):")
        for league in leagues:
            league_name = league[1].encode('ascii', 'replace').decode('ascii')
            country = league[2].encode('ascii', 'replace').decode('ascii')
            print(f"  ID: {league[0]}, Name: {league_name}, Country: {country}")
            
        conn.close()
        return True
        
    except Exception as e:
        print(f"[ERROR] Error checking database: {e}")
        return False

if __name__ == "__main__":
    success = check_barcelona()
    exit(0 if success else 1)