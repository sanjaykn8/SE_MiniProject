// src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";
import "./styles.css";
import GraphSelector from './components/GraphSelector';

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

function Register() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setOk("");
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      // Save auth and redirect to booking
      saveAuth({ token: data.token, role: data.role, email: data.email });
      navigate('/book');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Create Account</h1>
        <p className="muted mb">Register as a user</p>

        <form onSubmit={handleSubmit} className="form">
          <label className="label"><span className="label-text">Name</span>
            <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" />
          </label>

          <label className="label"><span className="label-text">Email</span>
            <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@domain.com" autoComplete="email" />
          </label>

          <label className="label"><span className="label-text">Password</span>
            <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" autoComplete="new-password" />
          </label>

          {error && <div className="error">{error}</div>}
          {ok && <div className="muted">{ok}</div>}

          <button className="btn-primary full" type="submit">Register</button>
        </form>

        <div className="foot muted small">Already have an account? <Link to="/login" className="link">Login</Link></div>
      </div>
    </div>
  );
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

        <div className="foot muted small">New? <Link to="/register" className="link">Create an account</Link></div>

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
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [search, setSearch] = useState("");
  const [highlightPath, setHighlightPath] = useState([]);
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
        if (roadsRes.ok) {
          setRoads(roadsData.roads);
          // Build graph structure for GraphSelector
          const unique = new Set();
          roadsData.roads.forEach(r => { unique.add(r.from); unique.add(r.to); });
          const nodes = Array.from(unique).map(id => ({ id }));
          const links = roadsData.roads.map(r => ({ source: r.from, target: r.to, weight: r.weight }));
          setGraph({ nodes, links });
        }
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  const toggleRoadStatus = async (road) => {
    const newStatus = road.status === "open" ? "closed" : "open";
    try {
      const res = await fetch(`${API_BASE}/roads/update/${road._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + auth.token },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to update road");
      // update local state
      setRoads(rs => rs.map(r => r._id === road._id ? { ...r, status: newStatus } : r));
    } catch (e) {
      console.error(e);
      alert("Network error");
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (!search) return true;
    return (b.userEmail || "").toLowerCase().includes(search.toLowerCase());
  });

  const exportCSV = () => {
    const rows = [
      ["userEmail","slot","path","recommendedSpeed","createdAt"]
    ];
    filteredBookings.forEach(b => {
      rows.push([b.userEmail, new Date(b.slot).toISOString(), b.path.join("->"), b.recommendedSpeed, new Date(b.createdAt).toISOString()]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onSelectBooking = (b) => {
    setHighlightPath(b.path || []);
    // scroll into view or highlight visually by leaving it selected
    const el = document.getElementById(`booking-${b._id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="page-app">
      <Topbar role="admin" />
      <div className="app-grid" style={{ alignItems: "start" }}>
        {/* Left: Graph + Roads list */}
        <div className="panel">
          <h3>Road Network</h3>
          <div style={{ height: 420, width: "100%", marginBottom: 12 }}>
            <GraphSelector graph={graph} selected={{}} highlightPath={highlightPath} onSelect={() => {}} />
          </div>

          <h4 style={{ marginTop: 12 }}>Roads (toggle status)</h4>
          <div className="list" style={{ maxHeight: "40vh", overflow: "auto" }}>
            {roads.map(r => (
              <div key={r._id} className="list-item" style={{ alignItems: "center", gap: 12 }}>
                <div>
                  <div className="item-title">{r.from} — {r.to}</div>
                  <div className="muted small">Weight: {r.weight} • Capacity: {r.capacity} • Status: <strong>{r.status}</strong></div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <button onClick={() => toggleRoadStatus(r)} className="btn-ghost">
                    {r.status === "open" ? "Close" : "Open"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Bookings list, search, export */}
        <div className="panel">
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Bookings</h3>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by user email" className="input" style={{ flex: 1, marginLeft: 8 }} />
            <button onClick={exportCSV} className="btn-primary" style={{ marginLeft: 8 }}>Export CSV</button>
          </div>

          <div className="list scroll" style={{ maxHeight: "72vh" }}>
            {filteredBookings.map(b => (
              <div id={`booking-${b._id}`} key={b._id} className="list-item small-card" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
                <div style={{ width: "100%", display: "flex", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div className="item-title">{b.userEmail}</div>
                    <div className="muted small">Slot: {new Date(b.slot).toLocaleString()}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => onSelectBooking(b)} className="btn-ghost">Highlight</button>
                  </div>
                </div>

                <div style={{ width: "100%" }}>
                  <div className="muted small">Path: {b.path.join(" → ")}</div>
                  <div className="muted small">Speed: {b.recommendedSpeed} km/h</div>
                </div>
              </div>
            ))}
            {filteredBookings.length === 0 && <div className="muted small">No bookings found.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function UserBooking() {
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [selectedNodes, setSelectedNodes] = useState({ src: "", dest: "" });
  const [slot, setSlot] = useState("");
  const [result, setResult] = useState(null);
  const [highlightPath, setHighlightPath] = useState([]);
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
          const ids = Array.from(unique);
          const nodes = ids.map(id => ({ id }));
          const links = roadsData.roads.map(r => ({ source: r.from, target: r.to, weight: r.weight }));
          setGraph({ nodes, links });
          setSelectedNodes({ src: ids[0] || "", dest: ids[1] || "" });
        }
      } catch (e) { console.error(e); }
    }
    load();
  }, []);

  const calculateRoute = async () => {
    const src = selectedNodes.src;
    const dest = selectedNodes.dest;
    if (!src || !dest) return setResult({ error: "Select source and destination" });
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
      setHighlightPath(data.booking.path || []);
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

          {/* Graph selector */}
          <div style={{ marginBottom: 12 }}>
            <label className="label-text">Pick Source & Destination (click node = source, Ctrl/Cmd+click = destination)</label>
            <GraphSelector
              graph={graph}
              selected={{ src: selectedNodes.src, dest: selectedNodes.dest }}
              highlightPath={highlightPath}
              onSelect={(nodeId, role) => {
                setResult(null);
                setHighlightPath([]);
                if (role === "src") setSelectedNodes(s => ({ ...s, src: nodeId }));
                else if (role === "dest") setSelectedNodes(s => ({ ...s, dest: nodeId }));
              }}
              width={800}
              height={420}
            />
          </div>

          {/* Hidden fallback selects (keeps keyboard/testing compatibility) */}
          <div style={{ display: "none" }}>
            <select value={selectedNodes.src} onChange={(e) => setSelectedNodes(s => ({ ...s, src: e.target.value }))}>
              {graph.nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
            </select>
            <select value={selectedNodes.dest} onChange={(e) => setSelectedNodes(s => ({ ...s, dest: e.target.value }))}>
              {graph.nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
            </select>
          </div>

          <label className="label-text">Preferred Slot</label>
          <input type="datetime-local" value={slot} onChange={(e)=>setSlot(e.target.value)} className="input" />

          <div className="actions">
            <button onClick={calculateRoute} className="btn-primary">Calculate Route</button>
            <button onClick={() => {
              const ids = graph.nodes.map(n => n.id);
              setSelectedNodes({ src: ids[0] || "", dest: ids[1] || "" });
              setSlot("");
              setResult(null);
              setHighlightPath([]);
            }} className="btn-ghost">Reset</button>
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
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/book" element={<ProtectedRoute role="user"><UserBooking /></ProtectedRoute>} />
        <Route path="*" element={<div className="centered-page">Page not found — <Link to="/login">Go to Login</Link></div>} />
      </Routes>
    </BrowserRouter>
  );
}
