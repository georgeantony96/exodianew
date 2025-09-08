import sqlite3

def complete_reset():
    conn = sqlite3.connect('database/exodia.db')
    cursor = conn.cursor()
    
    print("COMPLETE DATABASE RESET")
    print("=" * 30)
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    tables = [row[0] for row in cursor.fetchall()]
    
    print(f"Found {len(tables)} tables to clear")
    
    # Clear all data tables
    for table in tables:
        try:
            cursor.execute(f"DELETE FROM {table}")
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"Cleared {table}: {count} records remaining")
        except Exception as e:
            print(f"Error clearing {table}: {e}")
    
    # Reset auto-increment sequences
    cursor.execute("DELETE FROM sqlite_sequence")
    
    # Initialize fresh bankroll if user_bankroll table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user_bankroll';")
    if cursor.fetchone():
        cursor.execute("""
            INSERT INTO user_bankroll (id, current_bankroll, initial_bankroll, total_profit_loss, last_updated)
            VALUES (1, 5000.0, 5000.0, 0.0, datetime('now'))
        """)
        print("Fresh $5,000 bankroll initialized in user_bankroll")
    
    conn.commit()
    print("\nDatabase completely reset!")
    print("Ready for fresh production use!")
    
    conn.close()

if __name__ == "__main__":
    complete_reset()