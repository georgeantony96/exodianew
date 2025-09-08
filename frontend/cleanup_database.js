// Clean database for fresh start
const Database = require('better-sqlite3');
const path = require('path');

function cleanDatabase() {
    const dbPath = path.join(__dirname, '..', 'database', 'exodia.db');
    
    try {
        const db = new Database(dbPath);
        
        console.log('🧹 CLEANING DATABASE FOR FRESH START');
        console.log('='.repeat(50));
        
        // Delete all user data but keep structure
        const tables = [
            'user_bet_selections',
            'user_bankroll', 
            'simulations',
            'historical_matches',
            'match_results',
            'bookmaker_odds',
            'team_home_performance',
            'team_away_performance',
            'league_market_intelligence'
        ];
        
        let totalDeleted = 0;
        
        tables.forEach(table => {
            try {
                const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
                const result = db.prepare(`DELETE FROM ${table}`).run();
                console.log(`✅ Cleaned ${table}: ${count.count} records deleted`);
                totalDeleted += count.count;
            } catch (error) {
                console.log(`⚠️  ${table}: ${error.message}`);
            }
        });
        
        // Clean teams but keep basic structure (optional - comment out if you want to keep teams)
        const teamCount = db.prepare('SELECT COUNT(*) as count FROM teams').get();
        db.prepare('DELETE FROM teams').run();
        console.log(`✅ Cleaned teams: ${teamCount.count} records deleted`);
        totalDeleted += teamCount.count;
        
        // Clean leagues but keep basic structure (optional - comment out if you want to keep leagues)
        const leagueCount = db.prepare('SELECT COUNT(*) as count FROM leagues').get();
        db.prepare('DELETE FROM leagues').run();
        console.log(`✅ Cleaned leagues: ${leagueCount.count} records deleted`);
        totalDeleted += leagueCount.count;
        
        // Reset auto-increment counters
        db.prepare('UPDATE sqlite_sequence SET seq = 0 WHERE name IN (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
            'simulations', 'user_bet_selections', 'user_bankroll', 'teams', 'leagues',
            'historical_matches', 'match_results', 'bookmaker_odds', 
            'team_home_performance', 'team_away_performance', 'league_market_intelligence'
        );
        
        console.log('='.repeat(50));
        console.log(`🎯 CLEANUP COMPLETE: ${totalDeleted} total records removed`);
        console.log('✨ Database is now clean and ready for fresh data');
        console.log('');
        console.log('Next steps:');
        console.log('1. Add your leagues via the application');
        console.log('2. Add teams for each league');
        console.log('3. Start running real simulations');
        
        db.close();
        
    } catch (error) {
        console.error('❌ Cleanup error:', error.message);
    }
}

if (require.main === module) {
    cleanDatabase();
}

module.exports = { cleanDatabase };