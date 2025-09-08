#!/usr/bin/env python3
"""
Database inspection tool for EXODIA FINAL
Check if simulations, bets, and data are being saved properly
"""

import sqlite3
import json
from datetime import datetime

def inspect_database():
    db_path = "./database/exodia.db"
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("=" * 60)
        print("🔍 EXODIA DATABASE INSPECTION")
        print("=" * 60)
        
        # Check all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"\n📋 Available Tables ({len(tables)}):")
        for table in tables:
            print(f"  - {table[0]}")
        
        # Check simulations table
        print(f"\n🎯 SIMULATIONS TABLE:")
        cursor.execute("SELECT COUNT(*) FROM simulations")
        sim_count = cursor.fetchone()[0]
        print(f"  Total simulations: {sim_count}")
        
        if sim_count > 0:
            cursor.execute("""
                SELECT id, created_at, home_team_id, away_team_id, distribution_type, iterations
                FROM simulations 
                ORDER BY created_at DESC 
                LIMIT 5
            """)
            recent_sims = cursor.fetchall()
            print(f"  Recent 5 simulations:")
            for sim in recent_sims:
                print(f"    ID: {sim[0]} | {sim[1]} | Teams: {sim[2]} vs {sim[3]} | {sim[4]} | {sim[5]} iter")
        
        # Check bets table
        print(f"\n💰 BETS TABLE:")
        cursor.execute("SELECT COUNT(*) FROM bets")
        bet_count = cursor.fetchone()[0]
        print(f"  Total bets: {bet_count}")
        
        if bet_count > 0:
            cursor.execute("""
                SELECT id, simulation_id, market_type, market_option, selected_odds, edge_percentage, bet_status
                FROM bets 
                ORDER BY id DESC 
                LIMIT 5
            """)
            recent_bets = cursor.fetchall()
            print(f"  Recent 5 bets:")
            for bet in recent_bets:
                print(f"    ID: {bet[0]} | Sim: {bet[1]} | {bet[2]} {bet[3]} | Odds: {bet[4]} | Edge: {bet[5]}% | {bet[6]}")
        
        # Check teams table
        print(f"\n⚽ TEAMS TABLE:")
        cursor.execute("SELECT COUNT(*) FROM teams")
        team_count = cursor.fetchone()[0]
        print(f"  Total teams: {team_count}")
        
        if team_count > 0:
            cursor.execute("SELECT id, name, league_id FROM teams LIMIT 10")
            sample_teams = cursor.fetchall()
            print(f"  Sample teams:")
            for team in sample_teams:
                print(f"    ID: {team[0]} | {team[1]} | League: {team[2]}")
        
        # Check leagues table
        print(f"\n🏆 LEAGUES TABLE:")
        cursor.execute("SELECT COUNT(*) FROM leagues")
        league_count = cursor.fetchone()[0]
        print(f"  Total leagues: {league_count}")
        
        if league_count > 0:
            cursor.execute("SELECT id, name, country FROM leagues")
            leagues = cursor.fetchall()
            print(f"  All leagues:")
            for league in leagues:
                print(f"    ID: {league[0]} | {league[1]} | {league[2]}")
        
        # Check bankroll table
        print(f"\n💳 BANKROLL TABLE:")
        cursor.execute("SELECT COUNT(*) FROM bankroll")
        bankroll_count = cursor.fetchone()[0]
        print(f"  Total bankroll entries: {bankroll_count}")
        
        if bankroll_count > 0:
            cursor.execute("""
                SELECT id, current_balance, total_profit_loss, created_at
                FROM bankroll 
                ORDER BY created_at DESC 
                LIMIT 3
            """)
            recent_bankroll = cursor.fetchall()
            print(f"  Recent bankroll entries:")
            for entry in recent_bankroll:
                print(f"    ID: {entry[0]} | Balance: ${entry[1]} | P/L: ${entry[2]} | {entry[3]}")
        
        # Check for any data integrity issues
        print(f"\n🔧 DATA INTEGRITY CHECKS:")
        
        # Check for orphaned bets (bets without valid simulation)
        cursor.execute("""
            SELECT COUNT(*) FROM bets b 
            LEFT JOIN simulations s ON b.simulation_id = s.id 
            WHERE s.id IS NULL AND b.simulation_id IS NOT NULL
        """)
        orphaned_bets = cursor.fetchone()[0]
        print(f"  Orphaned bets: {orphaned_bets}")
        
        # Check for teams without leagues
        cursor.execute("""
            SELECT COUNT(*) FROM teams t 
            LEFT JOIN leagues l ON t.league_id = l.id 
            WHERE l.id IS NULL AND t.league_id IS NOT NULL
        """)
        orphaned_teams = cursor.fetchone()[0]
        print(f"  Teams without valid leagues: {orphaned_teams}")
        
        print(f"\n✅ Database inspection complete!")
        print(f"📊 Summary: {sim_count} simulations, {bet_count} bets, {team_count} teams, {league_count} leagues")
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    inspect_database()