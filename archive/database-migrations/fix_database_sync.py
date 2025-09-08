#!/usr/bin/env python3
"""
Fix database synchronization issue by creating missing tables in frontend database
"""

import sqlite3
import os
import shutil

def fix_database_sync():
    """Fix the database synchronization issue"""
    
    main_db = os.path.join(os.path.dirname(__file__), 'exodia.db')
    frontend_db = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'exodia.db')
    schema_file = os.path.join(os.path.dirname(__file__), 'schema.sql')
    
    print("=== DATABASE SYNCHRONIZATION FIX ===")
    print(f"Main database: {main_db}")
    print(f"Frontend database: {frontend_db}")
    print(f"Schema file: {schema_file}")
    
    # Check if files exist
    if not os.path.exists(main_db):
        print("[ERROR] Main database not found!")
        return False
        
    if not os.path.exists(frontend_db):
        print("[ERROR] Frontend database not found!")
        return False
        
    if not os.path.exists(schema_file):
        print("[ERROR] Schema file not found!")
        return False
    
    # Backup the frontend database first
    backup_file = frontend_db + '.backup'
    print(f"Creating backup: {backup_file}")
    shutil.copy2(frontend_db, backup_file)
    
    try:
        # Connect to both databases
        main_conn = sqlite3.connect(main_db)
        frontend_conn = sqlite3.connect(frontend_db)
        
        # Get list of missing tables in frontend
        main_cursor = main_conn.cursor()
        frontend_cursor = frontend_conn.cursor()
        
        main_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        main_tables = {table[0] for table in main_cursor.fetchall()}
        
        frontend_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        frontend_tables = {table[0] for table in frontend_cursor.fetchall()}
        
        missing_tables = main_tables - frontend_tables
        
        print(f"\nMain database tables: {sorted(main_tables)}")
        print(f"Frontend database tables: {sorted(frontend_tables)}")
        print(f"Missing tables in frontend: {sorted(missing_tables)}")
        
        if not missing_tables:
            print("\n[SUCCESS] No missing tables found!")
            return True
        
        # Read the schema file to get table creation statements
        with open(schema_file, 'r') as f:
            schema_content = f.read()
        
        # For each missing table, create it in the frontend database
        for table_name in missing_tables:
            print(f"\n[FIXING] Creating missing table: {table_name}")
            
            # Get the table schema from main database
            main_cursor.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{table_name}'")
            table_schema = main_cursor.fetchone()
            
            if table_schema and table_schema[0]:
                create_statement = table_schema[0]
                print(f"  SQL: {create_statement[:100]}...")
                
                try:
                    frontend_cursor.execute(create_statement)
                    print(f"  [SUCCESS] Created table: {table_name}")
                except Exception as e:
                    print(f"  [ERROR] Failed to create {table_name}: {e}")
            else:
                print(f"  [ERROR] Could not get schema for {table_name}")
        
        # Also need to create any missing indexes
        main_cursor.execute("SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL")
        main_indexes = main_cursor.fetchall()
        
        for index_sql in main_indexes:
            if index_sql[0]:
                try:
                    frontend_cursor.execute(index_sql[0])
                    print(f"  [SUCCESS] Created index")
                except Exception as e:
                    # Index might already exist, that's ok
                    if "already exists" not in str(e).lower():
                        print(f"  [WARNING] Index creation: {e}")
        
        # Commit changes
        frontend_conn.commit()
        
        # Verify the fix
        frontend_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        updated_frontend_tables = {table[0] for table in frontend_cursor.fetchall()}
        
        still_missing = main_tables - updated_frontend_tables
        
        if not still_missing:
            print(f"\n[SUCCESS] All tables synchronized!")
            print(f"Frontend database now has {len(updated_frontend_tables)} tables")
            
            # Specifically check for bookmaker_odds
            frontend_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='bookmaker_odds'")
            if frontend_cursor.fetchone():
                print("[SUCCESS] bookmaker_odds table now exists in frontend database!")
            else:
                print("[ERROR] bookmaker_odds table still missing!")
                
        else:
            print(f"[WARNING] Still missing tables: {sorted(still_missing)}")
        
        # Close connections
        main_conn.close()
        frontend_conn.close()
        
        return len(still_missing) == 0
        
    except Exception as e:
        print(f"[ERROR] Database synchronization failed: {e}")
        
        # Restore backup on error
        print("Restoring backup...")
        shutil.copy2(backup_file, frontend_db)
        
        return False

if __name__ == "__main__":
    success = fix_database_sync()
    print(f"\n{'='*50}")
    if success:
        print("DATABASE SYNCHRONIZATION COMPLETED SUCCESSFULLY!")
        print("The 'SQLITE_ERROR: no such table: bookmaker_odds' error should now be resolved.")
    else:
        print("DATABASE SYNCHRONIZATION FAILED!")
        print("The frontend database backup has been restored.")
    print(f"{'='*50}")
    
    exit(0 if success else 1)