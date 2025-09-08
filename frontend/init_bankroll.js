// Initialize user_bankroll table for EXODIA FINAL
const Database = require('better-sqlite3');
const path = require('path');

function initializeBankroll() {
    const dbPath = path.join(__dirname, '..', 'database', 'exodia.db');
    
    try {
        console.log('Connecting to database:', dbPath);
        const db = new Database(dbPath);
        
        // Check if user_bankroll record exists
        const existingBankroll = db.prepare('SELECT * FROM user_bankroll WHERE id = 1').get();
        
        if (existingBankroll) {
            console.log('✅ Bankroll already exists:');
            console.log(`   ID: ${existingBankroll.id}`);
            console.log(`   Balance: $${existingBankroll.current_balance}`);
            console.log(`   Currency: ${existingBankroll.currency}`);
            console.log(`   Starting Balance: $${existingBankroll.starting_balance}`);
        } else {
            console.log('❌ No bankroll found. Initializing default bankroll...');
            
            // Insert default bankroll record
            const insertBankroll = db.prepare(`
                INSERT INTO user_bankroll (
                    id, starting_balance, current_balance, currency,
                    total_profit_loss, total_staked, total_bets_placed,
                    winning_bets, losing_bets, pending_bets,
                    win_rate, roi_percentage, roi_on_turnover,
                    max_balance, max_drawdown, max_drawdown_amount,
                    current_drawdown, last_reset, created_at, updated_at
                ) VALUES (
                    1, 1000.00, 1000.00, 'USD',
                    0.00, 0.00, 0,
                    0, 0, 0,
                    0.00, 0.00, 0.00,
                    1000.00, 0.00, 0.00,
                    0.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )
            `);
            
            const result = insertBankroll.run();
            console.log('✅ Default bankroll initialized with ID:', result.lastInsertRowid);
            
            // Verify the creation
            const newBankroll = db.prepare('SELECT * FROM user_bankroll WHERE id = 1').get();
            console.log('✅ Verified bankroll data:');
            console.log(`   ID: ${newBankroll.id}`);
            console.log(`   Balance: $${newBankroll.current_balance}`);
            console.log(`   Currency: ${newBankroll.currency}`);
            console.log(`   Starting Balance: $${newBankroll.starting_balance}`);
            console.log(`   Created: ${newBankroll.created_at}`);
        }
        
        db.close();
        console.log('✅ Database connection closed');
        return true;
        
    } catch (error) {
        console.error('❌ Error initializing bankroll:', error.message);
        return false;
    }
}

if (require.main === module) {
    initializeBankroll();
}

module.exports = { initializeBankroll };