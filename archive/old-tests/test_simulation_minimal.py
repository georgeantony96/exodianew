#!/usr/bin/env python3
"""
Test minimal simulation to reproduce the bookmaker_odds error
"""

import os
import json
import traceback
from monte_carlo.simulation_engine import SimulationEngine

def test_minimal_simulation():
    """Test minimal simulation to find the exact error"""
    
    try:
        # Get the same path the simulation_runner uses
        script_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(script_dir, '..', 'database', 'exodia.db')
        
        print(f"Testing simulation with database: {db_path}")
        
        # Initialize simulation engine
        engine = SimulationEngine(db_path)
        
        # Create minimal test data (based on what would come from frontend)
        test_data = {
            "home_team_id": 1,
            "away_team_id": 2,
            "league_id": 1,
            "distribution_type": "poisson",
            "iterations": 10000,
            "boost_settings": {
                "home_advantage": 0.20,
                "custom_home_boost": 0.0,
                "custom_away_boost": 0.0,
                "enable_streak_analysis": False,
                "enable_form_weighting": False
            },
            "bookmaker_odds": {
                "1x2": {
                    "home": 2.10,
                    "draw": 3.40,
                    "away": 3.20
                },
                "ou25": {
                    "over": 1.85,
                    "under": 1.95
                }
            },
            "match_date": "2025-08-08"
        }
        
        print("Test data prepared, running simulation...")
        
        # Try to run simulation (only with supported parameters)
        print("Running simulation...")
        result = engine.run_simulation(
            home_team_id=test_data["home_team_id"],
            away_team_id=test_data["away_team_id"],
            distribution_type=test_data["distribution_type"],
            iterations=test_data["iterations"],
            custom_boosts={
                "home_advantage": 0.20,
                "custom_home_boost": 0.0,
                "custom_away_boost": 0.0
            }
        )
        
        print("Simulation completed, now saving to database...")
        # Now save to database (this is where the bookmaker_odds error might occur)
        simulation_id = engine.save_simulation(
            home_team_id=test_data["home_team_id"],
            away_team_id=test_data["away_team_id"],
            league_id=test_data["league_id"],
            match_date=test_data["match_date"],
            distribution_type=test_data["distribution_type"],
            iterations=test_data["iterations"],
            simulation_results=result,
            bookmaker_odds=test_data["bookmaker_odds"],
            custom_boosts={
                "home_advantage": 0.20,
                "custom_home_boost": 0.0,
                "custom_away_boost": 0.0
            }
        )
        
        print(f"Database save completed with simulation_id: {simulation_id}")
        
        print("Simulation completed successfully!")
        print(f"Result keys: {list(result.keys()) if result else 'No result'}")
        
        return True
        
    except Exception as e:
        print(f"[ERROR] Simulation failed: {e}")
        print(f"Error type: {type(e).__name__}")
        print(f"Traceback: {traceback.format_exc()}")
        
        # Check if it's specifically the bookmaker_odds error
        if "bookmaker_odds" in str(e).lower():
            print("\n[ANALYSIS] This appears to be the bookmaker_odds table error!")
            print("Let's check what specific operation is failing...")
        
        return False

if __name__ == "__main__":
    success = test_minimal_simulation()
    exit(0 if success else 1)