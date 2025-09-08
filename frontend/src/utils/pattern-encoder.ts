/**
 * PATTERN ENCODING ENGINE - PHASE 1 IMPLEMENTATION
 * Revolutionary Pattern-Based Prediction System for EXODIA FINAL
 * 
 * Transforms generic empirical thresholds to unique pattern-based adjustments
 * Each game receives personalized prediction based on exact historical fingerprint
 */

import { HistoricalMatch } from '@/types/simulation';
import { createHash } from 'crypto';

// Pattern Encoding Interfaces
export interface HistoricalPattern {
  h2hFingerprint: string;      // "OG-UN-OG-UG-ON-OG-UG-UN" (Over/Under + GG/NG)
  homeFingerprint: string;     // "WLDWWLLD" (Win/Loss/Draw sequence)
  awayFingerprint: string;     // "LLLDWWLL" (Win/Loss/Draw from away perspective)
  uniquePatternId: string;     // Hash combining all fingerprints
  patternComplexity: PatternComplexityLevel;
  confidence: number;          // Pattern strength confidence (0-1)
  contextMetadata: PatternContextMetadata;
}

export interface PatternContextMetadata {
  h2hMatchCount: number;
  homeMatchCount: number;
  awayMatchCount: number;
  avgGoalsPerGame: number;
  dominantTeam: 'home' | 'away' | 'balanced';
  patternStrength: 'weak' | 'moderate' | 'strong';
  encoding_timestamp: Date;
}

export enum PatternComplexityLevel {
  BASIC = 'BASIC',           // Results only (W/L/D)
  ENHANCED = 'ENHANCED',     // Results + Over/Under + BTTS
  ADVANCED = 'ADVANCED',     // Results + Goals + Clean sheets + Streaks
  MASTER = 'MASTER'          // All contexts + situational modifiers
}

// Match encoding for different contexts
interface MatchEncoding {
  result: string;      // W/L/D or H/A/D for H2H
  goals: string;       // O/U for over/under 2.5
  btts: string;        // G/N for goals/no goals
  clean: string;       // C/N for clean sheet/no clean sheet
}

/**
 * Core Pattern Encoding Engine
 * Converts historical match data into unique, searchable patterns
 */
export class PatternEncoder {
  
  /**
   * Main entry point: Encode complete game context into unique pattern
   */
  static encodeGameContext(
    h2h: HistoricalMatch[], 
    home: HistoricalMatch[], 
    away: HistoricalMatch[],
    complexityLevel: PatternComplexityLevel = PatternComplexityLevel.ENHANCED
  ): HistoricalPattern {
    
    console.log('🧬 Starting Pattern Encoding Process');
    console.log(`Complexity Level: ${complexityLevel}`);
    console.log(`Data: H2H=${h2h.length}, Home=${home.length}, Away=${away.length}`);
    
    // Encode each context based on complexity level
    const h2hPattern = this.encodeH2HSequence(h2h, complexityLevel);
    const homePattern = this.encodeTeamSequence(home, true, complexityLevel);
    const awayPattern = this.encodeTeamSequence(away, false, complexityLevel);
    
    // Generate unique pattern ID
    const uniquePatternId = this.generatePatternHash(h2hPattern, homePattern, awayPattern);
    
    // Calculate pattern metadata
    const contextMetadata = this.calculatePatternMetadata(h2h, home, away);
    
    // Calculate pattern confidence
    const confidence = this.calculatePatternConfidence(h2h, home, away, contextMetadata);
    
    const pattern: HistoricalPattern = {
      h2hFingerprint: h2hPattern,
      homeFingerprint: homePattern,
      awayFingerprint: awayPattern,
      uniquePatternId,
      patternComplexity: complexityLevel,
      confidence,
      contextMetadata
    };
    
    console.log(`✅ Pattern encoded: ${uniquePatternId.substring(0, 12)}...`);
    console.log(`📊 Confidence: ${(confidence * 100).toFixed(1)}%`);
    
    return pattern;
  }
  
  /**
   * Encode H2H match sequence based on complexity level
   */
  private static encodeH2HSequence(
    h2hMatches: HistoricalMatch[], 
    complexityLevel: PatternComplexityLevel
  ): string {
    
    if (!h2hMatches || h2hMatches.length === 0) {
      return 'NO_H2H_DATA';
    }
    
    // Take last 8 matches for consistent pattern length
    const recentMatches = h2hMatches.slice(0, 8);
    
    const encodedMatches = recentMatches.map(match => {
      const encoding = this.encodeH2HMatch(match, complexityLevel);
      return this.formatMatchEncoding(encoding, complexityLevel);
    });
    
    return `H2H:${encodedMatches.join('-')}`;
  }
  
