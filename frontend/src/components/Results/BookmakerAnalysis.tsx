import React, { useState, useMemo } from 'react';

interface BookmakerOdds {
  '1x2': {
    home: number;
    draw: number;
    away: number;
  };
  over_under: {
    [key: string]: { over: number; under: number };
  };
  both_teams_score: {
    yes: number;
    no: number;
  };
  first_half_gg?: {
    yes: number;
    no: number;
  };
}

interface TrueOdds {
  '1x2': {
    home: number;
    draw: number;
    away: number;
  };
  over_under: {
    [key: string]: number;
  };
  both_teams_score: {
    yes: number;
    no: number;
  };
}

interface BookmakerAnalysisProps {
  simulationResults: any;
  bookmakerOdds: any;
  leagueContext: any;
}

interface MarketAnalysis {
  market: string;
  margin: number;
  efficiency: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  publicMoney: 'Home' | 'Away' | 'Draw' | 'Over' | 'Under' | 'Neutral';
  recommendation: string;
  details: string;
}

const BookmakerAnalysis: React.FC<BookmakerAnalysisProps> = ({
  simulationResults,
  bookmakerOdds,
  leagueContext
}) => {
  // Extract data from props with null checks
  const trueOdds = simulationResults?.true_odds || {};
  const homeTeamName = simulationResults?.home_team || leagueContext?.home_team || 'Home Team';
  const awayTeamName = simulationResults?.away_team || leagueContext?.away_team || 'Away Team';
  const [activeAnalysis, setActiveAnalysis] = useState('margins');

  // Calculate market margins
  const calculateMargin = (odds: number[]): number => {
    const validOdds = odds.filter(odd => odd > 0);
    if (validOdds.length === 0) return 0;
    
    const impliedProbabilities = validOdds.map(odd => 1 / odd);
    const totalProbability = impliedProbabilities.reduce((sum, prob) => sum + prob, 0);
    return ((totalProbability - 1) * 100);
  };

  // Helper functions
  const getMarketRecommendation = (margin: number, publicMoney: string): string => {
    if (margin < 3) return 'Excellent market efficiency - look for value bets';
    if (margin < 5) return 'Good market - moderate opportunities';
    if (publicMoney !== 'Neutral') return `Avoid ${publicMoney.toLowerCase()} bias - consider opposite`;
    return 'High margin market - be selective';
  };

  const getOURecommendation = (margin: number, bias: string): string => {
    if (margin < 2) return 'Very efficient O/U market';
    if (bias === 'Over') return 'Public favors overs - consider under bets';
    if (bias === 'Under') return 'Public favors unders - consider over bets';
    return 'Balanced O/U market';
  };

  const getBTTSRecommendation = (margin: number, bias: string): string => {
    if (margin < 3) return 'Efficient BTTS market';
    if (bias === 'Over') return 'Public expects goals - consider No BTTS';
    if (bias === 'Under') return 'Public expects few goals - consider Yes BTTS';
    return 'Standard BTTS market';
  };

  const getPublicMoneyAnalysis = (publicMoney: string, home: string, away: string): string => {
    switch (publicMoney) {
      case 'Home': return `Public money on ${home} - inflated odds`;
      case 'Away': return `Public money on ${away} - inflated odds`;
      case 'Draw': return 'Unusual public draw bias detected';
      default: return 'No significant public bias detected';
    }
  };

  const getEfficiencyColor = (efficiency: string): string => {
    switch (efficiency) {
      case 'Excellent': return 'bg-success/10 text-success border-success/20';
      case 'Good': return 'bg-primary/10 text-primary border-primary/20';
      case 'Fair': return 'bg-warning/10 text-warning border-warning/20';
      case 'Poor': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getEfficiencyIcon = (efficiency: string): string => {
    switch (efficiency) {
      case 'Excellent': return '🎯';
      case 'Good': return '✅';
      case 'Fair': return '⚠️';
      case 'Poor': return '❌';
      default: return '➖';
    }
  };

  // Analyze markets
  const marketAnalyses = useMemo(() => {
    const analyses: MarketAnalysis[] = [];

    // 1X2 Market Analysis
    if (bookmakerOdds['1x2']) {
      const odds1x2 = [
        bookmakerOdds['1x2'].home,
        bookmakerOdds['1x2'].draw,
        bookmakerOdds['1x2'].away
      ];
      const margin1x2 = calculateMargin(odds1x2);
      
      // Determine public money bias - with safe access to trueOdds
      let publicMoney: 'Home' | 'Away' | 'Draw' | 'Neutral' = 'Neutral';
      const homeProb = 1 / bookmakerOdds['1x2'].home;
      const awayProb = 1 / bookmakerOdds['1x2'].away;
      
      // Handle different trueOdds structures - check both 1x2 and match_outcomes
      const trueMatchOdds = trueOdds['1x2'] || trueOdds.match_outcomes;
      if (trueMatchOdds) {
        const trueHomeProb = 1 / (trueMatchOdds.home || trueMatchOdds.home_win || 1);
        const trueAwayProb = 1 / (trueMatchOdds.away || trueMatchOdds.away_win || 1);
        
        if (homeProb > trueHomeProb * 1.05) publicMoney = 'Home';
        else if (awayProb > trueAwayProb * 1.05) publicMoney = 'Away';
      }

      analyses.push({
        market: '1X2',
        margin: margin1x2,
        efficiency: margin1x2 < 3 ? 'Excellent' : margin1x2 < 5 ? 'Good' : margin1x2 < 8 ? 'Fair' : 'Poor',
        publicMoney,
        recommendation: getMarketRecommendation(margin1x2, publicMoney),
        details: `${margin1x2.toFixed(2)}% margin. ${getPublicMoneyAnalysis(publicMoney, homeTeamName, awayTeamName)}`
      });
    }

    // Over/Under Markets Analysis
    Object.entries(bookmakerOdds.over_under || {}).forEach(([key, odds]) => {
      if (odds.over && odds.under) {
        const ouOdds = [odds.over, odds.under];
        const marginOU = calculateMargin(ouOdds);
        
        // Determine bias towards over/under
        const overProb = 1 / odds.over;
        const underProb = 1 / odds.under;
        const publicBias = overProb > underProb * 1.1 ? 'Over' : 
                          underProb > overProb * 1.1 ? 'Under' : 'Neutral';

        const goalsLine = key.replace('ou', '').replace('5', '.5');
        
        analyses.push({
          market: `O/U ${goalsLine}`,
          margin: marginOU,
          efficiency: marginOU < 2 ? 'Excellent' : marginOU < 4 ? 'Good' : marginOU < 6 ? 'Fair' : 'Poor',
          publicMoney: publicBias as any,
          recommendation: getOURecommendation(marginOU, publicBias),
          details: `${marginOU.toFixed(2)}% margin. Public ${publicBias === 'Neutral' ? 'evenly split' : `favors ${publicBias.toLowerCase()}`}`
        });
      }
    });

    // Both Teams Score Analysis
    if (bookmakerOdds.both_teams_score?.yes && bookmakerOdds.both_teams_score?.no) {
      const ggOdds = [bookmakerOdds.both_teams_score.yes, bookmakerOdds.both_teams_score.no];
      const marginGG = calculateMargin(ggOdds);
      
      const yesProb = 1 / bookmakerOdds.both_teams_score.yes;
      const noProb = 1 / bookmakerOdds.both_teams_score.no;
      const publicBias = yesProb > noProb * 1.1 ? 'Over' : 
                        noProb > yesProb * 1.1 ? 'Under' : 'Neutral';

      analyses.push({
        market: 'Both Teams Score',
        margin: marginGG,
        efficiency: marginGG < 3 ? 'Excellent' : marginGG < 5 ? 'Good' : marginGG < 7 ? 'Fair' : 'Poor',
        publicMoney: publicBias as any,
        recommendation: getBTTSRecommendation(marginGG, publicBias),
        details: `${marginGG.toFixed(2)}% margin. ${publicBias === 'Neutral' ? 'Balanced market' : `Slight bias toward ${publicBias === 'Over' ? 'Yes' : 'No'}`}`
      });
    }

    return analyses;
  }, [bookmakerOdds, trueOdds, homeTeamName, awayTeamName]);

  // Calculate overall bookmaker assessment
  const overallAssessment = useMemo(() => {
    if (marketAnalyses.length === 0) return null;

    const avgMargin = marketAnalyses.reduce((sum, analysis) => sum + analysis.margin, 0) / marketAnalyses.length;
    const excellentMarkets = marketAnalyses.filter(a => a.efficiency === 'Excellent').length;
    const poorMarkets = marketAnalyses.filter(a => a.efficiency === 'Poor').length;
    const publicBiases = marketAnalyses.filter(a => a.publicMoney !== 'Neutral').length;

    let assessment = 'Standard';
    let recommendation = '';
    let color = 'text-muted-foreground';

    if (avgMargin < 3 && excellentMarkets >= 2) {
      assessment = 'Sharp Bookmaker';
      recommendation = 'Highly efficient pricing - look for specific value spots';
      color = 'text-destructive';
    } else if (avgMargin > 6 || poorMarkets >= 2) {
      assessment = 'Recreational Bookmaker';
      recommendation = 'Higher margins - more value opportunities available';
      color = 'text-success';
    } else if (publicBiases >= 2) {
      assessment = 'Public-Influenced Lines';
      recommendation = 'Multiple public biases detected - fade the public';
      color = 'text-primary';
    }

    return {
      assessment,
      recommendation,
      color,
      avgMargin,
      stats: {
        excellentMarkets,
        poorMarkets,
        publicBiases
      }
    };
  }, [marketAnalyses]);

  const tabs = [
    { key: 'margins', label: 'Market Margins' },
    { key: 'efficiency', label: 'Market Efficiency' },
    { key: 'bias', label: 'Public Money Analysis' }
  ];

  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-lg">
      <h2 className="text-xl font-bold mb-6 text-card-foreground">📊 Bookmaker Analysis</h2>

      {/* Overall Assessment */}
      {overallAssessment && (
        <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-card-foreground">Overall Assessment</h3>
            <span className={`font-bold text-lg ${overallAssessment.color}`}>
              {overallAssessment.assessment}
            </span>
          </div>
          <p className="text-muted-foreground mb-3">{overallAssessment.recommendation}</p>
          <div className="grid grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="text-lg font-bold text-card-foreground">
                {overallAssessment.avgMargin.toFixed(1)}%
              </div>
              <div className="text-muted-foreground">Avg Margin</div>
            </div>
            <div>
              <div className="text-lg font-bold text-success">
                {overallAssessment.stats.excellentMarkets}
              </div>
              <div className="text-muted-foreground">Efficient Markets</div>
            </div>
            <div>
              <div className="text-lg font-bold text-destructive">
                {overallAssessment.stats.poorMarkets}
              </div>
              <div className="text-muted-foreground">Poor Markets</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">
                {overallAssessment.stats.publicBiases}
              </div>
              <div className="text-muted-foreground">Public Biases</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveAnalysis(tab.key)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeAnalysis === tab.key
                ? 'bg-primary text-primary-foreground border-b-2 border-primary'
                : 'bg-muted text-card-foreground hover:bg-accent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Market Analysis */}
      <div className="space-y-4">
        {marketAnalyses.map((analysis, index) => (
          <div key={index} className="p-4 border border-border rounded-lg bg-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">{getEfficiencyIcon(analysis.efficiency)}</span>
                <h3 className="font-semibold text-card-foreground">{analysis.market}</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getEfficiencyColor(analysis.efficiency)}`}>
                {analysis.efficiency}
              </span>
            </div>

            {activeAnalysis === 'margins' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Margin:</span>
                  <div className="text-lg font-bold text-destructive">
                    {analysis.margin.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Efficiency:</span>
                  <div className="text-lg font-bold text-primary">
                    {analysis.efficiency}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Fair Margin:</span>
                  <div className="text-lg font-bold text-success">
                    &lt;{analysis.market === '1X2' ? '5' : analysis.market.includes('O/U') ? '4' : '6'}%
                  </div>
                </div>
              </div>
            )}

            {activeAnalysis === 'efficiency' && (
              <div>
                <p className="text-muted-foreground mb-2">{analysis.recommendation}</p>
                <div className="text-sm text-muted-foreground">
                  Efficiency rating based on market margin and competitive standards
                </div>
              </div>
            )}

            {activeAnalysis === 'bias' && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-card-foreground">Public Bias:</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    analysis.publicMoney === 'Neutral' 
                      ? 'bg-muted text-muted-foreground' 
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {analysis.publicMoney}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">{analysis.details}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Analysis Legend */}
      <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
        <h4 className="font-medium text-primary mb-2">📊 Analysis Guide</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <strong>Market Efficiency:</strong>
            <ul className="mt-1 space-y-1">
              <li>🎯 Excellent: &lt;3-5% margin</li>
              <li>✅ Good: 3-6% margin</li>
              <li>⚠️ Fair: 6-8% margin</li>
              <li>❌ Poor: &gt;8% margin</li>
            </ul>
          </div>
          <div>
            <strong>Public Money Indicators:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Odds shifted away from true probability</li>
              <li>• Popular teams/overs get inflated backing</li>
              <li>• Smart money often fades public bias</li>
              <li>• Look for value on less popular sides</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookmakerAnalysis;