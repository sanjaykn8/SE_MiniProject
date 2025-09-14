// App.jsx - Single-file React app for Smart Traffic Automation (Login + Admin + User booking)
// Paste this into a Vite React project (src/App.jsx). Requires Tailwind CSS (recommended).

import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";

// ---------------------
// Hardcoded users (no DB)
// ---------------------
const USERS = [
  { id: 1, role: "admin", email: "admin@admin.com", password: "Admin@123" },
  { id: 2, role: "user", email: "user@user.com", password: "User@123" },
];

// ---------------------
// Helper: auth using localStorage
// ---------------------
const authKey = "smart_traffic_auth";
const saveAuth = (user) => localStorage.setItem(authKey, JSON.stringify(user));
const clearAuth = () => localStorage.removeItem(authKey);
const getAuth = () => JSON.parse(localStorage.getItem(authKey) || "null");

// ---------------------
// Protected Route HOC
// ---------------------
function ProtectedRoute({ children, role }) {
  const auth = getAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (role && auth.role !== role) return <Navigate to="/unauthorized" replace />;
  return children;
}

// ---------------------
// Login Page
// ---------------------
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    if (auth) {
      // redirect based on role
      return navigate(auth.role === "admin" ? "/admin" : "/book");
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = USERS.find((u) => u.email === email && u.password === password);
    if (!found) return setError("Invalid credentials. Use the sample accounts provided.");
    saveAuth({ id: found.id, role: found.role, email: found.email });
    if (found.role === "admin") navigate("/admin");
    else navigate("/book");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-gray-100 p-6">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-md rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-1 text-white">Smart Traffic System</h1>
        <p className="text-slate-300 mb-6">Login to continue — try <span className="font-mono">admin@admin.com</span> or <span className="font-mono">user@user.com</span></p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-slate-300 text-sm">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md bg-transparent border border-slate-600 px-3 py-2 outline-none text-white placeholder-slate-400"
              placeholder="you@domain.com"
            />
          </label>

          <label className="block">
            <span className="text-slate-300 text-sm">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md bg-transparent border border-slate-600 px-3 py-2 outline-none text-white placeholder-slate-400"
              placeholder="Password"
            />
          </label>

          {error && <div className="text-rose-400 text-sm">{error}</div>}

          <button
            type="submit"
            className="w-full py-2 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500 font-semibold shadow hover:scale-105 transition-transform"
          >
            Start
          </button>
        </form>

        <div className="mt-6 text-sm text-slate-400">
          <div><strong>Admin:</strong> admin@admin.com / Admin@123</div>
          <div><strong>User:</strong> user@user.com / User@123</div>
        </div>

      </div>
    </div>
  );
}

// ---------------------
// Unauthorized Page
// ---------------------
function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
      <div className="max-w-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Unauthorized Access</h2>
        <p className="mb-6">You do not have permission to view this page. Please login with correct account.</p>
        <Link to="/login" className="underline">Back to Login</Link>
      </div>
    </div>
  );
}

// ---------------------
// Simple Nav + Logout
// ---------------------
function Topbar({ role }) {
  const navigate = useNavigate();
  const auth = getAuth();
  const logout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="bg-white/5 backdrop-blur p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="font-bold text-white">SmartTraffic</div>
        {role === 'admin' ? <div className="text-slate-300">Admin Panel</div> : <div className="text-slate-300">User Booking</div>}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-slate-300">{auth?.email}</div>
        <button onClick={logout} className="px-3 py-1 border rounded text-white border-slate-600">Logout</button>
      </div>
    </div>
  );
}

// ---------------------
// Admin Dashboard (mock editable data)
// ---------------------
function AdminDashboard() {
  const [roads, setRoads] = useState([
    { id: 1, name: "A - B", capacity: 10, status: "open" },
    { id: 2, name: "B - C", capacity: 8, status: "open" },
    { id: 3, name: "C - D", capacity: 6, status: "maintenance" },
  ]);

  const [bookings, setBookings] = useState([
    { id: 1, user: "user@user.com", route: "A -> B -> C", slot: "2025-09-15 10:00" },
  ]);

  const toggleRoad = (id) => {
    setRoads((r) => r.map(rr => rr.id === id ? { ...rr, status: rr.status === 'open' ? 'closed' : 'open' } : rr));
  };

  return (
    <div className="min-h-screen bg-slate-800 text-white">
      <Topbar role="admin" />
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2">
          <h3 className="text-xl font-semibold mb-4">Roads</h3>
          <div className="space-y-3">
            {roads.map(r => (
              <div key={r.id} className="p-4 bg-white/3 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-sm text-slate-300">Capacity: {r.capacity} — Status: {r.status}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleRoad(r.id)} className="px-3 py-1 rounded bg-indigo-600">Toggle</button>
                  <button className="px-3 py-1 rounded border border-slate-600">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">Bookings</h3>
          <div className="space-y-3">
            {bookings.map(b => (
              <div key={b.id} className="p-3 bg-white/3 rounded">
                <div className="font-medium">{b.user}</div>
                <div className="text-sm text-slate-300">{b.route}</div>
                <div className="text-sm text-slate-300">Slot: {b.slot}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------
// User Booking Page (mock)
// ---------------------
function UserBooking() {
  const [nodes] = useState(["A","B","C","D"]);
  const [src, setSrc] = useState(nodes[0]);
  const [dest, setDest] = useState(nodes[1]);
  const [slot, setSlot] = useState("");
  const [result, setResult] = useState(null);

  const calculateRoute = () => {
    if (src === dest) return setResult({ error: 'Source and destination cannot be same' });
    // Mock 'route' logic: simple path list
    const path = [src, 'B', 'C', dest].filter((v, i, a) => a.indexOf(v) === i);
    // Mock recommended speed logic: if slot time in peak hours, lower speed
    let recommended = 50;
    if (slot) {
      const hour = new Date(slot).getHours();
      if (!isNaN(hour)) {
        if (hour >= 8 && hour <= 10) recommended = 30; // morning peak
        else if (hour >= 17 && hour <= 19) recommended = 28; // evening peak
        else recommended = 50;
      }
    }
    setResult({ path, recommended, slot: slot || 'ASAP' });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Topbar role="user" />
      <div className="p-6 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Book a Route</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-slate-300">Source</label>
            <select value={src} onChange={(e)=>setSrc(e.target.value)} className="input select">
              {nodes.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-300">Destination</label>
              <select value={dest} onChange={(e)=>setDest(e.target.value)} className="input select">
                {nodes.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
          </div>
        </div>

        <label className="text-sm text-slate-300">Preferred Slot (optional)</label>
        <input type="datetime-local" value={slot} onChange={(e)=>setSlot(e.target.value)} className="w-full mt-1 p-2 rounded bg-white/5 mb-4" />

        <div className="flex gap-3">
          <button onClick={calculateRoute} className="px-4 py-2 rounded bg-indigo-600">Calculate Route</button>
          <button onClick={()=>{ setSrc(nodes[0]); setDest(nodes[1]); setSlot(''); setResult(null); }} className="px-4 py-2 rounded border">Reset</button>
        </div>

        {result && (
          <div className="mt-6 p-4 bg-white/5 rounded">
            {result.error ? (
              <div className="text-rose-400">{result.error}</div>
            ) : (
              <div>
                <div className="text-slate-300">Planned slot: <span className="font-medium">{result.slot}</span></div>
                <div className="mt-2">Route: <span className="font-semibold">{result.path.join(' → ')}</span></div>
                <div className="mt-2">Recommended speed: <span className="font-semibold">{result.recommended} km/h</span></div>
                <div className="mt-3 text-sm text-slate-400">(This is a mock calculation for frontend demo.)</div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ---------------------
// App Root
// ---------------------
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/book" element={<ProtectedRoute role="user"><UserBooking /></ProtectedRoute>} />

        <Route path="*" element={<div className="min-h-screen flex items-center justify-center"> <div>Page not found — <Link to="/login">Go to Login</Link></div></div>} />
      </Routes>
    </BrowserRouter>
  );
}

/*
  Instructions to run this frontend locally (recommended):

  1) Create project (Vite + React):
     npm create vite@latest smart-traffic -- --template react
     cd smart-traffic

  2) Install deps:
     npm install react-router-dom

  3) Setup Tailwind (optional but recommended for the provided styles):
     npm install -D tailwindcss postcss autoprefixer
     npx tailwindcss init -p
     // add to tailwind.config.js content: ["./index.html", "./src/**//*.{js,jsx}"]
     // in src/index.css add: @tailwind base; @tailwind components; @tailwind utilities;

  4) Replace src/App.jsx with this file. Ensure src/main.jsx imports "./index.css".

  5) Run dev server:
     npm run dev

  Login test accounts:
    Admin -> admin@admin.com  / Admin@123
    User  -> user@user.com   / User@123

  Notes:
  - This is a frontend-only mock. No DB yet — all data is in-memory and sample users are hardcoded.
  - The admin page shows mock 'roads' and 'bookings' for editing demonstration.
  - The user booking page demonstrates booking UI and a simple recommended speed heuristic.
*/
