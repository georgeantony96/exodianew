// Database inspection tool for EXODIA FINAL
// Check if simulations, bets, and data are being saved properly

const Database = require('better-sqlite3');
const path = require('path');

function inspectDatabase() {
    const dbPath = path.join(__dirname, '..', 'database', 'exodia.db');
    
    try {
        const db = new Database(dbPath, { readonly: true });
        
        console.log('='.repeat(60));
        console.log('EXODIA DATABASE INSPECTION');
        console.log('='.repeat(60));
        
        // Check all tables
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        console.log(`\nAvailable Tables (${tables.length}):`);
        tables.forEach(table => {
            console.log(`  - ${table.name}`);
        });
        
        // Check simulations table
        console.log(`\nSIMULATIONS TABLE:`);
        const simCount = db.prepare("SELECT COUNT(*) as count FROM simulations").get();
        console.log(`  Total simulations: ${simCount.count}`);
        
        if (simCount.count > 0) {
            const recentSims = db.prepare(`
                SELECT id, created_at, home_team_id, away_team_id, distribution_type, iterations
                FROM simulations 
                ORDER BY created_at DESC 
                LIMIT 5
            `).all();
            console.log(`  Recent 5 simulations:`);
            recentSims.forEach(sim => {
                console.log(`    ID: ${sim.id} | ${sim.created_at} | Teams: ${sim.home_team_id} vs ${sim.away_team_id} | ${sim.distribution_type} | ${sim.iterations} iter`);
            });
        }
        
        // Check user_bet_selections table
        console.log(`\nUSER BET SELECTIONS TABLE:`);
        const betCount = db.prepare("SELECT COUNT(*) as count FROM user_bet_selections").get();
        console.log(`  Total bet selections: ${betCount.count}`);
        
        if (betCount.count > 0) {
            const recentBets = db.prepare(`
                SELECT id, simulation_id, market_type, market_option, selected_odds, edge_percentage, bet_status
                FROM user_bet_selections 
                ORDER BY id DESC 
                LIMIT 5
            `).all();
            console.log(`  Recent 5 bet selections:`);
            recentBets.forEach(bet => {
                console.log(`    ID: ${bet.id} | Sim: ${bet.simulation_id} | ${bet.market_type} ${bet.market_option} | Odds: ${bet.selected_odds} | Edge: ${bet.edge_percentage}% | ${bet.bet_status}`);
            });
        }
        
        // Check teams table
        console.log(`\nTEAMS TABLE:`);
        const teamCount = db.prepare("SELECT COUNT(*) as count FROM teams").get();
        console.log(`  Total teams: ${teamCount.count}`);
        
        if (teamCount.count > 0) {
            const sampleTeams = db.prepare("SELECT id, name, league_id FROM teams LIMIT 10").all();
            console.log(`  Sample teams:`);
            sampleTeams.forEach(team => {
                console.log(`    ID: ${team.id} | ${team.name} | League: ${team.league_id}`);
            });
        }
        
        // Check leagues table
        console.log(`\nLEAGUES TABLE:`);
        const leagueCount = db.prepare("SELECT COUNT(*) as count FROM leagues").get();
        console.log(`  Total leagues: ${leagueCount.count}`);
        
        if (leagueCount.count > 0) {
            const leagues = db.prepare("SELECT id, name, country FROM leagues").all();
            console.log(`  All leagues:`);
            leagues.forEach(league => {
                console.log(`    ID: ${league.id} | ${league.name} | ${league.country}`);
            });
        }
        
        // Check user_bankroll table
        console.log(`\nUSER BANKROLL TABLE:`);
        const bankrollCount = db.prepare("SELECT COUNT(*) as count FROM user_bankroll").get();
        console.log(`  Total bankroll entries: ${bankrollCount.count}`);
        
        if (bankrollCount.count > 0) {
            const recentBankroll = db.prepare(`
                SELECT id, current_balance, total_profit_loss, created_at
                FROM user_bankroll 
                ORDER BY created_at DESC 
                LIMIT 3
            `).all();
            console.log(`  Recent bankroll entries:`);
            recentBankroll.forEach(entry => {
                console.log(`    ID: ${entry.id} | Balance: $${entry.current_balance} | P/L: $${entry.total_profit_loss} | ${entry.created_at}`);
            });
        }
        
        // Check for any data integrity issues
        console.log(`\nDATA INTEGRITY CHECKS:`);
        
        // Check for orphaned bet selections
        const orphanedBets = db.prepare(`
            SELECT COUNT(*) as count FROM user_bet_selections b 
            LEFT JOIN simulations s ON b.simulation_id = s.id 
            WHERE s.id IS NULL AND b.simulation_id IS NOT NULL
        `).get();
        console.log(`  Orphaned bet selections: ${orphanedBets.count}`);
        
        // Check for teams without leagues
        const orphanedTeams = db.prepare(`
            SELECT COUNT(*) as count FROM teams t 
            LEFT JOIN leagues l ON t.league_id = l.id 
            WHERE l.id IS NULL AND t.league_id IS NOT NULL
        `).get();
        console.log(`  Teams without valid leagues: ${orphanedTeams.count}`);
        
        console.log(`\nDatabase inspection complete!`);
        console.log(`Summary: ${simCount.count} simulations, ${betCount.count} bet selections, ${teamCount.count} teams, ${leagueCount.count} leagues`);
        
        db.close();
        
    } catch (error) {
        console.error('Database error:', error.message);
    }
}

if (require.main === module) {
    inspectDatabase();
}

module.exports = { inspectDatabase };