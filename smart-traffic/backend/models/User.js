const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String, // plaintext for lab/demo only; hash in real projects
  role: { type: String, enum: ['admin','user'], default: 'user' },
  name: String
});

module.exports = mongoose.model('User', UserSchema);
