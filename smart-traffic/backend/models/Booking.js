const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userEmail: String,
  path: [String],
  slot: Date,
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: 'confirmed' },
  recommendedSpeed: Number
});

module.exports = mongoose.model('Booking', BookingSchema);
