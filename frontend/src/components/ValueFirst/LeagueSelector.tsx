import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { AutocompleteInput } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface League {
  id: number;
  name: string;
  country: string;
  season: string;
  intelligence_enabled: boolean;
  avg_efficiency_rating?: number;
}

interface LeagueIntelligence {
  market_type: string;
  avg_odds: number;
  opportunity_frequency: number;
  user_accuracy?: number;
}

interface DiscoveredPattern {
  type: string;
  description: string;
  strength: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: string;
  discovered_at: string;
  market?: string;
  data_points?: number;
}

interface LeagueSelectorProps {
  selectedLeague: League | null;
  onLeagueSelect: (league: League | null) => void;
  className?: string;
}

const LeagueSelector: React.FC<LeagueSelectorProps> = ({
  selectedLeague,
  onLeagueSelect,
  className
}) => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [leagueIntelligence, setLeagueIntelligence] = useState<LeagueIntelligence[]>([]);
  const [discoveredPatterns, setDiscoveredPatterns] = useState<DiscoveredPattern[]>([]);
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(false);
  const [isAddingLeague, setIsAddingLeague] = useState(false);
  const [leaguesError, setLeaguesError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLeague, setNewLeague] = useState({
    name: '',
    country: '',
    season: '2025-26',
    intelligence_enabled: true
  });

  // Load available leagues and auto-select Universal Pattern
  useEffect(() => {
    const loadLeagues = async () => {
      setIsLoadingLeagues(true);
      setLeaguesError(null);
      try {
        const response = await fetch('/api/leagues');
        if (response.ok) {
          const data = await response.json();
          console.log('Loaded leagues:', data.leagues); // Debug log
          const loadedLeagues = data.leagues || [];
          setLeagues(loadedLeagues);
          
          // Auto-select Universal Pattern if not already selected
          if (!selectedLeague && loadedLeagues.length > 0) {
            const universalPattern = loadedLeagues.find(league => 
              league.name.toLowerCase().includes('universal') || 
              league.name.toLowerCase().includes('pattern')
            );
            
            if (universalPattern) {
              console.log('🎯 Auto-selecting Universal Pattern league for fast input');
              onLeagueSelect(universalPattern);
              setSearchQuery(universalPattern.name);
            }
          }
          
          if (loadedLeagues.length === 0) {
            setLeaguesError('No leagues found. Add your first league to get started.');
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          setLeaguesError(`Failed to load leagues: ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Failed to load leagues:', error);
        setLeaguesError('Network error: Unable to connect to the server. Please check your connection.');
      } finally {
        setIsLoadingLeagues(false);
      }
    };

    loadLeagues();
  }, [selectedLeague, onLeagueSelect]);

  // Load league intelligence and discovered patterns when a league is selected
  useEffect(() => {
    const loadLeagueData = async () => {
      if (!selectedLeague) {
        setLeagueIntelligence([]);
        setDiscoveredPatterns([]);
        return;
      }

      try {
        // Load basic intelligence
        const intelligenceResponse = await fetch(`/api/leagues/${selectedLeague.id}/intelligence`);
        if (intelligenceResponse.ok) {
          const intelligenceData = await intelligenceResponse.json();
          setLeagueIntelligence(intelligenceData.intelligence || []);
        }

        // Load discovered patterns
        const patternsResponse = await fetch(`/api/intelligence/pattern-detection?league_id=${selectedLeague.id}`);
        if (patternsResponse.ok) {
          const patternsData = await patternsResponse.json();
          if (patternsData.success && patternsData.discovered_patterns) {
            const allPatterns = patternsData.discovered_patterns.flatMap((item: any) => 
              item.patterns.map((pattern: any) => ({
                ...pattern,
                market: item.market,
                data_points: item.data_points
              }))
            );
            setDiscoveredPatterns(allPatterns);
          }
        }
      } catch (error) {
        console.error('Failed to load league data:', error);
      }
    };

    loadLeagueData();
  }, [selectedLeague]);

  const filteredLeagues = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return leagues;
    }
    return leagues.filter(league =>
      league.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      league.country.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [leagues, searchQuery]);

  const leagueSuggestions = filteredLeagues.map(league => ({
    id: league.id,
    label: league.name,
    description: `${league.country} • ${league.season || '2025-26'}`,
    badge: league.intelligence_enabled ? '🧠 AI' : undefined
  }));

  console.log('Current leagues:', leagues); // Debug log
  console.log('Filtered leagues:', filteredLeagues); // Debug log
  console.log('League suggestions:', leagueSuggestions); // Debug log

  const handleLeagueSelection = (suggestion: any) => {
    const league = leagues.find(l => l.id === suggestion.id);
    if (league) {
      onLeagueSelect(league);
      setSearchQuery(league.name);
      setIsDropdownOpen(false);
    }
  };

  const handleAddLeague = async () => {
    if (!newLeague.name.trim() || !newLeague.country.trim()) {
      alert('Please enter both league name and country');
      return;
    }

    setIsAddingLeague(true);
    try {
      console.log('Adding league:', newLeague); // Debug log
      
      const response = await fetch('/api/leagues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLeague),
      });

      const data = await response.json();
      console.log('Add league response:', data); // Debug log

      if (response.ok && data.success) {
        const addedLeague = data.league;
        
        // Add to local state
        setLeagues(prev => [...prev, addedLeague].sort((a, b) => a.name.localeCompare(b.name)));
        
        // Auto-select the newly added league
        onLeagueSelect(addedLeague);
        setSearchQuery(addedLeague.name);
        
        // Reset form
        setNewLeague({
          name: '',
          country: '',
          season: '2025-26',
          intelligence_enabled: true
        });
        setShowAddForm(false);
        
        alert(`League "${addedLeague.name}" added successfully!`);
      } else {
        console.error('Failed to add league:', data);
        alert(`Failed to add league: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding league:', error);
      alert('Failed to add league. Please try again.');
    } finally {
      setIsAddingLeague(false);
    }
  };

  const getIntelligenceRating = () => {
    if (discoveredPatterns.length === 0) {
      return { level: 'LEARNING', color: 'info', text: 'Building pattern intelligence through usage' };
    }
    
    const highStrengthPatterns = discoveredPatterns.filter(p => p.strength === 'HIGH').length;
    const mediumStrengthPatterns = discoveredPatterns.filter(p => p.strength === 'MEDIUM').length;
    
    if (highStrengthPatterns >= 2) {
      return { level: 'EXCEPTIONAL', color: 'success', text: `${highStrengthPatterns} high-value patterns discovered` };
    }
    if (highStrengthPatterns >= 1 || mediumStrengthPatterns >= 2) {
      return { level: 'GOOD', color: 'warning', text: `${discoveredPatterns.length} patterns identified` };
    }
    if (discoveredPatterns.length > 0) {
      return { level: 'EMERGING', color: 'info', text: `${discoveredPatterns.length} pattern(s) being tracked` };
    }
    
    return { level: 'LEARNING', color: 'info', text: 'Building pattern intelligence through usage' };
  };

  const intelligenceRating = getIntelligenceRating();

  return (
    <div className={cn('space-y-6', className)}>
      {/* League Selection */}
      <Card 
        variant="pattern-discovery" 
        padding="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                Select League
              </h2>
            </div>
          </div>

          <AutocompleteInput
            label="Search Leagues"
            placeholder="Search by league name or country..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!isDropdownOpen && e.target.value.length > 0) {
                setIsDropdownOpen(true);
              }
            }}
            suggestions={leagueSuggestions}
            onSuggestionSelect={handleLeagueSelection}
            isOpen={isDropdownOpen && leagueSuggestions.length > 0}
            onToggle={(open) => {
              setIsDropdownOpen(open && leagueSuggestions.length > 0);
            }}
            isLoading={isLoadingLeagues}
            hint={leaguesError}
            error={leaguesError}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />

          {/* Add League Button and Quick Suggestions */}
          <div className="space-y-4">
            {/* League Management Section */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wide font-medium">
                  {selectedLeague 
                    ? 'League Actions'
                    : leagues.length > 0 ? 'Popular Leagues' : 'No Leagues Available'
                  }
                </p>
              </div>
                <Button
                  variant={leagues.length === 0 ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add League
                </Button>
              </div>

              {/* Add League Form */}
              {showAddForm && (
                <Card variant="elevated" padding="md" className="bg-bg-secondary">
                  <div className="space-y-4">
                    <h4 className="font-medium text-text-primary">Add New League</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">
                          League Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Premier League"
                          value={newLeague.name}
                          onChange={(e) => setNewLeague(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-border-secondary rounded-lg bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">
                          Country *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. England"
                          value={newLeague.country}
                          onChange={(e) => setNewLeague(prev => ({ ...prev, country: e.target.value }))}
                          className="w-full px-3 py-2 border border-border-secondary rounded-lg bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">
                          Season
                        </label>
                        <input
                          type="text"
                          placeholder="2025-26"
                          value={newLeague.season}
                          onChange={(e) => setNewLeague(prev => ({ ...prev, season: e.target.value }))}
                          className="w-full px-3 py-2 border border-border-secondary rounded-lg bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2 pt-6">
                        <input
                          type="checkbox"
                          id="intelligence_enabled"
                          checked={newLeague.intelligence_enabled}
                          onChange={(e) => setNewLeague(prev => ({ ...prev, intelligence_enabled: e.target.checked }))}
                          className="w-4 h-4 text-accent bg-bg-primary border-border-secondary rounded focus:ring-accent focus:ring-2"
                        />
                        <label htmlFor="intelligence_enabled" className="text-sm text-text-primary">
                          Enable AI Intelligence
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowAddForm(false);
                          setNewLeague({
                            name: '',
                            country: '',
                            season: '2025-26',
                            intelligence_enabled: true
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAddLeague}
                        disabled={isAddingLeague || !newLeague.name.trim() || !newLeague.country.trim()}
                      >
                        {isAddingLeague ? 'Adding...' : 'Add League'}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Quick League Suggestions */}
              {leagues.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {leagues
                    .filter(league => league.intelligence_enabled)
                    .slice(0, 6)
                    .map(league => (
                      <Button
                        key={league.id}
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          onLeagueSelect(league);
                          setSearchQuery(league.name);
                          setIsDropdownOpen(false);
                        }}
                      >
                        {league.intelligence_enabled && '🧠'} {league.name}
                      </Button>
                    ))
                  }
                </div>
              )}
            </div>
        </div>
      </Card>

      {/* Selected League Intelligence Display */}
      {selectedLeague && (
        <Card 
          variant={intelligenceRating ? 'pattern-discovery' : 'elevated'} 
          padding="lg"
          className="relative"
        >
          <div className="space-y-6">
            {/* League Header */}
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2 flex-wrap">
                  {selectedLeague.name}
                  {selectedLeague.intelligence_enabled && (
                    <span className="bg-accent text-white px-2 py-1 rounded-full text-xs font-medium">
                      AI ENABLED
                    </span>
                  )}
                </h3>
                <p className="text-text-secondary text-sm">
                  {selectedLeague.country} • {selectedLeague.season}
                </p>
              </div>
            </div>

            {/* Intelligence Rating */}
            {intelligenceRating && (
              <div className={cn(
                'p-4 rounded-lg border-l-4',
                intelligenceRating.color === 'success' && 'bg-success-bg border-success',
                intelligenceRating.color === 'warning' && 'bg-warning-bg border-warning',
                intelligenceRating.color === 'info' && 'bg-info-bg border-info',
                intelligenceRating.color === 'danger' && 'bg-danger-bg border-danger'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-text-primary">Value Rating</span>
                  <span className={cn(
                    'text-sm font-bold uppercase tracking-wide',
                    `text-${intelligenceRating.color}`
                  )}>
                    {intelligenceRating.level}
                  </span>
                </div>
                <p className="text-text-secondary text-sm">
                  {intelligenceRating.text}
                </p>
              </div>
            )}

            {/* Discovered Patterns */}
            {discoveredPatterns.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-text-primary">🔍 Discovered Patterns</h4>
                  <span className="bg-accent text-white px-2 py-1 rounded-full text-xs font-medium">
                    {discoveredPatterns.length} Pattern{discoveredPatterns.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {discoveredPatterns.map((pattern, index) => (
                    <div 
                      key={index} 
                      className={cn(
                        'p-4 rounded-lg border-l-4',
                        pattern.strength === 'HIGH' && 'bg-success-bg border-success',
                        pattern.strength === 'MEDIUM' && 'bg-warning-bg border-warning',
                        pattern.strength === 'LOW' && 'bg-info-bg border-info'
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-xs font-bold px-2 py-1 rounded uppercase tracking-wide',
                            pattern.strength === 'HIGH' && 'bg-success text-white',
                            pattern.strength === 'MEDIUM' && 'bg-warning text-white',
                            pattern.strength === 'LOW' && 'bg-info text-white'
                          )}>
                            {pattern.strength}
                          </span>
                          {pattern.market && (
                            <span className="text-xs font-medium text-text-secondary">
                              {pattern.market}
                            </span>
                          )}
                        </div>
                        {pattern.data_points && (
                          <span className="text-xs text-text-secondary">
                            {pattern.data_points} samples
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-text-primary mb-2">
                        {pattern.description}
                      </p>
                      
                      <p className="text-xs text-text-secondary italic">
                        💡 {pattern.recommendation}
                      </p>
                      
                      <div className="text-xs text-text-tertiary mt-2">
                        Discovered: {new Date(pattern.discovered_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Basic Market Intelligence */}
            {leagueIntelligence.length > 0 && discoveredPatterns.length === 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-text-primary">📊 Basic Market Data</h4>
                <div className="bg-info-bg border border-info p-3 rounded-lg">
                  <p className="text-sm text-text-primary mb-1">Learning Phase</p>
                  <p className="text-xs text-text-secondary">
                    Add simulation data to discover unique patterns for this league. 
                    The system will automatically detect market inefficiencies, 
                    opportunity frequencies, and special attributes as you use it.
                  </p>
                </div>
              </div>
            )}

            {/* Pattern Discovery Status */}
            {selectedLeague.intelligence_enabled && discoveredPatterns.length === 0 && (
              <div className="bg-info-bg border border-info p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-text-primary">Pattern Discovery Active</span>
                </div>
                <p className="text-text-secondary text-sm">
                  Ready to discover patterns through simulation data.
                </p>
              </div>
            )}

            {/* Intelligence Disabled Warning */}
            {!selectedLeague.intelligence_enabled && (
              <div className="bg-warning-bg border border-warning p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-warning text-lg">⚠️</span>
                  <span className="font-medium text-text-primary">Pattern Discovery Disabled</span>
                </div>
                <p className="text-text-secondary text-sm">
                  Pattern discovery is disabled for this league. You can still run simulations, 
                  but won't get automated pattern detection and special attribute discovery.
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default LeagueSelector;