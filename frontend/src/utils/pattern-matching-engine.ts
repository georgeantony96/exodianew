/**
 * PATTERN MATCHING ENGINE - PHASE 3 IMPLEMENTATION
 * Intelligent pattern matching and unique adjustment calculation system
 * 
 * Finds exact and similar patterns in database for personalized predictions
 */

import { PatternDatabase, PatternMatch, PatternStatistics, patternDatabase } from './pattern-database';
import { PatternEncoder, HistoricalPattern } from './pattern-encoder';

// Pattern-based adjustment interfaces
export interface UniqueAdjustment {
  goalAdjustment: number;           // Lambda adjustment based on pattern outcomes
  homeWinAdjustment: number;        // Home win probability adjustment
  awayWinAdjustment: number;        // Away win probability adjustment
  confidence: number;               // Overall adjustment confidence (0-1)
  sampleSize: number;               // Number of pattern matches found
  patternDetails: PatternMatchDetail[];
  adjustmentReason: string;         // Human-readable explanation
  fallbackUsed: boolean;            // Whether fallback logic was applied
}

export interface PatternMatchDetail {
  patternId: string;
  matchType: 'exact' | 'similar' | 'partial';
  similarity: number;
  sampleSize: number;
  contribution: number;             // Weight in final adjustment calculation
}

export interface PatternMatchingConfig {
  exactMatchMinSamples: number;     // Minimum samples for exact match reliability
  similarityThreshold: number;      // Minimum similarity for fuzzy matching
  maxSimilarMatches: number;        // Maximum similar patterns to consider
  confidenceThreshold: number;      // Minimum confidence for pattern usage
  fallbackToGeneric: boolean;       // Whether to use generic adjustments as fallback
}

// Default configuration
const DEFAULT_MATCHING_CONFIG: PatternMatchingConfig = {
  exactMatchMinSamples: 20,
  similarityThreshold: 0.7,
  maxSimilarMatches: 5,
  confidenceThreshold: 0.6,
  fallbackToGeneric: true
};

/**
 * Core Pattern Matching Engine
 * Finds relevant historical patterns and calculates unique adjustments
 */
export class PatternMatchingEngine {
  private patternDB: PatternDatabase;
  private config: PatternMatchingConfig;
  
  constructor(patternDatabase?: PatternDatabase, config?: Partial<PatternMatchingConfig>) {
    this.patternDB = patternDatabase || patternDatabase;
    this.config = { ...DEFAULT_MATCHING_CONFIG, ...config };
  }
  
  /**
   * Main entry point: Find pattern matches and calculate unique adjustment
   */
  async findPatternBasedAdjustment(gamePattern: HistoricalPattern): Promise<UniqueAdjustment> {
    console.log('🔍 Starting Pattern Matching Process');
    console.log(`Pattern ID: ${gamePattern.uniquePatternId.substring(0, 12)}...`);
    console.log(`Pattern Confidence: ${(gamePattern.confidence * 100).toFixed(1)}%`);
    
    try {
      // STEP 1: Try exact pattern match first
      const exactMatch = await this.findExactPatternMatch(gamePattern.uniquePatternId);
      
      if (exactMatch && exactMatch.sampleSize >= this.config.exactMatchMinSamples) {
        console.log(`✅ Found exact pattern match with ${exactMatch.sampleSize} samples`);
        return this.calculateUniqueAdjustmentFromMatches([exactMatch], 'exact');
      }
      
      console.log('🔄 No sufficient exact matches, searching for similar patterns...');
      
      // STEP 2: Find similar patterns using fuzzy matching
      const similarMatches = await this.findSimilarPatterns(gamePattern);
      
      if (similarMatches.length > 0) {
        const totalSamples = similarMatches.reduce((sum, match) => sum + match.sampleSize, 0);
        console.log(`✅ Found ${similarMatches.length} similar patterns with ${totalSamples} total samples`);
        return this.calculateUniqueAdjustmentFromMatches(similarMatches, 'similar');
      }
      
      console.log('🔄 No similar patterns found, attempting partial matching...');
      
      // STEP 3: Try partial pattern matching
      const partialMatches = await this.findPartialPatterns(gamePattern);
      
      if (partialMatches.length > 0) {
        const totalSamples = partialMatches.reduce((sum, match) => sum + match.sampleSize, 0);
        console.log(`✅ Found ${partialMatches.length} partial patterns with ${totalSamples} total samples`);
        return this.calculateUniqueAdjustmentFromMatches(partialMatches, 'partial');
      }
      
      console.log('⚠️ No pattern matches found, using fallback adjustment');
      
      // STEP 4: Fallback to generic adjustment
      return this.createFallbackAdjustment(gamePattern);
      
    } catch (error) {
      console.error('Pattern matching error:', error);
      return this.createErrorFallbackAdjustment();
    }
  }
  
