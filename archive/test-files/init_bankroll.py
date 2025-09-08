import sqlite3

conn = sqlite3.connect('database/exodia.db')
cursor = conn.cursor()

# Initialize fresh bankroll
cursor.execute("""
    INSERT INTO user_bankroll (id, current_bankroll, initial_bankroll, total_profit_loss, last_updated)
    VALUES (1, 5000.0, 5000.0, 0.0, datetime('now'))
""")

conn.commit()
print("Fresh $5,000 bankroll initialized!")

# Verify
cursor.execute("SELECT current_bankroll FROM user_bankroll WHERE id = 1")
result = cursor.fetchone()
if result:
    print(f"Verified: Bankroll = ${result[0]:,.2f}")

conn.close()