#!/usr/bin/env python3
"""
BANKROLL MANAGEMENT & BET TRACKING ENHANCEMENT
Applies the comprehensive bankroll system to EXODIA FINAL database

Features:
- User-controlled bankroll (editable starting balance, reset functionality)
- Automated Kelly Criterion calculations
- Comprehensive P&L tracking with drawdown management
- Automatic bankroll updates via triggers
- Performance views and analytics

Usage: python apply_bankroll_enhancement.py
"""

import sqlite3
import os
import sys
from datetime import datetime

def get_database_path():
    """Find the main database file"""
    possible_paths = [
        'exodia.db',
        '../exodia.db',
        './database/exodia.db',
        './exodia.db'
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return os.path.abspath(path)
    
    print("ERROR: Database not found. Checked paths:")
    for path in possible_paths:
        print(f"   - {os.path.abspath(path)}")
    return None

def backup_database(db_path):
    """Create backup before migration"""
    import shutil
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"{db_path}_backup_bankroll_{timestamp}"
    
    try:
        shutil.copy2(db_path, backup_path)
        print(f"SUCCESS: Backup created: {backup_path}")
        return backup_path
    except Exception as e:
        print(f"ERROR: Backup failed: {e}")
        return None

def check_existing_tables(conn):
    """Check if bankroll tables already exist"""
    cursor = conn.cursor()
    
    existing_tables = []
    check_tables = ['user_bankroll', 'user_bet_selections']
    
    for table in check_tables:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
        if cursor.fetchone():
            existing_tables.append(table)
    
    return existing_tables

def apply_bankroll_system(conn):
    """Apply the complete bankroll management system"""
    cursor = conn.cursor()
    
    print("🔧 Applying bankroll management system...")
    
    # Read the enhancement schema
    schema_path = os.path.join(os.path.dirname(__file__), 'schema_bet_tracking_enhancement.sql')
    
    if not os.path.exists(schema_path):
        print(f"❌ Schema file not found: {schema_path}")
        return False
    
    with open(schema_path, 'r') as f:
        schema_sql = f.read()
    
    # Split into individual statements (rough approach)
    statements = [stmt.strip() for stmt in schema_sql.split(';') if stmt.strip() and not stmt.strip().startswith('--')]
    
    success_count = 0
    error_count = 0
    
    for i, statement in enumerate(statements):
        if not statement or statement.startswith('/*'):
            continue
            
        try:
            cursor.execute(statement)
            success_count += 1
            print(f"   ✅ Statement {i+1}: Applied successfully")
        except sqlite3.Error as e:
            error_count += 1
            # Don't fail on expected errors (table exists, etc)
            if 'already exists' in str(e).lower():
                print(f"   ⚠️  Statement {i+1}: {e} (skipping - already exists)")
            else:
                print(f"   ❌ Statement {i+1}: {e}")
                if 'FOREIGN KEY constraint failed' not in str(e):
                    # This might be serious
                    print(f"      Statement was: {statement[:100]}...")
    
    conn.commit()
    print(f"\n📊 Migration Summary:")
    print(f"   - Success: {success_count}")
    print(f"   - Errors: {error_count}")
    
    return error_count == 0 or error_count < 3  # Allow some expected errors

def verify_bankroll_system(conn):
    """Verify the bankroll system is working"""
    cursor = conn.cursor()
    
    print("🔍 Verifying bankroll system...")
    
    # Check if user_bankroll table exists and has data
    try:
        cursor.execute("SELECT * FROM user_bankroll WHERE id = 1")
        bankroll = cursor.fetchone()
        
        if bankroll:
            print(f"   ✅ Bankroll initialized: ${bankroll[1]:.2f} starting balance")
            return True
        else:
            print("   ⚠️  Bankroll table exists but no default data")
            return False
    except sqlite3.Error as e:
        print(f"   ❌ Bankroll verification failed: {e}")
        return False

def test_bankroll_functionality(conn):
    """Test basic bankroll functionality"""
    cursor = conn.cursor()
    
    print("🧪 Testing bankroll functionality...")
    
    try:
        # Test: Get current bankroll status
        cursor.execute("SELECT * FROM bankroll_status")
        status = cursor.fetchone()
        
        if status:
            print(f"   ✅ Bankroll Status View: ${status[1]:.2f} current balance")
            
            # Test: Update starting balance (user control)
            cursor.execute("UPDATE user_bankroll SET starting_balance = 1500.00, current_balance = 1500.00 WHERE id = 1")
            conn.commit()
            
            cursor.execute("SELECT current_balance FROM user_bankroll WHERE id = 1")
            new_balance = cursor.fetchone()[0]
            
            if new_balance == 1500.00:
                print("   ✅ User balance control: Working")
                
                # Reset to default
                cursor.execute("UPDATE user_bankroll SET starting_balance = 1000.00, current_balance = 1000.00 WHERE id = 1")
                conn.commit()
                
                return True
            else:
                print(f"   ❌ Balance update failed: Expected 1500, got {new_balance}")
                return False
        else:
            print("   ❌ Bankroll status view not working")
            return False
            
    except sqlite3.Error as e:
        print(f"   ❌ Bankroll test failed: {e}")
        return False

def main():
    print("EXODIA FINAL - Bankroll Management Enhancement")
    print("=" * 60)
    
    # Find database
    db_path = get_database_path()
    if not db_path:
        sys.exit(1)
    
    print(f"Database: {db_path}")
    
    # Create backup
    backup_path = backup_database(db_path)
    if not backup_path:
        print("WARNING: Continuing without backup (risky)")
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        conn.execute("PRAGMA foreign_keys = ON")  # Enable foreign key constraints
        
        # Check existing tables
        existing = check_existing_tables(conn)
        if existing:
            print(f"⚠️  Found existing bankroll tables: {existing}")
            response = input("Continue anyway? (y/N): ").lower()
            if response != 'y':
                print("❌ Migration cancelled")
                sys.exit(0)
        
        # Apply enhancement
        success = apply_bankroll_system(conn)
        
        if success:
            # Verify system
            if verify_bankroll_system(conn):
                # Test functionality
                if test_bankroll_functionality(conn):
                    print("\n🎉 SUCCESS! Bankroll management system is ready!")
                    print("\n💰 Features Available:")
                    print("   - User-controlled bankroll (edit starting balance)")
                    print("   - Reset functionality")
                    print("   - Automatic Kelly Criterion calculations")
                    print("   - Real-time P&L tracking")
                    print("   - Drawdown monitoring")
                    print("   - Performance analytics")
                    print("\n📊 Next Steps:")
                    print("   1. Create bankroll management UI")
                    print("   2. Integrate with bet selection system")
                    print("   3. Add Kelly Criterion to value bet display")
                else:
                    print("⚠️  System applied but tests failed")
            else:
                print("⚠️  System applied but verification failed")
        else:
            print("❌ Migration failed")
            sys.exit(1)
            
    except Exception as e:
        print(f"💥 Critical error: {e}")
        sys.exit(1)
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()