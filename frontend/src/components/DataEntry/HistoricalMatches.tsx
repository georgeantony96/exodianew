import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';

interface Match {
  id?: number;
  home_team: string;
  away_team: string;
  home_score_ft: number;
  away_score_ft: number;
  match_date?: string;
  home_team_name?: string;
  away_team_name?: string;
  context_type?: string;
}

interface Team {
  id: number;
  name: string;
}

interface HistoricalMatchesProps {
  homeTeam: Team;
  awayTeam: Team;
  historicalMatches: {
    h2h: any[];
    home_home: any[];
    away_away: any[];
  };
  onMatchesUpdate: (matches: any) => void;
}

const HistoricalMatches: React.FC<HistoricalMatchesProps> = ({
  homeTeam,
  awayTeam,
  historicalMatches,
  onMatchesUpdate
}) => {
  const homeTeamName = homeTeam.name;
  const awayTeamName = awayTeam.name;
  const [activeTab, setActiveTab] = useState('h2h');
  const [matches, setMatches] = useState<{ [key: string]: Match[] }>(() => {
    const initialMatches = {
      h2h: historicalMatches.h2h.length > 0 ? historicalMatches.h2h.map(m => ({
        home_team: m.home_team || homeTeamName, away_team: m.away_team || awayTeamName, 
        home_score_ft: m.home_score_ft || 0, away_score_ft: m.away_score_ft || 0 
      })) : Array(9).fill(null).map(() => ({ 
        home_team: homeTeamName, away_team: awayTeamName, 
        home_score_ft: 0, away_score_ft: 0 
      })),
      home_home: historicalMatches.home_home.length > 0 ? historicalMatches.home_home.map(m => ({
        home_team: m.home_team || homeTeamName, away_team: m.away_team || '', 
        home_score_ft: m.home_score_ft || 0, away_score_ft: m.away_score_ft || 0 
      })) : Array(9).fill(null).map(() => ({ 
        home_team: homeTeamName, away_team: '', 
        home_score_ft: 0, away_score_ft: 0 
      })),
      away_away: historicalMatches.away_away.length > 0 ? historicalMatches.away_away.map(m => ({
        home_team: m.home_team || '', away_team: m.away_team || awayTeamName, 
        home_score_ft: m.home_score_ft || 0, away_score_ft: m.away_score_ft || 0 
      })) : Array(9).fill(null).map(() => ({ 
        home_team: '', away_team: awayTeamName, 
        home_score_ft: 0, away_score_ft: 0 
      }))
    };
    return initialMatches;
  });

  const tabs = [
    { key: 'h2h', label: 'Head-to-Head', count: 9 },
    { key: 'home_home', label: `${homeTeamName} (Home)`, count: 9 },
    { key: 'away_away', label: `${awayTeamName} (Away)`, count: 9 }
  ];

  const updateMatch = (tabKey: string, index: number, field: string, value: string | number) => {
    const updatedMatches = { ...matches };
    if (!updatedMatches[tabKey][index]) {
      updatedMatches[tabKey][index] = { 
        home_team: '', away_team: '', 
        home_score_ft: 0, away_score_ft: 0 
      };
    }
    updatedMatches[tabKey][index] = {
      ...updatedMatches[tabKey][index],
      [field]: value
    };
    setMatches(updatedMatches);
    onMatchesUpdate(updatedMatches);
  };

  const addMatch = (tabKey: string) => {
    const updatedMatches = { ...matches };
    
    // Create new match with proper team positioning
    let newMatch = { 
      home_team: '', away_team: '', 
      home_score_ft: 0, away_score_ft: 0 
    };
    
    // Pre-fill the known team based on tab
    if (tabKey === 'h2h') {
      newMatch.home_team = homeTeamName;
      newMatch.away_team = awayTeamName;
    } else if (tabKey === 'home_home') {
      newMatch.home_team = homeTeamName;
    } else if (tabKey === 'away_away') {
      newMatch.away_team = awayTeamName;
    }
    
    updatedMatches[tabKey].push(newMatch);
    setMatches(updatedMatches);
    onMatchesUpdate(updatedMatches);
  };

  const removeMatch = (tabKey: string, index: number) => {
    const updatedMatches = { ...matches };
    updatedMatches[tabKey].splice(index, 1);
    setMatches(updatedMatches);
    onMatchesUpdate(updatedMatches);
  };

  // Delete saved historical match from database
  const deleteHistoricalMatch = async (matchId: number, tabKey: string, index: number) => {
    if (!matchId) return;
    
    const confirmDelete = window.confirm('Are you sure you want to delete this historical match? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/historical-data?id=${matchId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Remove from local state
        const updatedMatches = { ...matches };
        updatedMatches[tabKey].splice(index, 1);
        setMatches(updatedMatches);
        onMatchesUpdate(updatedMatches);
        
        // Show success message
        alert('Historical match deleted successfully!');
      } else {
        alert('Failed to delete match: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting historical match:', error);
      alert('Error deleting match. Please try again.');
    }
  };

  // Realistic football score generator based on common match outcomes
  const generateRandomScore = () => {
    const rand = Math.random();
    // 0 goals: 35%, 1 goal: 30%, 2 goals: 20%, 3 goals: 10%, 4+ goals: 5%
    if (rand < 0.35) return 0;
    if (rand < 0.65) return 1;
    if (rand < 0.85) return 2;
    if (rand < 0.95) return 3;
    return Math.floor(Math.random() * 2) + 4; // 4 or 5 goals (rare)
  };
  
  const autoFillRandomData = (tabKey: string) => {
    const updatedMatches = { ...matches };
    const currentMatches = updatedMatches[tabKey];
    
    // Ensure we have at least 9 matches
    while (currentMatches.length < 9) {
      currentMatches.push({ 
        home_team: '', away_team: '', 
        home_score_ft: 0, away_score_ft: 0 
      });
    }
    
    // Fill with random data for all 9 matches
    currentMatches.forEach((match, index) => {
      if (index < 9) { // Fill all 9 matches
        // Generate random FT scores directly
        const homeFT = generateRandomScore();
        const awayFT = generateRandomScore();
        
        // Set proper team names based on context
        if (tabKey === 'h2h') {
          match.home_team = homeTeamName;
          match.away_team = awayTeamName;
        } else if (tabKey === 'home_home') {
          match.home_team = homeTeamName;
          match.away_team = `Opponent ${index + 1}`;
        } else if (tabKey === 'away_away') {
          match.home_team = `Opponent ${index + 1}`;
          match.away_team = awayTeamName;
        }
        
        match.home_score_ft = homeFT;
        match.away_score_ft = awayFT;
      }
    });
    
    setMatches(updatedMatches);
    onMatchesUpdate(updatedMatches);
  };

  const renderMatchRow = (match: Match, tabKey: string, index: number) => {
    const isSavedMatch = match.id !== undefined;
    const isReadOnlyMatch = isSavedMatch && (match.home_team_name || match.away_team_name);
    const isHomeTeamFixed = tabKey === 'home_home' || tabKey === 'h2h' || tabKey === 'away_away';
    const isAwayTeamFixed = tabKey === 'away_away' || tabKey === 'h2h' || tabKey === 'home_home';
    
    return (
      <tr key={index} className={`border-b border-border hover:bg-muted/50 transition-colors ${isSavedMatch ? 'bg-primary/5' : ''}`}>
        {/* Home Team Column */}
        <td className="p-3">
          {isReadOnlyMatch ? (
            <div className="p-2 text-sm text-card-foreground font-medium">
              {match.home_team_name || match.home_team}
            </div>
          ) : isHomeTeamFixed ? (
            <div className="p-2 text-sm text-card-foreground font-medium bg-primary/10 rounded border">
              {tabKey === 'h2h' ? homeTeamName : 
               tabKey === 'home_home' ? homeTeamName : 
               'Opponent'}
            </div>
          ) : (
            <input
              type="text"
              value={match.home_team}
              onChange={(e) => updateMatch(tabKey, index, 'home_team', e.target.value)}
              placeholder="Opponent"
              className="w-full p-2 border border-border rounded-lg text-sm bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
            />
          )}
        </td>
        
        {/* Away Team Column */}
        <td className="p-3">
          {isReadOnlyMatch ? (
            <div className="p-2 text-sm text-card-foreground font-medium">
              {match.away_team_name || match.away_team}
            </div>
          ) : isAwayTeamFixed ? (
            <div className="p-2 text-sm text-card-foreground font-medium bg-primary/10 rounded border">
              {tabKey === 'h2h' ? awayTeamName : 
               tabKey === 'away_away' ? awayTeamName : 
               'Opponent'}
            </div>
          ) : (
            <input
              type="text"
              value={match.away_team}
              onChange={(e) => updateMatch(tabKey, index, 'away_team', e.target.value)}
              placeholder="Opponent"
              className="w-full p-2 border border-border rounded-lg text-sm bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
            />
          )}
        </td>
        
        {/* Final Score */}
        <td className="p-3">
          <div className="flex gap-1">
            <input
              type="number"
              min="0"
              value={match.home_score_ft}
              onChange={(e) => updateMatch(tabKey, index, 'home_score_ft', parseInt(e.target.value) || 0)}
              className="w-16 p-2 border border-border rounded-lg text-sm text-center bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors font-bold"
              placeholder="0"
              readOnly={isReadOnlyMatch}
            />
            <span className="text-sm self-center text-muted-foreground font-bold">-</span>
            <input
              type="number"
              min="0"
              value={match.away_score_ft}
              onChange={(e) => updateMatch(tabKey, index, 'away_score_ft', parseInt(e.target.value) || 0)}
              className="w-16 p-2 border border-border rounded-lg text-sm text-center bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors font-bold"
              placeholder="0"
              readOnly={isReadOnlyMatch}
            />
          </div>
        </td>
        
        {/* Action Column */}
        <td className="p-2">
          {isSavedMatch ? (
            <div className="flex gap-1">
              <span className="px-2 py-1 bg-success/10 text-success rounded text-xs font-medium border border-success/20">
                Saved
              </span>
              <button
                onClick={() => deleteHistoricalMatch(match.id!, tabKey, index)}
                className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs hover:opacity-80 transition-opacity"
                title="Delete this historical match"
              >
                🗑️ Delete
              </button>
            </div>
          ) : (
            <button
              onClick={() => removeMatch(tabKey, index)}
              className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs hover:opacity-80 transition-opacity"
              title="Remove this row"
            >
              ✕
            </button>
          )}
        </td>
      </tr>
    );
  };

  if (!homeTeam || !awayTeam) {
    return (
      <div className="bg-muted p-6 rounded-lg border border-border">
        <p className="text-muted-foreground">Please select both teams first</p>
      </div>
    );
  }

  return (
    <Card variant="pattern-discovery" padding="lg">
      <h2 className="text-xl font-bold mb-4 text-card-foreground">Historical Match Data</h2>
      
      
      <div className="flex flex-wrap gap-2 mb-4 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground border-b-2 border-primary'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            {tab.label} ({matches[tab.key]?.length || tab.count})
          </button>
        ))}
      </div>

      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {activeTab === 'h2h' ? `Historical ${homeTeamName} vs ${awayTeamName} matches (teams auto-filled)` :
           activeTab === 'home_home' ? `${homeTeamName} home matches vs any opponent` :
           `${awayTeamName} away matches vs any opponent`}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => addMatch(activeTab)}
            className="px-3 py-1 bg-success/80 text-success-foreground rounded text-sm hover:bg-success/70 transition-colors"
          >
            ➕ Add Row
          </button>
          <button
            onClick={() => autoFillRandomData(activeTab)}
            className="px-3 py-1 bg-purple-600/80 text-white rounded text-sm hover:bg-purple-600/70 transition-colors"
          >
            🎲 Auto-fill Random Data
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-muted border-b-2 border-border">
              <th className="p-3 text-left font-semibold text-card-foreground">
                {activeTab === 'h2h' ? homeTeamName : 
                 activeTab === 'home_home' ? homeTeamName : 
                 'Home Team'}
              </th>
              <th className="p-3 text-left font-semibold text-card-foreground">
                {activeTab === 'h2h' ? awayTeamName : 
                 activeTab === 'away_away' ? awayTeamName : 
                 'Away Team'}
              </th>
              <th className="p-3 text-left font-semibold text-card-foreground">Final Score</th>
              <th className="p-3 text-left font-semibold text-card-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {matches[activeTab]?.map((match, index) => 
              renderMatchRow(match, activeTab, index)
            )}
          </tbody>
        </table>
      </div>


    </Card>
  );
};

export default HistoricalMatches;