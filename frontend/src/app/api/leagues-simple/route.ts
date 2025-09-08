import { NextRequest, NextResponse } from 'next/server';
import { getOptimizedDatabase, resetDatabaseInstance } from '@/utils/optimized-database';

export async function POST(request: NextRequest) {
  try {
    // Use the exact same approach that works in debug
    resetDatabaseInstance();
    const db = getOptimizedDatabase();
    
    const { name, country, season, intelligence_enabled, avg_efficiency_rating } = await request.json();
    
    // Basic validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'League name is required' },
        { status: 400 }
      );
    }
    
    if (!country || typeof country !== 'string' || country.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Country is required' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedCountry = country.trim();
    
    // Check if league already exists (simple approach)
    const existingLeague = db.db.prepare(
      'SELECT id FROM leagues WHERE LOWER(name) = LOWER(?)'
    ).get(trimmedName);
    
    if (existingLeague) {
      return NextResponse.json(
        { success: false, error: 'League already exists' },
        { status: 409 }
      );
    }
    
    // Insert new league (exactly like debug version)
    const insertResult = db.statements.insertLeague.run(
      trimmedName,
      trimmedCountry,
      season || '2025',
      intelligence_enabled !== undefined ? (intelligence_enabled ? 1 : 0) : 1,
      avg_efficiency_rating || 0.85
    );
    
    // Get the inserted league
    const insertedLeague = db.db.prepare(`
      SELECT * FROM leagues WHERE id = ?
    `).get(insertResult.lastInsertRowid);
    
    return NextResponse.json({
      success: true,
      league: {
        ...insertedLeague,
        team_count: 0,
        market_intelligence_entries: 0
      },
      message: 'League added successfully - Pattern discovery system ready'
    });
    
  } catch (error) {
    console.error('❌ Error adding league (simple):', error);
    
    if (error.message === 'League already exists') {
      return NextResponse.json(
        { success: false, error: 'League already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to add league' },
      { status: 500 }
    );
  }
}