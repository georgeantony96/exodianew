import { NextRequest, NextResponse } from 'next/server';
import { getOptimizedDatabase, resetDatabaseInstance } from '@/utils/optimized-database';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Debug: Testing league addition...');
    
    // Reset singleton to ensure fresh instance
    resetDatabaseInstance();
    const db = getOptimizedDatabase();
    
    const body = await request.json();
    console.log('📥 Received data:', body);
    
    const { name, country, season, intelligence_enabled } = body;
    
    // Validation
    if (!name || !country) {
      return NextResponse.json({
        success: false,
        error: 'Name and country required'
      }, { status: 400 });
    }
    
    const trimmedName = name.trim();
    const trimmedCountry = country.trim();
    
    console.log('🔍 Checking if league exists...');
    // Check if league already exists
    const existingLeague = db.db.prepare(
      'SELECT id FROM leagues WHERE LOWER(name) = LOWER(?)'
    ).get(trimmedName);
    
    if (existingLeague) {
      console.log('⚠️ League already exists:', existingLeague);
      return NextResponse.json({
        success: false,
        error: 'League already exists'
      }, { status: 409 });
    }
    
    console.log('✅ League does not exist, proceeding with insert...');
    
    // Test insert parameters (fix boolean to integer conversion)
    const params = [
      trimmedName,
      trimmedCountry,
      season || '2025',
      intelligence_enabled !== undefined ? (intelligence_enabled ? 1 : 0) : 1,
      0.85
    ];
    console.log('📊 Insert parameters:', params);
    
    // Insert new league
    const insertResult = db.statements.insertLeague.run(...params);
    console.log('✅ Insert successful:', insertResult);
    
    // Get the inserted league
    const insertedLeague = db.db.prepare(`
      SELECT * FROM leagues WHERE id = ?
    `).get(insertResult.lastInsertRowid);
    console.log('✅ Inserted league retrieved:', insertedLeague);
    
    return NextResponse.json({
      success: true,
      league: {
        ...insertedLeague,
        team_count: 0,
        market_intelligence_entries: 0
      },
      debug: {
        params: params,
        insertResult: insertResult
      }
    });
    
  } catch (error) {
    console.error('❌ Debug add league failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}