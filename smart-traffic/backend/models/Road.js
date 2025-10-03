const mongoose = require('mongoose');

const RoadSchema = new mongoose.Schema({
  from: String,
  to: String,
  weight: Number,    // base travel time / cost
  capacity: Number,  // max parallel bookings
  status: { type: String, default: 'open' } // open/closed/maintenance
});

module.exports = mongoose.model('Road', RoadSchema);