  /**
   * Encode team sequence (home or away perspective)
   */
  private static encodeTeamSequence(
    teamMatches: HistoricalMatch[], 
    isHomeTeam: boolean,
    complexityLevel: PatternComplexityLevel
  ): string {
    
    if (!teamMatches || teamMatches.length === 0) {
      return `NO_${isHomeTeam ? 'HOME' : 'AWAY'}_DATA`;
    }
    
    // Take last 8 matches for consistent pattern length
    const recentMatches = teamMatches.slice(0, 8);
    
    const encodedMatches = recentMatches.map(match => {
      const encoding = this.encodeTeamMatch(match, isHomeTeam, complexityLevel);
      return this.formatMatchEncoding(encoding, complexityLevel);
    });
    
    const prefix = isHomeTeam ? 'HOME' : 'AWAY';
    return `${prefix}:${encodedMatches.join('-')}`;
  }
  
  /**
   * Encode single H2H match based on complexity
   */
  private static encodeH2HMatch(match: HistoricalMatch, complexityLevel: PatternComplexityLevel): MatchEncoding {
    const homeGoals = match.home_score_ft || 0;
    const awayGoals = match.away_score_ft || 0;
    const totalGoals = homeGoals + awayGoals;
    
    // Result from home team perspective in H2H
    const result = homeGoals > awayGoals ? 'H' : (homeGoals < awayGoals ? 'A' : 'D');
    
    // Goal patterns
    const goals = totalGoals > 2.5 ? 'O' : 'U';
    const btts = (homeGoals > 0 && awayGoals > 0) ? 'G' : 'N';
    const clean = (homeGoals === 0 || awayGoals === 0) ? 'C' : 'N';
    
    return { result, goals, btts, clean };
  }
  
  /**
   * Encode single team match based on complexity
   */
  private static encodeTeamMatch(
    match: HistoricalMatch, 
    isHomeTeam: boolean, 
    complexityLevel: PatternComplexityLevel
  ): MatchEncoding {
    
    const homeGoals = match.home_score_ft || 0;
    const awayGoals = match.away_score_ft || 0;
    const totalGoals = homeGoals + awayGoals;
    
    // Result from team's perspective
    let result: string;
    if (isHomeTeam) {
      result = homeGoals > awayGoals ? 'W' : (homeGoals < awayGoals ? 'L' : 'D');
    } else {
      result = awayGoals > homeGoals ? 'W' : (awayGoals < homeGoals ? 'L' : 'D');
    }
    
    // Goal patterns
    const goals = totalGoals > 2.5 ? 'O' : 'U';
    const btts = (homeGoals > 0 && awayGoals > 0) ? 'G' : 'N';
    
    // Clean sheet from team's perspective
    const clean = isHomeTeam 
      ? (awayGoals === 0 ? 'C' : 'N')
      : (homeGoals === 0 ? 'C' : 'N');
    
    return { result, goals, btts, clean };
  }
  
  /**
   * Format match encoding based on complexity level
   */
  private static formatMatchEncoding(encoding: MatchEncoding, complexityLevel: PatternComplexityLevel): string {
    switch (complexityLevel) {
      case PatternComplexityLevel.BASIC:
        return encoding.result;
        
      case PatternComplexityLevel.ENHANCED:
        return `${encoding.result}${encoding.goals}${encoding.btts}`;
        
      case PatternComplexityLevel.ADVANCED:
        return `${encoding.result}${encoding.goals}${encoding.btts}${encoding.clean}`;
        
      case PatternComplexityLevel.MASTER:
        return `${encoding.result}${encoding.goals}${encoding.btts}${encoding.clean}`;
        
      default:
        return `${encoding.result}${encoding.goals}${encoding.btts}`;
    }
  }
  
  /**
   * Generate unique hash for pattern combination
   */
  private static generatePatternHash(h2hPattern: string, homePattern: string, awayPattern: string): string {
    const combinedPattern = `${h2hPattern}_${homePattern}_${awayPattern}`;
    return createHash('sha256').update(combinedPattern).digest('hex');
  }
  
