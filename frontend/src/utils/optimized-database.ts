import Database from 'better-sqlite3';
import path from 'path';

export class OptimizedSQLiteManager {
  private db: Database.Database;
  public statements: Record<string, Database.Statement>;

  constructor(dbPath?: string) {
    // PRIORITY ORDER: Ensure main database is always prioritized over frontend copies
    const possiblePaths = [
      dbPath,
      path.resolve(process.cwd(), '..', 'database', 'exodia.db'),        // MAIN PROJECT DB (PRIORITY 1)
      path.resolve(process.cwd(), 'database', 'exodia.db'),              // Alternative main DB location
      path.resolve(__dirname, '..', '..', '..', '..', 'database', 'exodia.db'), // Deep fallback to main
      path.resolve(process.cwd(), 'exodia.db'),                          // LOCAL FRONTEND DB (LAST RESORT)
    ].filter(Boolean);

    let defaultPath = null;
    const fs = require('fs');
    
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        defaultPath = testPath;
        console.log(`🔍 Database found at: ${testPath}`);
        
        // Log file size and modification time for debugging
        try {
          const stats = fs.statSync(testPath);
          console.log(`📊 Database size: ${(stats.size / 1024).toFixed(1)}KB, Modified: ${stats.mtime.toLocaleString()}`);
        } catch (statsError) {
          console.warn('⚠️ Could not read database stats:', statsError);
        }
        break;
      } else {
        console.log(`❌ Database not found at: ${testPath}`);
      }
    }

    if (!defaultPath) {
      // Fallback to main project database path (create if needed)
      defaultPath = path.resolve(process.cwd(), '..', 'database', 'exodia.db');
      console.log(`⚠️ No existing database found. Using fallback: ${defaultPath}`);
    }

    try {
      this.db = new Database(defaultPath);
      console.log(`✅ Database connected: ${defaultPath}`);
      
      this.applyOptimizations();
      this.prepareCriticalStatements();
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  private applyOptimizations() {
    // RESEARCH-VALIDATED: Best SQLite performance settings for 2025
    const optimizations = [
      'PRAGMA journal_mode = WAL',        // Write-Ahead Logging (2-5x improvement)
      'PRAGMA synchronous = NORMAL',      // Safe performance balance
      'PRAGMA cache_size = -131072',      // 128MB cache for simulations
      'PRAGMA temp_store = MEMORY',       // Temp objects in RAM
      'PRAGMA mmap_size = 536870912',     // 512MB memory mapping
      'PRAGMA busy_timeout = 5000',       // 5-second timeout
      'PRAGMA threads = 4',               // Multi-core utilization
      'PRAGMA foreign_keys = ON',         // Enforce foreign keys
      'PRAGMA secure_delete = OFF',       // Performance optimization
      'PRAGMA auto_vacuum = INCREMENTAL'  // Space management
    ];

    optimizations.forEach(pragma => {
      try {
        this.db.exec(pragma);
        console.log(`✅ Applied: ${pragma}`);
      } catch (error) {
        console.warn(`⚠️ Failed: ${pragma}`, error);
      }
    });

    // Run optimization routine
    try {
      this.db.exec('PRAGMA optimize');
      console.log('✅ Database optimization completed');
    } catch (error) {
      console.warn('⚠️ Optimization failed:', error);
    }
  }

  private prepareCriticalStatements() {
    this.statements = {
      // High-frequency simulation operations
      insertSimulation: this.db.prepare(`
        INSERT INTO simulations (
          home_team_id, away_team_id, league_id, match_date,
          distribution_type, iterations, home_boost, away_boost,
          home_advantage, true_odds, value_bets, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `),

      // League intelligence queries (optimized for frequent access)
      getLeagueIntelligence: this.db.prepare(`
        SELECT odds_avg, opportunity_frequency, market_efficiency,
               hit_rate, avg_edge_when_value, odds_count
        FROM league_market_intelligence
        WHERE league_id = ? AND market_type = ?
      `),

      // Team management (prepared for autocomplete)
      getTeamsByLeague: this.db.prepare(`
        SELECT t.id, t.name, t.auto_suggest_priority,
               l.name as league_name, l.country
        FROM teams t
        JOIN leagues l ON t.league_id = l.id
        WHERE t.league_id = ?
        ORDER BY t.auto_suggest_priority DESC, t.name ASC
        LIMIT 50
      `),

      // Get all teams (for team selector)
      getAllTeams: this.db.prepare(`
        SELECT t.id, t.name, t.auto_suggest_priority,
               l.name as league_name, l.country, t.league_id
        FROM teams t
        JOIN leagues l ON t.league_id = l.id
        ORDER BY t.auto_suggest_priority DESC, t.name ASC
        LIMIT 200
      `),

      // League operations
      getAllLeagues: this.db.prepare(`
        SELECT l.*, 
               COUNT(t.id) as team_count,
               COUNT(lmi.id) as market_intelligence_entries
        FROM leagues l
        LEFT JOIN teams t ON l.id = t.league_id
        LEFT JOIN league_market_intelligence lmi ON l.id = lmi.league_id
        GROUP BY l.id
        ORDER BY l.intelligence_enabled DESC, l.name ASC
      `),

      insertLeague: this.db.prepare(`
        INSERT INTO leagues (
          name, country, season, intelligence_enabled, 
          avg_efficiency_rating
        ) VALUES (?, ?, ?, ?, ?)
      `),

      // Team insertion
      insertTeam: this.db.prepare(`
        INSERT INTO teams (
          name, league_id, auto_suggest_priority
        ) VALUES (?, ?, ?)
      `),

      // Bookmaker odds storage (match actual schema)
      insertBookmakerOdds: this.db.prepare(`
        INSERT INTO bookmaker_odds (
          simulation_id, market_type, home_odds, draw_odds, away_odds,
          over_odds, under_odds, yes_odds, no_odds
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),

      // Intelligence tracking (match actual schema)
      updateLeagueIntelligence: this.db.prepare(`
        INSERT OR REPLACE INTO league_market_intelligence (
          league_id, market_type, odds_avg, opportunity_frequency, 
          hit_rate, market_efficiency
        ) VALUES (?, ?, ?, ?, ?, ?)
      `)
    };

    console.log('✅ Critical prepared statements ready');
  }

  // RESEARCH-BASED: Batch operations for 5x performance
  processBatchSimulations(simulations: any[]) {
    const transaction = this.db.transaction((sims: any[]) => {
      const results = [];
      for (const sim of sims) {
        const result = this.statements.insertSimulation.run(
          sim.home_team_id, sim.away_team_id, sim.league_id,
          sim.match_date, sim.distribution_type, sim.iterations,
          sim.home_boost, sim.away_boost, sim.home_advantage,
          JSON.stringify(sim.true_odds), JSON.stringify(sim.value_bets)
        );
        results.push(result.lastInsertRowid);
      }
      return results;
    });

    return transaction(simulations);
  }

  // Professional health check for monitoring
  getHealthStatus() {
    try {
      const startTime = Date.now();
      
      // Test basic query
      const testQuery = this.db.prepare('SELECT 1 as test').get();
      const queryTime = Date.now() - startTime;
      
      // WAL checkpoint status
      const walInfo = this.db.pragma('wal_checkpoint(PASSIVE)', { simple: true });
      
      // Cache and journal info
      const cacheSize = this.db.pragma('cache_size', { simple: true });
      const journalMode = this.db.pragma('journal_mode', { simple: true });
      const mmapSize = this.db.pragma('mmap_size', { simple: true });
      
      // Table count (basic schema validation)
      const tableCount = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM sqlite_master 
        WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
      `).get();

      return {
        status: 'healthy',
        database_responsive: testQuery?.test === 1,
        query_time_ms: queryTime,
        wal_pages: walInfo,
        cache_size_pages: cacheSize,
        cache_size_mb: Math.round((Math.abs(cacheSize) * 1024) / 1024),
        journal_mode: journalMode,
        mmap_size_mb: Math.round(mmapSize / (1024 * 1024)),
        table_count: tableCount?.count || 0,
        performance_grade: queryTime < 10 ? 'EXCELLENT' : 
                          queryTime < 50 ? 'GOOD' : 
                          queryTime < 200 ? 'FAIR' : 'POOR'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        performance_grade: 'CRITICAL'
      };
    }
  }

  // Enhanced error handling with detailed logging
  executeQuery(query: string, params: any[] = []) {
    try {
      const startTime = Date.now();
      const statement = this.db.prepare(query);
      
      // Determine if this is a SELECT query or a mutation (INSERT, UPDATE, DELETE)
      const trimmedQuery = query.trim().toUpperCase();
      const isSelect = trimmedQuery.startsWith('SELECT') || trimmedQuery.startsWith('WITH');
      
      let result;
      if (isSelect) {
        // Use .all() for SELECT queries
        result = params.length > 0 ? statement.all(...params) : statement.all();
      } else {
        // Use .run() for INSERT, UPDATE, DELETE queries
        const runResult = params.length > 0 ? statement.run(...params) : statement.run();
        result = {
          changes: runResult.changes,
          lastInsertRowid: runResult.lastInsertRowid
        };
      }
      
      const duration = Date.now() - startTime;
      
      if (duration > 1000) {
        console.warn(`🐌 Slow query (${duration}ms): ${query.substring(0, 100)}...`);
      }
      
      return { success: true, data: isSelect ? result : [result], duration };
    } catch (error) {
      console.error('❌ Query failed:', error, query);
      return { success: false, error: error.message, query };
    }
  }

  // Transaction wrapper for complex operations
  transaction<T>(fn: (db: Database.Database) => T): T {
    const transaction = this.db.transaction(fn);
    return transaction();
  }

  // Graceful shutdown with optimization
  close() {
    try {
      // Final optimization before close
      this.db.exec('PRAGMA optimize');
      
      // WAL checkpoint to ensure data persistence
      this.db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
      
      this.db.close();
      console.log('✅ Database connection closed gracefully');
    } catch (error) {
      console.error('❌ Error closing database:', error);
    }
  }
}

