#!/usr/bin/env python3
import sys
import json

def main():
    try:
        # Read from stdin
        if len(sys.argv) > 1:
            # Read from file
            with open(sys.argv[1], 'r') as f:
                input_data = f.read()
        else:
            # Read from stdin
            input_data = sys.stdin.read()
        
        data = json.loads(input_data)
        
        # Simple test response
        result = {
            "success": True,
            "test_data": data,
            "simulation_id": 999,
            "results": {
                "1x2": {"home": 0.45, "draw": 0.25, "away": 0.30},
                "test": "Working without emojis"
            }
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "traceback": None
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()