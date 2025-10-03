#!/usr/bin/env python
# predict.py
import sys, json
try:
    data = sys.stdin.read()
    inp = json.loads(data) if data else {}
except Exception as e:
    inp = {}

# Example heuristic:
# - If path length large -> lower recommended speed
# - If slot time in peak hours -> lower speed
def heuristic(path, slot):
    rec = 50
    try:
        import datetime
        dt = datetime.datetime.fromisoformat(slot)
        h = dt.hour
        if 8 <= h <= 10 or 17 <= h <= 19:
            rec = 30
        # longer paths -> step down
        if len(path) >= 6:
            rec -= 8
        if len(path) >= 10:
            rec -= 8
        rec = max(20, rec)
    except:
        pass
    return rec

# Try to use a saved sklearn regressor if exists (advanced), otherwise heuristic
recommended = heuristic(inp.get('path', []), inp.get('slot', ''))
out = { "recommendedSpeed": recommended }
sys.stdout.write(json.dumps(out))
