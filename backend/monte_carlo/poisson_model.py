import numpy as np
from scipy.stats import poisson
from typing import Dict, List, Tuple

class PoissonModel:
    """Poisson distribution model for Monte Carlo football simulations"""
    
    def __init__(self, home_lambda: float, away_lambda: float, 
                 home_boost: float = 0.0, away_boost: float = 0.0):
        self.home_lambda = max(0.1, home_lambda + home_boost)
        self.away_lambda = max(0.1, away_lambda + away_boost)
    
    def simulate_match(self, iterations: int = 10000) -> Dict:
        """Run Monte Carlo simulation using Poisson distribution"""
        
        # Generate random scores
        home_scores = poisson.rvs(self.home_lambda, size=iterations)
        away_scores = poisson.rvs(self.away_lambda, size=iterations)
        
        # Calculate outcomes
        home_wins = np.sum(home_scores > away_scores)
        draws = np.sum(home_scores == away_scores)
        away_wins = np.sum(home_scores < away_scores)
        
        # Goal totals for over/under markets
        total_goals = home_scores + away_scores
        
        # Both teams score
        both_score = np.sum((home_scores > 0) & (away_scores > 0))
        
        # Convert to probabilities
        results = {
            '1x2': {
                'home': home_wins / iterations,
                'draw': draws / iterations,
                'away': away_wins / iterations
            },
            'over_under': {
                'over_25': np.sum(total_goals > 2.5) / iterations,
                'under_25': np.sum(total_goals < 2.5) / iterations,
                'over_35': np.sum(total_goals > 3.5) / iterations,
                'under_35': np.sum(total_goals < 3.5) / iterations,
                'over_45': np.sum(total_goals > 4.5) / iterations,
                'under_45': np.sum(total_goals < 4.5) / iterations,
                'over_55': np.sum(total_goals > 5.5) / iterations,
                'under_55': np.sum(total_goals < 5.5) / iterations
            },
            'both_teams_score': {
                'yes': both_score / iterations,
                'no': (iterations - both_score) / iterations
            },
            'statistics': {
                'avg_home_goals': np.mean(home_scores),
                'avg_away_goals': np.mean(away_scores),
                'avg_total_goals': np.mean(total_goals),
                'home_lambda': self.home_lambda,
                'away_lambda': self.away_lambda
            }
        }
        
        return results
    
    def calculate_expected_goals(self, historical_data: List[Dict]) -> Tuple[float, float]:
        """Calculate expected goals from historical match data"""
        if not historical_data:
            return 1.5, 1.5  # Default values
        
        home_goals = []
        away_goals = []
        
        for match in historical_data:
            home_goals.append(match['home_score_ft'])
            away_goals.append(match['away_score_ft'])
        
        return np.mean(home_goals), np.mean(away_goals)
    
    @staticmethod
    def probability_to_odds(probability: float) -> float:
        """Convert probability to decimal odds"""
        if probability <= 0:
            return 999.99
        return round(1 / probability, 2)
    
    def get_true_odds(self, simulation_results: Dict) -> Dict:
        """Convert simulation probabilities to true odds"""
        true_odds = {}
        
        # 1X2 odds
        true_odds['1x2'] = {
            'home': self.probability_to_odds(simulation_results['1x2']['home']),
            'draw': self.probability_to_odds(simulation_results['1x2']['draw']),
            'away': self.probability_to_odds(simulation_results['1x2']['away'])
        }
        
        # Over/Under odds
        true_odds['over_under'] = {}
        for market, prob in simulation_results['over_under'].items():
            true_odds['over_under'][market] = self.probability_to_odds(prob)
        
        # Both teams score odds
        true_odds['both_teams_score'] = {
            'yes': self.probability_to_odds(simulation_results['both_teams_score']['yes']),
            'no': self.probability_to_odds(simulation_results['both_teams_score']['no'])
        }
        
        return true_odds