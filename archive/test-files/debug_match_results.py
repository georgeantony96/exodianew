import sqlite3

def debug_match_results():
    print("=== DEBUGGING MATCH RESULTS ISSUE ===")
    
    try:
        conn = sqlite3.connect('./database/exodia.db')
        cursor = conn.cursor()
        
        # Check if match_results table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='match_results'")
        table_exists = cursor.fetchone()
        
        if table_exists:
            print("match_results table exists")
            
            # Check table structure
            cursor.execute('PRAGMA table_info(match_results)')
            columns = cursor.fetchall()
            print("Table columns:")
            for col in columns:
                print(f"  {col[1]} ({col[2]})")
            
            # Check if any data exists
            cursor.execute('SELECT COUNT(*) FROM match_results')
            count = cursor.fetchone()[0]
            print(f"Records in match_results: {count}")
            
            if count > 0:
                cursor.execute('SELECT * FROM match_results ORDER BY result_entered_at DESC LIMIT 1')
                latest = cursor.fetchone()
                print(f"Latest record: {latest}")
            
            # Check constraints
            cursor.execute('PRAGMA foreign_key_list(match_results)')
            fk_constraints = cursor.fetchall()
            print(f"Foreign key constraints: {len(fk_constraints)}")
            for fk in fk_constraints:
                print(f"  {fk}")
                
        else:
            print("ERROR: match_results table does not exist!")
            
        # Check simulations table for reference
        cursor.execute('SELECT id, created_at FROM simulations ORDER BY created_at DESC LIMIT 3')
        sims = cursor.fetchall()
        print(f"\nRecent simulations for reference:")
        for sim in sims:
            print(f"  Simulation {sim[0]}: {sim[1]}")
            
        # Check if there are any records in match_results at all
        cursor.execute('SELECT * FROM match_results')
        all_results = cursor.fetchall()
        print(f"\nAll match_results records: {len(all_results)}")
        for result in all_results:
            print(f"  {result}")
            
        conn.close()
        
    except Exception as e:
        print(f"Database error: {e}")

if __name__ == "__main__":
    debug_match_results()