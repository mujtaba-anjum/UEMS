require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db.js');
const authRoutes = require('./middleware/auth.js');
const eventRoutes = require('./routes/events');

const feedbackRoutes = require('./routes/feedback');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());




// Routes
//app.use('/api/auth', authRoutes);



//app.use('/api/events', eventRoutes);
//app.use('/api/feedback', feedbackRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'University Event Management API' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});