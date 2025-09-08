'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

interface OverallStats {
  total_bets: number;
  won_bets: number;
  lost_bets: number;
  pushed_bets: number;
  total_profit_loss: number;
  avg_edge: number;
  total_matches: number;
}

interface BetTypeStats {
  market_type: string;
  display_name?: string;
  total_bets: number;
  won_bets: number;
  lost_bets: number;
  pushed_bets: number;
  total_profit_loss: number;
  avg_edge: number;
  win_rate: number;
}

interface LeagueStats {
  league_name: string;
  league_id: number;
  total_bets: number;
  won_bets: number;
  lost_bets: number;
  pushed_bets: number;
  total_profit_loss: number;
  avg_edge: number;
  win_rate: number;
}

interface EdgeAnalysis {
  edge_range: string;
  total_bets: number;
  won_bets: number;
  lost_bets: number;
  pushed_bets: number;
  total_profit_loss: number;
  win_rate: number;
}

interface OddsAnalysis {
  odds_range: string;
  total_bets: number;
  won_bets: number;
  lost_bets: number;
  pushed_bets: number;
  total_profit_loss: number;
  win_rate: number;
  avg_odds: number;
}

interface RecentBet {
  id: number;
  market_type: string;
  market_option: string;
  input_odds: number;
  edge_percentage: number;
  actual_result: number | null;
  profit_loss: number | null;
  recorded_at: string;
  home_team_name: string;
  away_team_name: string;
  match_date: string;
  league_name: string;
}

interface MonthlyTrend {
  month: string;
  total_bets: number;
  won_bets: number;
  total_profit_loss: number;
  win_rate: number;
}

interface AnalyticsData {
  overallStats: OverallStats;
  betTypeStats: BetTypeStats[];
  leagueStats: LeagueStats[];
  edgeAnalysis: EdgeAnalysis[];
  oddsAnalysis: OddsAnalysis[];
  recentBets: RecentBet[];
  monthlyTrends: MonthlyTrend[];
}

