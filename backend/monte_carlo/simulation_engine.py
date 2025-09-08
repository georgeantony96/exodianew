import json
import sqlite3
from typing import Dict, List, Optional
from .poisson_model import PoissonModel
from .negative_binomial_model import NegativeBinomialModel

class SimulationEngine:
    """Main engine for running Monte Carlo simulations"""
    
    def __init__(self, db_path: str = "database/exodia.db"):
        self.db_path = db_path
    
    def prepare_historical_data(self, home_team_id: int, away_team_id: int) -> Dict[str, List[Dict]]:
        """Fetch and organize historical data for both teams"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        
        historical_data = {
            'h2h': [],
            'home_home': [],
            'away_away': [],
            'home_away': [],
            'away_home': []
        }
        
        # Fetch all relevant historical matches
        query = """
        SELECT hm.*, ht.name as home_team_name, at.name as away_team_name
        FROM historical_matches hm
        JOIN teams ht ON hm.home_team_id = ht.id
        JOIN teams at ON hm.away_team_id = at.id
        WHERE (
            (hm.home_team_id = ? AND hm.away_team_id = ?) OR
            (hm.home_team_id = ? AND hm.away_team_id = ?) OR
            (hm.home_team_id = ?) OR
            (hm.away_team_id = ?)
        )
        ORDER BY hm.match_date DESC
        """
        
        cursor = conn.execute(query, (
            home_team_id, away_team_id,  # H2H matches
            away_team_id, home_team_id,  # H2H reverse
            home_team_id,  # Home team matches
            away_team_id   # Away team matches
        ))
        
        for row in cursor.fetchall():
            match_data = dict(row)
            match_type = match_data['match_type']
            
            if match_type in historical_data:
                historical_data[match_type].append(match_data)
        
        conn.close()
        return historical_data
    
    def calculate_boosts(self, historical_data: Dict, home_team_id: int, away_team_id: int) -> Dict[str, float]:
        """Calculate boost factors based on historical data analysis"""
        boosts = {
            'home_advantage': 0.20,  # Default home advantage
            'home_boost': 0.0,
            'away_boost': 0.0,
            'home_streak_boost': 0.0,
            'away_streak_boost': 0.0
        }
        
        # Analyze unbeaten/losing streaks
        home_recent = historical_data.get('home_home', [])[:6]
        away_recent = historical_data.get('away_away', [])[:6]
        
        # Home team streak analysis
        if len(home_recent) >= 5:
            home_unbeaten = self._check_unbeaten_streak(home_recent, True)
            home_losing = self._check_losing_streak(home_recent, True)
            
            if home_unbeaten >= 5:
                boosts['home_streak_boost'] = min(0.10, home_unbeaten * 0.02)
            elif home_losing >= 5:
                boosts['home_streak_boost'] = min(0.12, home_losing * 0.024)
        
        # Away team streak analysis
        if len(away_recent) >= 5:
            away_unbeaten = self._check_unbeaten_streak(away_recent, False)
            away_losing = self._check_losing_streak(away_recent, False)
            
            if away_unbeaten >= 5:
                boosts['away_streak_boost'] = min(0.10, away_unbeaten * 0.02)
            elif away_losing >= 5:
                boosts['away_streak_boost'] = min(0.12, away_losing * 0.024)
        
        # Apply form weighting
        boosts['home_boost'] = boosts['home_advantage'] + boosts['home_streak_boost']
        boosts['away_boost'] = boosts['away_streak_boost']
        
        return boosts
    
    def _check_unbeaten_streak(self, matches: List[Dict], is_home_team: bool) -> int:
        """Check for unbeaten streak in recent matches"""
        streak = 0
        for match in matches:
            if is_home_team:
                if match['home_score_ft'] >= match['away_score_ft']:
                    streak += 1
                else:
                    break
            else:
                if match['away_score_ft'] >= match['home_score_ft']:
                    streak += 1
                else:
                    break
        return streak
    
    def _check_losing_streak(self, matches: List[Dict], is_home_team: bool) -> int:
        """Check for losing streak in recent matches"""
        streak = 0
        for match in matches:
            if is_home_team:
                if match['home_score_ft'] < match['away_score_ft']:
                    streak += 1
                else:
                    break
            else:
                if match['away_score_ft'] < match['home_score_ft']:
                    streak += 1
                else:
                    break
        return streak
    
    def run_simulation(self, home_team_id: int, away_team_id: int, 
                      distribution_type: str = "poisson", iterations: int = 10000,
                      custom_boosts: Optional[Dict] = None) -> Dict:
        """Run complete Monte Carlo simulation"""
        
        # Prepare historical data
        historical_data = self.prepare_historical_data(home_team_id, away_team_id)
        
        # Calculate boosts
        boosts = self.calculate_boosts(historical_data, home_team_id, away_team_id)
        if custom_boosts:
            boosts.update(custom_boosts)
        
        # Combine relevant historical data for parameter estimation
        combined_data = []
        combined_data.extend(historical_data.get('h2h', []))
        combined_data.extend(historical_data.get('home_home', [])[:6])
        combined_data.extend(historical_data.get('away_away', [])[:6])
        
        if distribution_type.lower() == "poisson":
            model = PoissonModel(1.5, 1.5, boosts['home_boost'], boosts['away_boost'])
            if combined_data:
                home_lambda, away_lambda = model.calculate_expected_goals(combined_data)
                model = PoissonModel(home_lambda, away_lambda, boosts['home_boost'], boosts['away_boost'])
        
        elif distribution_type.lower() == "negative_binomial":
            nb_model = NegativeBinomialModel((2.0, 0.5), (2.0, 0.5), boosts['home_boost'], boosts['away_boost'])
            if combined_data:
                home_params, away_params = nb_model.calculate_expected_goals_and_params(combined_data)
                model = NegativeBinomialModel(home_params, away_params, boosts['home_boost'], boosts['away_boost'])
            else:
                model = nb_model
        
        else:
            raise ValueError("Distribution type must be 'poisson' or 'negative_binomial'")
        
        # Run simulation
        simulation_results = model.simulate_match(iterations)
        true_odds = model.get_true_odds(simulation_results)
        
        # Add metadata
        simulation_results['metadata'] = {
            'distribution_type': distribution_type,
            'iterations': iterations,
            'boosts': boosts,
            'historical_data_counts': {
                'h2h': len(historical_data.get('h2h', [])),
                'home_home': len(historical_data.get('home_home', [])),
                'away_away': len(historical_data.get('away_away', []))
            }
        }
        
        simulation_results['true_odds'] = true_odds
        
        return simulation_results
    
    def save_simulation(self, home_team_id: int, away_team_id: int,
                       league_id: int, match_date: str, distribution_type: str,
                       iterations: int, simulation_results: Dict, 
                       bookmaker_odds: Optional[Dict] = None,
                       custom_boosts: Optional[Dict] = None) -> int:
        """Save simulation results to database"""
        conn = sqlite3.connect(self.db_path)
        
        # Extract boost values from custom_boosts if provided
        home_boost = custom_boosts.get('custom_home_boost', 0) if custom_boosts else 0
        away_boost = custom_boosts.get('custom_away_boost', 0) if custom_boosts else 0
        home_advantage = custom_boosts.get('home_advantage', 0.20) if custom_boosts else 0.20
        
        # Insert simulation
        simulation_query = """
        INSERT INTO simulations (
            home_team_id, away_team_id, league_id, match_date, distribution_type, 
            iterations, home_boost, away_boost, home_advantage, 
            true_odds, value_bets
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        metadata = simulation_results.get('metadata', {})
        boosts = metadata.get('boosts', {})
        
        # Calculate value bets if bookmaker odds provided
        value_bets = {}
        if bookmaker_odds:
            value_bets = self.calculate_value_bets(simulation_results['true_odds'], bookmaker_odds)
        
        cursor = conn.execute(simulation_query, (
            home_team_id, away_team_id, league_id, match_date,
            distribution_type,
            iterations,
            home_boost,
            away_boost, 
            home_advantage,
            json.dumps(simulation_results['true_odds']),
            json.dumps(value_bets)
        ))
        
        simulation_id = cursor.lastrowid
        
        # Save bookmaker odds if provided
        if bookmaker_odds:
            self.save_bookmaker_odds(simulation_id, bookmaker_odds, conn)
        
        conn.commit()
        conn.close()
        
        return simulation_id
    
    def save_bookmaker_odds(self, simulation_id: int, bookmaker_odds: Dict, conn):
        """Save bookmaker odds to database"""
        for market_type, odds in bookmaker_odds.items():
            odds_query = """
            INSERT INTO bookmaker_odds (
                simulation_id, market_type, home_odds, draw_odds, away_odds,
                over_odds, under_odds, yes_odds, no_odds
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            
            conn.execute(odds_query, (
                simulation_id, market_type,
                odds.get('home'), odds.get('draw'), odds.get('away'),
                odds.get('over'), odds.get('under'),
                odds.get('yes'), odds.get('no')
            ))
    
    def calculate_value_bets(self, true_odds: Dict, bookmaker_odds: Dict) -> Dict:
        """Calculate value bets by comparing true odds with bookmaker odds"""
        value_bets = {}
        
        for market_category, true_market in true_odds.items():
            if market_category in bookmaker_odds:
                bookmaker_market = bookmaker_odds[market_category]
                market_value_bets = {}
                
                for outcome, true_odd in true_market.items():
                    if outcome in bookmaker_market and bookmaker_market[outcome]:
                        bookmaker_odd = bookmaker_market[outcome]
                        true_probability = 1 / true_odd if true_odd > 0 else 0
                        
                        # Calculate edge: (True Probability × Bookmaker Odds) - 1
                        edge = (true_probability * bookmaker_odd) - 1
                        
                        if edge > 0.02:  # Minimum 2% edge threshold
                            market_value_bets[outcome] = {
                                'edge': round(edge * 100, 2),  # Convert to percentage
                                'true_odds': true_odd,
                                'bookmaker_odds': bookmaker_odd,
                                'true_probability': round(true_probability * 100, 2),
                                'confidence': self._get_confidence_level(edge)
                            }
                
                if market_value_bets:
                    value_bets[market_category] = market_value_bets
        
        return value_bets
    
    def _get_confidence_level(self, edge: float) -> str:
        """Determine confidence level based on edge percentage"""
        if edge >= 0.10:
            return "High"
        elif edge >= 0.05:
            return "Medium"
        elif edge >= 0.02:
            return "Low"
        else:
            return "None"