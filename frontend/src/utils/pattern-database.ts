/**
 * PATTERN DATABASE SYSTEM - PHASE 2 FOUNDATION
 * SQLite database optimized for pattern storage and retrieval
 * 
 * Handles 10M+ pattern records with optimized indexes and queries
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { HistoricalPattern } from './pattern-encoder';

// Pattern outcome storage interfaces
export interface PatternOutcome {
  patternId: string;
  homeGoals: number;
  awayGoals: number;
  totalGoals: number;
  matchResult: 'home' | 'draw' | 'away';
  btts: boolean;
  marketOutcomes: {
    over05: boolean;
    over15: boolean;
    over25: boolean;
    over30: boolean;
    over35: boolean;
    over45: boolean;
  };
  exactScore: string;
  iteration: number;
  timestamp: Date;
}

export interface PatternStatistics {
  patternId: string;
  occurrenceCount: number;
  avgHomeGoals: number;
  avgAwayGoals: number;
  avgTotalGoals: number;
  homeWinRate: number;
  drawRate: number;
  awayWinRate: number;
  over25Rate: number;
  bttsRate: number;
  confidenceScore: number;
  lastUpdated: Date;
}

export interface PatternMatch {
  patternId: string;
  matchType: 'exact' | 'similar' | 'partial';
  similarity: number;
  sampleSize: number;
  statistics: PatternStatistics;
  confidence: number;
}

/**
 * Core Pattern Database Manager
 * Optimized for high-performance pattern storage and retrieval
 */
export class PatternDatabase {
  private db: Database.Database;
  private dbPath: string;
  
  // Prepared statements for performance
  private statements: {
    insertOutcome?: Database.Statement;
    findExactPattern?: Database.Statement;
    findSimilarPatterns?: Database.Statement;
    updateStatistics?: Database.Statement;
    getPatternStatistics?: Database.Statement;
  } = {};
  
  constructor(dbPath?: string) {
    // Use pattern-specific database file
    this.dbPath = dbPath || path.join(process.cwd(), 'database', 'patterns.db');
    
    // Ensure database directory exists
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.initializeDatabase();
  }
  
  /**
   * Initialize database with optimized schema and indexes
   */
  private initializeDatabase(): void {
    console.log('🗄️ Initializing Pattern Database');
    console.log(`Database path: ${this.dbPath}`);
    
    this.db = new Database(this.dbPath);
    
    // Enable WAL mode for better performance
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -131072'); // 128MB cache
    this.db.pragma('temp_store = MEMORY');
    this.db.pragma('mmap_size = 536870912'); // 512MB mmap
    
    this.createTables();
    this.createIndexes();
    this.prepareCriticalStatements();
    
    console.log('✅ Pattern database initialized successfully');
  }
  
  /**
   * Create optimized table schema
   */
  private createTables(): void {
    // Pattern outcomes table - stores all Monte Carlo iteration results
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pattern_outcomes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern_id TEXT NOT NULL,
        home_goals REAL NOT NULL,
        away_goals REAL NOT NULL,
        total_goals REAL NOT NULL,
        match_result TEXT NOT NULL CHECK (match_result IN ('home', 'draw', 'away')),
        btts INTEGER NOT NULL CHECK (btts IN (0, 1)),
        over05 INTEGER NOT NULL CHECK (over05 IN (0, 1)),
        over15 INTEGER NOT NULL CHECK (over15 IN (0, 1)),
        over25 INTEGER NOT NULL CHECK (over25 IN (0, 1)),
        over30 INTEGER NOT NULL CHECK (over30 IN (0, 1)),
        over35 INTEGER NOT NULL CHECK (over35 IN (0, 1)),
        over45 INTEGER NOT NULL CHECK (over45 IN (0, 1)),
        exact_score TEXT NOT NULL,
        iteration INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Pattern statistics table - pre-calculated aggregations for performance
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pattern_statistics (
        pattern_id TEXT PRIMARY KEY,
        occurrence_count INTEGER NOT NULL DEFAULT 0,
        avg_home_goals REAL NOT NULL DEFAULT 0,
        avg_away_goals REAL NOT NULL DEFAULT 0,
        avg_total_goals REAL NOT NULL DEFAULT 0,
        home_win_rate REAL NOT NULL DEFAULT 0,
        draw_rate REAL NOT NULL DEFAULT 0,
        away_win_rate REAL NOT NULL DEFAULT 0,
        over25_rate REAL NOT NULL DEFAULT 0,
        btts_rate REAL NOT NULL DEFAULT 0,
        confidence_score REAL NOT NULL DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Pattern registry table - stores pattern metadata
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pattern_registry (
        pattern_id TEXT PRIMARY KEY,
        h2h_fingerprint TEXT NOT NULL,
        home_fingerprint TEXT NOT NULL,
        away_fingerprint TEXT NOT NULL,
        pattern_complexity TEXT NOT NULL,
        pattern_confidence REAL NOT NULL,
        h2h_match_count INTEGER NOT NULL,
        home_match_count INTEGER NOT NULL,
        away_match_count INTEGER NOT NULL,
        avg_goals_per_game REAL NOT NULL,
        dominant_team TEXT NOT NULL,
        pattern_strength TEXT NOT NULL,
        registered_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  
  /**
   * Create optimized indexes for fast pattern matching
   */
  private createIndexes(): void {
    // Primary pattern lookup indexes
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_pattern_outcomes_pattern_id ON pattern_outcomes(pattern_id);');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_pattern_outcomes_total_goals ON pattern_outcomes(total_goals);');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_pattern_outcomes_match_result ON pattern_outcomes(match_result);');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_pattern_outcomes_created_at ON pattern_outcomes(created_at);');
    
    // Pattern registry indexes for similarity matching
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_pattern_registry_h2h ON pattern_registry(h2h_fingerprint);');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_pattern_registry_home ON pattern_registry(home_fingerprint);');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_pattern_registry_away ON pattern_registry(away_fingerprint);');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_pattern_registry_complexity ON pattern_registry(pattern_complexity);');
    
