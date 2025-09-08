import { NextResponse } from 'next/server';
import { getOptimizedDatabase, resetDatabaseInstance } from '@/utils/optimized-database';

export async function GET() {
  try {
    // Reset the singleton to get fresh instance
    resetDatabaseInstance();
    
    const db = getOptimizedDatabase();
    
    console.log('🧪 Testing database operations...');
    
    // Test 1: Basic database connection
    console.log('1. Testing basic query...');
    const testQuery = db.db.prepare('SELECT 1 as test').get();
    console.log('✅ Basic query works:', testQuery);
    
    // Test 2: Check leagues table
    console.log('2. Testing leagues count...');
    const leaguesCount = db.db.prepare('SELECT COUNT(*) as count FROM leagues').get();
    console.log('✅ Leagues count:', leaguesCount);
    
    // Test 3: Test prepared statement
    console.log('3. Testing getAllLeagues prepared statement...');
    const leagues = db.statements.getAllLeagues.all();
    console.log('✅ getAllLeagues result:', leagues.length, 'leagues');
    
    // Test 4: Test insertLeague statement structure
    console.log('4. Testing insertLeague statement...');
    try {
      const insertResult = db.statements.insertLeague.run(
        'Debug League Test',
        'Debug Country',
        '2025-26',
        1,
        0.85
      );
      console.log('✅ insertLeague works:', insertResult.lastInsertRowid);
      
      // Clean up test data
      db.db.prepare('DELETE FROM leagues WHERE name = ?').run('Debug League Test');
      
    } catch (insertError) {
      console.error('❌ insertLeague failed:', insertError);
    }
    
    return NextResponse.json({
      success: true,
      results: {
        basicQuery: testQuery,
        leaguesCount: leaguesCount,
        leaguesFound: leagues.length
      }
    });
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}