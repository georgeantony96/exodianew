import { NextRequest, NextResponse } from 'next/server';
import { getOptimizedDatabase } from '@/utils/optimized-database';

// Database already initialized with V2 schema
// No need for table creation - schema is managed separately

// GET /api/teams - Fetch all teams with league context (OPTIMIZED)
export async function GET(request: NextRequest) {
  try {
    const db = getOptimizedDatabase();
    
    // Check for league_id filter parameter
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('league_id');
    
    // Use prepared statements for 2-5x performance improvement
    if (leagueId) {
      const teams = db.statements.getTeamsByLeague.all(parseInt(leagueId));
      return NextResponse.json({
        success: true,
        teams: teams || []
      });
    } else {
      const teams = db.statements.getAllTeams.all();
      return NextResponse.json({
        success: true,
        teams: teams || []
      });
    }
  } catch (error) {
    console.error('❌ Error fetching teams:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

// POST /api/teams - Add new team with league context (OPTIMIZED)
export async function POST(request: NextRequest) {
  try {
    const db = getOptimizedDatabase();
    
    const { name, league_id, auto_suggest_priority } = await request.json();
    
    // Professional validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Team name is required' },
        { status: 400 }
      );
    }
    
    if (!league_id) {
      return NextResponse.json(
        { success: false, error: 'League ID is required' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    
    // Verify league exists
    const league = db.db.prepare(
      'SELECT id, name FROM leagues WHERE id = ?'
    ).get(league_id);
    
    if (!league) {
      return NextResponse.json(
        { success: false, error: `League not found with ID ${league_id}` },
        { status: 404 }
      );
    }
    
    // Check if team already exists in this league
    const existingTeam = db.db.prepare(
      'SELECT id FROM teams WHERE LOWER(name) = LOWER(?) AND league_id = ?'
    ).get(trimmedName, league_id);
    
    if (existingTeam) {
      return NextResponse.json(
        { success: false, error: `Team already exists in ${league.name}` },
        { status: 409 }
      );
    }
    
    // Insert new team with prepared statement
    const insertResult = db.statements.insertTeam.run(
      trimmedName,
      league_id,
      auto_suggest_priority || 100
    );
    
    const result = {
      id: insertResult.lastInsertRowid,
      name: trimmedName,
      league_id: league_id,
      auto_suggest_priority: auto_suggest_priority || 100,
      league_name: league.name
    };
    
    return NextResponse.json({
      success: true,
      team: result,
      message: `Team "${trimmedName}" added successfully`
    });
  } catch (error) {
    console.error('❌ Error adding team:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to add team' },
      { status: 500 }
    );
  }
}