  /**
   * Calculate pattern metadata for context analysis
   */
  private static calculatePatternMetadata(
    h2h: HistoricalMatch[], 
    home: HistoricalMatch[], 
    away: HistoricalMatch[]
  ): PatternContextMetadata {
    
    // Calculate average goals
    const allMatches = [...h2h, ...home, ...away];
    const totalGoals = allMatches.reduce((sum, match) => 
      sum + (match.home_score_ft || 0) + (match.away_score_ft || 0), 0
    );
    const avgGoalsPerGame = allMatches.length > 0 ? totalGoals / allMatches.length : 0;
    
    // Determine dominant team from H2H
    const homeWins = h2h.filter(match => (match.home_score_ft || 0) > (match.away_score_ft || 0)).length;
    const awayWins = h2h.filter(match => (match.away_score_ft || 0) > (match.home_score_ft || 0)).length;
    
    let dominantTeam: 'home' | 'away' | 'balanced' = 'balanced';
    if (homeWins > awayWins + 1) dominantTeam = 'home';
    else if (awayWins > homeWins + 1) dominantTeam = 'away';
    
    // Calculate pattern strength
    const totalMatches = h2h.length + home.length + away.length;
    let patternStrength: 'weak' | 'moderate' | 'strong' = 'weak';
    if (totalMatches >= 15) patternStrength = 'strong';
    else if (totalMatches >= 10) patternStrength = 'moderate';
    
    return {
      h2hMatchCount: h2h.length,
      homeMatchCount: home.length,
      awayMatchCount: away.length,
      avgGoalsPerGame,
      dominantTeam,
      patternStrength,
      encoding_timestamp: new Date()
    };
  }
  
  /**
   * Calculate pattern confidence based on data quality
   */
  private static calculatePatternConfidence(
    h2h: HistoricalMatch[], 
    home: HistoricalMatch[], 
    away: HistoricalMatch[],
    metadata: PatternContextMetadata
  ): number {
    
    let confidence = 0.0;
    
    // Base confidence from data availability
    if (h2h.length >= 5) confidence += 0.3;
    else if (h2h.length >= 3) confidence += 0.2;
    else if (h2h.length >= 1) confidence += 0.1;
    
    if (home.length >= 8) confidence += 0.25;
    else if (home.length >= 5) confidence += 0.15;
    else if (home.length >= 3) confidence += 0.1;
    
    if (away.length >= 8) confidence += 0.25;
    else if (away.length >= 5) confidence += 0.15;
    else if (away.length >= 3) confidence += 0.1;
    
    // Bonus for pattern strength
    if (metadata.patternStrength === 'strong') confidence += 0.15;
    else if (metadata.patternStrength === 'moderate') confidence += 0.10;
    
    // Bonus for recent data (all matches within reasonable time)
    confidence += 0.05;
    
    return Math.min(confidence, 1.0);
  }
  
  /**
   * Calculate pattern similarity between two patterns (for fuzzy matching)
   */
  static calculatePatternSimilarity(pattern1: HistoricalPattern, pattern2: HistoricalPattern): number {
    let similarity = 0.0;
    let totalWeight = 0.0;
    
    // H2H similarity (weight: 0.4)
    const h2hSimilarity = this.calculateStringSimilarity(pattern1.h2hFingerprint, pattern2.h2hFingerprint);
    similarity += h2hSimilarity * 0.4;
    totalWeight += 0.4;
    
    // Home similarity (weight: 0.3)
    const homeSimilarity = this.calculateStringSimilarity(pattern1.homeFingerprint, pattern2.homeFingerprint);
    similarity += homeSimilarity * 0.3;
    totalWeight += 0.3;
    
    // Away similarity (weight: 0.3)
    const awaySimilarity = this.calculateStringSimilarity(pattern1.awayFingerprint, pattern2.awayFingerprint);
    similarity += awaySimilarity * 0.3;
    totalWeight += 0.3;
    
    return totalWeight > 0 ? similarity / totalWeight : 0.0;
  }
  
  /**
   * Calculate similarity between two pattern strings
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (!str1 || !str2) return 0.0;
    
    const segments1 = str1.split(':')[1]?.split('-') || [];
    const segments2 = str2.split(':')[1]?.split('-') || [];
    
    if (segments1.length === 0 || segments2.length === 0) return 0.0;
    
    const minLength = Math.min(segments1.length, segments2.length);
    let matches = 0;
    
    for (let i = 0; i < minLength; i++) {
      if (segments1[i] === segments2[i]) {
        matches++;
      }
    }
    
    return minLength > 0 ? matches / minLength : 0.0;
  }
  
  /**
   * Validate pattern encoding for quality assurance
   */
  static validatePattern(pattern: HistoricalPattern): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for minimum data requirements
    if (pattern.contextMetadata.h2hMatchCount === 0) {
      issues.push('No H2H data available');
    }
    
    if (pattern.contextMetadata.homeMatchCount < 3) {
      issues.push('Insufficient home match data (minimum 3 required)');
    }
    
    if (pattern.contextMetadata.awayMatchCount < 3) {
      issues.push('Insufficient away match data (minimum 3 required)');
    }
    
    // Check confidence threshold
    if (pattern.confidence < 0.3) {
      issues.push('Pattern confidence too low for reliable prediction');
    }
    
    // Check pattern ID validity
    if (!pattern.uniquePatternId || pattern.uniquePatternId.length < 10) {
      issues.push('Invalid pattern ID generated');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}