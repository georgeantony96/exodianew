/**
 * ADAPTIVE THRESHOLD ENGINE
 * 
 * Transforms fixed Mean Reversion penalties into self-learning thresholds
 * that improve based on actual match outcomes and prediction accuracy
 * 
 * Revolutionary Concept:
 * - Current: "Home over dominance = -25% penalty for everyone" 
 * - Future: "Home over dominance = -22.3% penalty (learned from 47 outcomes, 89% accuracy)"
 * 
 * Key Innovation: Each pattern type learns its optimal adjustment strength
 * through continuous feedback from real match results
 * 
 * Integration: Works with existing Mean Reversion system while building
 * foundation for independent Pattern Intelligence Engine
 */

import Database from 'better-sqlite3';

export interface ThresholdLearning {
  pattern_type: string;
  current_penalty: number;
  original_penalty: number;
  total_predictions: number;
  successful_predictions: number;
  total_error: number;
  avg_error: number;
  recent_avg_error: number;
  last_adjustment: number;
  last_adjusted_at: Date | null;
  adjustment_count: number;
  learning_rate: number;
  confidence_threshold: number;
  min_penalty: number;
  max_penalty: number;
}

export interface PredictionOutcome {
  pattern_type: string;
  predicted_goals: number;
  actual_goals: number;
  confidence: number;
  simulation_id: number;
  prediction_date: Date;
}

export interface LearningStats {
  total_patterns: number;
  learning_patterns: number;
  avg_improvement: number;
  best_performer: string;
  worst_performer: string;
  total_adjustments: number;
}

export class AdaptiveThresholdEngine {
  private db: Database.Database;
  private thresholds = new Map<string, ThresholdLearning>();
  
  constructor(databasePath: string = '../database/exodia.db') {
    this.db = new Database(databasePath);
    this.initializeThresholds();
  }

  /**
   * Initialize thresholds with current Mean Reversion system values
   * These will gradually improve through learning
   */
  private initializeThresholds() {
    // Load existing thresholds from database
    const existingThresholds = this.db.prepare(`
      SELECT * FROM adaptive_thresholds
    `).all() as any[];

    existingThresholds.forEach(threshold => {
      this.thresholds.set(threshold.pattern_type, {
        pattern_type: threshold.pattern_type,
        current_penalty: threshold.current_penalty,
        original_penalty: threshold.original_penalty,
        total_predictions: threshold.total_predictions,
        successful_predictions: threshold.successful_predictions,
        total_error: threshold.total_error,
        avg_error: threshold.avg_error,
        recent_avg_error: threshold.recent_avg_error,
        last_adjustment: threshold.last_adjustment,
        last_adjusted_at: threshold.last_adjusted_at ? new Date(threshold.last_adjusted_at) : null,
        adjustment_count: threshold.adjustment_count,
        learning_rate: threshold.learning_rate,
        confidence_threshold: threshold.confidence_threshold,
        min_penalty: threshold.min_penalty,
        max_penalty: threshold.max_penalty
      });
    });

    console.log(`✅ AdaptiveThresholdEngine: Loaded ${this.thresholds.size} learning thresholds`);
  }

  /**
   * Get current learned penalty for a pattern type
   * This replaces fixed penalties in the Mean Reversion system
   */
  getLearnedPenalty(patternType: string, confidence: number): number {
    const threshold = this.thresholds.get(patternType);
    if (!threshold) {
      console.warn(`⚠️ Unknown pattern type: ${patternType}, returning 0`);
      return 0;
    }

    // Only apply learned penalty if confidence meets threshold
    if (confidence < threshold.confidence_threshold) {
      return 0;
    }

    // Return current learned penalty (weighted by confidence)
    return threshold.current_penalty * confidence;
  }

