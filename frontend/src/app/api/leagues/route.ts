import { NextRequest, NextResponse } from 'next/server';
import { getOptimizedDatabase } from '@/utils/optimized-database';

// GET /api/leagues - Fetch all leagues with intelligence data (OPTIMIZED)
export async function GET() {
  try {
    const db = getOptimizedDatabase();
    
    // Use prepared statement for 2-5x performance improvement
    const leagues = db.statements.getAllLeagues.all();
    
    return NextResponse.json({
      success: true,
      leagues: leagues || []
    });
  } catch (error) {
    console.error('❌ Error fetching leagues:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leagues' },
      { status: 500 }
    );
  }
}

// POST /api/leagues - Add new league (OPTIMIZED)
export async function POST(request: NextRequest) {
  try {
    const db = getOptimizedDatabase();
    
    const { 
      name, 
      country, 
      season,
      intelligence_enabled,
      avg_efficiency_rating
    } = await request.json();
    
    // Professional validation
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
    
    // Check if league already exists
    const existingLeague = db.db.prepare(
      'SELECT id FROM leagues WHERE LOWER(name) = LOWER(?)'
    ).get(trimmedName);
    
    if (existingLeague) {
      return NextResponse.json(
        { success: false, error: 'League already exists' },
        { status: 409 }
      );
    }
    
    // Insert new league with prepared statement
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
    
    const result = {
      ...insertedLeague,
      team_count: 0,
      market_intelligence_entries: 0
    };
    
    return NextResponse.json({
      success: true,
      league: result,
      message: 'League added successfully - Pattern discovery system ready'
    });
  } catch (error) {
    console.error('❌ Error adding league:', error);
    
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

// DELETE /api/leagues - Delete league (OPTIMIZED)
export async function DELETE(request: NextRequest) {
  try {
    const db = getOptimizedDatabase();
    
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('id');
    
    if (!leagueId) {
      return NextResponse.json(
        { success: false, error: 'League ID is required' },
        { status: 400 }
      );
    }
    
    // Use transaction for safe deletion
    const result = db.transaction(() => {
      // Check if league exists and has teams
      const league = db.db.prepare(`
        SELECT l.*, COUNT(t.id) as team_count
        FROM leagues l
        LEFT JOIN teams t ON l.id = t.league_id
        WHERE l.id = ?
        GROUP BY l.id
      `).get(leagueId);
      
      if (!league) {
        throw new Error('League not found');
      }
      
      if (league.team_count > 0) {
        throw new Error(`Cannot delete league with ${league.team_count} teams. Remove teams first.`);
      }
      
      // Delete league (cascade will handle market intelligence)
      const deleteResult = db.db.prepare('DELETE FROM leagues WHERE id = ?').run(leagueId);
      
      return deleteResult.changes > 0;
    })();
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete league' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'League deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting league:', error);
    
    if (error.message === 'League not found') {
      return NextResponse.json(
        { success: false, error: 'League not found' },
        { status: 404 }
      );
    }
    
    if (error.message.includes('Cannot delete league')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to delete league' },
      { status: 500 }
    );
  }
}