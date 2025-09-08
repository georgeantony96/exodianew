const Database = require('./frontend/node_modules/better-sqlite3');
const path = require('path');

console.log('🔍 CHECKING DATABASE SYNCHRONIZATION...\n');

// Check both database locations
const frontendDbPath = path.resolve('./frontend/exodia.db');
const mainDbPath = path.resolve('./database/exodia.db');

console.log('📍 Database paths:');
console.log(`   Frontend: ${frontendDbPath}`);
console.log(`   Main: ${mainDbPath}`);

try {
  const frontendDb = new Database(frontendDbPath);
  const mainDb = new Database(mainDbPath);

  // Check simulations in both databases
  const frontendSims = frontendDb.prepare('SELECT COUNT(*) as count FROM simulations').get();
  const mainSims = mainDb.prepare('SELECT COUNT(*) as count FROM simulations').get();
  
  console.log('\n📊 SIMULATION RECORDS:');
  console.log(`   Frontend DB: ${frontendSims.count} simulations`);
  console.log(`   Main DB: ${mainSims.count} simulations`);

  // Check rich_historical_patterns in both
  try {
    const frontendPatterns = frontendDb.prepare('SELECT COUNT(*) as count FROM rich_historical_patterns').get();
    console.log(`   Frontend DB: ${frontendPatterns.count} rich patterns`);
  } catch (error) {
    console.log(`   Frontend DB: rich_historical_patterns table missing`);
  }

  try {
    const mainPatterns = mainDb.prepare('SELECT COUNT(*) as count FROM rich_historical_patterns').get();
    console.log(`   Main DB: ${mainPatterns.count} rich patterns`);
  } catch (error) {
    console.log(`   Main DB: rich_historical_patterns table missing`);
  }

  // Check if simulation was actually stored (most recent)
  try {
    const recentFrontend = frontendDb.prepare(`
      SELECT id, created_at, results_data IS NOT NULL as has_results
      FROM simulations 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get();
    
    if (recentFrontend) {
      console.log('\n✅ MOST RECENT SIMULATION (Frontend DB):');
      console.log(`   ID: ${recentFrontend.id}`);
      console.log(`   Created: ${recentFrontend.created_at}`);
      console.log(`   Has Results: ${recentFrontend.has_results ? 'Yes' : 'No'}`);
    } else {
      console.log('\n❌ No simulations found in Frontend DB');
    }
  } catch (error) {
    console.log('\n❌ Error checking recent simulation:', error.message);
  }

  // Check which database the API is actually using
  console.log('\n🔍 API DATABASE USAGE:');
  console.log('   The multi-engine API uses: ./exodia.db (relative to frontend)');
  console.log('   The check script uses: ./database/exodia.db (relative to root)');
  console.log('   These are DIFFERENT databases!');

  frontendDb.close();
  mainDb.close();

} catch (error) {
  console.log('❌ Error:', error.message);
}

console.log('\n✅ Database sync check complete!');