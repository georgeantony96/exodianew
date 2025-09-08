import { NextRequest, NextResponse } from 'next/server';
import { getOptimizedDatabase } from '@/utils/optimized-database';

// GET /api/historical-data - Fetch historical matches for analysis
export async function GET(request: NextRequest) {
  try {
    const db = getOptimizedDatabase();
    const { searchParams } = new URL(request.url);
    
    const homeTeamId = searchParams.get('home_team_id');
    const awayTeamId = searchParams.get('away_team_id');
    const matchType = searchParams.get('match_type') || 'all';

    if (!homeTeamId || !awayTeamId) {
      return NextResponse.json(
        { success: false, error: 'Both home_team_id and away_team_id are required' },
        { status: 400 }
      );
    }

    let matches = [];
    
    if (matchType === 'h2h' || matchType === 'all') {
      // Head to head matches
      const h2hMatches = db.db.prepare(`
        SELECT * FROM historical_matches 
        WHERE (home_team_id = ? AND away_team_id = ?) 
           OR (home_team_id = ? AND away_team_id = ?)
        ORDER BY match_date DESC
        LIMIT 10
      `).all(homeTeamId, awayTeamId, awayTeamId, homeTeamId);
      
      matches.push(...h2hMatches.map(match => ({ ...match, match_type: 'h2h' })));
    }

    return NextResponse.json({
      success: true,
      matches: matches,
      summary: {
        total_matches: matches.length,
        match_types: {
          h2h: matches.filter(m => m.match_type === 'h2h').length
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching historical data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}

// POST /api/historical-data - Add historical match
export async function POST(request: NextRequest) {
  try {
    const db = getOptimizedDatabase();
    const {
      home_team_id,
      away_team_id,
      home_score_ht,
      away_score_ht,
      home_score_ft,
      away_score_ft,
      match_date,
      match_type
    } = await request.json();

    // Validation
    if (!home_team_id || !away_team_id || home_score_ft === undefined || away_score_ft === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required match data' },
        { status: 400 }
      );
    }

    // Insert historical match
    const insertResult = db.db.prepare(`
      INSERT INTO historical_matches (
        home_team_id, away_team_id, home_score_ht, away_score_ht,
        home_score_ft, away_score_ft, match_type, match_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      home_team_id, away_team_id, 
      home_score_ht || 0, away_score_ht || 0,
      home_score_ft, away_score_ft,
      match_type || 'h2h', 
      match_date || new Date().toISOString().split('T')[0]
    );

    return NextResponse.json({
      success: true,
      match_id: insertResult.lastInsertRowid,
      message: 'Historical match added successfully'
    });

  } catch (error) {
    console.error('❌ Error adding historical match:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add historical match' },
      { status: 500 }
    );
  }
}

// DELETE /api/historical-data - Remove historical match
export async function DELETE(request: NextRequest) {
  try {
    const db = getOptimizedDatabase();
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('id');

    if (!matchId) {
      return NextResponse.json(
        { success: false, error: 'Match ID is required' },
        { status: 400 }
      );
    }

    const deleteResult = db.db.prepare('DELETE FROM historical_matches WHERE id = ?').run(matchId);

    if (deleteResult.changes === 0) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Historical match deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting historical match:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete historical match' },
      { status: 500 }
    );
  }
}