#!/usr/bin/env python3
import sys
import json

try:
    print("Testing imports...", file=sys.stderr)
    import numpy
    print("Numpy imported successfully", file=sys.stderr)
    import scipy
    print("Scipy imported successfully", file=sys.stderr)
    from monte_carlo.simulation_engine import SimulationEngine
    print("SimulationEngine imported successfully", file=sys.stderr)
    
    result = {"success": True, "message": "All imports successful"}
    print(json.dumps(result))
    
except Exception as e:
    print(f"Import error: {str(e)}", file=sys.stderr)
    result = {"success": False, "error": str(e)}
    print(json.dumps(result))
    sys.exit(1)