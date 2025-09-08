import sqlite3

conn = sqlite3.connect('database/exodia.db')
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

print("Existing tables:")
for table in tables:
    print(f"- {table[0]}")
    
print("\nChecking key tables for data:")
for table_name in ['simulations', 'teams', 'leagues']:
    try:
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"{table_name}: {count} records")
    except:
        print(f"{table_name}: table not found")

conn.close()