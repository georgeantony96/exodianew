#!/usr/bin/env python3
"""
Fix incorrect team league assignments in the frontend database
Specifically fix Barcelona in Premier League issue
"""

import sqlite3
import os

def fix_team_assignments():
    """Fix the incorrect team assignments in the frontend database"""
    
    # Check the frontend database file
    frontend_db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend', 'exodia.db')
    
    if not os.path.exists(frontend_db_path):
        print(f"Frontend database not found at: {frontend_db_path}")
        return False
        
    try:
        # Connect to frontend database
        conn = sqlite3.connect(frontend_db_path)
        cursor = conn.cursor()
        
        print(f"Fixing team assignments in: {frontend_db_path}")
        print("=" * 60)
        
        # First, let's identify the problematic teams
        print("\n1. Identifying problematic teams...")
        
        # Find Barcelona in wrong leagues
        cursor.execute("""
            SELECT t.id, t.name, t.league_id, l.name as league_name, l.country
            FROM teams t
            LEFT JOIN leagues l ON t.league_id = l.id
            WHERE LOWER(t.name) = 'barcelona'
        """)
        barcelona_teams = cursor.fetchall()
        
        print("Current Barcelona teams:")
        for team in barcelona_teams:
            team_name = team[1].encode('ascii', 'replace').decode('ascii')
            league_name = team[3].encode('ascii', 'replace').decode('ascii') if team[3] else "NO LEAGUE"
            country = team[4].encode('ascii', 'replace').decode('ascii') if team[4] else "NO COUNTRY"
            print(f"  ID: {team[0]}, Name: {team_name}, League: {league_name} (ID: {team[2]}), Country: {country}")
        
        # Find Real Madrid duplicates too
        cursor.execute("""
            SELECT t.id, t.name, t.league_id, l.name as league_name, l.country
            FROM teams t
            LEFT JOIN leagues l ON t.league_id = l.id
            WHERE LOWER(t.name) = 'real madrid'
        """)
        real_madrid_teams = cursor.fetchall()
        
        print("\nCurrent Real Madrid teams:")
        for team in real_madrid_teams:
            team_name = team[1].encode('ascii', 'replace').decode('ascii')
            league_name = team[3].encode('ascii', 'replace').decode('ascii') if team[3] else "NO LEAGUE"
            country = team[4].encode('ascii', 'replace').decode('ascii') if team[4] else "NO COUNTRY"
            print(f"  ID: {team[0]}, Name: {team_name}, League: {league_name} (ID: {team[2]}), Country: {country}")
        
        # Get league IDs for reference
        cursor.execute("SELECT id, name, country FROM leagues")
        leagues = cursor.fetchall()
        
        print(f"\nLeague mappings:")
        for league in leagues:
            league_name = league[1].encode('ascii', 'replace').decode('ascii')
            country = league[2].encode('ascii', 'replace').decode('ascii')
            print(f"  {league_name} ({country}) -> ID: {league[0]}")
        
        # Now let's fix the issues
        print(f"\n2. Fixing team assignments...")
        
        fixes_made = 0
        
        # Remove Barcelona from Premier League (ID: 9)
        cursor.execute("SELECT id FROM teams WHERE LOWER(name) = 'barcelona' AND league_id = 5")
        barca_premier = cursor.fetchone()
        if barca_premier:
            print(f"  Removing Barcelona from Premier League (ID: {barca_premier[0]})")
            cursor.execute("DELETE FROM teams WHERE id = ?", [barca_premier[0]])
            fixes_made += 1
        
        # Remove Real Madrid from Premier League (ID: 10)  
        cursor.execute("SELECT id FROM teams WHERE LOWER(name) = 'real madrid' AND league_id = 5")
        real_premier = cursor.fetchone()
        if real_premier:
            print(f"  Removing Real Madrid from Premier League (ID: {real_premier[0]})")
            cursor.execute("DELETE FROM teams WHERE id = ?", [real_premier[0]])
            fixes_made += 1
        
        # Remove Barcelona from Argentina Primera División (ID: 7) - this is clearly wrong
        cursor.execute("SELECT id FROM teams WHERE LOWER(name) = 'barcelona' AND league_id = 1")
        barca_argentina = cursor.fetchone()
        if barca_argentina:
            print(f"  Removing Barcelona from Argentina Primera División (ID: {barca_argentina[0]})")
            cursor.execute("DELETE FROM teams WHERE id = ?", [barca_argentina[0]])
            fixes_made += 1
        
        # Remove Real Madrid from Argentina Primera División (ID: 8) - this is clearly wrong
        cursor.execute("SELECT id FROM teams WHERE LOWER(name) = 'real madrid' AND league_id = 1")
        real_argentina = cursor.fetchone()
        if real_argentina:
            print(f"  Removing Real Madrid from Argentina Primera División (ID: {real_argentina[0]})")
            cursor.execute("DELETE FROM teams WHERE id = ?", [real_argentina[0]])
            fixes_made += 1
        
        # Commit changes
        conn.commit()
        
        print(f"\n3. Verification after fixes...")
        
        # Verify the fixes
        cursor.execute("""
            SELECT t.id, t.name, t.league_id, l.name as league_name, l.country
            FROM teams t
            LEFT JOIN leagues l ON t.league_id = l.id
            WHERE LOWER(t.name) IN ('barcelona', 'real madrid')
            ORDER BY t.name, l.name
        """)
        remaining_teams = cursor.fetchall()
        
        print(f"Remaining Barcelona/Real Madrid teams after cleanup:")
        for team in remaining_teams:
            team_name = team[1].encode('ascii', 'replace').decode('ascii')
            league_name = team[3].encode('ascii', 'replace').decode('ascii') if team[3] else "NO LEAGUE"
            country = team[4].encode('ascii', 'replace').decode('ascii') if team[4] else "NO COUNTRY"
            print(f"  ID: {team[0]}, Name: {team_name}, League: {league_name} (ID: {team[2]}), Country: {country}")
        
        # Show Premier League teams now
        cursor.execute("""
            SELECT t.id, t.name
            FROM teams t
            WHERE t.league_id = 5
            ORDER BY t.name
        """)
        premier_teams = cursor.fetchall()
        
        print(f"\nPremier League teams after cleanup ({len(premier_teams)}):")
        for team in premier_teams:
            team_name = team[1].encode('ascii', 'replace').decode('ascii')
            print(f"  - {team_name}")
        
        # Show La Liga teams now
        cursor.execute("""
            SELECT t.id, t.name
            FROM teams t
            WHERE t.league_id = 6
            ORDER BY t.name
        """)
        laliga_teams = cursor.fetchall()
        
        print(f"\nLa Liga teams after cleanup ({len(laliga_teams)}):")
        for team in laliga_teams:
            team_name = team[1].encode('ascii', 'replace').decode('ascii')
            print(f"  - {team_name}")
        
        conn.close()
        
        if fixes_made > 0:
            print(f"\n[SUCCESS] Made {fixes_made} fixes to team assignments")
            print("Barcelona should now only appear in La Liga team selection")
            return True
        else:
            print(f"\n[INFO] No fixes needed - teams are already correctly assigned")
            return True
        
    except Exception as e:
        print(f"[ERROR] Error fixing team assignments: {e}")
        return False

if __name__ == "__main__":
    success = fix_team_assignments()
    exit(0 if success else 1)