interface LeagueDetailBreakdown {
  league_name: string;
  total_stats: {
    bets: number;
    win_rate: number;
    profit_loss: number;
  };
  bet_type_breakdown: Array<{
    market_type: string;
    bets: number;
    won: number;
    lost: number;
    pushed: number;
    win_rate: number;
    profit_loss: number;
  }>;
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<LeagueDetailBreakdown | null>(null);
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  const [loadingLeagueDetail, setLoadingLeagueDetail] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/betting-analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Error loading analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeagueDetail = async (leagueId: number, leagueName: string) => {
    try {
      setLoadingLeagueDetail(true);
      const response = await fetch(`/api/betting-analytics/league/${leagueId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedLeague(data);
        setShowLeagueModal(true);
      } else {
        console.error('Failed to fetch league details');
      }
    } catch (error) {
      console.error('Error fetching league details:', error);
    } finally {
      setLoadingLeagueDetail(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0.0%';
    return `${value.toFixed(1)}%`;
  };

  const getWinRateColor = (winRate: number): string => {
    if (winRate >= 60) return 'text-green-400';
    if (winRate >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProfitColor = (profit: number): string => {
    if (profit > 0) return 'text-green-400';
    if (profit < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading betting analytics...</div>
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4"></div>
          <h2 className="text-xl font-semibold text-card-foreground mb-2">Error Loading Analytics</h2>
          <p className="text-muted-foreground mb-6">{error || 'Failed to load analytics data'}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { overallStats, betTypeStats, leagueStats, edgeAnalysis, oddsAnalysis, recentBets, monthlyTrends } = analyticsData;
  const winRate = overallStats.total_bets > 0 ? (overallStats.won_bets / overallStats.total_bets) * 100 : 0;
  const roi = overallStats.total_bets > 0 ? (overallStats.total_profit_loss / (overallStats.total_bets * 100)) * 100 : 0; // Assuming average $100 stakes

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
                Betting Analytics Dashboard
              </h1>
              <p className="text-muted-foreground mt-1 font-medium" style={{ color: 'rgba(255, 255, 255, 0.60)' }}>
                Comprehensive betting performance analysis
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/history"
                className="px-4 py-2 text-sm font-medium text-card-foreground bg-secondary border border-border rounded-lg hover:bg-accent transition-colors"
                style={{ color: 'rgba(255, 255, 255, 0.87)' }}
              >
                📋 History
              </Link>
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-card-foreground bg-secondary border border-border rounded-lg hover:bg-accent transition-colors"
                style={{ color: 'rgba(255, 255, 255, 0.87)' }}
              >
                ← Back to Simulation
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card variant="pattern-discovery" padding="lg">
            <div className="text-2xl font-bold text-primary" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>
              {overallStats.total_bets}
            </div>
            <div className="text-sm text-muted-foreground" style={{ color: 'rgba(255, 255, 255, 0.60)' }}>Total Bets</div>
          </Card>
          
          <Card variant="pattern-discovery" padding="lg">
            <div className={`text-2xl font-bold ${getWinRateColor(winRate)}`}>
              {formatPercentage(winRate)}
            </div>
            <div className="text-sm text-muted-foreground" style={{ color: 'rgba(255, 255, 255, 0.60)' }}>Win Rate</div>
          </Card>
          
          <Card variant="pattern-discovery" padding="lg">
            <div className={`text-2xl font-bold ${getProfitColor(overallStats.total_profit_loss)}`}>
              {formatCurrency(overallStats.total_profit_loss)}
            </div>
            <div className="text-sm text-muted-foreground" style={{ color: 'rgba(255, 255, 255, 0.60)' }}>Total P&L</div>
          </Card>
          
          <Card variant="pattern-discovery" padding="lg">
            <div className="text-2xl font-bold text-warning" style={{ color: '#F59E0B' }}>
              {formatPercentage(overallStats.avg_edge)}
            </div>
            <div className="text-sm text-muted-foreground" style={{ color: 'rgba(255, 255, 255, 0.60)' }}>Average Edge</div>
          </Card>
          
          <Card variant="pattern-discovery" padding="lg">
            <div className={`text-2xl font-bold ${getProfitColor(roi)}`}>
              {formatPercentage(roi)}
            </div>
            <div className="text-sm text-muted-foreground" style={{ color: 'rgba(255, 255, 255, 0.60)' }}>ROI</div>
          </Card>
        </div>

        {/* Bet Type Performance */}
        <Card variant="pattern-discovery" padding="lg" className="mb-8">
          <h2 className="text-xl font-bold mb-6" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>
            Bet Type Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Market</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Total</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Won</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Lost</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Pushed</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Win Rate</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>P&L</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Avg Edge</th>
                </tr>
              </thead>
              <tbody>
                {betTypeStats.map((market, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>
                      {market.display_name || market.market_type.replace(/_/g, ' ').toUpperCase()}
                    </td>
                    <td className="py-3 px-4" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>{market.total_bets}</td>
                    <td className="py-3 px-4 text-green-400">{market.won_bets}</td>
                    <td className="py-3 px-4 text-red-400">{market.lost_bets}</td>
                    <td className="py-3 px-4 text-yellow-400">{market.pushed_bets || 0}</td>
                    <td className={`py-3 px-4 font-medium ${getWinRateColor(market.win_rate)}`}>
                      {formatPercentage(market.win_rate)}
                    </td>
                    <td className={`py-3 px-4 font-medium ${getProfitColor(market.total_profit_loss)}`}>
                      {formatCurrency(market.total_profit_loss)}
                    </td>
                    <td className="py-3 px-4 text-warning">{formatPercentage(market.avg_edge)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* League Performance */}
        <Card variant="pattern-discovery" padding="lg" className="mb-8">
          <h2 className="text-xl font-bold mb-6" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>
            League Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>League</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Bets</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Win Rate</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>P&L</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Avg Edge</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {leagueStats.map((league, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>
                      {league.league_name}
                    </td>
                    <td className="py-3 px-4" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>{league.total_bets}</td>
                    <td className={`py-3 px-4 font-medium ${getWinRateColor(league.win_rate)}`}>
                      {formatPercentage(league.win_rate)}
                    </td>
                    <td className={`py-3 px-4 font-medium ${getProfitColor(league.total_profit_loss)}`}>
                      {formatCurrency(league.total_profit_loss)}
                    </td>
                    <td className="py-3 px-4 text-warning">{formatPercentage(league.avg_edge)}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => fetchLeagueDetail(league.league_id, league.league_name)}
                        disabled={loadingLeagueDetail}
                        className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {loadingLeagueDetail ? 'Loading...' : 'View Details'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Edge Analysis */}
        <Card variant="pattern-discovery" padding="lg" className="mb-8">
          <h2 className="text-xl font-bold mb-6" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>
            Edge Analysis
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Edge Range</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Total Bets</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Won Bets</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Lost Bets</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Pushed Bets</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Win Rate</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Total P&L</th>
                </tr>
              </thead>
              <tbody>
                {edgeAnalysis.map((edge, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-3 px-4 font-medium text-warning">{edge.edge_range}</td>
                    <td className="py-3 px-4" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>{edge.total_bets}</td>
                    <td className="py-3 px-4 text-green-400">{edge.won_bets}</td>
                    <td className="py-3 px-4 text-red-400">{edge.lost_bets}</td>
                    <td className="py-3 px-4 text-yellow-400">{edge.pushed_bets || 0}</td>
                    <td className={`py-3 px-4 font-medium ${getWinRateColor(edge.win_rate)}`}>
                      {formatPercentage(edge.win_rate)}
                    </td>
                    <td className={`py-3 px-4 font-medium ${getProfitColor(edge.total_profit_loss)}`}>
                      {formatCurrency(edge.total_profit_loss)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Odds Range Analysis */}
        <Card variant="pattern-discovery" padding="lg" className="mb-8">
          <h2 className="text-xl font-bold mb-6" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>
            Odds Range Analysis
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Odds Range</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Category</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Total Bets</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Won Bets</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Lost Bets</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Pushed Bets</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Win Rate</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Total P&L</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Avg Odds</th>
                </tr>
              </thead>
              <tbody>
                {oddsAnalysis.map((odds, index) => {
                  const getOddsCategory = (range: string) => {
                    switch (range) {
                      case '1.00-1.49': return 'Heavy Favorites';
                      case '1.50-1.99': return 'Favorites';
                      case '2.00-2.99': return 'Moderate';
                      case '3.00-4.99': return 'Underdogs';
                      case '5.00+': return 'Long Shots';
                      default: return 'Unknown';
                    }
                  };

                  const getOddsRangeColor = (range: string) => {
                    switch (range) {
                      case '1.00-1.49': return 'text-blue-400';
                      case '1.50-1.99': return 'text-green-400';
                      case '2.00-2.99': return 'text-yellow-400';
                      case '3.00-4.99': return 'text-orange-400';
                      case '5.00+': return 'text-red-400';
                      default: return 'text-gray-400';
                    }
                  };

                  return (
                    <tr key={index} className="border-b border-border/50 hover:bg-muted/20">
                      <td className={`py-3 px-4 font-bold ${getOddsRangeColor(odds.odds_range)}`}>
                        {odds.odds_range}
                      </td>
                      <td className="py-3 px-4" style={{ color: 'rgba(255, 255, 255, 0.60)' }}>
                        {getOddsCategory(odds.odds_range)}
                      </td>
                      <td className="py-3 px-4" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>{odds.total_bets}</td>
                      <td className="py-3 px-4 text-green-400">{odds.won_bets}</td>
                      <td className="py-3 px-4 text-red-400">{odds.lost_bets || 0}</td>
                      <td className="py-3 px-4 text-blue-400">{odds.pushed_bets || 0}</td>
                      <td className={`py-3 px-4 font-medium ${getWinRateColor(odds.win_rate)}`}>
                        {formatPercentage(odds.win_rate)}
                      </td>
                      <td className={`py-3 px-4 font-medium ${getProfitColor(odds.total_profit_loss)}`}>
                        {formatCurrency(odds.total_profit_loss)}
                      </td>
                      <td className="py-3 px-4 text-warning">{odds.avg_odds ? odds.avg_odds.toFixed(2) : 'N/A'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Bet History */}
        <Card variant="pattern-discovery" padding="lg">
          <h2 className="text-xl font-bold mb-6" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>
            Recent Bet History (Last 20)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Date</th>
                  <th className="text-left py-3 px-2 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Match</th>
                  <th className="text-left py-3 px-2 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>League</th>
                  <th className="text-left py-3 px-2 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Market</th>
                  <th className="text-left py-3 px-2 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Odds</th>
                  <th className="text-left py-3 px-2 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Edge</th>
                  <th className="text-left py-3 px-2 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Result</th>
                  <th className="text-left py-3 px-2 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>P&L</th>
                </tr>
              </thead>
              <tbody>
                {recentBets.map((bet, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-2 px-2" style={{ color: 'rgba(255, 255, 255, 0.60)' }}>
                      {new Date(bet.recorded_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-2" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>
                      {bet.home_team_name && bet.away_team_name 
                        ? `${bet.home_team_name} vs ${bet.away_team_name}`
                        : `${bet.market_type} Manual Bet`
                      }
                    </td>
                    <td className="py-2 px-2" style={{ color: 'rgba(255, 255, 255, 0.60)' }}>
                      {bet.league_name}
                    </td>
                    <td className="py-2 px-2" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>
                      {(() => {
                        // Full Time Markets
                        if (bet.market_type === '1x2_ft' && bet.market_option === 'home') return '1X2 - Home Win';
                        if (bet.market_type === '1x2_ft' && bet.market_option === 'draw') return '1X2 - Draw';
                        if (bet.market_type === '1x2_ft' && bet.market_option === 'away') return '1X2 - Away Win';
                        if (bet.market_type === 'over_under_25' && bet.market_option === 'over') return 'Over/Under 2.5 - Over';
                        if (bet.market_type === 'over_under_25' && bet.market_option === 'under') return 'Over/Under 2.5 - Under';
                        if (bet.market_type === 'over_under_3' && bet.market_option === 'over') return 'Over/Under 3.0 - Over';
                        if (bet.market_type === 'over_under_3' && bet.market_option === 'under') return 'Over/Under 3.0 - Under';
                        if (bet.market_type === 'over_under_35' && bet.market_option === 'over') return 'Over/Under 3.5 - Over';
                        if (bet.market_type === 'over_under_35' && bet.market_option === 'under') return 'Over/Under 3.5 - Under';
                        if (bet.market_type === 'gg_ng' && bet.market_option === 'gg') return 'Both Teams to Score - Yes (GG)';
                        if (bet.market_type === 'gg_ng' && bet.market_option === 'ng') return 'Both Teams to Score - No (NG)';
                        if (bet.market_type === 'double_chance' && bet.market_option === '1x') return 'Double Chance - 1X (Home or Draw)';
                        if (bet.market_type === 'double_chance' && bet.market_option === '12') return 'Double Chance - 12 (Home or Away)';
                        if (bet.market_type === 'double_chance' && bet.market_option === '2x') return 'Double Chance - 2X (Away or Draw)';
                        if (bet.market_type === 'asian_handicap_0' && bet.market_option === 'home') return 'AH+0 - Home +0';
                        if (bet.market_type === 'asian_handicap_0' && bet.market_option === 'away') return 'AH+0 - Away +0';
                        if (bet.market_type === 'asian_handicap_minus1_plus1' && bet.market_option === 'home') return 'AH -1/+1 - Home -1';
                        if (bet.market_type === 'asian_handicap_minus1_plus1' && bet.market_option === 'away') return 'AH -1/+1 - Away +1';
                        if (bet.market_type === 'asian_handicap_plus1_minus1' && bet.market_option === 'home') return 'AH +1/-1 - Home +1';
                        if (bet.market_type === 'asian_handicap_plus1_minus1' && bet.market_option === 'away') return 'AH +1/-1 - Away -1';
                        
                        // Half Time Markets
                        if (bet.market_type === '1x2_ht' && bet.market_option === 'home') return '1X2 HT - Home Win';
                        if (bet.market_type === '1x2_ht' && bet.market_option === 'draw') return '1X2 HT - Draw';
                        if (bet.market_type === '1x2_ht' && bet.market_option === 'away') return '1X2 HT - Away Win';
                        if (bet.market_type === 'asian_handicap_0_ht' && bet.market_option === 'home') return 'AH+0 HT - Home +0';
                        if (bet.market_type === 'asian_handicap_0_ht' && bet.market_option === 'away') return 'AH+0 HT - Away +0';
                        if (bet.market_type === 'over_under_15_ht' && bet.market_option === 'over') return 'O/U 1.5 HT - Over';
                        if (bet.market_type === 'over_under_15_ht' && bet.market_option === 'under') return 'O/U 1.5 HT - Under';
                        
                        // Legacy Market Support
                        if (bet.market_type === 'over_under' && bet.market_option === 'over') return 'Over/Under - Over';
                        if (bet.market_type === 'over_under' && bet.market_option === 'under') return 'Over/Under - Under';
                        if (bet.market_type === 'both_teams_score' && bet.market_option === 'yes') return 'BTTS - Yes';
                        if (bet.market_type === 'both_teams_score' && bet.market_option === 'no') return 'BTTS - No';
                        if (bet.market_type === 'btts' && bet.market_option === 'yes') return 'BTTS - Yes';
                        if (bet.market_type === 'btts' && bet.market_option === 'no') return 'BTTS - No';
                        if (bet.market_type === 'asian_handicap' && bet.market_option === 'home') return 'Asian Handicap - Home';
                        if (bet.market_type === 'asian_handicap' && bet.market_option === 'away') return 'Asian Handicap - Away';
                        if (bet.market_type === 'ah_minus1_plus1' && bet.market_option === 'minus1') return 'AH -1/+1 - Home (-1)';
                        if (bet.market_type === 'ah_minus1_plus1' && bet.market_option === 'plus1') return 'AH -1/+1 - Away (+1)';
                        if (bet.market_type === 'ah_plus1_minus1' && bet.market_option === 'plus1') return 'AH +1/-1 - Home (+1)';
                        if (bet.market_type === 'ah_plus1_minus1' && bet.market_option === 'minus1') return 'AH +1/-1 - Away (-1)';
                        if (bet.market_type === '1x2' && bet.market_option === 'home') return '1X2 - Home Win';
                        if (bet.market_type === '1x2' && bet.market_option === 'draw') return '1X2 - Draw';
                        if (bet.market_type === '1x2' && bet.market_option === 'away') return '1X2 - Away Win';
                        if (bet.market_type === 'ou25' && bet.market_option === 'over') return 'Over/Under 2.5 - Over';
                        if (bet.market_type === 'ou25' && bet.market_option === 'under') return 'Over/Under 2.5 - Under';
                        if (bet.market_type === 'ou30' && bet.market_option === 'over') return 'Over/Under 3.0 - Over';
                        if (bet.market_type === 'ou30' && bet.market_option === 'under') return 'Over/Under 3.0 - Under';
                        if (bet.market_type === 'ou35' && bet.market_option === 'over') return 'Over/Under 3.5 - Over';
                        if (bet.market_type === 'ou35' && bet.market_option === 'under') return 'Over/Under 3.5 - Under';
                        if (bet.market_type === 'ou15' && bet.market_option === 'over') return 'Over/Under 1.5 - Over';
                        if (bet.market_type === 'ou15' && bet.market_option === 'under') return 'Over/Under 1.5 - Under';
                        if (bet.market_type === 'ou45' && bet.market_option === 'over') return 'Over/Under 4.5 - Over';
                        if (bet.market_type === 'ou45' && bet.market_option === 'under') return 'Over/Under 4.5 - Under';
                        if (bet.market_type === 'first_half_gg' && bet.market_option === 'yes') return '1H BTTS - Yes (GG 1H)';
                        if (bet.market_type === 'first_half_gg' && bet.market_option === 'no') return '1H BTTS - No (NG 1H)';
                        if (bet.market_type === 'first_half_ou15' && bet.market_option === 'over') return '1H O/U 1.5 - Over';
                        if (bet.market_type === 'first_half_ou15' && bet.market_option === 'under') return '1H O/U 1.5 - Under';
                        return `${bet.market_type.replace(/_/g, ' ').toUpperCase()} - ${bet.market_option.replace(/_/g, ' ').toUpperCase()}`;
                      })()}
                    </td>
                    <td className="py-2 px-2" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>
                      {bet.input_odds ? bet.input_odds.toFixed(2) : 'N/A'}
                    </td>
                    <td className="py-2 px-2 text-warning">
                      {formatPercentage(bet.edge_percentage)}
                    </td>
                    <td className="py-2 px-2">
                      {bet.actual_result === null ? (
                        <span className="text-yellow-400">Pending</span>
                      ) : bet.actual_result === 1 ? (
                        <span className="text-green-400">Won</span>
                      ) : bet.actual_result === 0.5 ? (
                        <span className="text-blue-400">Push</span>
                      ) : (
                        <span className="text-red-400">Lost</span>
                      )}
                    </td>
                    <td className="py-2 px-2">
                      {bet.profit_loss === null ? (
                        <span className="text-gray-400">-</span>
                      ) : (
                        <span className={getProfitColor(bet.profit_loss)}>
                          {formatCurrency(bet.profit_loss)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* League Detail Modal */}
      {showLeagueModal && selectedLeague && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto border border-border shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>
                {selectedLeague.league_name} - Detailed Breakdown
              </h2>
              <button
                onClick={() => setShowLeagueModal(false)}
                className="p-2 text-muted-foreground hover:text-card-foreground rounded-lg hover:bg-accent transition-colors"
                style={{ color: 'rgba(255, 255, 255, 0.60)' }}
              >
                ✕
              </button>
            </div>

            {/* League Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card padding="base">
                <div className="text-xl font-bold text-center" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>
                  {selectedLeague.total_stats.bets}
                </div>
                <div className="text-sm text-center" style={{ color: 'rgba(255, 255, 255, 0.60)' }}>Total Bets</div>
              </Card>
              <Card padding="base">
                <div className={`text-xl font-bold text-center ${getWinRateColor(selectedLeague.total_stats.win_rate)}`}>
                  {formatPercentage(selectedLeague.total_stats.win_rate)}
                </div>
                <div className="text-sm text-center" style={{ color: 'rgba(255, 255, 255, 0.60)' }}>Win Rate</div>
              </Card>
              <Card padding="base">
                <div className={`text-xl font-bold text-center ${getProfitColor(selectedLeague.total_stats.profit_loss)}`}>
                  {formatCurrency(selectedLeague.total_stats.profit_loss)}
                </div>
                <div className="text-sm text-center" style={{ color: 'rgba(255, 255, 255, 0.60)' }}>Total P&L</div>
              </Card>
            </div>

            {/* Bet Type Breakdown */}
            <h3 className="text-lg font-bold mb-4" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>
              Bet Type Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Market Type</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Bets</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Won</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Lost</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Pushed</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>Win Rate</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLeague.bet_type_breakdown.map((breakdown, index) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="py-3 px-4 font-medium" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>
                        {breakdown.market_type}
                      </td>
                      <td className="py-3 px-4" style={{ color: 'rgba(255, 255, 255, 0.87)' }}>{breakdown.bets}</td>
                      <td className="py-3 px-4 text-green-400">{breakdown.won}</td>
                      <td className="py-3 px-4 text-red-400">{breakdown.lost}</td>
                      <td className="py-3 px-4 text-yellow-400">{breakdown.pushed || 0}</td>
                      <td className={`py-3 px-4 font-medium ${getWinRateColor(breakdown.win_rate)}`}>
                        {formatPercentage(breakdown.win_rate)}
                      </td>
                      <td className={`py-3 px-4 font-medium ${getProfitColor(breakdown.profit_loss)}`}>
                        {formatCurrency(breakdown.profit_loss)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-6 pt-6 border-t border-border">
              <button
                onClick={() => setShowLeagueModal(false)}
                className="px-4 py-2 text-sm font-medium text-card-foreground bg-secondary border border-border rounded-lg hover:bg-accent transition-colors"
                style={{ color: 'rgba(255, 255, 255, 0.87)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}