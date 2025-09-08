#!/usr/bin/env python3
"""
Test team filtering functionality to ensure Barcelona only appears in La Liga
"""

import sqlite3
import os

def test_team_filtering():
    """Test the team filtering by league_id"""
    
    # Check the frontend database file
    frontend_db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend', 'exodia.db')
    
    if not os.path.exists(frontend_db_path):
        print(f"Frontend database not found at: {frontend_db_path}")
        return False
        
    try:
        # Connect to frontend database
        conn = sqlite3.connect(frontend_db_path)
        cursor = conn.cursor()
        
        print("Testing team filtering functionality...")
        print("=" * 60)
        
        # Test 1: Get teams for Premier League (should NOT include Barcelona)
        print("\nTest 1: Teams for Premier League (league_id = 5)")
        cursor.execute("""
            SELECT t.id, t.name
            FROM teams t
            WHERE t.league_id = 5
            ORDER BY t.name
        """)
        premier_teams = cursor.fetchall()
        
        print(f"Found {len(premier_teams)} teams:")
        barcelona_in_premier = False
        for team in premier_teams:
            team_name = team[1].encode('ascii', 'replace').decode('ascii')
            print(f"  - {team_name}")
            if team_name.lower() == 'barcelona':
                barcelona_in_premier = True
        
        if barcelona_in_premier:
            print("  ❌ FAIL: Barcelona found in Premier League!")
        else:
            print("  ✅ PASS: Barcelona NOT in Premier League")
        
        # Test 2: Get teams for La Liga (should include Barcelona)
        print("\nTest 2: Teams for La Liga (league_id = 6)")
        cursor.execute("""
            SELECT t.id, t.name
            FROM teams t
            WHERE t.league_id = 6
            ORDER BY t.name
        """)
        laliga_teams = cursor.fetchall()
        
        print(f"Found {len(laliga_teams)} teams:")
        barcelona_in_laliga = False
        for team in laliga_teams:
            team_name = team[1].encode('ascii', 'replace').decode('ascii')
            print(f"  - {team_name}")
            if team_name.lower() == 'barcelona':
                barcelona_in_laliga = True
        
        if barcelona_in_laliga:
            print("  ✅ PASS: Barcelona found in La Liga")
        else:
            print("  ❌ FAIL: Barcelona NOT found in La Liga!")
        
        # Test 3: Get teams for Argentina Primera (should NOT include Barcelona)
        print("\nTest 3: Teams for Argentina Primera División (league_id = 1)")
        cursor.execute("""
            SELECT t.id, t.name
            FROM teams t
            WHERE t.league_id = 1
            ORDER BY t.name
        """)
        argentina_teams = cursor.fetchall()
        
        print(f"Found {len(argentina_teams)} teams:")
        barcelona_in_argentina = False
        for team in argentina_teams:
            team_name = team[1].encode('ascii', 'replace').decode('ascii')
            print(f"  - {team_name}")
            if team_name.lower() == 'barcelona':
                barcelona_in_argentina = True
        
        if barcelona_in_argentina:
            print("  ❌ FAIL: Barcelona found in Argentina Primera!")
        else:
            print("  ✅ PASS: Barcelona NOT in Argentina Primera")
        
        # Test 4: Count total Barcelona instances (should be exactly 1)
        print("\nTest 4: Total Barcelona instances")
        cursor.execute("SELECT COUNT(*) FROM teams WHERE LOWER(name) = 'barcelona'")
        barcelona_count = cursor.fetchone()[0]
        
        print(f"Total Barcelona teams: {barcelona_count}")
        if barcelona_count == 1:
            print("  ✅ PASS: Exactly 1 Barcelona team exists")
        else:
            print(f"  ❌ FAIL: Expected 1 Barcelona team, found {barcelona_count}")
        
        # Test 5: Verify Barcelona is only in La Liga
        print("\nTest 5: Verify Barcelona league assignment")
        cursor.execute("""
            SELECT t.league_id, l.name as league_name
            FROM teams t
            LEFT JOIN leagues l ON t.league_id = l.id
            WHERE LOWER(t.name) = 'barcelona'
        """)
        barcelona_league = cursor.fetchone()
        
        if barcelona_league:
            league_id, league_name = barcelona_league
            league_name_safe = league_name.encode('ascii', 'replace').decode('ascii')
            print(f"Barcelona is in: {league_name_safe} (ID: {league_id})")
            if league_id == 6:
                print("  ✅ PASS: Barcelona is correctly in La Liga (ID: 6)")
            else:
                print(f"  ❌ FAIL: Barcelona is in wrong league (ID: {league_id})")
        else:
            print("  ❌ FAIL: Barcelona not found!")
        
        conn.close()
        
        # Summary
        print("\n" + "=" * 60)
        print("SUMMARY:")
        all_passed = (
            not barcelona_in_premier and 
            barcelona_in_laliga and 
            not barcelona_in_argentina and 
            barcelona_count == 1 and
            barcelona_league and barcelona_league[0] == 6
        )
        
        if all_passed:
            print("✅ ALL TESTS PASSED - Barcelona filtering is working correctly!")
            print("Barcelona will now only appear when La Liga is selected in the frontend.")
            return True
        else:
            print("❌ SOME TESTS FAILED - Please check the issues above")
            return False
        
    except Exception as e:
        print(f"[ERROR] Error testing team filtering: {e}")
        return False

if __name__ == "__main__":
    success = test_team_filtering()
    exit(0 if success else 1)