// Singleton pattern for database connection
let dbInstance: OptimizedSQLiteManager | null = null;

export function getOptimizedDatabase(dbPath?: string): OptimizedSQLiteManager {
  if (!dbInstance) {
    dbInstance = new OptimizedSQLiteManager(dbPath);
  }
  return dbInstance;
}

// Function to reset the singleton (useful during development)
export function resetDatabaseInstance(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

// Database synchronization utility (development/maintenance use)
export function syncDatabases(): void {
  const fs = require('fs');
  const mainDbPath = path.resolve(process.cwd(), '..', 'database', 'exodia.db');
  const frontendDbPath = path.resolve(process.cwd(), 'exodia.db');
  
  try {
    if (fs.existsSync(mainDbPath) && fs.existsSync(frontendDbPath)) {
      const mainStats = fs.statSync(mainDbPath);
      const frontendStats = fs.statSync(frontendDbPath);
      
      console.log(`🔄 Database sync check:`);
      console.log(`   Main DB: ${(mainStats.size / 1024).toFixed(1)}KB, ${mainStats.mtime.toLocaleString()}`);
      console.log(`   Frontend DB: ${(frontendStats.size / 1024).toFixed(1)}KB, ${frontendStats.mtime.toLocaleString()}`);
      
      // If main database is newer or larger, suggest sync
      if (mainStats.mtime > frontendStats.mtime || mainStats.size > frontendStats.size) {
        console.log(`⚠️ Main database appears more current. Consider running database sync.`);
        console.log(`   To sync: copy "${mainDbPath}" to "${frontendDbPath}"`);
      } else {
        console.log(`✅ Databases appear synchronized`);
      }
    }
  } catch (error) {
    console.warn('⚠️ Database sync check failed:', error);
  }
}

// Graceful shutdown handler
process.on('SIGINT', () => {
  if (dbInstance) {
    console.log('🔄 Gracefully shutting down database...');
    dbInstance.close();
    process.exit(0);
  }
});

process.on('SIGTERM', () => {
  if (dbInstance) {
    console.log('🔄 Gracefully shutting down database...');
    dbInstance.close();
    process.exit(0);
  }
});