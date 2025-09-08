import numpy as np
from scipy.stats import nbinom
from typing import Dict, List, Tuple

class NegativeBinomialModel:
    """Negative Binomial distribution model for Monte Carlo football simulations"""
    
    def __init__(self, home_params: Tuple[float, float], away_params: Tuple[float, float],
                 home_boost: float = 0.0, away_boost: float = 0.0):
        # Negative binomial parameters: (n, p) where n is number of failures, p is success probability
        self.home_n, self.home_p = home_params
        self.away_n, self.away_p = away_params
        self.home_boost = home_boost
        self.away_boost = away_boost
    
    def simulate_match(self, iterations: int = 10000) -> Dict:
        """Run Monte Carlo simulation using Negative Binomial distribution"""
        
        # Apply boosts by adjusting the mean (which affects p parameter)
        home_mean = self.home_n * (1 - self.home_p) / self.home_p + self.home_boost
        away_mean = self.away_n * (1 - self.away_p) / self.away_p + self.away_boost
        
        # Recalculate p parameters with boosts
        home_p_boosted = self.home_n / (self.home_n + max(0.1, home_mean))
        away_p_boosted = self.away_n / (self.away_n + max(0.1, away_mean))
        
        # Generate random scores
        home_scores = nbinom.rvs(self.home_n, home_p_boosted, size=iterations)
        away_scores = nbinom.rvs(self.away_n, away_p_boosted, size=iterations)
        
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
                'home_params': (self.home_n, home_p_boosted),
                'away_params': (self.away_n, away_p_boosted)
            }
        }
        
        return results
    
    def estimate_parameters_from_data(self, goals_data: List[int]) -> Tuple[float, float]:
        """Estimate negative binomial parameters from historical goal data using method of moments"""
        if not goals_data:
            return 2.0, 0.5  # Default parameters
        
        goals_array = np.array(goals_data)
        mean_goals = np.mean(goals_array)
        var_goals = np.var(goals_array)
        
        # Avoid division by zero and ensure variance > mean for negative binomial
        if var_goals <= mean_goals or mean_goals <= 0:
            return 2.0, 0.5
        
        # Method of moments estimation
        p = mean_goals / var_goals
        n = mean_goals * p / (1 - p)
        
        # Ensure valid parameters
        p = max(0.01, min(0.99, p))
        n = max(0.1, n)
        
        return n, p
    
    def calculate_expected_goals_and_params(self, historical_data: List[Dict]) -> Tuple[Tuple[float, float], Tuple[float, float]]:
        """Calculate expected goals and estimate parameters from historical match data"""
        if not historical_data:
            return (2.0, 0.5), (2.0, 0.5)
        
        home_goals = [match['home_score_ft'] for match in historical_data]
        away_goals = [match['away_score_ft'] for match in historical_data]
        
        home_params = self.estimate_parameters_from_data(home_goals)
        away_params = self.estimate_parameters_from_data(away_goals)
        
        return home_params, away_params
    
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
    
    @staticmethod
    def recommend_distribution(goals_data: List[int]) -> str:
        """Recommend whether to use Poisson or Negative Binomial based on data characteristics"""
        if not goals_data or len(goals_data) < 3:
            return "poisson"  # Default to Poisson for insufficient data
        
        goals_array = np.array(goals_data)
        mean_goals = np.mean(goals_array)
        var_goals = np.var(goals_array)
        
        # If variance is significantly greater than mean, recommend Negative Binomial
        if var_goals > mean_goals * 1.2:
            return "negative_binomial"
        else:
            return "poisson"