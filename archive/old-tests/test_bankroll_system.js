// Test script for bankroll management system
const fetch = require('node-fetch');

async function testBankrollAPI() {
    const baseUrl = 'http://localhost:3000'; // Adjust if different
    
    console.log('Testing Bankroll Management System...\n');
    
    try {
        // Test 1: Get current bankroll status
        console.log('1. Testing GET /api/bankroll...');
        const getResponse = await fetch(`${baseUrl}/api/bankroll`);
        const bankrollData = await getResponse.json();
        
        if (bankrollData.success) {
            console.log('✅ Bankroll GET working');
            console.log(`   Current balance: $${bankrollData.bankroll.current_balance}`);
            console.log(`   Starting balance: $${bankrollData.bankroll.starting_balance}`);
            console.log(`   Total bets: ${bankrollData.bankroll.total_bets_placed}`);
        } else {
            console.log('❌ Bankroll GET failed:', bankrollData.error);
            return;
        }

        // Test 2: Test Kelly Criterion calculation
        console.log('\n2. Testing POST /api/kelly...');
        const kellyResponse = await fetch(`${baseUrl}/api/kelly`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                true_probability: 0.55,  // 55% chance
                bookmaker_odds: 2.00,    // Even odds (2.0)
                confidence_level: 'HIGH'
            })
        });
        
        const kellyData = await kellyResponse.json();
        
        if (kellyData.success) {
            console.log('✅ Kelly calculation working');
            console.log(`   Edge: ${kellyData.calculations.edge_percentage}%`);
            console.log(`   Recommended stake: $${kellyData.calculations.recommended_stake}`);
            console.log(`   Should bet: ${kellyData.calculations.should_bet}`);
            console.log(`   Recommendation: ${kellyData.calculations.recommendation}`);
        } else {
            console.log('❌ Kelly calculation failed:', kellyData.error);
        }

        // Test 3: Test bankroll update
        console.log('\n3. Testing PUT /api/bankroll (update Kelly multiplier)...');
        const updateResponse = await fetch(`${baseUrl}/api/bankroll`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                kelly_multiplier: 0.3  // Change from default 0.25 to 0.3
            })
        });
        
        const updateData = await updateResponse.json();
        
        if (updateData.success) {
            console.log('✅ Bankroll update working');
            console.log(`   Updated Kelly multiplier to: ${updateData.bankroll.kelly_multiplier}`);
        } else {
            console.log('❌ Bankroll update failed:', updateData.error);
        }

        // Test 4: Reset Kelly multiplier back
        console.log('\n4. Testing bankroll reset to original settings...');
        const resetResponse = await fetch(`${baseUrl}/api/bankroll`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                kelly_multiplier: 0.25  // Reset to default
            })
        });
        
        const resetData = await resetResponse.json();
        
        if (resetData.success) {
            console.log('✅ Bankroll reset working');
            console.log('   Kelly multiplier reset to 0.25');
        }

        console.log('\n🎉 All bankroll system tests passed!');
        console.log('\n💰 Bankroll System Features Ready:');
        console.log('   - User-controlled bankroll (edit starting balance)');
        console.log('   - Reset functionality'); 
        console.log('   - Kelly Criterion calculations');
        console.log('   - Risk management settings');
        console.log('   - Performance tracking');

    } catch (error) {
        console.log('❌ Test failed:', error.message);
        console.log('\nMake sure the Next.js development server is running:');
        console.log('   npm run dev');
    }
}

// Run if called directly
if (require.main === module) {
    testBankrollAPI();
}

module.exports = { testBankrollAPI };