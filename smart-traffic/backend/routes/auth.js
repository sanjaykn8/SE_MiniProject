// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const config = require('../config');
const router = express.Router();

const SALT_ROUNDS = 10;

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const u = new User({ email, password: hash, name, role: 'user' });
    await u.save();

    const token = jwt.sign({ id: u._id, role: u.role, email: u.email }, config.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, role: u.role, email: u.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, config.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, role: user.role, email: user.email });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// middleware to verify token
function authMiddleware(req,res,next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: 'No token' });
  const token = h.split(' ')[1];
  try {
    req.user = jwt.verify(token, config.JWT_SECRET);
    next();
  } catch(e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { router, authMiddleware };
