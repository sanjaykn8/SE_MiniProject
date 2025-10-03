const express = require('express');
const Road = require('../models/Road');
const { authMiddleware } = require('./auth');
const router = express.Router();

router.get('/all', authMiddleware, async (req,res)=>{
  const roads = await Road.find({});
  res.json({ roads });
});

// Admin endpoint to update status
router.post('/update/:id', authMiddleware, async (req,res)=>{
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { id } = req.params;
  const { status } = req.body;
  await Road.findByIdAndUpdate(id, { status });
  res.json({ ok: true });
});

module.exports = router;
