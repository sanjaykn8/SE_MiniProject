const express = require('express');
const Booking = require('../models/Booking');
const Road = require('../models/Road');
const User = require('../models/User');
const { authMiddleware } = require('./auth');
const { dijkstra } = require('../utils/dijkstra');
const config = require('../config');
const { spawnSync } = require('child_process');

const router = express.Router();

// helper to build nodes and edges from DB
async function loadGraph() {
  const roads = await Road.find({ status: 'open' });
  const nodesSet = new Set();
  for (const r of roads) { nodesSet.add(r.from); nodesSet.add(r.to); }
  const nodes = Array.from(nodesSet);
  const edges = roads.map(r => ({ from: r.from, to: r.to, weight: r.weight, capacity: r.capacity }));
  return { nodes, edges };
}

// create booking: protected (user)
router.post('/book', authMiddleware, async (req,res)=>{
  if (req.user.role !== 'user') return res.status(403).json({ error: 'Only users can book' });
  const { source, destination, slot } = req.body;
  const { nodes, edges } = await loadGraph();

  // incorporate dynamic weighting: increase weight for heavily booked roads (simple approach)
  // fetch bookings overlapping the desired slot and increase weights of edges appearing in booking paths
  const bookings = await Booking.find({ slot: { $gte: new Date(slot) } }); // simplistic
  // In this prototype we won't compute exact occupancy per edge. For demonstration, we just proceed.

  const { distance, path } = dijkstra(nodes, edges, source, destination);
  if (!path || path.length === 0) return res.status(400).json({ error: 'No path found' });

  // Call Python ML predictor to get congestion metric and recommended speed
  // send JSON input: { path, slot }
  let recommendedSpeed = 50;
  try {
    const input = JSON.stringify({ path, slot });
    const proc = spawnSync(config.PYTHON_PATH, [config.PREDICT_SCRIPT], { input, encoding: 'utf-8', maxBuffer: 10*1024*1024 });
    if (proc.status === 0 && proc.stdout) {
      const out = JSON.parse(proc.stdout);
      recommendedSpeed = out.recommendedSpeed || recommendedSpeed;
    } else {
      console.warn('Predictor failed', proc.stderr);
    }
  } catch (e) {
    console.warn('Predict call error', e.message);
  }

  const user = await User.findOne({ email: req.user.email });
  const booking = new Booking({
    user: user._id,
    userEmail: user.email,
    path,
    slot: new Date(slot),
    recommendedSpeed
  });
  await booking.save();

  res.json({ booking: { id: booking._id, path, recommendedSpeed, slot: booking.slot } });
});

// get bookings (admin: all; user: own)
router.get('/', authMiddleware, async (req,res)=>{
  if (req.user.role === 'admin') {
    const all = await Booking.find({}).sort('-createdAt');
    return res.json({ bookings: all });
  } else {
    const user = await User.findOne({ email: req.user.email });
    const own = await Booking.find({ user: user._id }).sort('-createdAt');
    return res.json({ bookings: own });
  }
});

module.exports = router;
