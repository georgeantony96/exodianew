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
        
        print(f"Fixing team assignments in frontend database...")
        print("=" * 60)
        
        fixes_made = 0
        
        # Remove Barcelona from Premier League (league_id = 5)
        cursor.execute("SELECT id FROM teams WHERE LOWER(name) = 'barcelona' AND league_id = 5")
        barca_premier = cursor.fetchone()
        if barca_premier:
            print(f"Removing Barcelona from Premier League (team ID: {barca_premier[0]})")
            cursor.execute("DELETE FROM teams WHERE id = ?", [barca_premier[0]])
            fixes_made += 1
        
        # Remove Real Madrid from Premier League (league_id = 5)  
        cursor.execute("SELECT id FROM teams WHERE LOWER(name) = 'real madrid' AND league_id = 5")
        real_premier = cursor.fetchone()
        if real_premier:
            print(f"Removing Real Madrid from Premier League (team ID: {real_premier[0]})")
            cursor.execute("DELETE FROM teams WHERE id = ?", [real_premier[0]])
            fixes_made += 1
        
        # Remove Barcelona from Argentina Primera Division (league_id = 1) - this is clearly wrong
        cursor.execute("SELECT id FROM teams WHERE LOWER(name) = 'barcelona' AND league_id = 1")
        barca_argentina = cursor.fetchone()
        if barca_argentina:
            print(f"Removing Barcelona from Argentina Primera Division (team ID: {barca_argentina[0]})")
            cursor.execute("DELETE FROM teams WHERE id = ?", [barca_argentina[0]])
            fixes_made += 1
        
        # Remove Real Madrid from Argentina Primera Division (league_id = 1) - this is clearly wrong
        cursor.execute("SELECT id FROM teams WHERE LOWER(name) = 'real madrid' AND league_id = 1")
        real_argentina = cursor.fetchone()
        if real_argentina:
            print(f"Removing Real Madrid from Argentina Primera Division (team ID: {real_argentina[0]})")
            cursor.execute("DELETE FROM teams WHERE id = ?", [real_argentina[0]])
            fixes_made += 1
        
        # Commit changes
        conn.commit()
        
        print(f"\nVerification after fixes...")
        
        # Count teams in Premier League now
        cursor.execute("SELECT COUNT(*) FROM teams WHERE league_id = 5")
        premier_count = cursor.fetchone()[0]
        print(f"Premier League now has {premier_count} teams")
        
        # Count teams in La Liga now  
        cursor.execute("SELECT COUNT(*) FROM teams WHERE league_id = 6")
        laliga_count = cursor.fetchone()[0]
        print(f"La Liga now has {laliga_count} teams")
        
        # Check remaining Barcelona teams
        cursor.execute("SELECT COUNT(*) FROM teams WHERE LOWER(name) = 'barcelona'")
        barca_count = cursor.fetchone()[0]
        print(f"Total Barcelona teams remaining: {barca_count}")
        
        # Check remaining Real Madrid teams
        cursor.execute("SELECT COUNT(*) FROM teams WHERE LOWER(name) = 'real madrid'")
        real_count = cursor.fetchone()[0]
        print(f"Total Real Madrid teams remaining: {real_count}")
        
        # Show which leagues the remaining Barcelona teams are in
        cursor.execute("""
            SELECT t.league_id, COUNT(*) as team_count
            FROM teams t 
            WHERE LOWER(t.name) = 'barcelona'
            GROUP BY t.league_id
        """)
        barca_leagues = cursor.fetchall()
        
        print(f"Barcelona teams by league:")
        for league_id, count in barca_leagues:
            print(f"  League ID {league_id}: {count} teams")
        
        conn.close()
        
        if fixes_made > 0:
            print(f"\n[SUCCESS] Made {fixes_made} fixes to team assignments")
            print("Barcelona should now only appear when La Liga is selected")
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