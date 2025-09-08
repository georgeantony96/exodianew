import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Card } from '@/components/ui/Card';

interface OddsComparisonProps {
  simulationResults: any;
  bookmakerOdds: any;
  leagueContext?: any;
  simulationData?: any;
  onBankrollUpdate?: () => void;
}

export interface OddsComparisonRef {
  getSelectedBets: () => any[];
  saveSelectedBets: (simulationId?: number) => Promise<void>;
}

interface OddsPair {
  market: string;
  outcome: string;
  trueOdds: number;
  bookmakerOdds: number;
  trueProbability: number;
  impliedProbability: number;
  edge: number;
  edgeType: 'high' | 'medium' | 'low' | 'negative';
}

const OddsComparison = forwardRef<OddsComparisonRef, OddsComparisonProps>(({
  simulationResults,
  bookmakerOdds,
  leagueContext,
  simulationData,
  onBankrollUpdate
}, ref) => {
  const [selectedBets, setSelectedBets] = useState<Set<string>>(new Set());
  const [savingBets, setSavingBets] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const generateOddsComparison = (): OddsPair[] => {
    console.log('[DEBUG] OddsComparison - generateOddsComparison called with simplified structure:', {
      simulationResults: simulationResults ? Object.keys(simulationResults) : null,
      bookmakerOdds: bookmakerOdds ? Object.keys(bookmakerOdds) : null,
      hasTrueOddsDirectly: !!simulationResults?.true_odds,
      hasTrueOddsNested: !!simulationResults?.results?.true_odds,
      trueOddsKeys: simulationResults?.results?.true_odds ? Object.keys(simulationResults.results.true_odds) : 
                   simulationResults?.true_odds ? Object.keys(simulationResults.true_odds) : null,
      bookmakerOddsKeys: bookmakerOdds ? Object.keys(bookmakerOdds) : null
    });

    // DEBUG: Log the complete bookmaker odds structure for simplified markets
    console.log('[DEBUG] Simplified bookmaker odds structure:', JSON.stringify(bookmakerOdds, null, 2));
    console.log('[DEBUG] Simplified market structure check:', {
      '1x2_ft_structure': bookmakerOdds?.['1x2_ft'],
      'over_under_25_structure': bookmakerOdds?.over_under_25,
      'goal_ranges_structure': bookmakerOdds?.goal_ranges,
      'asian_handicap_0_structure': bookmakerOdds?.asian_handicap_0
    });
    
    const comparisons: OddsPair[] = [];
    
    // Extract true odds from correct location
    const trueOdds = simulationResults?.results?.true_odds || simulationResults?.true_odds || {};
    
    if (!trueOdds || Object.keys(trueOdds).length === 0 || !bookmakerOdds) {
      console.log('[DEBUG] OddsComparison - Early return: missing true_odds or bookmakerOdds');
      return comparisons;
    }
    
    // 1X2 FT Market
    const matchOutcomes = trueOdds['1x2_ft'];
    if (matchOutcomes && bookmakerOdds['1x2_ft']) {
      ['home', 'draw', 'away'].forEach(outcome => {
        const trueOdd = matchOutcomes[outcome];
        const bookOdd = bookmakerOdds['1x2_ft'][outcome];
        
        if (typeof bookOdd === 'number' && bookOdd > 0) {
          let comparison;
          
          if (typeof trueOdd === 'number' && trueOdd > 0) {
            const trueProbability = 1 / trueOdd;
            const impliedProbability = 1 / bookOdd;
            const edge = ((bookOdd / trueOdd) - 1) * 100;
            
            comparison = {
              market: '1X2 FT',
              outcome: outcome.charAt(0).toUpperCase() + outcome.slice(1),
              trueOdds: trueOdd,
              bookmakerOdds: bookOdd,
              trueProbability,
              impliedProbability,
              edge,
              edgeType: edge > 10 ? 'high' : edge > 5 ? 'medium' : edge > 0 ? 'low' : 'negative'
            };
          } else {
            const impliedProbability = 1 / bookOdd;
            comparison = {
              market: '1X2 FT',
              outcome: outcome.charAt(0).toUpperCase() + outcome.slice(1),
              trueOdds: 0,
              bookmakerOdds: bookOdd,
              trueProbability: 0,
              impliedProbability,
              edge: -100,
              edgeType: 'negative' as const
            };
          }
          
          comparisons.push(comparison);
          console.log(`[DEBUG] Added 1X2 FT ${outcome} comparison:`, comparison);
        }
      });
    }
    
    // Over/Under 2.5 Market (Simplified)
    const overUnder25Market = trueOdds.over_under_25;
    if (overUnder25Market && bookmakerOdds.over_under_25) {
      ['over', 'under'].forEach(side => {
        const trueOdd = overUnder25Market[side];
        const bookOdd = bookmakerOdds.over_under_25[side];
        
        if (typeof bookOdd === 'number' && bookOdd > 0 && typeof trueOdd === 'number' && trueOdd > 0) {
          const trueProbability = 1 / trueOdd;
          const impliedProbability = 1 / bookOdd;
          const edge = ((bookOdd / trueOdd) - 1) * 100;
          
          comparisons.push({
            market: 'O/U 2.5',
            outcome: side.charAt(0).toUpperCase() + side.slice(1),
            trueOdds: trueOdd,
            bookmakerOdds: bookOdd,
            trueProbability,
            impliedProbability,
            edge,
            edgeType: edge > 10 ? 'high' : edge > 5 ? 'medium' : edge > 0 ? 'low' : 'negative'
          });
          console.log(`[DEBUG] Added O/U 2.5 ${side} comparison`);
        }
      });
    }
    
    // Goal Ranges Market
    const goalRangesMarket = trueOdds.goal_ranges;
    if (goalRangesMarket && bookmakerOdds.goal_ranges) {
      const rangeLabels = {
        range_0_1: '0-1 Goals',
        range_2_3: '2-3 Goals', 
        range_4_6: '4-6 Goals',
        range_7_plus: '7+ Goals'
      };
      
      Object.keys(rangeLabels).forEach(range => {
        const trueOdd = goalRangesMarket[range];
        const bookOdd = bookmakerOdds.goal_ranges[range];
        
        if (typeof bookOdd === 'number' && bookOdd > 0 && typeof trueOdd === 'number' && trueOdd > 0) {
          const trueProbability = 1 / trueOdd;
          const impliedProbability = 1 / bookOdd;
          const edge = ((bookOdd / trueOdd) - 1) * 100;
          
          comparisons.push({
            market: 'Goal Ranges',
            outcome: rangeLabels[range],
            trueOdds: trueOdd,
            bookmakerOdds: bookOdd,
            trueProbability,
            impliedProbability,
            edge,
            edgeType: edge > 10 ? 'high' : edge > 5 ? 'medium' : edge > 0 ? 'low' : 'negative'
          });
          console.log(`[DEBUG] Added Goal Range ${rangeLabels[range]} comparison`);
        }
      });
    }
    
    // === COMPREHENSIVE MARKETS ADDITION ===

    // Over/Under 3.0 Market
    const overUnder3Market = trueOdds.over_under_3;
    if (overUnder3Market && bookmakerOdds.over_under_3) {
      ['over', 'under'].forEach(side => {
        const trueOdd = overUnder3Market[side];
        const bookOdd = bookmakerOdds.over_under_3[side];
        
        if (typeof bookOdd === 'number' && bookOdd > 0 && typeof trueOdd === 'number' && trueOdd > 0) {
          const trueProbability = 1 / trueOdd;
          const impliedProbability = 1 / bookOdd;
          const edge = ((bookOdd / trueOdd) - 1) * 100;
          
          comparisons.push({
            market: 'O/U 3.0',
            outcome: side.charAt(0).toUpperCase() + side.slice(1),
            trueOdds: trueOdd,
            bookmakerOdds: bookOdd,
            trueProbability,
            impliedProbability,
            edge,
            edgeType: edge > 10 ? 'high' : edge > 5 ? 'medium' : edge > 0 ? 'low' : 'negative'
          });
          console.log(`[DEBUG] Added O/U 3.0 ${side} comparison`);
        }
      });
    }

    // Over/Under 3.5 Market
    const overUnder35Market = trueOdds.over_under_35;
    if (overUnder35Market && bookmakerOdds.over_under_35) {
      ['over', 'under'].forEach(side => {
        const trueOdd = overUnder35Market[side];
        const bookOdd = bookmakerOdds.over_under_35[side];
        
        if (typeof bookOdd === 'number' && bookOdd > 0 && typeof trueOdd === 'number' && trueOdd > 0) {
          const trueProbability = 1 / trueOdd;
          const impliedProbability = 1 / bookOdd;
          const edge = ((bookOdd / trueOdd) - 1) * 100;
          
          comparisons.push({
            market: 'O/U 3.5',
            outcome: side.charAt(0).toUpperCase() + side.slice(1),
            trueOdds: trueOdd,
            bookmakerOdds: bookOdd,
            trueProbability,
            impliedProbability,
            edge,
            edgeType: edge > 10 ? 'high' : edge > 5 ? 'medium' : edge > 0 ? 'low' : 'negative'
          });
          console.log(`[DEBUG] Added O/U 3.5 ${side} comparison`);
        }
      });
    }

    // GG/NG (Both Teams to Score) Market
    const ggNgMarket = trueOdds.gg_ng;
    if (ggNgMarket && bookmakerOdds.gg_ng) {
      ['gg', 'ng'].forEach(outcome => {
        const trueOdd = ggNgMarket[outcome];
        const bookOdd = bookmakerOdds.gg_ng[outcome];
        
        if (typeof bookOdd === 'number' && bookOdd > 0 && typeof trueOdd === 'number' && trueOdd > 0) {
          const trueProbability = 1 / trueOdd;
          const impliedProbability = 1 / bookOdd;
          const edge = ((bookOdd / trueOdd) - 1) * 100;
          
          comparisons.push({
            market: 'BTTS',
            outcome: outcome === 'gg' ? 'Yes (GG)' : 'No (NG)',
            trueOdds: trueOdd,
            bookmakerOdds: bookOdd,
            trueProbability,
            impliedProbability,
            edge,
            edgeType: edge > 10 ? 'high' : edge > 5 ? 'medium' : edge > 0 ? 'low' : 'negative'
          });
          console.log(`[DEBUG] Added BTTS ${outcome} comparison`);
        }
      });
    }

    // Double Chance Market
    const doubleChanceMarket = trueOdds.double_chance;
    if (doubleChanceMarket && bookmakerOdds.double_chance) {
      const dcOptions = [
        { key: '1x', label: '1X (Home or Draw)' },
        { key: '12', label: '12 (Home or Away)' },
        { key: '2x', label: '2X (Away or Draw)' }
      ];
      
      dcOptions.forEach(option => {
        const trueOdd = doubleChanceMarket[option.key];
        const bookOdd = bookmakerOdds.double_chance[option.key];
        
        if (typeof bookOdd === 'number' && bookOdd > 0 && typeof trueOdd === 'number' && trueOdd > 0) {
          const trueProbability = 1 / trueOdd;
          const impliedProbability = 1 / bookOdd;
          const edge = ((bookOdd / trueOdd) - 1) * 100;
          
          comparisons.push({
            market: 'Double Chance',
            outcome: option.label,
            trueOdds: trueOdd,
            bookmakerOdds: bookOdd,
            trueProbability,
            impliedProbability,
            edge,
            edgeType: edge > 10 ? 'high' : edge > 5 ? 'medium' : edge > 0 ? 'low' : 'negative'
          });
          console.log(`[DEBUG] Added Double Chance ${option.key} comparison`);
        }
      });
    }

    // Asian Handicap -1/+1 Market
    const ahMinus1Plus1Market = trueOdds.asian_handicap_minus1_plus1;
    if (ahMinus1Plus1Market && bookmakerOdds.asian_handicap_minus1_plus1) {
      ['home', 'away'].forEach(outcome => {
        const trueOdd = ahMinus1Plus1Market[outcome];
        const bookOdd = bookmakerOdds.asian_handicap_minus1_plus1[outcome];
        
        if (typeof bookOdd === 'number' && bookOdd > 0 && typeof trueOdd === 'number' && trueOdd > 0) {
          const trueProbability = 1 / trueOdd;
          const impliedProbability = 1 / bookOdd;
          const edge = ((bookOdd / trueOdd) - 1) * 100;
          
          comparisons.push({
            market: 'AH -1/+1',
            outcome: outcome === 'home' ? 'Home -1' : 'Away +1',
            trueOdds: trueOdd,
            bookmakerOdds: bookOdd,
            trueProbability,
            impliedProbability,
            edge,
            edgeType: edge > 10 ? 'high' : edge > 5 ? 'medium' : edge > 0 ? 'low' : 'negative'
          });
          console.log(`[DEBUG] Added AH -1/+1 ${outcome} comparison`);
        }
      });
    }

    // Asian Handicap +1/-1 Market  
    const ahPlus1Minus1Market = trueOdds.asian_handicap_plus1_minus1;
    if (ahPlus1Minus1Market && bookmakerOdds.asian_handicap_plus1_minus1) {
      ['home', 'away'].forEach(outcome => {
        const trueOdd = ahPlus1Minus1Market[outcome];
        const bookOdd = bookmakerOdds.asian_handicap_plus1_minus1[outcome];
        
        if (typeof bookOdd === 'number' && bookOdd > 0 && typeof trueOdd === 'number' && trueOdd > 0) {
          const trueProbability = 1 / trueOdd;
          const impliedProbability = 1 / bookOdd;
          const edge = ((bookOdd / trueOdd) - 1) * 100;
          
          comparisons.push({
            market: 'AH +1/-1',
            outcome: outcome === 'home' ? 'Home +1' : 'Away -1',
            trueOdds: trueOdd,
            bookmakerOdds: bookOdd,
            trueProbability,
            impliedProbability,
            edge,
            edgeType: edge > 10 ? 'high' : edge > 5 ? 'medium' : edge > 0 ? 'low' : 'negative'
          });
          console.log(`[DEBUG] Added AH +1/-1 ${outcome} comparison`);
        }
      });
    }

    // 1X2 Half Time Market
    const x2HtMarket = trueOdds['1x2_ht'];
    if (x2HtMarket && bookmakerOdds['1x2_ht']) {
      ['home', 'draw', 'away'].forEach(outcome => {
        const trueOdd = x2HtMarket[outcome];
        const bookOdd = bookmakerOdds['1x2_ht'][outcome];
        
        if (typeof bookOdd === 'number' && bookOdd > 0 && typeof trueOdd === 'number' && trueOdd > 0) {
          const trueProbability = 1 / trueOdd;
          const impliedProbability = 1 / bookOdd;
          const edge = ((bookOdd / trueOdd) - 1) * 100;
          
          comparisons.push({
            market: '1X2 HT',
            outcome: outcome.charAt(0).toUpperCase() + outcome.slice(1),
            trueOdds: trueOdd,
            bookmakerOdds: bookOdd,
            trueProbability,
            impliedProbability,
            edge,
            edgeType: edge > 10 ? 'high' : edge > 5 ? 'medium' : edge > 0 ? 'low' : 'negative'
          });
          console.log(`[DEBUG] Added 1X2 HT ${outcome} comparison`);
        }
      });
    }

    // Asian Handicap +0 HT Market
    const ahHtMarket = trueOdds.asian_handicap_0_ht;
    if (ahHtMarket && bookmakerOdds.asian_handicap_0_ht) {
      ['home', 'away'].forEach(outcome => {
        const trueOdd = ahHtMarket[outcome];
        const bookOdd = bookmakerOdds.asian_handicap_0_ht[outcome];
        
        if (typeof bookOdd === 'number' && bookOdd > 0 && typeof trueOdd === 'number' && trueOdd > 0) {
          const trueProbability = 1 / trueOdd;
          const impliedProbability = 1 / bookOdd;
          const edge = ((bookOdd / trueOdd) - 1) * 100;
          
          comparisons.push({
            market: '1H AH+0',
            outcome: outcome === 'home' ? 'Home +0' : 'Away +0',
            trueOdds: trueOdd,
            bookmakerOdds: bookOdd,
            trueProbability,
            impliedProbability,
            edge,
            edgeType: edge > 10 ? 'high' : edge > 5 ? 'medium' : edge > 0 ? 'low' : 'negative'
          });
          console.log(`[DEBUG] Added 1H AH+0 ${outcome} comparison`);
        }
      });
    }

    // Over/Under 1.5 HT Market
    const overUnder15HtMarket = trueOdds.over_under_15_ht;
    if (overUnder15HtMarket && bookmakerOdds.over_under_15_ht) {
      ['over', 'under'].forEach(side => {
        const trueOdd = overUnder15HtMarket[side];
        const bookOdd = bookmakerOdds.over_under_15_ht[side];
        
        if (typeof bookOdd === 'number' && bookOdd > 0 && typeof trueOdd === 'number' && trueOdd > 0) {
          const trueProbability = 1 / trueOdd;
          const impliedProbability = 1 / bookOdd;
          const edge = ((bookOdd / trueOdd) - 1) * 100;
          
          comparisons.push({
            market: '1H O/U 1.5',
            outcome: side.charAt(0).toUpperCase() + side.slice(1),
            trueOdds: trueOdd,
            bookmakerOdds: bookOdd,
            trueProbability,
            impliedProbability,
            edge,
            edgeType: edge > 10 ? 'high' : edge > 5 ? 'medium' : edge > 0 ? 'low' : 'negative'
          });
          console.log(`[DEBUG] Added 1H O/U 1.5 ${side} comparison`);
        }
      });
    }

    // Asian Handicap +0 FT Market
    const asianHandicapMarket = trueOdds.asian_handicap_0;
    if (asianHandicapMarket && bookmakerOdds.asian_handicap_0) {
      ['home', 'away'].forEach(outcome => {
        const trueOdd = asianHandicapMarket[outcome];
        const bookOdd = bookmakerOdds.asian_handicap_0[outcome];
        
        if (typeof bookOdd === 'number' && bookOdd > 0) {
          let comparison;
          
          if (typeof trueOdd === 'number' && trueOdd > 0) {
            const trueProbability = 1 / trueOdd;
            const impliedProbability = 1 / bookOdd;
            const edge = ((bookOdd / trueOdd) - 1) * 100;
            
            comparison = {
              market: 'AH+0 FT',
              outcome: outcome === 'home' ? 'Home +0' : 'Away +0',
              trueOdds: trueOdd,
              bookmakerOdds: bookOdd,
              trueProbability,
              impliedProbability,
              edge,
              edgeType: edge > 10 ? 'high' : edge > 5 ? 'medium' : edge > 0 ? 'low' : 'negative'
            };
          } else {
            const impliedProbability = 1 / bookOdd;
            comparison = {
              market: 'AH+0 FT',
              outcome: outcome === 'home' ? 'Home +0' : 'Away +0',
              trueOdds: 0,
              bookmakerOdds: bookOdd,
              trueProbability: 0,
              impliedProbability,
              edge: -100,
              edgeType: 'negative' as const
            };
          }
          
          comparisons.push(comparison);
          console.log(`[DEBUG] Added Asian Handicap +0 ${outcome} comparison`);
        }
      });
    }

    // Asian Handicap -1/+1 Market (AH -1 for home, AH +1 for away)
    const ahMinus1Plus1MarketV2 = trueOdds.ah_minus1_plus1;
    if (ahMinus1Plus1MarketV2 && bookmakerOdds.ah_minus1_plus1) {
      const mappings = [
        { trueKey: 'minus1', bookKey: 'minus1', label: 'Home -1' },
        { trueKey: 'plus1', bookKey: 'plus1', label: 'Away +1' }
      ];

      mappings.forEach(({ trueKey, bookKey, label }) => {
        const trueOdd = ahMinus1Plus1MarketV2[trueKey];
        const bookOdd = bookmakerOdds.ah_minus1_plus1[bookKey];
        
        console.log(`[DEBUG] AH -1/+1 ${label} validation:`, { trueOdd, bookOdd, trueOddType: typeof trueOdd, bookOddType: typeof bookOdd });
        
        if (typeof bookOdd === 'number' && bookOdd > 0) {
          let comparison;
          
          if (typeof trueOdd === 'number' && trueOdd > 0) {
            const trueProbability = 1 / trueOdd;
            const impliedProbability = 1 / bookOdd;
            const edge = ((bookOdd / trueOdd) - 1) * 100;
            
            comparison = {
              market: 'AH -1/+1',
              outcome: label,
              trueOdds: trueOdd,
              bookmakerOdds: bookOdd,
              trueProbability,
              impliedProbability,
              edge,
              edgeType: edge > 10 ? 'high' : edge > 5 ? 'medium' : edge > 0 ? 'low' : 'negative'
            };
          } else {
            const impliedProbability = 1 / bookOdd;
            
            comparison = {
              market: 'AH -1/+1',
              outcome: label,
              trueOdds: 0,
              bookmakerOdds: bookOdd,
              trueProbability: 0,
              impliedProbability,
              edge: -100,
              edgeType: 'negative' as const
            };
          }
          
          comparisons.push(comparison);
          console.log(`[DEBUG] Added AH -1/+1 ${label} comparison:`, comparison);
        } else {
          console.log(`[DEBUG] FAILED to add AH -1/+1 ${label} - validation failed`);
        }
      });
    }

    // Asian Handicap +1/-1 Market (AH +1 for home, AH -1 for away)
    const ahPlus1Minus1MarketV2 = trueOdds.ah_plus1_minus1;
    if (ahPlus1Minus1MarketV2 && bookmakerOdds.ah_plus1_minus1) {
      const mappings = [
        { trueKey: 'plus1', bookKey: 'plus1', label: 'Home +1' },
        { trueKey: 'minus1', bookKey: 'minus1', label: 'Away -1' }
      ];

      mappings.forEach(({ trueKey, bookKey, label }) => {
        const trueOdd = ahPlus1Minus1MarketV2[trueKey];
        const bookOdd = bookmakerOdds.ah_plus1_minus1[bookKey];
        
        console.log(`[DEBUG] AH +1/-1 ${label} validation:`, { trueOdd, bookOdd, trueOddType: typeof trueOdd, bookOddType: typeof bookOdd });
        
        if (typeof bookOdd === 'number' && bookOdd > 0) {
          let comparison;
          
          if (typeof trueOdd === 'number' && trueOdd > 0) {
            const trueProbability = 1 / trueOdd;
            const impliedProbability = 1 / bookOdd;
            const edge = ((bookOdd / trueOdd) - 1) * 100;
            
            comparison = {
              market: 'AH +1/-1',
              outcome: label,
              trueOdds: trueOdd,
              bookmakerOdds: bookOdd,
              trueProbability,
              impliedProbability,
              edge,
              edgeType: edge > 10 ? 'high' : edge > 5 ? 'medium' : edge > 0 ? 'low' : 'negative'
            };
          } else {
            const impliedProbability = 1 / bookOdd;
            
            comparison = {
              market: 'AH +1/-1',
              outcome: label,
              trueOdds: 0,
              bookmakerOdds: bookOdd,
              trueProbability: 0,
              impliedProbability,
              edge: -100,
              edgeType: 'negative' as const
            };
          }
          
          comparisons.push(comparison);
          console.log(`[DEBUG] Added AH +1/-1 ${label} comparison:`, comparison);
        } else {
          console.log(`[DEBUG] FAILED to add AH +1/-1 ${label} - validation failed`);
        }
      });
    }

    // Double Chance Market
    const doubleChanceMarketV2 = trueOdds.double_chance;
    if (doubleChanceMarketV2 && bookmakerOdds.double_chance) {
      const mappings = [
        { trueKey: 'dc_1x', bookKey: 'dc_1x', label: '1X (Home or Draw)' },
        { trueKey: 'dc_12', bookKey: 'dc_12', label: '12 (Home or Away)' },
        { trueKey: 'dc_x2', bookKey: 'dc_x2', label: 'X2 (Draw or Away)' }
      ];

      mappings.forEach(({ trueKey, bookKey, label }) => {
        const trueOdd = doubleChanceMarketV2[trueKey];
        const bookOdd = bookmakerOdds.double_chance[bookKey];
        
        console.log(`[DEBUG] Double Chance ${label} validation:`, { trueOdd, bookOdd, trueOddType: typeof trueOdd, bookOddType: typeof bookOdd });
        
        if (typeof bookOdd === 'number' && bookOdd > 0) {
          let comparison;
          
          if (typeof trueOdd === 'number' && trueOdd > 0) {
            const trueProbability = 1 / trueOdd;
            const impliedProbability = 1 / bookOdd;
            const edge = ((bookOdd / trueOdd) - 1) * 100;
            
            comparison = {
              market: 'Double Chance',
              outcome: label,
              trueOdds: trueOdd,
              bookmakerOdds: bookOdd,
              trueProbability,
              impliedProbability,
              edge,
              edgeType: edge > 10 ? 'high' : edge > 5 ? 'medium' : edge > 0 ? 'low' : 'negative'
            };
          } else {
            const impliedProbability = 1 / bookOdd;
            
            comparison = {
              market: 'Double Chance',
              outcome: label,
              trueOdds: 0,
              bookmakerOdds: bookOdd,
              trueProbability: 0,
              impliedProbability,
              edge: -100,
              edgeType: 'negative' as const
            };
          }
          
          comparisons.push(comparison);
          console.log(`[DEBUG] Added Double Chance ${label} comparison:`, comparison);
        } else {
          console.log(`[DEBUG] FAILED to add Double Chance ${label} - validation failed`);
        }
      });
    }
    
    // First Half Double Chance Market
    const firstHalfDoubleChanceMarket = trueOdds.first_half_double_chance;
    if (firstHalfDoubleChanceMarket && bookmakerOdds.first_half_double_chance) {
      const mappings = [
        { trueKey: 'dc_1x_1h', bookKey: 'dc_1x_1h', label: '1H 1X (Home or Draw)' },
        { trueKey: 'dc_12_1h', bookKey: 'dc_12_1h', label: '1H 12 (Home or Away)' },
        { trueKey: 'dc_x2_1h', bookKey: 'dc_x2_1h', label: '1H X2 (Draw or Away)' }
      ];
      mappings.forEach(({ trueKey, bookKey, label }) => {
        const trueOdd = firstHalfDoubleChanceMarket[trueKey];
        const bookOdd = bookmakerOdds.first_half_double_chance[bookKey];
        
        console.log(`[DEBUG] 1H Double Chance ${label} validation:`, { trueOdd, bookOdd, trueOddType: typeof trueOdd, bookOddType: typeof bookOdd });
        
        if (typeof bookOdd === 'number' && bookOdd > 0) {
          let comparison;
          
          if (typeof trueOdd === 'number' && trueOdd > 0) {
            const trueProbability = 1 / trueOdd;
            const impliedProbability = 1 / bookOdd;
            const edge = ((bookOdd / trueOdd) - 1) * 100;
            
            comparison = {
              market: '1H Double Chance',
              outcome: label.split(' ')[1], // Extract "1X", "12", or "X2"
              trueOdds: trueOdd,
              bookmakerOdds: bookOdd,
              trueProbability,
              impliedProbability,
              edge,
              edgeType: edge > 10 ? 'high' : edge > 5 ? 'medium' : edge > 0 ? 'low' : 'negative'
            };
          } else {
            const impliedProbability = 1 / bookOdd;
            
            comparison = {
              market: '1H Double Chance',
              outcome: label.split(' ')[1],
              trueOdds: 0,
              bookmakerOdds: bookOdd,
              trueProbability: 0,
              impliedProbability,
              edge: -100,
              edgeType: 'negative' as const
            };
          }
          
          comparisons.push(comparison);
          console.log(`[DEBUG] Added 1H Double Chance ${label} comparison:`, comparison);
        } else {
          console.log(`[DEBUG] FAILED to add 1H Double Chance ${label} - validation failed`);
        }
      });
    }

    // First Half Asian Handicap +0 Market
    const firstHalfAh0Market = trueOdds.first_half_ah_0;
    if (firstHalfAh0Market && bookmakerOdds.first_half_ah_0) {
      const mappings = [
        { trueKey: 'home_ah0_1h', bookKey: 'home_ah0_1h', label: '1H Home +0' },
        { trueKey: 'away_ah0_1h', bookKey: 'away_ah0_1h', label: '1H Away +0' }
      ];
      mappings.forEach(({ trueKey, bookKey, label }) => {
        const trueOdd = firstHalfAh0Market[trueKey];
        const bookOdd = bookmakerOdds.first_half_ah_0[bookKey];
        
        console.log(`[DEBUG] 1H AH+0 ${label} validation:`, { trueOdd, bookOdd, trueOddType: typeof trueOdd, bookOddType: typeof bookOdd });
        
        if (typeof bookOdd === 'number' && bookOdd > 0) {
          let comparison;
          
          if (typeof trueOdd === 'number' && trueOdd > 0) {
            const trueProbability = 1 / trueOdd;
            const impliedProbability = 1 / bookOdd;
            const edge = ((bookOdd / trueOdd) - 1) * 100;
            
            comparison = {
              market: '1H AH+0',
              outcome: label.includes('Home') ? 'Home' : 'Away',
              trueOdds: trueOdd,
              bookmakerOdds: bookOdd,
              trueProbability,
              impliedProbability,
              edge,
              edgeType: edge > 10 ? 'high' : edge > 5 ? 'medium' : edge > 0 ? 'low' : 'negative'
            };
          } else {
            const impliedProbability = 1 / bookOdd;
            
            comparison = {
              market: '1H AH+0',
              outcome: label.includes('Home') ? 'Home' : 'Away',
              trueOdds: 0,
              bookmakerOdds: bookOdd,
              trueProbability: 0,
              impliedProbability,
              edge: -100,
              edgeType: 'negative' as const
            };
          }
          
          comparisons.push(comparison);
          console.log(`[DEBUG] Added 1H AH+0 ${label} comparison:`, comparison);
        } else {
          console.log(`[DEBUG] FAILED to add 1H AH+0 ${label} - validation failed`);
        }
      });
    }
    
    // Both Teams to Score - FIXED: Support new Monte Carlo engine format
    const bttsMarket = trueOdds.both_teams_score;
    if (bttsMarket && bookmakerOdds.both_teams_score) {
      ['yes', 'no'].forEach(outcome => {
        const trueOdd = bttsMarket[outcome];
        const bookOdd = bookmakerOdds.both_teams_score[outcome];
        
        console.log(`[DEBUG] BTTS ${outcome} validation:`, { trueOdd, bookOdd, trueOddType: typeof trueOdd, bookOddType: typeof bookOdd });
        
        if (typeof bookOdd === 'number' && bookOdd > 0) {
          let comparison;
          
          if (typeof trueOdd === 'number' && trueOdd > 0) {
            // Normal case: both true and book odds available
            const trueProbability = 1 / trueOdd;
            const impliedProbability = 1 / bookOdd;
            const edge = ((bookOdd / trueOdd) - 1) * 100;
            
            comparison = {
              market: 'BTTS',
              outcome: outcome.toUpperCase(),
              trueOdds: trueOdd,
              bookmakerOdds: bookOdd,
              trueProbability,
              impliedProbability,
              edge,
              edgeType: edge > 10 ? 'high' : edge > 5 ? 'medium' : edge > 0 ? 'low' : 'negative'
            };
          } else {
            // True odds are null (impossible outcome), but show bookmaker odds anyway
            const impliedProbability = 1 / bookOdd;
            
            comparison = {
              market: 'BTTS',
              outcome: outcome.toUpperCase(),
              trueOdds: 0, // Display as N/A in UI
              bookmakerOdds: bookOdd,
              trueProbability: 0,
              impliedProbability,
              edge: -100, // Negative edge for impossible outcomes
              edgeType: 'negative' as const
            };
          }
          
          comparisons.push(comparison);
          console.log(`[DEBUG] Added BTTS ${outcome} comparison:`, comparison);
        } else {
          console.log(`[DEBUG] FAILED to add BTTS ${outcome} - validation failed`);
        }
      });
    }
    
    // 1st Half Markets
    // 1st Half BTTS
    console.log('[DEBUG] Checking 1st Half BTTS market:', {
      hasFirstHalfGGTrue: !!trueOdds.first_half_gg,
      hasFirstHalfGGBook: !!bookmakerOdds.first_half_gg,
      trueMarketData: trueOdds.first_half_gg,
      bookMarketData: bookmakerOdds.first_half_gg
    });
    
    const firstHalfGGMarket = trueOdds.first_half_gg;
    if (firstHalfGGMarket && bookmakerOdds.first_half_gg) {
      ['yes', 'no'].forEach(outcome => {
        const trueOdd = firstHalfGGMarket[outcome];
        const bookOdd = bookmakerOdds.first_half_gg[outcome];
        
        console.log(`[DEBUG] 1st Half BTTS ${outcome} validation:`, { trueOdd, bookOdd, trueOddType: typeof trueOdd, bookOddType: typeof bookOdd });
        
        if (typeof bookOdd === 'number' && bookOdd > 0) {
          let comparison;
          
          if (typeof trueOdd === 'number' && trueOdd > 0) {
            // Normal case: both true and book odds available
            const trueProbability = 1 / trueOdd;
            const impliedProbability = 1 / bookOdd;
            const edge = ((bookOdd / trueOdd) - 1) * 100;
            
            comparison = {
              market: '1H BTTS',
              outcome: outcome === 'yes' ? 'Yes (GG 1H)' : 'No (NG 1H)',
              trueOdds: trueOdd,
              bookmakerOdds: bookOdd,
              trueProbability,
              impliedProbability,
              edge,
              edgeType: edge > 10 ? 'high' : edge > 5 ? 'medium' : edge > 0 ? 'low' : 'negative'
            };
          } else {
            // True odds are null (impossible outcome), but show bookmaker odds anyway
            const impliedProbability = 1 / bookOdd;
            
            comparison = {
              market: '1H BTTS',
              outcome: outcome === 'yes' ? 'Yes (GG 1H)' : 'No (NG 1H)',
              trueOdds: 0, // Display as N/A in UI
              bookmakerOdds: bookOdd,
              trueProbability: 0,
              impliedProbability,
              edge: -100, // Negative edge for impossible outcomes
              edgeType: 'negative' as const
            };
          }
          
          comparisons.push(comparison);
          console.log(`[DEBUG] Added 1st Half BTTS ${outcome} comparison:`, comparison);
        } else {
          console.log(`[DEBUG] FAILED to add 1st Half BTTS ${outcome} - validation failed`);
        }
      });
    }
    
    // 1st Half O/U 1.5
    console.log('[DEBUG] Checking 1st Half O/U 1.5 market:', {
      hasFirstHalfOU15True: !!trueOdds.first_half_ou15,
      hasFirstHalfOU15Book: !!bookmakerOdds.first_half_ou15,
      trueMarketData: trueOdds.first_half_ou15,
      bookMarketData: bookmakerOdds.first_half_ou15
    });
    
    const firstHalfOU15Market = trueOdds.first_half_ou15;
    if (firstHalfOU15Market && bookmakerOdds.first_half_ou15) {
      ['over', 'under'].forEach(outcome => {
        const trueOdd = firstHalfOU15Market[outcome];
        const bookOdd = bookmakerOdds.first_half_ou15[outcome];
        
        if (typeof trueOdd === 'number' && trueOdd > 0 && typeof bookOdd === 'number' && bookOdd > 0) {
          const trueProbability = 1 / trueOdd;
          const impliedProbability = 1 / bookOdd;
          const edge = ((bookOdd / trueOdd) - 1) * 100;
          
          comparisons.push({
            market: '1H O/U 1.5',
            outcome: outcome === 'over' ? 'Over' : 'Under',
            trueOdds: trueOdd,
            bookmakerOdds: bookOdd,
            trueProbability,
            impliedProbability,
            edge,
            edgeType: edge > 10 ? 'high' : edge > 5 ? 'medium' : edge > 0 ? 'low' : 'negative'
          });
        }
      });
    }
    
    // Sort by market order to match input section: 1X2 → Double Chance → AH+0 → AH±1 → BTTS → O/U → 1st Half
    const marketOrder = {
      '1X2 FT': 1,
      'O/U 2.5': 2,
      'O/U 3.0': 3,
      'O/U 3.5': 4,
      'BTTS': 5,
      'Double Chance': 6,
      'AH+0 FT': 7,
      'AH -1/+1': 8,
      'AH +1/-1': 9,
      '1X2 HT': 10,
      '1H AH+0': 11,
      '1H O/U 1.5': 12,
      'Goal Ranges': 13
    };
    
    const sortedComparisons = comparisons.sort((a, b) => {
      const orderA = marketOrder[a.market] || 999;
      const orderB = marketOrder[b.market] || 999;
      if (orderA !== orderB) return orderA - orderB;
      
      // Within same market, sort by outcome order
      const outcomeOrder = {
        'Home': 1, 'Draw': 2, 'Away': 3,
        'Home +0': 1, 'Away +0': 2,
        'Over': 1, 'Under': 2,
        'YES': 1, 'NO': 2,
        'Yes (GG 1H)': 1, 'No (NG 1H)': 2
      };
      return (outcomeOrder[a.outcome] || 0) - (outcomeOrder[b.outcome] || 0);
    });
    
    console.log(`[DEBUG] Final comparison count: ${sortedComparisons.length} odds pairs generated`);
    console.log(`[DEBUG] Markets included:`, sortedComparisons.map(c => `${c.market}-${c.outcome}`));
    
    return sortedComparisons;
  };
  
  const oddsComparisons = generateOddsComparison();
  
  const getEdgeColor = (edgeType: string, edge: number) => {
    switch (edgeType) {
      case 'high': return 'text-green-400 font-bold'; // Bright green for high contrast
      case 'medium': return 'text-yellow-400 font-semibold'; // Bright yellow
      case 'low': return 'text-blue-400 font-medium'; // Bright blue
      case 'negative': return 'text-danger'; // Red
      default: return 'text-text-secondary';
    }
  };
  
  const getEdgeIcon = (edgeType: string) => {
    switch (edgeType) {
      case 'high': return '🔥';
      case 'medium': return '⚡';
      case 'low': return '💡';
      case 'negative': return '❌';
      default: return '📊';
    }
  };

  const toggleBetSelection = (betId: string) => {
    setSelectedBets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(betId)) {
        newSet.delete(betId);
      } else {
        newSet.add(betId);
      }
      return newSet;
    });
  };

  const selectAllPositiveBets = () => {
    const positiveBets = oddsComparisons.filter(bet => bet.edge > 0).map(bet => `${bet.market}_${bet.outcome}`);
    setSelectedBets(new Set(positiveBets));
  };

  const deselectAllBets = () => {
    setSelectedBets(new Set());
  };

  const saveSelectedBets = async (overrideSimulationId?: number) => {
    if (selectedBets.size === 0) {
      return; // Don't show alert when called from parent
    }

    setSavingBets(true);
    try {
      // Get selected bet details
      const selectedBetDetails = oddsComparisons.filter(bet => 
        selectedBets.has(`${bet.market}_${bet.outcome}`)
      );

      // CRITICAL FIX: Validate simulation_id before saving bets
      const finalSimulationId = overrideSimulationId || simulationData?.simulationId;
      if (!finalSimulationId || finalSimulationId === 0) {
        console.error('❌ Cannot save bets: Invalid simulation_id', {
          overrideSimulationId,
          simulationDataId: simulationData?.simulationId,
          finalSimulationId
        });
        throw new Error('Cannot save bets without a valid simulation ID. Please run simulation first.');
      }
      
      console.log('✅ Saving bets with simulation_id:', finalSimulationId);
      
      // Save each selected bet
      for (const bet of selectedBetDetails) {
        const betData = {
          simulation_id: finalSimulationId,
          market_type: bet.market,
          market_option: bet.outcome,
          selected_odds: bet.bookmakerOdds,
          true_probability: bet.trueProbability,
          edge_percentage: bet.edge,
          actual_stake: 100, // Default stake amount
          league_id: simulationData?.league_id || 1,
          bet_reasoning: `Value bet with ${bet.edge.toFixed(1)}% edge`,
          confidence_level: bet.edge > 10 ? 'HIGH' : bet.edge > 5 ? 'MEDIUM' : 'LOW',
          bet_status: 'pending'
        };

        const response = await fetch('/api/place-bet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(betData)
        });

        if (!response.ok) {
          throw new Error(`Failed to save bet: ${bet.market} ${bet.outcome}`);
        }
      }

      // Update bankroll if callback provided
      onBankrollUpdate?.();
      
      // Clear selections
      setSelectedBets(new Set());
      
      // Only show alert if called directly (not from parent)
      if (!overrideSimulationId) {
        alert(`✅ Successfully saved ${selectedBetDetails.length} bets!`);
      }
    } catch (error) {
      console.error('Error saving bets:', error);
      if (!overrideSimulationId) {
        alert('❌ Failed to save some bets. Please try again.');
      }
    } finally {
      setSavingBets(false);
    }
  };

  const handleSaveSimulation = async () => {
    setIsSaving(true);
    try {
      // First save the simulation if it doesn't exist
      let simulationId = simulationData?.simulationId;
      
      if (!simulationId) {
        // Save simulation data
        const simData = {
          home_team_id: simulationData?.homeTeam?.id,
          away_team_id: simulationData?.awayTeam?.id,
          league_id: simulationData?.selectedLeague?.id,
          match_date: simulationData?.matchDate,
          distribution_type: simulationData?.distribution,
          iterations: simulationData?.iterations,
          home_boost: simulationData?.boosts?.home || 0,
          away_boost: simulationData?.boosts?.away || 0,
          home_advantage: simulationData?.boosts?.homeAdvantage || 0.10,
          true_odds: JSON.stringify(simulationResults?.results?.true_odds || simulationResults?.true_odds),
          value_bets: JSON.stringify(selectedBets.size > 0 ? Array.from(selectedBets) : [])
        };

        const simResponse = await fetch('/api/simulations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(simData)
        });

        if (simResponse.ok) {
          const simResult = await simResponse.json();
          simulationId = simResult.simulation_id;
        }
      }
      
      // Save selected bets with the simulation ID
      if (selectedBets.size > 0 && simulationId) {
        await saveSelectedBets(simulationId);
      }
      
      alert(`✅ Simulation saved successfully! ${selectedBets.size > 0 ? `${selectedBets.size} bets included.` : ''}`);
    } catch (error) {
      console.error('Error saving simulation:', error);
      alert('❌ Failed to save simulation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getSelectedBets: () => {
      return oddsComparisons.filter(bet => 
        selectedBets.has(`${bet.market}_${bet.outcome}`)
      );
    },
    saveSelectedBets
  }));
  
  return (
    <Card className="p-6">
      
      {oddsComparisons.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-text-secondary text-lg mb-2">No Odds Comparison Available</div>
          <div className="text-text-disabled text-sm">
            Complete simulation with bookmaker odds to view detailed comparison
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Bet Selection Controls */}
          {selectedBets.size > 0 && (
            <div className="p-3 bg-muted/30 rounded-lg mb-2">
              <span className="text-sm text-success font-medium">
                ✅ {selectedBets.size} bet{selectedBets.size !== 1 ? 's' : ''} selected for saving with simulation
              </span>
            </div>
          )}

          {/* Group bets by market type */}
          {(() => {
            // Group comparisons by market
            const groupedComparisons = oddsComparisons.reduce((acc, comparison) => {
              if (!acc[comparison.market]) {
                acc[comparison.market] = [];
              }
              acc[comparison.market].push(comparison);
              return acc;
            }, {} as Record<string, typeof oddsComparisons>);

            return Object.entries(groupedComparisons).map(([market, comparisons]) => (
              <div key={market} className="bg-card/30 rounded-lg p-2 border border-border">
                {/* Compact Market Header */}
                <div className="relative mb-1">
                  <h3 className="text-base font-semibold text-card-foreground text-center">
                    {market === '1X2 FT' ? 'Match Result (1X2) - Full Time' :
                     market === '1X2 HT' ? 'Match Result (1X2) - Half Time' :
                     market === 'Double Chance' ? 'Double Chance - Full Time' :
                     market === '1H Double Chance' ? 'Double Chance - 1st Half' :
                     market === 'AH+0 FT' ? 'Asian Handicap +0 - Full Time' :
                     market === '1H AH+0' ? 'Asian Handicap +0 - 1st Half' :
                     market === 'AH -1/+1' ? 'Asian Handicap -1/+1' :
                     market === 'AH +1/-1' ? 'Asian Handicap +1/-1' :
                     market === 'BTTS' ? 'Both Teams to Score - Full Time' :
                     market === '1H BTTS' ? 'Both Teams to Score - 1st Half' :
                     market === 'O/U 2.5' ? 'Over/Under 2.5 Goals' :
                     market === 'O/U 3.0' ? 'Over/Under 3.0 Goals' :
                     market === 'O/U 3.5' ? 'Over/Under 3.5 Goals' :
                     market === '1H O/U 1.5' ? '1st Half Over/Under 1.5 Goals' :
                     market === 'Goal Ranges' ? 'Goal Range Markets' :
                     market.startsWith('O/U') ? `${market} Goals` :
                     market}
                  </h3>
                </div>

                {/* Compact Bet Cards Grid */}
                <div className={`grid gap-1 ${
                  market === '1X2 FT' ? 'grid-cols-3' :
                  market === '1X2 HT' ? 'grid-cols-3' :
                  market === 'Double Chance' ? 'grid-cols-3' :
                  market === '1H Double Chance' ? 'grid-cols-3' :
                  market === 'AH+0 FT' ? 'grid-cols-2' :
                  market === '1H AH+0' ? 'grid-cols-2' :
                  market === 'AH -1/+1' ? 'grid-cols-2' :
                  market === 'AH +1/-1' ? 'grid-cols-2' :
                  market === 'BTTS' ? 'grid-cols-2' :
                  market === '1H BTTS' ? 'grid-cols-2' :
                  market === 'O/U 2.5' ? 'grid-cols-2' :
                  market === 'O/U 3.0' ? 'grid-cols-2' :
                  market === 'O/U 3.5' ? 'grid-cols-2' :
                  market === '1H O/U 1.5' ? 'grid-cols-2' :
                  market === 'Goal Ranges' ? 'grid-cols-4' :
                  'grid-cols-2'
                }`}>
                  {comparisons.map((comparison, index) => {
                    const betId = `${comparison.market}_${comparison.outcome}`;
                    const isSelected = selectedBets.has(betId);
                    const isPositiveEdge = comparison.edge > 0;
                    
                    return (
                      <div
                        key={`${comparison.market}-${comparison.outcome}-${index}`}
                        className={`relative p-2 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${
                          comparison.edgeType === 'high' ? 'bg-green-900/20 border-green-600/60' : 
                          comparison.edgeType === 'medium' ? 'bg-yellow-900/20 border-yellow-600/60' :
                          comparison.edgeType === 'low' ? 'bg-blue-900/20 border-blue-600/60' :
                          comparison.edgeType === 'negative' ? 'bg-gray-900/60 border-gray-700/80 opacity-40' : 
                          'bg-muted/30 border-border'
                        } ${isSelected ? 'ring-2 ring-primary' : ''} ${
                          !isPositiveEdge && comparison.edgeType !== 'negative' ? 'opacity-50' : ''
                        }`}
                        onClick={() => isPositiveEdge && toggleBetSelection(betId)}
                      >
                        {/* Checkbox */}
                        <div className="absolute top-2 right-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleBetSelection(betId)}
                            disabled={!isPositiveEdge}
                            className={`w-4 h-4 rounded transition-colors ${
                              !isPositiveEdge ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                            } ${isSelected ? 'bg-primary border-primary' : 'border-gray-400'}`}
                          />
                        </div>

                        {/* Compact Layout */}
                        <div className="pr-6">
                          {/* Bet Title */}
                          <div className="mb-2">
                            <div className="font-bold text-white text-sm text-center">
                              {comparison.outcome === 'Home' ? '1 - Home' :
                               comparison.outcome === 'Draw' ? 'X - Draw' :
                               comparison.outcome === 'Away' ? '2 - Away' :
                               `${comparison.outcome}`}
                            </div>
                          </div>

                          {/* Main Odds Row */}
                          <div className="flex justify-between items-center mb-1">
                            <div className="text-center flex-1">
                              <div className={`text-base font-bold rounded px-3 py-2 border text-center ${
                                comparison.trueOdds === 0 
                                  ? 'text-gray-400 bg-gray-600/40 border-gray-500/40' 
                                  : 'text-yellow-100 bg-yellow-600/60 border-yellow-400/40'
                              }`}>
                                {comparison.trueOdds === 0 ? 'N/A' : comparison.trueOdds.toFixed(2)}
                              </div>
                              <div className="text-xs text-yellow-300 mt-1 text-center">True Odds</div>
                            </div>
                            <div className="mx-2 flex flex-col items-center justify-center text-center">
                              <div className="text-gray-500 text-sm">vs</div>
                              <span className={`text-xs px-2 py-1 rounded mt-1 ${
                                comparison.edgeType === 'high' ? 'bg-green-600 text-white' :
                                comparison.edgeType === 'medium' ? 'bg-yellow-600 text-white' :
                                comparison.edgeType === 'low' ? 'bg-blue-600 text-white' :
                                'bg-red-600 text-white'
                              }`}>
                                {comparison.edge > 0 ? '+' : ''}{comparison.edge.toFixed(1)}%
                              </span>
                              {/* Odds Difference */}
                              <div className="text-xs text-gray-400 mt-1">
                                Δ {comparison.trueOdds === 0 ? 'N/A' : (comparison.bookmakerOdds - comparison.trueOdds).toFixed(2)}
                              </div>
                            </div>
                            <div className="text-center flex-1">
                              <div className="text-base font-bold text-sky-100 bg-sky-600/60 rounded px-3 py-2 border border-sky-400/40 text-center">
                                {comparison.bookmakerOdds.toFixed(2)}
                              </div>
                              <div className="text-xs text-sky-300 mt-1 text-center">Bookmaker</div>
                            </div>
                          </div>

                          {/* Probabilities Row */}
                          <div className="flex text-xs text-gray-400">
                            <div className="flex-1 text-center">
                              {comparison.trueProbability === 0 ? 'N/A' : `${(comparison.trueProbability * 100).toFixed(0)}%`}
                            </div>
                            <div className="mx-2"></div>
                            <div className="flex-1 text-center">{(comparison.impliedProbability * 100).toFixed(0)}%</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
          
          {/* Save Simulation Button */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <div className="text-sm text-text-secondary">
                {selectedBets.length > 0 && (
                  <span>✅ {selectedBets.length} bets selected for saving with simulation</span>
                )}
              </div>
              <button
                onClick={handleSaveSimulation}
                disabled={isSaving}
                className={`px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                  isSaving
                    ? 'bg-secondary text-text-disabled cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:opacity-90 focus:ring-2 focus:ring-ring'
                }`}
              >
                {isSaving ? '⏳ Saving...' : '💾 Save Simulation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
});

export default OddsComparison;