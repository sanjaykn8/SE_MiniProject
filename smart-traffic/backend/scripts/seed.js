const mongoose = require('mongoose');
const fs = require('fs');
const config = require('../config');
const User = require('../models/User');
const Road = require('../models/Road');

async function main() {
  await mongoose.connect(config.MONGO_URI);
  console.log('Connected to DB');

  // create users
  await User.deleteMany({});
  const admin = new User({ email: 'admin@admin.com', password: 'Admin@123', role: 'admin', name: 'Admin' });
  const user = new User({ email: 'user@user.com', password: 'User@123', role: 'user', name: 'Demo User' });
  await admin.save();
  await user.save();
  console.log('Users created');

  // load graph
  const g = JSON.parse(fs.readFileSync('graph.json'));
  await Road.deleteMany({});
  for (const e of g.edges) {
    await new Road({ from: e.from, to: e.to, weight: e.weight, capacity: e.capacity }).save();
  }
  console.log('Roads seeded:', g.edges.length);

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
