// backend/server.js
require('dotenv').config({ path: __dirname + '/.env' }); // Load .env from backend directory
const express = require('express');
const cors = require('cors');
const db = require('./config/database'); // Import Sequelize configuration
const path = require('path');
const bcrypt = require('bcryptjs'); // For hashing passwords

const app = express();
const PORT = process.env.PORT || 3001; // Backend will run on port 3001

// Middleware
// More explicit CORS configuration for development
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Sync database and start server
// Allow an opt-in ALTER sync to apply non-destructive schema changes when
// needed. This is disabled by default to avoid accidental schema mutations.
const syncOptions = process.env.DB_ALTER_ON_START === 'true' ? { alter: true } : {};
if (syncOptions.alter) {
  console.warn('DB_ALTER_ON_START=true -> running sequelize.sync({ alter: true }) to apply schema changes (use with caution)');
}

db.sequelize.sync(syncOptions) // Removed `force: true` to make data persistent
  .then(() => {
    console.log('Database synced.');
    // Seeding logic has been removed. The database is now persistent.
    // Data should be managed via the application's UI/API.

    // --- Import routes AFTER database is synced ---
    const authRoutes = require('./routes/auth');
    const userRoutes = require('./routes/users');
    const serviceRoutes = require('./routes/services');
    const appointmentRoutes = require('./routes/appointments');
    const promotionRoutes = require('./routes/promotions');
    const voucherRoutes = require('./routes/vouchers');
    const walletRoutes = require('./routes/wallets');
    const staffRoutes = require('./routes/staff');
    const paymentRoutes = require('./routes/payments');
    const reviewRoutes = require('./routes/reviews');
    const missionRoutes = require('./routes/missions');
    
    // Use unprotected auth routes first
    app.use('/api/auth', authRoutes);

    // Use protected routes
    app.use('/api/users', userRoutes);
    app.use('/api/services', serviceRoutes);
    app.use('/api/appointments', appointmentRoutes);
    app.use('/api/promotions', promotionRoutes);
    app.use('/api/vouchers', voucherRoutes);
    app.use('/api/wallets', walletRoutes);
    app.use('/api/staff', staffRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/reviews', reviewRoutes);
    app.use('/api/missions', missionRoutes);


    // Simple root route
    app.get('/', (req, res) => {
      res.send('Welcome to Anh Thơ Spa Backend API!');
    });

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Access the API at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });
