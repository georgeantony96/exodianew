#!/usr/bin/env python3
"""
Initialize the SQLite database with the schema
"""

import sqlite3
import os

def init_database():
    # Database path
    db_path = "../database/exodia.db"
    schema_path = "../database/schema.sql"
    
    # Create database directory if it doesn't exist
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    
    try:
        # Read and execute schema
        with open(schema_path, 'r') as schema_file:
            schema_sql = schema_file.read()
            conn.executescript(schema_sql)
        
        conn.commit()
        print("Database initialized successfully!")
        print(f"Database created at: {os.path.abspath(db_path)}")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    init_database()