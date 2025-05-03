const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB Connection String
const mongoUri = process.env.MONGODB_URI || 'YOUR MONGODB URL';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB:', err));

// Define a schema and model
const DataSchema = new mongoose.Schema({
  pm25: Number,
  pm10: Number,
  latitude: Number,
  longitude: Number,
  device_temp: Number, 
  real_temp: Number,   
  humidity: Number,   
  timestamp: { type: Date, default: Date.now }
});

const Data = mongoose.model('Data', DataSchema);

// Serve static HTML file
app.use(express.static(path.join(__dirname)));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/track', (req, res) => {
  res.sendFile(path.join(__dirname, 'track.html'));
});

// API routes
app.post('/api/data', async (req, res) => {
  const { pm25, pm10, latitude, longitude, device_temp, real_temp, humidity } = req.body;
  const newData = new Data({ pm25, pm10, latitude, longitude, device_temp, real_temp, humidity });
  await newData.save();
  io.emit('newData', newData); // Emit new data to all connected clients
  res.status(201).send(newData);
});

app.get('/api/data', async (req, res) => {
  const data = await Data.find().sort({ timestamp: -1 }).limit(100);
  res.status(200).send(data);
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
