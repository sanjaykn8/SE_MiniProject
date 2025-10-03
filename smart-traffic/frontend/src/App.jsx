// src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";
import "./styles.css";

const API_BASE = "http://localhost:4000/api";

const authKey = "smart_traffic_auth";
const saveAuth = (auth) => localStorage.setItem(authKey, JSON.stringify(auth));
const clearAuth = () => localStorage.removeItem(authKey);
const getAuth = () => JSON.parse(localStorage.getItem(authKey) || "null");

function ProtectedRoute({ children, role }) {
  const auth = getAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (role && auth.role !== role) return <Navigate to="/unauthorized" replace />;
  return children;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    if (auth) return navigate(auth.role === "admin" ? "/admin" : "/book");
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      saveAuth({ token: data.token, role: data.role, email: data.email });
      if (data.role === "admin") navigate("/admin");
      else navigate("/book");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h1 className="title floaty">Smart Traffic System</h1>
        <p className="muted mb">Plan, Book & Smoothen Traffic</p>

        <form onSubmit={handleSubmit} className="form">
          <label className="label">
            <span className="label-text">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@domain.com"
              autoComplete="email"
            />
          </label>

          <label className="label">
            <span className="label-text">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Password"
              autoComplete="current-password"
            />
          </label>

          {error && <div className="error">{error}</div>}

          <button type="submit" className="btn-primary full">Start</button>
        </form>

        <div className="foot muted small">
          <div><strong>Admin:</strong> admin@admin.com / Admin@123</div>
          <div><strong>User:</strong> user@user.com / User@123</div>
        </div>
      </div>
    </div>
  );
}

function Unauthorized() {
  return (
    <div className="centered-page">
      <div className="card small-card text-center">
        <h2>Unauthorized Access</h2>
        <p className="muted">Please login with correct account.</p>
        <Link to="/login" className="link">Back to Login</Link>
      </div>
    </div>
  );
}

function Topbar({ role }) {
  const navigate = useNavigate();
  const auth = getAuth();
  const logout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-title">SmartTraffic</div>
        <div className="muted small">{role === "admin" ? "Admin Panel" : "User Booking"}</div>
      </div>

      <div className="top-actions">
        <div className="muted small">{auth?.email}</div>
        <button onClick={logout} className="btn-ghost">Logout</button>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [roads, setRoads] = useState([]);
  const auth = getAuth();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/bookings`, {
          headers: { Authorization: "Bearer " + auth.token }
        });
        const data = await res.json();
        if (res.ok) setBookings(data.bookings);

        const roadsRes = await fetch(`${API_BASE}/roads/all`, {
          headers: { Authorization: "Bearer " + auth.token }
        });
        const roadsData = await roadsRes.json();
        if (roadsRes.ok) setRoads(roadsData.roads);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  return (
    <div className="page-app">
      <Topbar role="admin" />
      <div className="app-grid">
        <div className="panel">
          <h3>Roads</h3>
          <div className="list">
            {roads.map(r => (
              <div key={r._id} className="list-item">
                <div className="item-left">
                  <div className="item-title">{r.from} — {r.to}</div>
                  <div className="muted small">Capacity: {r.capacity} • {r.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3>Bookings</h3>
          <div className="list scroll">
            {bookings.map(b => (
              <div key={b._id} className="list-item small-card">
                <div className="item-title">{b.userEmail}</div>
                <div className="muted small">Path: {b.path.join(" → ")}</div>
                <div className="muted small">Slot: {new Date(b.slot).toLocaleString()}</div>
                <div className="muted small">Speed: {b.recommendedSpeed} km/h</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UserBooking() {
  const [nodes, setNodes] = useState([]);
  const [src, setSrc] = useState("");
  const [dest, setDest] = useState("");
  const [slot, setSlot] = useState("");
  const [result, setResult] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    async function load() {
      try {
        const roadsRes = await fetch(`${API_BASE}/roads/all`, {
          headers: { Authorization: "Bearer " + auth.token }
        });
        const roadsData = await roadsRes.json();
        if (roadsRes.ok) {
          const unique = new Set();
          roadsData.roads.forEach(r => { unique.add(r.from); unique.add(r.to); });
          const arr = Array.from(unique);
          setNodes(arr);
          setSrc(arr[0] || "");
          setDest(arr[1] || "");
        }
      } catch (e) { console.error(e); }
    }
    load();
  }, []);

  const calculateRoute = async () => {
    if (!src || !dest) return;
    if (src === dest) return setResult({ error: "Source and destination cannot be same" });

    try {
      const res = await fetch(`${API_BASE}/bookings/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + auth.token },
        body: JSON.stringify({ source: src, destination: dest, slot })
      });
      const data = await res.json();
      if (!res.ok) return setResult({ error: data.error || "Booking failed" });
      setResult({ path: data.booking.path, recommended: data.booking.recommendedSpeed, slot: data.booking.slot });
    } catch (e) {
      setResult({ error: "Network error" });
    }
  };

  return (
    <div className="page-app">
      <Topbar role="user" />
      <div className="panel-center">
        <div className="card">
          <h2>Book a Route</h2>

          <div className="grid-2">
            <div>
              <label className="label-text">Source</label>
              <select value={src} onChange={(e)=>setSrc(e.target.value)} className="input select">
                {nodes.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div>
              <label className="label-text">Destination</label>
              <select value={dest} onChange={(e)=>setDest(e.target.value)} className="input select">
                {nodes.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <label className="label-text">Preferred Slot</label>
          <input type="datetime-local" value={slot} onChange={(e)=>setSlot(e.target.value)} className="input" />

          <div className="actions">
            <button onClick={calculateRoute} className="btn-primary">Calculate Route</button>
            <button onClick={()=>{ setSrc(nodes[0]); setDest(nodes[1]); setSlot(""); setResult(null); }} className="btn-ghost">Reset</button>
          </div>

          {result && (
            <div className="result-card">
              {result.error ? (
                <div className="error">{result.error}</div>
              ) : (
                <>
                  <div className="muted">Planned slot: <strong>{new Date(result.slot).toLocaleString()}</strong></div>
                  <div className="muted">Route: <strong>{result.path.join(" → ")}</strong></div>
                  <div className="muted">Recommended speed: <strong>{result.recommended} km/h</strong></div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/book" element={<ProtectedRoute role="user"><UserBooking /></ProtectedRoute>} />
        <Route path="*" element={<div className="centered-page">Page not found — <Link to="/login">Go to Login</Link></div>} />
      </Routes>
    </BrowserRouter>
  );
}
