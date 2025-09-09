import React, { useState, useEffect } from 'react';
import { AutocompleteInput } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface Team {
  id: number;
  name: string;
}

interface TeamSelectorProps {
  onTeamSelect: (homeTeam: Team | null, awayTeam: Team | null) => void;
  selectedHomeTeam: Team | null;
  selectedAwayTeam: Team | null;
  leagueFilter?: number;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({
  onTeamSelect,
  selectedHomeTeam,
  selectedAwayTeam,
  leagueFilter
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [homeTeamSearch, setHomeTeamSearch] = useState('');
  const [awayTeamSearch, setAwayTeamSearch] = useState('');
  const [homeDropdownOpen, setHomeDropdownOpen] = useState(false);
  const [awayDropdownOpen, setAwayDropdownOpen] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, [leagueFilter]);

  const fetchTeams = async () => {
    try {
      const url = leagueFilter ? `/api/teams?league_id=${leagueFilter}` : '/api/teams';
      const response = await fetch(url);
      const data = await response.json();
      const loadedTeams = data.teams || [];
      setTeams(loadedTeams);
      
      // Auto-select Home/Away teams if they exist and no teams are selected
      if (loadedTeams.length > 0 && !selectedHomeTeam && !selectedAwayTeam) {
        const homeTeam = loadedTeams.find(team => team.name.toLowerCase().includes('home'));
        const awayTeam = loadedTeams.find(team => team.name.toLowerCase().includes('away'));
        
        if (homeTeam && awayTeam) {
          console.log('🎯 Auto-selecting Home/Away teams for fast input');
          onTeamSelect(homeTeam, awayTeam);
          setHomeTeamSearch(homeTeam.name);
          setAwayTeamSearch(awayTeam.name);
        }
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleAddTeam = async () => {
    if (!newTeamName.trim()) return;
    if (!leagueFilter) {
      console.error('No league selected');
      alert('Please select a league first before adding teams.');
      return;
    }

    console.log('Adding team:', { name: newTeamName.trim(), league_id: leagueFilter });

    try {
      const requestBody = { 
        name: newTeamName.trim(),
        league_id: leagueFilter
      };
      
      console.log('Making request to /api/teams with:', requestBody);
      
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Check if response has content
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
        console.log('Parsed response data:', responseData);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        console.error('Response text was:', responseText);
        responseData = { error: 'Invalid JSON response from server' };
      }

      if (response.ok) {
        console.log('Success! Team added successfully');
        await fetchTeams();
        setNewTeamName('');
        setShowAddTeam(false);
        alert(`Team "${newTeamName.trim()}" added successfully!`);
      } else {
        console.error('Error adding team - Response not OK');
        console.error('Status:', response.status, response.statusText);
        console.error('Response data:', responseData);
        
        const errorMsg = responseData?.error || responseData?.details || `Server error: ${response.status} ${response.statusText}`;
        alert(`Failed to add team: ${errorMsg}`);
        
        // Show available leagues if provided
        if (responseData?.available_leagues) {
          console.log('Available leagues:', responseData.available_leagues);
        }
      }
    } catch (error) {
      console.error('Error adding team:', error);
      alert('Network error: Unable to add team. Please try again.');
    }
  };

  // Create team suggestions for autocomplete
  const createTeamSuggestions = (searchQuery: string, excludeTeam?: Team | null) => {
    return teams
      .filter(team => 
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        team.id !== excludeTeam?.id // Prevent selecting same team for both positions
      )
      .slice(0, 10) // Limit to 10 suggestions for performance
      .map(team => ({
        id: team.id,
        label: team.name,
        description: leagueFilter 
          ? `League: ${(team as any).league_name || 'Selected League'}` 
          : `League: ${(team as any).league_name || 'Unknown'}`,
        badge: '⚽'
      }));
  };

  const handleHomeTeamSelect = (suggestion: any) => {
    const team = teams.find(t => t.id === suggestion.id) || null;
    onTeamSelect(team, selectedAwayTeam);
    setHomeTeamSearch(team?.name || '');
    setHomeDropdownOpen(false);
  };

  const handleAwayTeamSelect = (suggestion: any) => {
    const team = teams.find(t => t.id === suggestion.id) || null;
    onTeamSelect(selectedHomeTeam, team);
    setAwayTeamSearch(team?.name || '');
    setAwayDropdownOpen(false);
  };

  // Update search states when selections change externally
  useEffect(() => {
    setHomeTeamSearch(selectedHomeTeam?.name || '');
  }, [selectedHomeTeam]);

  useEffect(() => {
    setAwayTeamSearch(selectedAwayTeam?.name || '');
  }, [selectedAwayTeam]);

  return (
    <Card variant="pattern-discovery" padding="lg">
      <h2 className="text-xl font-bold mb-4 text-card-foreground">Select Teams</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <AutocompleteInput
            label="Home Team"
            placeholder="Type to search home team..."
            value={homeTeamSearch}
            onChange={(e) => {
              setHomeTeamSearch(e.target.value);
              if (!homeDropdownOpen && e.target.value.length > 0) {
                setHomeDropdownOpen(true);
              }
            }}
            suggestions={createTeamSuggestions(homeTeamSearch, selectedAwayTeam)}
            onSuggestionSelect={handleHomeTeamSelect}
            isOpen={homeDropdownOpen && createTeamSuggestions(homeTeamSearch, selectedAwayTeam).length > 0}
            onToggle={(open) => {
              setHomeDropdownOpen(open && createTeamSuggestions(homeTeamSearch, selectedAwayTeam).length > 0);
            }}
            hint={selectedHomeTeam ? `Selected: ${selectedHomeTeam.name}` : `${teams.length} teams available`}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        <div className="space-y-2">
          <AutocompleteInput
            label="Away Team"
            placeholder="Type to search away team..."
            value={awayTeamSearch}
            onChange={(e) => {
              setAwayTeamSearch(e.target.value);
              if (!awayDropdownOpen && e.target.value.length > 0) {
                setAwayDropdownOpen(true);
              }
            }}
            suggestions={createTeamSuggestions(awayTeamSearch, selectedHomeTeam)}
            onSuggestionSelect={handleAwayTeamSelect}
            isOpen={awayDropdownOpen && createTeamSuggestions(awayTeamSearch, selectedHomeTeam).length > 0}
            onToggle={(open) => {
              setAwayDropdownOpen(open && createTeamSuggestions(awayTeamSearch, selectedHomeTeam).length > 0);
            }}
            hint={selectedAwayTeam ? `Selected: ${selectedAwayTeam.name}` : `${teams.length} teams available`}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Team Selection Summary */}
      {(selectedHomeTeam || selectedAwayTeam) && (
        <div className="mb-6 p-4 bg-success-bg border border-success rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-success font-medium">Selected Teams:</span>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{selectedHomeTeam?.name || '???'}</span>
                <span className="text-text-secondary">vs</span>
                <span className="font-medium">{selectedAwayTeam?.name || '???'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedHomeTeam && selectedAwayTeam && (
                <span className="text-success text-sm">✅ Ready for next step</span>
              )}
              {(selectedHomeTeam || selectedAwayTeam) && (
                <button
                  onClick={() => {
                    onTeamSelect(null, null);
                    setHomeTeamSearch('');
                    setAwayTeamSearch('');
                    setHomeDropdownOpen(false);
                    setAwayDropdownOpen(false);
                  }}
                  className="text-text-secondary hover:text-danger transition-colors text-sm flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Team Section */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center gap-2 mb-4">
          {!showAddTeam ? (
            <button
              onClick={() => setShowAddTeam(true)}
              className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-muted transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Team
            </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Team name"
              autoComplete="off"
              className="px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-ring bg-input text-card-foreground"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTeam()}
            />
            <button
              onClick={handleAddTeam}
              className="px-4 py-2 bg-success text-success-foreground rounded-md hover:bg-success/80"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddTeam(false);
                setNewTeamName('');
              }}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
            >
              Cancel
            </button>
          </div>
        )}
        </div>
      </div>
    </Card>
  );
};

export default TeamSelector;