    // Statistics table indexes
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_pattern_stats_confidence ON pattern_statistics(confidence_score);');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_pattern_stats_occurrence ON pattern_statistics(occurrence_count);');
  }
  
  /**
   * Prepare critical statements for high-performance operations
   */
  private prepareCriticalStatements(): void {
    // Insert pattern outcome
    this.statements.insertOutcome = this.db.prepare(`
      INSERT INTO pattern_outcomes (
        pattern_id, home_goals, away_goals, total_goals, match_result, btts,
        over05, over15, over25, over30, over35, over45, exact_score, iteration
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Find exact pattern statistics
    this.statements.getPatternStatistics = this.db.prepare(`
      SELECT * FROM pattern_statistics WHERE pattern_id = ?
    `);
    
    // Update pattern statistics
    this.statements.updateStatistics = this.db.prepare(`
      INSERT OR REPLACE INTO pattern_statistics (
        pattern_id, occurrence_count, avg_home_goals, avg_away_goals, avg_total_goals,
        home_win_rate, draw_rate, away_win_rate, over25_rate, btts_rate, confidence_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Find exact pattern match
    this.statements.findExactPattern = this.db.prepare(`
      SELECT COUNT(*) as count FROM pattern_outcomes WHERE pattern_id = ?
    `);
  }
  
  /**
   * Store pattern outcome from Monte Carlo iteration
   */
  async storePatternOutcome(outcome: PatternOutcome): Promise<void> {
    try {
      this.statements.insertOutcome?.run(
        outcome.patternId,
        outcome.homeGoals,
        outcome.awayGoals,
        outcome.totalGoals,
        outcome.matchResult,
        outcome.btts ? 1 : 0,
        outcome.marketOutcomes.over05 ? 1 : 0,
        outcome.marketOutcomes.over15 ? 1 : 0,
        outcome.marketOutcomes.over25 ? 1 : 0,
        outcome.marketOutcomes.over30 ? 1 : 0,
        outcome.marketOutcomes.over35 ? 1 : 0,
        outcome.marketOutcomes.over45 ? 1 : 0,
        outcome.exactScore,
        outcome.iteration
      );
    } catch (error) {
      console.error('Failed to store pattern outcome:', error);
      throw error;
    }
  }
  
  /**
   * Register a pattern in the registry for similarity matching
   */
  async registerPattern(pattern: HistoricalPattern): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO pattern_registry (
          pattern_id, h2h_fingerprint, home_fingerprint, away_fingerprint,
          pattern_complexity, pattern_confidence, h2h_match_count, home_match_count,
          away_match_count, avg_goals_per_game, dominant_team, pattern_strength
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        pattern.uniquePatternId,
        pattern.h2hFingerprint,
        pattern.homeFingerprint,
        pattern.awayFingerprint,
        pattern.patternComplexity,
        pattern.confidence,
        pattern.contextMetadata.h2hMatchCount,
        pattern.contextMetadata.homeMatchCount,
        pattern.contextMetadata.awayMatchCount,
        pattern.contextMetadata.avgGoalsPerGame,
        pattern.contextMetadata.dominantTeam,
        pattern.contextMetadata.patternStrength
      );
    } catch (error) {
      console.error('Failed to register pattern:', error);
      throw error;
    }
  }
  
  /**
   * Find exact pattern match
   */
  async findExactPatternMatch(patternId: string): Promise<PatternMatch | null> {
    try {
      const countResult = this.statements.findExactPattern?.get(patternId) as { count: number } | undefined;
      
      if (!countResult || countResult.count < 10) {
        return null; // Minimum 10 occurrences for reliability
      }
      
      const statistics = await this.getPatternStatistics(patternId);
      
      if (!statistics) {
        return null;
      }
      
      return {
        patternId,
        matchType: 'exact',
        similarity: 1.0,
        sampleSize: statistics.occurrenceCount,
        statistics,
        confidence: statistics.confidenceScore
      };
    } catch (error) {
      console.error('Failed to find exact pattern match:', error);
      return null;
    }
  }
  
  /**
   * Get pattern statistics
   */
  async getPatternStatistics(patternId: string): Promise<PatternStatistics | null> {
    try {
      const result = this.statements.getPatternStatistics?.get(patternId);
      
      if (!result) {
        return null;
      }
      
      return {
        patternId: result.pattern_id,
        occurrenceCount: result.occurrence_count,
        avgHomeGoals: result.avg_home_goals,
        avgAwayGoals: result.avg_away_goals,
        avgTotalGoals: result.avg_total_goals,
        homeWinRate: result.home_win_rate,
        drawRate: result.draw_rate,
        awayWinRate: result.away_win_rate,
        over25Rate: result.over25_rate,
        bttsRate: result.btts_rate,
        confidenceScore: result.confidence_score,
        lastUpdated: new Date(result.last_updated)
      };
    } catch (error) {
      console.error('Failed to get pattern statistics:', error);
      return null;
    }
  }
  
  /**
   * Recalculate pattern statistics from raw outcomes
   */
  async recalculatePatternStatistics(patternId: string): Promise<void> {
    try {
      const outcomes = this.db.prepare(`
        SELECT * FROM pattern_outcomes WHERE pattern_id = ?
      `).all(patternId);
      
      if (outcomes.length === 0) {
        return;
      }
      
      // Calculate aggregated statistics
      const stats = {
        occurrenceCount: outcomes.length,
        avgHomeGoals: outcomes.reduce((sum: number, o: any) => sum + o.home_goals, 0) / outcomes.length,
        avgAwayGoals: outcomes.reduce((sum: number, o: any) => sum + o.away_goals, 0) / outcomes.length,
        avgTotalGoals: outcomes.reduce((sum: number, o: any) => sum + o.total_goals, 0) / outcomes.length,
        homeWinRate: outcomes.filter((o: any) => o.match_result === 'home').length / outcomes.length,
        drawRate: outcomes.filter((o: any) => o.match_result === 'draw').length / outcomes.length,
        awayWinRate: outcomes.filter((o: any) => o.match_result === 'away').length / outcomes.length,
        over25Rate: outcomes.filter((o: any) => o.over25 === 1).length / outcomes.length,
        bttsRate: outcomes.filter((o: any) => o.btts === 1).length / outcomes.length
      };
      
      // Calculate confidence based on sample size and consistency
      const confidenceScore = Math.min(0.95, 0.5 + (outcomes.length / 1000) * 0.45);
      
      // Store updated statistics
      this.statements.updateStatistics?.run(
        patternId,
        stats.occurrenceCount,
        stats.avgHomeGoals,
        stats.avgAwayGoals,
        stats.avgTotalGoals,
        stats.homeWinRate,
        stats.drawRate,
        stats.awayWinRate,
        stats.over25Rate,
        stats.bttsRate,
        confidenceScore
      );
    } catch (error) {
      console.error('Failed to recalculate pattern statistics:', error);
      throw error;
    }
  }
  
  /**
   * Get database performance metrics
   */
  getPerformanceMetrics(): any {
    try {
      const outcomeCount = this.db.prepare('SELECT COUNT(*) as count FROM pattern_outcomes').get();
      const patternCount = this.db.prepare('SELECT COUNT(*) as count FROM pattern_statistics').get();
      const registryCount = this.db.prepare('SELECT COUNT(*) as count FROM pattern_registry').get();
      
      return {
        patternOutcomes: outcomeCount?.count || 0,
        patternStatistics: patternCount?.count || 0,
        patternRegistry: registryCount?.count || 0,
        databaseSize: this.getDatabaseSize(),
        lastOptimization: new Date()
      };
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return null;
    }
  }
  
  /**
   * Get database file size
   */
  private getDatabaseSize(): string {
    try {
      const stats = fs.statSync(this.dbPath);
      const sizeInMB = stats.size / (1024 * 1024);
      return `${sizeInMB.toFixed(1)}MB`;
    } catch (error) {
      return 'Unknown';
    }
  }
  
  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      console.log('✅ Pattern database connection closed');
    }
  }
}

// Export singleton instance
export const patternDatabase = new PatternDatabase();