  /**
   * Find exact pattern match in database
   */
  private async findExactPatternMatch(patternId: string): Promise<PatternMatch | null> {
    try {
      return await this.patternDB.findExactPatternMatch(patternId);
    } catch (error) {
      console.error('Failed to find exact pattern match:', error);
      return null;
    }
  }
  
  /**
   * Find similar patterns using fuzzy matching
   */
  private async findSimilarPatterns(gamePattern: HistoricalPattern): Promise<PatternMatch[]> {
    try {
      // This would involve more complex database queries
      // For now, we'll implement a simplified version
      
      const similarMatches: PatternMatch[] = [];
      
      // Query database for patterns with similar fingerprints
      // This is a simplified implementation - in production this would be more sophisticated
      const candidatePatterns = await this.getCandidatePatterns(gamePattern);
      
      for (const candidate of candidatePatterns) {
        const similarity = PatternEncoder.calculatePatternSimilarity(gamePattern, candidate.pattern);
        
        if (similarity >= this.config.similarityThreshold) {
          const statistics = await this.patternDB.getPatternStatistics(candidate.patternId);
          
          if (statistics && statistics.occurrenceCount >= 5) {
            similarMatches.push({
              patternId: candidate.patternId,
              matchType: 'similar',
              similarity,
              sampleSize: statistics.occurrenceCount,
              statistics,
              confidence: statistics.confidenceScore * similarity
            });
          }
        }
      }
      
      // Sort by confidence and take top matches
      return similarMatches
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, this.config.maxSimilarMatches);
        
    } catch (error) {
      console.error('Failed to find similar patterns:', error);
      return [];
    }
  }
  
  /**
   * Find partial pattern matches (e.g., H2H only, home form only)
   */
  private async findPartialPatterns(gamePattern: HistoricalPattern): Promise<PatternMatch[]> {
    try {
      const partialMatches: PatternMatch[] = [];
      
      // Try H2H-only matching
      const h2hMatches = await this.findH2HOnlyMatches(gamePattern.h2hFingerprint);
      partialMatches.push(...h2hMatches);
      
      // Try home form-only matching
      const homeMatches = await this.findHomeFormOnlyMatches(gamePattern.homeFingerprint);
      partialMatches.push(...homeMatches);
      
      // Try away form-only matching
      const awayMatches = await this.findAwayFormOnlyMatches(gamePattern.awayFingerprint);
      partialMatches.push(...awayMatches);
      
      // Sort by sample size and confidence
      return partialMatches
        .filter(match => match.sampleSize >= 10)
        .sort((a, b) => (b.confidence * b.sampleSize) - (a.confidence * a.sampleSize))
        .slice(0, 3); // Take top 3 partial matches
        
    } catch (error) {
      console.error('Failed to find partial patterns:', error);
      return [];
    }
  }
  
  /**
   * Get candidate patterns for similarity matching
   */
  private async getCandidatePatterns(gamePattern: HistoricalPattern): Promise<Array<{patternId: string, pattern: HistoricalPattern}>> {
    // This is a simplified implementation
    // In production, this would use database queries to find candidate patterns
    // based on fingerprint similarity
    
    try {
      // For now, return empty array - this would be implemented with proper database queries
      return [];
    } catch (error) {
      console.error('Failed to get candidate patterns:', error);
      return [];
    }
  }
  
  /**
   * Find patterns matching only H2H fingerprint
   */
  private async findH2HOnlyMatches(h2hFingerprint: string): Promise<PatternMatch[]> {
    // Simplified implementation - would query database for H2H fingerprint matches
    return [];
  }
  
  /**
   * Find patterns matching only home form fingerprint
   */
  private async findHomeFormOnlyMatches(homeFingerprint: string): Promise<PatternMatch[]> {
    // Simplified implementation - would query database for home form matches
    return [];
  }
  
  /**
   * Find patterns matching only away form fingerprint
   */
  private async findAwayFormOnlyMatches(awayFingerprint: string): Promise<PatternMatch[]> {
    // Simplified implementation - would query database for away form matches
    return [];
  }
  
  /**
   * Calculate unique adjustment from pattern matches
   */
  private calculateUniqueAdjustmentFromMatches(
    matches: PatternMatch[], 
    matchType: 'exact' | 'similar' | 'partial'
  ): UniqueAdjustment {
    
    console.log(`🧮 Calculating unique adjustment from ${matches.length} ${matchType} matches`);
    
    if (matches.length === 0) {
      return this.createFallbackAdjustment(null);
    }
    
    // Calculate weighted averages based on sample size and confidence
    let totalWeight = 0;
    let weightedGoalSum = 0;
    let weightedHomeWinSum = 0;
    let weightedAwayWinSum = 0;
    
    const patternDetails: PatternMatchDetail[] = [];
    
    for (const match of matches) {
      const weight = match.sampleSize * match.confidence * match.similarity;
      totalWeight += weight;
      
      // Calculate adjustments from pattern statistics
      const baselineGoals = 2.7; // League average baseline
      const baselineHomeWin = 0.45; // Baseline home win rate
      const baselineAwayWin = 0.3; // Baseline away win rate
      
      const goalAdjustment = match.statistics.avgTotalGoals - baselineGoals;
      const homeWinAdjustment = match.statistics.homeWinRate - baselineHomeWin;
      const awayWinAdjustment = match.statistics.awayWinRate - baselineAwayWin;
      
      weightedGoalSum += goalAdjustment * weight;
      weightedHomeWinSum += homeWinAdjustment * weight;
      weightedAwayWinSum += awayWinAdjustment * weight;
      
      patternDetails.push({
        patternId: match.patternId.substring(0, 12) + '...',
        matchType: match.matchType,
        similarity: match.similarity,
        sampleSize: match.sampleSize,
        contribution: weight / totalWeight // Will be recalculated after loop
      });
    }
    
    // Calculate final weighted adjustments
    const finalGoalAdjustment = totalWeight > 0 ? weightedGoalSum / totalWeight : 0;
    const finalHomeWinAdjustment = totalWeight > 0 ? weightedHomeWinSum / totalWeight : 0;
    const finalAwayWinAdjustment = totalWeight > 0 ? weightedAwayWinSum / totalWeight : 0;
    
    // Recalculate contribution percentages
    patternDetails.forEach(detail => {
      const matchData = matches.find(m => m.patternId.startsWith(detail.patternId.replace('...', '')));
      if (matchData) {
        const weight = matchData.sampleSize * matchData.confidence * matchData.similarity;
        detail.contribution = weight / totalWeight;
      }
    });
    
    // Calculate overall confidence
    const avgConfidence = matches.reduce((sum, match) => sum + match.confidence, 0) / matches.length;
    const sampleSizeBonus = Math.min(0.2, totalWeight / 1000); // Bonus for large sample sizes
    const overallConfidence = Math.min(0.95, avgConfidence + sampleSizeBonus);
    
    // Apply confidence-based dampening to prevent extreme adjustments
    const confidenceFactor = overallConfidence;
    
    const adjustment: UniqueAdjustment = {
      goalAdjustment: finalGoalAdjustment * confidenceFactor,
      homeWinAdjustment: finalHomeWinAdjustment * confidenceFactor,
      awayWinAdjustment: finalAwayWinAdjustment * confidenceFactor,
      confidence: overallConfidence,
      sampleSize: Math.round(totalWeight),
      patternDetails,
      adjustmentReason: this.generateAdjustmentReason(matchType, matches, finalGoalAdjustment),
      fallbackUsed: false
    };
    
    console.log(`✅ Unique adjustment calculated:`);
    console.log(`   Goal adjustment: ${finalGoalAdjustment > 0 ? '+' : ''}${finalGoalAdjustment.toFixed(3)}`);
    console.log(`   Home win adjustment: ${finalHomeWinAdjustment > 0 ? '+' : ''}${(finalHomeWinAdjustment * 100).toFixed(1)}%`);
    console.log(`   Away win adjustment: ${finalAwayWinAdjustment > 0 ? '+' : ''}${(finalAwayWinAdjustment * 100).toFixed(1)}%`);
    console.log(`   Overall confidence: ${(overallConfidence * 100).toFixed(1)}%`);
    
    return adjustment;
  }
  
  /**
   * Create fallback adjustment when no patterns found
   */
  private createFallbackAdjustment(gamePattern: HistoricalPattern | null): UniqueAdjustment {
    console.log('🔄 Creating fallback adjustment (no patterns found)');
    
    // Use very conservative adjustments as fallback
    return {
      goalAdjustment: 0,
      homeWinAdjustment: 0,
      awayWinAdjustment: 0,
      confidence: 0.3, // Low confidence for fallback
      sampleSize: 0,
      patternDetails: [],
      adjustmentReason: 'No pattern matches found - using baseline predictions',
      fallbackUsed: true
    };
  }
  
  /**
   * Create error fallback adjustment
   */
  private createErrorFallbackAdjustment(): UniqueAdjustment {
    console.log('❌ Creating error fallback adjustment');
    
    return {
      goalAdjustment: 0,
      homeWinAdjustment: 0,
      awayWinAdjustment: 0,
      confidence: 0.1, // Very low confidence for error case
      sampleSize: 0,
      patternDetails: [],
      adjustmentReason: 'Pattern matching error - using baseline predictions',
      fallbackUsed: true
    };
  }
  
  /**
   * Generate human-readable adjustment reason
   */
  private generateAdjustmentReason(
    matchType: 'exact' | 'similar' | 'partial',
    matches: PatternMatch[],
    goalAdjustment: number
  ): string {
    
    const totalSamples = matches.reduce((sum, match) => sum + match.sampleSize, 0);
    const avgGoals = matches.reduce((sum, match) => sum + match.statistics.avgTotalGoals, 0) / matches.length;
    
    let reason = `Found ${matches.length} ${matchType} pattern match${matches.length > 1 ? 'es' : ''} `;
    reason += `with ${totalSamples} total occurrences. `;
    
    if (Math.abs(goalAdjustment) > 0.1) {
      reason += `Historical average: ${avgGoals.toFixed(1)} goals `;
      reason += goalAdjustment > 0 
        ? `(above baseline - expecting higher scoring)`
        : `(below baseline - expecting lower scoring)`;
    } else {
      reason += `Pattern suggests normal goal expectation`;
    }
    
    return reason;
  }
  
  /**
   * Update pattern matching configuration
   */
  updateConfig(newConfig: Partial<PatternMatchingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Pattern matching configuration updated');
  }
  
  /**
   * Get current configuration
   */
  getConfig(): PatternMatchingConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const patternMatchingEngine = new PatternMatchingEngine();