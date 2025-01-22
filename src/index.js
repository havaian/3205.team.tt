const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./config/database');
const urlRoutes = require('./url/routes');

const app = express();

// Only connect to database if not in test environment
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'view')));

// Routes
app.use('/api', urlRoutes);

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;