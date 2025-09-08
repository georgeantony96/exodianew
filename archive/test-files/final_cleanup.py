import sqlite3

conn = sqlite3.connect('database/exodia.db')
cursor = conn.cursor()

print("FINAL CLEANUP - Removing all remaining data")
print("=" * 45)

# Clear specific remaining tables
remaining_tables = ['leagues', 'teams', 'simulations', 'user_bankroll', 'user_bet_selections']

for table in remaining_tables:
    try:
        cursor.execute(f"DELETE FROM {table}")
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"Cleared {table}: {count} records remaining")
    except Exception as e:
        print(f"Error clearing {table}: {e}")

conn.commit()

# Final verification
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
tables = cursor.fetchall()

total_records = 0
for table in tables:
    table_name = table[0]
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    count = cursor.fetchone()[0]
    total_records += count

print(f"\nFinal total records: {total_records}")

if total_records == 0:
    print("\nSUCCESS! Database completely clean!")
    print("Ready for fresh production use tomorrow!")
else:
    print(f"Warning: {total_records} records still exist")

conn.close()