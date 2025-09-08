const { getOptimizedDatabase } = require('./src/utils/optimized-database.ts');

console.log('🧪 Testing API database calls...\n');

try {
  console.log('1. Getting database instance...');
  const db = getOptimizedDatabase();
  console.log('✅ Database connected');

  console.log('\n2. Testing getAllLeagues statement...');
  const leagues = db.statements.getAllLeagues.all();
  console.log('✅ getAllLeagues executed successfully');
  console.log(`📊 Found ${leagues.length} leagues:`);
  leagues.forEach(league => {
    console.log(`  - ${league.name} (${league.country}) - Teams: ${league.team_count}, Intelligence: ${league.market_intelligence_entries}`);
  });

} catch (error) {
  console.error('❌ Error:', error);
  console.error('Stack:', error.stack);
}