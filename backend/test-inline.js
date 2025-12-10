/**
 * Test server with inline API call
 */

const http = require('http');

// Load the database configuration (this sets up models)
const db = require('./config/database');

const PORT = 3002; // Use different port to avoid conflicts

async function main() {
  // Test DB connection first
  try {
    await db.sequelize.authenticate();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  }  // Load express app
  const express = require('express');
  const app = express();
  app.use(express.json());

  // Mount just the appointments route for testing
  const appointmentsRouter = require('./routes/appointments');
  app.use('/api/appointments', appointmentsRouter);

  // Error handler
  app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  });

  // Start server
  const server = app.listen(PORT, () => {
    console.log(`✅ Test server running on port ${PORT}`);

    // Make test request
    const testData = {
      serviceId: "svc-body-detox",
      date: "2025-12-15",
      time: "10:00",
      userId: "user-client-1",
      quantity: 1,
      durationWeeks: 2,
      frequencyType: "sessions_per_week",
      frequencyValue: 1
    };

    const postData = JSON.stringify(testData);

    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/api/appointments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('\n📤 Sending test request...');
    console.log('   Request body:', JSON.stringify(testData, null, 2));

    const req = http.request(options, (res) => {
      console.log(`\n📥 Response Status: ${res.statusCode}`);

      let data = '';
      res.on('data', (chunk) => { data += chunk; });

      res.on('end', () => {
        console.log('📥 Response Body:');
        try {
          console.log(JSON.stringify(JSON.parse(data), null, 2));
        } catch (e) {
          console.log(data);
        }

        // Close server
        server.close(() => {
          console.log('\n✅ Test complete, server closed');
          process.exit(res.statusCode === 201 ? 0 : 1);
        });
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Request Error: ${e.message}`);
      server.close();
      process.exit(1);
    });

    req.write(postData);
    req.end();
  });
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
