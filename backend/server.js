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
// Trust proxy to get correct client IP
app.set('trust proxy', true);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve static files from the assets directory
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

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
    const walletRoutes = require('./routes/wallets');
    const staffRoutes = require('./routes/staff');
    const paymentRoutes = require('./routes/payments');
    const reviewRoutes = require('./routes/reviews');
    const chatbotRoutes = require('./routes/chatbot');
    const notificationRoutes = require('./routes/notifications');
    const treatmentCourseRoutes = require('./routes/treatmentCourses');
    const monthlyVoucherRoutes = require('./routes/monthlyVouchers');
    const treatmentSessionRoutes = require('./routes/treatmentSessions');
    
    // Use unprotected auth routes first
    app.use('/api/auth', authRoutes);

    // Use protected routes
    app.use('/api/users', userRoutes);
    app.use('/api/services', serviceRoutes);
    app.use('/api/appointments', appointmentRoutes);
    app.use('/api/promotions', promotionRoutes);
    app.use('/api/wallets', walletRoutes);
    app.use('/api/staff', staffRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/reviews', reviewRoutes);
    app.use('/api/treatment-courses', treatmentCourseRoutes);
    app.use('/api/treatment-sessions', treatmentSessionRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/chatbot', chatbotRoutes);
    app.use('/api/monthly-vouchers', monthlyVoucherRoutes);


    // Simple root route
    app.get('/', (req, res) => {
      res.send('Welcome to Anh Thơ Spa Backend API!');
    });

    // Start the server
    // Listen on 0.0.0.0 to allow connections from emulator and devices on the same network
    app.listen(PORT, '0.0.0.0', async () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Access the API at http://localhost:${PORT}`);
      console.log(`Server listening on 0.0.0.0:${PORT} (accessible from network)`);
      console.log(`Mobile app (Android emulator) should use: http://10.0.2.2:${PORT}/api`);
      console.log(`Mobile app (iOS Simulator) should use: http://localhost:${PORT}/api`);
      console.log(`Mobile app (Physical device) should use: http://192.168.80.1:${PORT}/api`);
      
      // Verify email connection
      try {
        const emailService = require('./services/emailService');
        const emailConnected = await emailService.verifyConnection();
        if (emailConnected) {
          console.log('✅ Email service is ready');
        } else {
          console.warn('⚠️  Email service is not configured. Please check EMAIL_SETUP.md for configuration instructions.');
        }
      } catch (error) {
        console.warn('⚠️  Email service verification failed:', error.message);
        console.warn('⚠️  Email verification feature will not work until SMTP is configured.');
      }
      
      // Setup cron job for monthly voucher distribution
      const cron = require('node-cron');
      const monthlyVoucherService = require('./services/monthlyVoucherService');
      
      // Chạy vào 00:00 ngày 1 mỗi tháng
      // Cron expression: '0 0 1 * *' = minute 0, hour 0, day 1, every month
      const cronJob = cron.schedule('0 0 1 * *', async () => {
        console.log('\n📅 [Cron Job] ==========================================');
        console.log('📅 [Cron Job] Bắt đầu gửi voucher hàng tháng cho khách VIP...');
        console.log(`📅 [Cron Job] Thời gian: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
        try {
          const results = await monthlyVoucherService.sendMonthlyVouchersToAllVIPUsers();
          console.log(`✅ [Cron Job] Hoàn thành gửi voucher:`);
          console.log(`   - Thành công: ${results.success} khách hàng`);
          console.log(`   - Đã nhận rồi: ${results.skipped} khách hàng`);
          console.log(`   - Thất bại: ${results.failed} khách hàng`);
          console.log(`   - Tổng cộng: ${results.total} khách hàng`);
          console.log('📅 [Cron Job] ==========================================\n');
        } catch (error) {
          console.error('❌ [Cron Job] Lỗi khi gửi voucher hàng tháng:', error);
          console.error('❌ [Cron Job] Stack trace:', error.stack);
          console.log('📅 [Cron Job] ==========================================\n');
        }
      }, {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh"
      });
      
      // Store cron job reference for potential manual trigger
      app.locals.monthlyVoucherCronJob = cronJob;
      
      console.log('✅ Cron job đã được thiết lập: Gửi voucher hàng tháng vào 00:00 ngày 1 mỗi tháng (GMT+7)');
      console.log('   Cron expression: 0 0 1 * *');
      console.log('   Timezone: Asia/Ho_Chi_Minh');
      console.log('   Status: ACTIVE');
    });
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });
