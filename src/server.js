require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());              // Allow requests from any origin (needed for frontend)
app.use(express.json());      // Parse JSON request bodies

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api', apiRoutes);   // All routes in api.js will be prefixed with /api

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});
