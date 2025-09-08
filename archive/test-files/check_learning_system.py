import sqlite3
import json

def check_learning_system():
    print("=== EXODIA FINAL LEARNING SYSTEM CHECK ===")
    
    try:
        conn = sqlite3.connect('./database/exodia.db')
        cursor = conn.cursor()
        
        # Check recent simulations
        print("\nRECENT SIMULATIONS:")
        cursor.execute('SELECT id, home_team_id, away_team_id, created_at FROM simulations ORDER BY created_at DESC LIMIT 3')
        simulations = cursor.fetchall()
        for i, sim in enumerate(simulations):
            print(f'Simulation {i+1}: ID={sim[0]}, Teams={sim[1]}-{sim[2]}, Date={sim[3]}')
        
        # Check match results (settled data)
        print("\nMATCH RESULTS (Learning Data):")
        cursor.execute('SELECT simulation_id, home_score_ft, away_score_ft, result_entered_at, accuracy_metrics FROM match_results ORDER BY result_entered_at DESC LIMIT 3')
        results = cursor.fetchall()
        if results:
            for i, result in enumerate(results):
                print(f'Result {i+1}: Sim_ID={result[0]}, Score={result[1]}-{result[2]}, Entered={result[3]}')
                if result[4]:
                    try:
                        accuracy = json.loads(result[4])
                        accuracy_pct = accuracy.get("accuracy_percentage", 0)
                        correct = accuracy.get("correct_predictions", 0)
                        total = accuracy.get("total_predictions", 0)
                        print(f'  Accuracy: {accuracy_pct:.1f}% ({correct}/{total} correct)')
                    except:
                        print(f'  Accuracy data present but could not parse')
        else:
            print('No match results found - learning system not capturing settled data yet')
        
        # Check bet selections (user betting data)
        print("\nUSER BET SELECTIONS:")
        cursor.execute('SELECT id, simulation_id, market_type, market_option, bet_status, profit_loss, placed_at FROM user_bet_selections ORDER BY placed_at DESC LIMIT 3')
        bets = cursor.fetchall()
        if bets:
            for i, bet in enumerate(bets):
                pl = bet[5] if bet[5] is not None else 0
                print(f'Bet {i+1}: ID={bet[0]}, Sim_ID={bet[1]}, Market={bet[2]}_{bet[3]}, Status={bet[4]}, P&L=${pl}, Date={bet[6]}')
        else:
            print('No bet selections found - user has not placed any bets yet')
        
        # Check league intelligence updates
        print("\nLEAGUE INTELLIGENCE (Pattern Learning):")
        cursor.execute('SELECT league_id, market_type, avg_odds, opportunity_frequency, hit_rate, last_updated FROM league_market_intelligence ORDER BY last_updated DESC LIMIT 5')
        intelligence = cursor.fetchall()
        if intelligence:
            for i, intel in enumerate(intelligence):
                print(f'Intel {i+1}: League={intel[0]}, Market={intel[1]}, Avg_Odds={intel[2]}, Opportunity_Rate={intel[3]}, Hit_Rate={intel[4]}, Updated={intel[5]}')
        else:
            print('No league intelligence updates - pattern learning system not active')
        
        # Check match odds analysis (real-time learning)
        print("\nMATCH ODDS ANALYSIS (Real-time Learning):")
        cursor.execute('SELECT simulation_id, market_type, market_option, input_odds, actual_result, profit_loss, recorded_at FROM match_odds_analysis ORDER BY recorded_at DESC LIMIT 3')
        odds_analysis = cursor.fetchall()
        if odds_analysis:
            for i, analysis in enumerate(odds_analysis):
                pl = analysis[5] if analysis[5] is not None else 0
                result = analysis[4] if analysis[4] is not None else 'None'
                print(f'Analysis {i+1}: Sim_ID={analysis[0]}, Market={analysis[1]}_{analysis[2]}, Odds={analysis[3]}, Result={result}, P&L=${pl}, Date={analysis[6]}')
        else:
            print('No odds analysis records - real-time learning not capturing patterns yet')
        
        # Summary stats
        print("\nLEARNING SYSTEM SUMMARY:")
        cursor.execute('SELECT COUNT(*) FROM simulations')
        sim_count = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM match_results') 
        results_count = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM user_bet_selections')
        bets_count = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM match_odds_analysis')
        analysis_count = cursor.fetchone()[0]
        
        print(f'Total Simulations: {sim_count}')
        print(f'Settled Results: {results_count} ({(results_count/max(sim_count,1)*100):.1f}% of simulations)')
        print(f'User Bets Placed: {bets_count}')
        print(f'Learning Records: {analysis_count}')
        
        learning_active = results_count > 0 or analysis_count > 0
        status = "ACTIVE" if learning_active else "INACTIVE - Needs first settled match"
        print(f'Learning System Status: {status}')
        
        conn.close()
        
    except Exception as e:
        print(f'Database error: {e}')

if __name__ == "__main__":
    check_learning_system()