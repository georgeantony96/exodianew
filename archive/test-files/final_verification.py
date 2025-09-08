import sqlite3

conn = sqlite3.connect('database/exodia.db')
cursor = conn.cursor()

print("FINAL VERIFICATION - Database Status")
print("=" * 40)

# Check all tables and their record counts
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
tables = cursor.fetchall()

total_records = 0
for table in tables:
    table_name = table[0]
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    count = cursor.fetchone()[0]
    total_records += count
    print(f"{table_name}: {count} records")

print(f"\nTotal records in database: {total_records}")

if total_records == 0:
    print("\n✅ DATABASE COMPLETELY CLEAN!")
    print("✅ Ready for fresh production use!")
    print("✅ All tables empty, fresh start achieved!")
else:
    print(f"\n⚠️  {total_records} records still remain")

conn.close()