  /**
   * Record a prediction for later learning
   * This is called when we make predictions with current thresholds
   */
  async recordPrediction(
    patternType: string,
    predictedGoals: number,
    confidence: number,
    simulationId: number
  ): Promise<void> {
    const threshold = this.thresholds.get(patternType);
    if (!threshold || confidence < threshold.confidence_threshold) {
      return;
    }

    // Store prediction for later comparison with actual outcome
    await this.db.prepare(`
      INSERT INTO pattern_learning_outcomes 
      (pattern_fingerprint, market_type, predicted_outcome, confidence_level, simulation_id, prediction_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      patternType,
      'goal_total',
      predictedGoals > 2.5 ? 1 : 0, // Convert to boolean for consistency
      confidence,
      simulationId,
      new Date().toISOString()
    );

    console.log(`📝 Recorded prediction: ${patternType} → ${predictedGoals.toFixed(2)} goals (confidence: ${(confidence * 100).toFixed(1)}%)`);
  }

  /**
   * Learn from actual match outcome
   * This is called when match results are known
   */
  async learnFromOutcome(
    simulationId: number,
    actualHomeGoals: number,
    actualAwayGoals: number
  ): Promise<LearningUpdate[]> {
    const actualTotalGoals = actualHomeGoals + actualAwayGoals;
    const updates: LearningUpdate[] = [];

    // Get all predictions for this simulation
    const predictions = this.db.prepare(`
      SELECT * FROM pattern_learning_outcomes 
      WHERE simulation_id = ? AND actual_outcome IS NULL
    `).all(simulationId) as any[];

    for (const prediction of predictions) {
      const patternType = prediction.pattern_fingerprint;
      const predictedOutcome = prediction.predicted_outcome;
      const actualOutcome = actualTotalGoals > 2.5 ? 1 : 0;
      
      // Calculate prediction error
      const error = predictedOutcome - actualOutcome;
      const wasCorrect = predictedOutcome === actualOutcome;

      // Update prediction with actual outcome
      await this.db.prepare(`
        UPDATE pattern_learning_outcomes 
        SET actual_outcome = ?, result_date = ?
        WHERE id = ?
      `).run(actualOutcome, new Date().toISOString(), prediction.id);

      // Learn from this outcome
      const learningUpdate = await this.updateThresholdFromError(
        patternType,
        error,
        wasCorrect,
        prediction.confidence_level
      );

      if (learningUpdate) {
        updates.push(learningUpdate);
      }
    }

    return updates;
  }

  /**
   * Update threshold based on prediction error
   * Core learning algorithm that adjusts penalties over time
   */
  private async updateThresholdFromError(
    patternType: string,
    error: number,
    wasCorrect: boolean,
    confidence: number
  ): Promise<LearningUpdate | null> {
    const threshold = this.thresholds.get(patternType);
    if (!threshold) return null;

    // Update statistics
    threshold.total_predictions++;
    if (wasCorrect) threshold.successful_predictions++;
    threshold.total_error += Math.abs(error);
    threshold.avg_error = threshold.total_error / threshold.total_predictions;

    // Only adjust if we have enough data and the error is systematic
    if (threshold.total_predictions < 10) return null;

    // Calculate recent average error (last 20 predictions)
    const recentPredictions = await this.getRecentPredictionErrors(patternType, 20);
    threshold.recent_avg_error = recentPredictions.length > 0 
      ? recentPredictions.reduce((sum, err) => sum + Math.abs(err), 0) / recentPredictions.length
      : threshold.avg_error;

    // Adjust threshold if there's systematic bias
    let adjustment = 0;
    let reason = '';

    // If consistently over-predicting (positive error), strengthen penalty
    if (threshold.recent_avg_error > 0.2 && threshold.total_predictions >= 15) {
      adjustment = -threshold.learning_rate;
      reason = 'Over-predicting - strengthening penalty';
    }
    // If consistently under-predicting (negative error), weaken penalty
    else if (threshold.recent_avg_error < -0.2 && threshold.total_predictions >= 15) {
      adjustment = +threshold.learning_rate;
      reason = 'Under-predicting - weakening penalty';
    }

    if (adjustment !== 0) {
      // Apply adjustment within bounds
      const oldPenalty = threshold.current_penalty;
      threshold.current_penalty += adjustment;
      threshold.current_penalty = Math.max(threshold.min_penalty, 
                                          Math.min(threshold.max_penalty, threshold.current_penalty));
      
      threshold.last_adjustment = adjustment;
      threshold.last_adjusted_at = new Date();
      threshold.adjustment_count++;

      // Save to database
      await this.saveLearningUpdate(threshold);

      const learningUpdate: LearningUpdate = {
        pattern_type: patternType,
        old_penalty: oldPenalty,
        new_penalty: threshold.current_penalty,
        adjustment: adjustment,
        reason,
        total_predictions: threshold.total_predictions,
        success_rate: threshold.successful_predictions / threshold.total_predictions,
        avg_error: threshold.avg_error
      };

      console.log(`🧠 LEARNING UPDATE: ${patternType}`);
      console.log(`   Old penalty: ${oldPenalty.toFixed(3)} → New penalty: ${threshold.current_penalty.toFixed(3)}`);
      console.log(`   Reason: ${reason}`);
      console.log(`   Success rate: ${(learningUpdate.success_rate * 100).toFixed(1)}% (${threshold.successful_predictions}/${threshold.total_predictions})`);

      return learningUpdate;
    }

    return null;
  }

  /**
   * Get recent prediction errors for a pattern type
   */
  private async getRecentPredictionErrors(patternType: string, limit: number): Promise<number[]> {
    const results = this.db.prepare(`
      SELECT predicted_outcome, actual_outcome 
      FROM pattern_learning_outcomes 
      WHERE pattern_fingerprint = ? AND actual_outcome IS NOT NULL
      ORDER BY result_date DESC
      LIMIT ?
    `).all(patternType, limit) as any[];

    return results.map(r => r.predicted_outcome - r.actual_outcome);
  }

  /**
   * Save learning update to database
   */
  private async saveLearningUpdate(threshold: ThresholdLearning): Promise<void> {
    await this.db.prepare(`
      UPDATE adaptive_thresholds 
      SET 
        current_penalty = ?,
        total_predictions = ?,
        successful_predictions = ?,
        total_error = ?,
        avg_error = ?,
        recent_avg_error = ?,
        last_adjustment = ?,
        last_adjusted_at = ?,
        adjustment_count = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE pattern_type = ?
    `).run(
      threshold.current_penalty,
      threshold.total_predictions,
      threshold.successful_predictions,
      threshold.total_error,
      threshold.avg_error,
      threshold.recent_avg_error,
      threshold.last_adjustment,
      threshold.last_adjusted_at?.toISOString() || null,
      threshold.adjustment_count,
      threshold.pattern_type
    );
  }

  /**
   * Get learning statistics for monitoring system performance
   */
  getLearningStats(): LearningStats {
    const thresholdArray = Array.from(this.thresholds.values());
    const learningThresholds = thresholdArray.filter(t => t.total_predictions >= 10);
    
    const improvements = learningThresholds.map(t => 
      Math.abs(t.current_penalty - t.original_penalty) / Math.abs(t.original_penalty)
    );
    
    const avgImprovement = improvements.length > 0 
      ? improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length 
      : 0;

    const bestPerformer = learningThresholds.reduce((best, current) => 
      current.successful_predictions / Math.max(1, current.total_predictions) > 
      best.successful_predictions / Math.max(1, best.total_predictions) ? current : best,
      learningThresholds[0] || { pattern_type: 'none', successful_predictions: 0, total_predictions: 1 }
    );

    const worstPerformer = learningThresholds.reduce((worst, current) => 
      current.successful_predictions / Math.max(1, current.total_predictions) < 
      worst.successful_predictions / Math.max(1, worst.total_predictions) ? current : worst,
      learningThresholds[0] || { pattern_type: 'none', successful_predictions: 0, total_predictions: 1 }
    );

    return {
      total_patterns: this.thresholds.size,
      learning_patterns: learningThresholds.length,
      avg_improvement: avgImprovement,
      best_performer: bestPerformer?.pattern_type || 'none',
      worst_performer: worstPerformer?.pattern_type || 'none',
      total_adjustments: thresholdArray.reduce((sum, t) => sum + t.adjustment_count, 0)
    };
  }

  /**
   * Get current threshold values for debugging
   */
  getCurrentThresholds(): Map<string, number> {
    const current = new Map<string, number>();
    this.thresholds.forEach((threshold, key) => {
      current.set(key, threshold.current_penalty);
    });
    return current;
  }

  /**
   * Reset a threshold to its original value (for testing)
   */
  async resetThreshold(patternType: string): Promise<boolean> {
    const threshold = this.thresholds.get(patternType);
    if (!threshold) return false;

    threshold.current_penalty = threshold.original_penalty;
    threshold.total_predictions = 0;
    threshold.successful_predictions = 0;
    threshold.total_error = 0;
    threshold.avg_error = 0;
    threshold.recent_avg_error = 0;
    threshold.last_adjustment = 0;
    threshold.last_adjusted_at = null;
    threshold.adjustment_count = 0;

    await this.saveLearningUpdate(threshold);
    return true;
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

export interface LearningUpdate {
  pattern_type: string;
  old_penalty: number;
  new_penalty: number;
  adjustment: number;
  reason: string;
  total_predictions: number;
  success_rate: number;
  avg_error: number;
}

// Export singleton instance for global usage
export const adaptiveThresholdEngine = new AdaptiveThresholdEngine();

// Export types
export type { ThresholdLearning, PredictionOutcome, LearningStats };