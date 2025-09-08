import sqlite3
import os

# Connect to frontend database
db_path = 'exodia.db'
print('Setting up bankroll management in frontend database...')

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create bankroll management tables
print('Adding bankroll management system...')

# User bankroll table
try:
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_bankroll (
        id INTEGER PRIMARY KEY DEFAULT 1,
        starting_balance DECIMAL NOT NULL DEFAULT 1000.00,
        current_balance DECIMAL NOT NULL DEFAULT 1000.00,
        currency TEXT DEFAULT 'USD',
        last_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_profit_loss DECIMAL DEFAULT 0.00,
        total_staked DECIMAL DEFAULT 0.00,
        total_bets_placed INTEGER DEFAULT 0,
        winning_bets INTEGER DEFAULT 0,
        losing_bets INTEGER DEFAULT 0,
        pending_bets INTEGER DEFAULT 0,
        win_rate DECIMAL DEFAULT 0.00,
        roi_percentage DECIMAL DEFAULT 0.00,
        roi_on_turnover DECIMAL DEFAULT 0.00,
        max_balance DECIMAL DEFAULT 1000.00,
        max_drawdown DECIMAL DEFAULT 0.00,
        max_drawdown_amount DECIMAL DEFAULT 0.00,
        current_drawdown DECIMAL DEFAULT 0.00,
        kelly_multiplier DECIMAL DEFAULT 0.25,
        max_bet_percentage DECIMAL DEFAULT 5.00,
        min_edge_required DECIMAL DEFAULT 5.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    print('SUCCESS: user_bankroll table created')
except Exception as e:
    print('Table creation:', str(e))

# Insert default bankroll
try:
    cursor.execute('INSERT OR IGNORE INTO user_bankroll (id, starting_balance, current_balance) VALUES (1, 1000.00, 1000.00)')
    print('SUCCESS: Default bankroll inserted')
except Exception as e:
    print('Insert error:', str(e))

# Create bankroll status view
try:
    cursor.execute('DROP VIEW IF EXISTS bankroll_status')
    cursor.execute('''
    CREATE VIEW bankroll_status AS
    SELECT 
        ub.*,
        CASE 
            WHEN starting_balance > 0 THEN 
                ROUND(((current_balance - starting_balance) / starting_balance) * 100, 2)
            ELSE 0 
        END as total_roi_percentage,
        ROUND(current_balance - starting_balance, 2) as net_profit_loss,
        CASE
            WHEN max_drawdown < 5 THEN 'LOW RISK'
            WHEN max_drawdown < 15 THEN 'MODERATE RISK'  
            WHEN max_drawdown < 25 THEN 'HIGH RISK'
            ELSE 'VERY HIGH RISK'
        END as risk_level,
        ROUND(current_balance * (kelly_multiplier * 0.10), 2) as kelly_10pct_edge
    FROM user_bankroll ub
    WHERE id = 1
    ''')
    print('SUCCESS: bankroll_status view created')
except Exception as e:
    print('View creation:', str(e))

conn.commit()

# Test the setup
try:
    cursor.execute('SELECT * FROM bankroll_status')
    result = cursor.fetchone()
    if result:
        balance = result[1]
        print('SUCCESS: System working! Balance: $' + str(balance))
    else:
        print('ERROR: No data found')
except Exception as e:
    print('Test failed:', str(e))

conn.close()
print('Database setup complete!')