const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');

const { router: authRouter } = require('./routes/auth');
const roadsRouter = require('./routes/roads');
const bookingsRouter = require('./routes/bookings');

const app = express();
// health / root route (helps quick curl checks)
app.get('/', (req, res) => res.send('Smart Traffic Backend Running'));
app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', authRouter);
app.use('/api/roads', roadsRouter);
app.use('/api/bookings', bookingsRouter);

mongoose.connect(config.MONGO_URI).then(()=> {
  console.log('Mongo connected');
  app.listen(4000, ()=> console.log('Server running on http://localhost:4000'));
}).catch(err => {
  console.error('DB err', err);
});
