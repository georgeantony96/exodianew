import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    const dbPath = path.resolve(process.cwd(), '..', 'database', 'exodia.db');
    
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: 'Database file not found' }, { status: 404 });
    }

    const db = new Database(dbPath);
    
    // Get all table schemas
    const tables = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();
    
    const schemas: Record<string, any> = {};
    
    for (const table of tables) {
      const tableInfo = db.prepare(`PRAGMA table_info(${table.name})`).all();
      schemas[table.name] = tableInfo;
    }
    
    db.close();
    
    return NextResponse.json({
      tables: tables.map(t => t.name),
      schemas
    });
    
  } catch (error) {
    console.error('❌ Schema check failed:', error);
    return NextResponse.json({ 
      error: 'Schema check failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}