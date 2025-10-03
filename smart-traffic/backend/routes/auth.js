const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const router = express.Router();

router.post('/login', async (req,res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (!user) return res.status(401).json({ error: 'Invalid credentials'});
  const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, config.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, role: user.role, email: user.email });
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
