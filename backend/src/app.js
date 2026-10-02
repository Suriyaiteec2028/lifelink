const express = require('express');
const cors = require('cors');
const { apiLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/authRoutes');
const donorRoutes = require('./routes/donorRoutes');
const requestRoutes = require('./routes/requestRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const donationRoutes = require('./routes/donationRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiter in production
if (process.env.NODE_ENV === 'production') {
  app.use('/api', apiLimiter);
}

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'LifeLink Blood Donor & Request Portal API',
    cooldownMonths: parseInt(process.env.COOLDOWN_MONTHS || '6', 10),
    timestamp: new Date()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/donations', donationRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
