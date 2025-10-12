// backend/scripts/seed.js
const mongoose = require('mongoose');
const fs = require('fs');
const bcrypt = require('bcrypt');
const config = require('../config');
const User = require('../models/User');
const Road = require('../models/Road');

const SALT_ROUNDS = 10;

async function main() {
  await mongoose.connect(config.MONGO_URI);
  console.log('Connected to DB');

  await User.deleteMany({});
  const adminHash = await bcrypt.hash('Admin@123', SALT_ROUNDS);
  const userHash = await bcrypt.hash('User@123', SALT_ROUNDS);

  const admin = new User({ email: 'admin@admin.com', password: adminHash, role: 'admin', name: 'Admin' });
  const user = new User({ email: 'user@user.com', password: userHash, role: 'user', name: 'Demo User' });
  await admin.save();
  await user.save();
  console.log('Users created');

  const g = JSON.parse(fs.readFileSync('graph.json'));
  await Road.deleteMany({});
  for (const e of g.edges) {
    await new Road({ from: e.from, to: e.to, weight: e.weight, capacity: e.capacity }).save();
  }
  console.log('Roads seeded:', g.edges.length);

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
