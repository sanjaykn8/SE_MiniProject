#!/usr/bin/env python3
# backend/ml/predict.py
"""
Predictor for Smart Traffic Automation.
Input (stdin): JSON object, e.g. {"path": ["N1","N2","N3"], "slot":"2025-10-12T09:30:00"}
Output (stdout): JSON e.g.
{
  "recommendedSpeed": 30,
  "congestionScore": 0.72,
  "modelUsed": False,
  "reason": "heuristic: peak hour and path length=7"
}

Optional: run training mode:
  python predict.py --train training.csv
training.csv should have columns: path_length,hour,is_peak,is_weekend,target_speed
"""

import sys, json, os, math
from datetime import datetime
from pathlib import Path

MODEL_PATH = Path(__file__).resolve().parent / "model.pkl"

def parse_input():
    # try to read stdin JSON
    try:
        raw = sys.stdin.read()
        inp = json.loads(raw) if raw and raw.strip() else {}
    except Exception:
        inp = {}
    # also allow CLI args as fallback (not used normally)
    return inp

def featurize(path, slot_iso):
    # features: path_length, hour, is_peak, is_weekend
    path_length = 0
    try:
        path_length = len(path) if path else 0
    except:
        path_length = 0

    hour = None
    is_weekend = 0
    is_peak = 0
    try:
        if slot_iso:
            dt = datetime.fromisoformat(slot_iso)
            hour = dt.hour
            is_weekend = 1 if dt.weekday() >= 5 else 0
            is_peak = 1 if (8 <= hour <= 10 or 17 <= hour <= 19) else 0
        else:
            hour = -1
    except Exception:
        hour = -1

    # scaled features for naive model
    return {
        "path_length": int(path_length),
        "hour": int(hour),
        "is_peak": int(is_peak),
        "is_weekend": int(is_weekend)
    }

def heuristic_speed(features):
    # baseline speed (km/h)
    speed = 50.0
    # peak hour penalty
    if features["is_peak"]:
        speed -= 18.0
    # weekend slight improvement (less commuter traffic)
    if features["is_weekend"]:
        speed += 4.0
    # longer routes -> reduce speed
    if features["path_length"] >= 6:
        speed -= 8.0
    if features["path_length"] >= 10:
        speed -= 8.0
    # shorter routes can go slightly faster
    if features["path_length"] <= 2:
        speed += 6.0
    # clamp
    speed = max(20.0, min(80.0, speed))
    return round(speed, 1)

def heuristic_congestion_score(features):
    # simple score 0..1 combining path length and peak
    base = 0.1 * features["path_length"] / (features["path_length"] + 3)  # grows with length
    if features["is_peak"]:
        base += 0.35
    if features["is_weekend"]:
        base *= 0.8
    # clamp
    return round(max(0.0, min(1.0, base)), 3)

def try_model_predict(features):
    # returns (pred_speed_float) or raises
    try:
        import pickle
        import numpy as np
        if not MODEL_PATH.exists():
            raise FileNotFoundError("model file not found")
        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)
        # build feature vector in a stable order:
        fv = np.array([[features["path_length"], features["hour"], features["is_peak"], features["is_weekend"]]])
        pred = model.predict(fv)
        # model might return array-like
        speed = float(pred[0]) if hasattr(pred, "__iter__") else float(pred)
        # safe clamp
        speed = max(15.0, min(100.0, speed))
        return round(speed, 1)
    except Exception as e:
        raise

def output_json(obj):
    sys.stdout.write(json.dumps(obj))
    sys.stdout.flush()

def train_model_from_csv(csv_path):
    # simple training utility to create a model.pkl
    try:
        import pandas as pd
        from sklearn.ensemble import RandomForestRegressor
        import pickle
    except Exception as e:
        print(json.dumps({"error":"missing training dependencies: pandas scikit-learn required", "detail": str(e)}))
        return 1

    if not Path(csv_path).exists():
        print(json.dumps({"error": f"training csv not found: {csv_path}"}))
        return 1

    df = pd.read_csv(csv_path)
    # Expect columns: path_length, hour, is_peak, is_weekend, target_speed
    required = {"path_length","hour","is_peak","is_weekend","target_speed"}
    if not required.issubset(set(df.columns)):
        print(json.dumps({"error":"CSV missing required columns", "required": list(required)}))
        return 1

    X = df[["path_length","hour","is_peak","is_weekend"]].values
    y = df["target_speed"].values
    model = RandomForestRegressor(n_estimators=200, random_state=42)
    model.fit(X,y)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    print(json.dumps({"ok": True, "saved_model": str(MODEL_PATH)}))
    return 0

def main():
    # support CLI training: python predict.py --train training.csv
    if len(sys.argv) >= 3 and sys.argv[1] in ("--train", "-t"):
        csv = sys.argv[2]
        return train_model_from_csv(csv)

    inp = parse_input()
    path = inp.get("path", []) or []
    slot = inp.get("slot", "") or inp.get("datetime", "")

    features = featurize(path, slot)
    result = {
        "recommendedSpeed": None,
        "congestionScore": heuristic_congestion_score(features),
        "modelUsed": False,
        "reason": ""
    }

    # try model first, fallback to heuristic
    try:
        speed = try_model_predict(features)
        result["recommendedSpeed"] = speed
        result["modelUsed"] = True
        result["reason"] = "model"
    except Exception as e:
        # fallback to heuristic
        result["recommendedSpeed"] = heuristic_speed(features)
        result["modelUsed"] = False
        result["reason"] = f"heuristic (model error: {str(e)})" if str(e) else "heuristic"

    # include diagnostic features (helpful during dev)
    result["features"] = features

    output_json(result)
    return 0

if __name__ == "__main__":
    sys.exit(main())
