import sqlite3

# Check main database
print("=== MAIN DATABASE (database/exodia.db) ===")
try:
    conn = sqlite3.connect('database/exodia.db')
    cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [t[0] for t in cursor.fetchall()]
    print(f"Tables: {tables}")
    
    if 'leagues' in tables:
        cursor = conn.execute('SELECT COUNT(*) FROM leagues')
        print(f"Leagues count: {cursor.fetchone()[0]}")
    else:
        print("❌ No leagues table in main database")
        
    if 'teams' in tables:
        cursor = conn.execute('SELECT COUNT(*) FROM teams')
        print(f"Teams count: {cursor.fetchone()[0]}")
    else:
        print("❌ No teams table in main database")
    
    conn.close()
except Exception as e:
    print(f"Error with main database: {e}")

print("\n=== FRONTEND DATABASE (frontend/exodia.db) ===")
try:
    conn = sqlite3.connect('frontend/exodia.db')
    cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [t[0] for t in cursor.fetchall()]
    print(f"Tables: {tables}")
    
    # Check leagues
    cursor = conn.execute('SELECT COUNT(*) FROM leagues')
    league_count = cursor.fetchone()[0]
    print(f"Leagues count: {league_count}")
    
    if league_count > 0:
        cursor = conn.execute('SELECT id, name, country FROM leagues')
        leagues = cursor.fetchall()
        print("Leagues:")
        for league in leagues:
            print(f"  - ID: {league[0]}, Name: {league[1]}, Country: {league[2]}")
    
    # Check teams
    cursor = conn.execute('SELECT COUNT(*) FROM teams')
    team_count = cursor.fetchone()[0]
    print(f"Teams count: {team_count}")
    
    if team_count > 0:
        cursor = conn.execute('SELECT id, name, league_id FROM teams')
        teams = cursor.fetchall()
        print("Teams:")
        for team in teams:
            print(f"  - ID: {team[0]}, Name: {team[1]}, League ID: {team[2]}")
    
    conn.close()
except Exception as e:
    print(f"Error with frontend database: {e}")