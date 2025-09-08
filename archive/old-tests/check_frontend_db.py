#!/usr/bin/env python3
"""
Check the frontend database for Barcelona teams
"""

import sqlite3
import os

def check_frontend_db():
    """Check the frontend database for teams and leagues"""
    
    # Check the frontend database file
    frontend_db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend', 'exodia.db')
    
    if not os.path.exists(frontend_db_path):
        print(f"Frontend database not found at: {frontend_db_path}")
        return False
        
    try:
        # Connect to frontend database
        conn = sqlite3.connect(frontend_db_path)
        cursor = conn.cursor()
        
        print(f"Checking frontend database at: {frontend_db_path}")
        print("=" * 60)
        
        # Get all leagues
        cursor.execute("SELECT id, name, country FROM leagues ORDER BY id")
        leagues = cursor.fetchall()
        
        print(f"\nLeagues in frontend database ({len(leagues)}):")
        for league in leagues:
            league_name = league[1].encode('ascii', 'replace').decode('ascii')
            country = league[2].encode('ascii', 'replace').decode('ascii')
            print(f"  ID: {league[0]}, Name: {league_name}, Country: {country}")
        
        # Get all teams
        cursor.execute("""
            SELECT t.id, t.name, t.league_id, l.name as league_name, l.country
            FROM teams t
            LEFT JOIN leagues l ON t.league_id = l.id
            ORDER BY l.name, t.name
        """)
        all_teams = cursor.fetchall()
        
        print(f"\nAll teams in frontend database ({len(all_teams)}):")
        for team in all_teams:
            team_name = team[1].encode('ascii', 'replace').decode('ascii')
            league_name = team[3].encode('ascii', 'replace').decode('ascii') if team[3] else "NO LEAGUE"
            country = team[4].encode('ascii', 'replace').decode('ascii') if team[4] else "NO COUNTRY"
            print(f"  ID: {team[0]}, Name: {team_name}, League: {league_name} (ID: {team[2]}), Country: {country}")
        
        # Search specifically for Barcelona
        cursor.execute("""
            SELECT t.id, t.name, t.league_id, l.name as league_name, l.country
            FROM teams t
            LEFT JOIN leagues l ON t.league_id = l.id
            WHERE LOWER(t.name) LIKE '%barcelona%' OR LOWER(t.name) LIKE '%barça%' OR LOWER(t.name) = 'barca'
        """)
        barcelona_teams = cursor.fetchall()
        
        if barcelona_teams:
            print(f"\nBarcelona teams found:")
            for team in barcelona_teams:
                team_name = team[1].encode('ascii', 'replace').decode('ascii')
                league_name = team[3].encode('ascii', 'replace').decode('ascii') if team[3] else "NO LEAGUE"
                country = team[4].encode('ascii', 'replace').decode('ascii') if team[4] else "NO COUNTRY"
                print(f"  ID: {team[0]}, Name: {team_name}, League: {league_name} (ID: {team[2]}), Country: {country}")
        else:
            print("\nNo Barcelona teams found in frontend database")
        
        # Look for Premier League
        cursor.execute("""
            SELECT id, name, country FROM leagues 
            WHERE LOWER(name) LIKE '%premier%' OR LOWER(name) LIKE '%england%' OR LOWER(name) LIKE '%epl%'
        """)
        premier_leagues = cursor.fetchall()
        
        if premier_leagues:
            print(f"\nPremier League found:")
            for league in premier_leagues:
                league_name = league[1].encode('ascii', 'replace').decode('ascii')
                country = league[2].encode('ascii', 'replace').decode('ascii')
                print(f"  ID: {league[0]}, Name: {league_name}, Country: {country}")
                
                # Get teams in this league
                cursor.execute("""
                    SELECT t.id, t.name
                    FROM teams t
                    WHERE t.league_id = ?
                    ORDER BY t.name
                """, [league[0]])
                premier_teams = cursor.fetchall()
                
                print(f"    Teams in {league_name} ({len(premier_teams)}):")
                for team in premier_teams:
                    team_name = team[1].encode('ascii', 'replace').decode('ascii')
                    print(f"      - {team_name}")
        
        # Look for La Liga
        cursor.execute("""
            SELECT id, name, country FROM leagues 
            WHERE LOWER(name) LIKE '%la liga%' OR LOWER(name) LIKE '%spain%' OR LOWER(name) LIKE '%española%'
        """)
        laliga_leagues = cursor.fetchall()
        
        if laliga_leagues:
            print(f"\nLa Liga found:")
            for league in laliga_leagues:
                league_name = league[1].encode('ascii', 'replace').decode('ascii')
                country = league[2].encode('ascii', 'replace').decode('ascii')
                print(f"  ID: {league[0]}, Name: {league_name}, Country: {country}")
                
                # Get teams in this league
                cursor.execute("""
                    SELECT t.id, t.name
                    FROM teams t
                    WHERE t.league_id = ?
                    ORDER BY t.name
                """, [league[0]])
                laliga_teams = cursor.fetchall()
                
                print(f"    Teams in {league_name} ({len(laliga_teams)}):")
                for team in laliga_teams:
                    team_name = team[1].encode('ascii', 'replace').decode('ascii')
                    print(f"      - {team_name}")
            
        conn.close()
        return True
        
    except Exception as e:
        print(f"[ERROR] Error checking frontend database: {e}")
        return False

if __name__ == "__main__":
    success = check_frontend_db()
    exit(0 if success else 1)