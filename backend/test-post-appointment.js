/**
 * Test script for POST /api/appointments
 * Run this to debug payment issues
 */

const http = require('http');

const testData = {
  serviceId: "svc-body-detox",
  date: "2025-12-10",
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
  port: 3001,
  path: '/api/appointments',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('='.repeat(60));
console.log('Testing POST /api/appointments');
console.log('Request body:', JSON.stringify(testData, null, 2));
console.log('='.repeat(60));

const req = http.request(options, (res) => {
  console.log(`\nResponse Status: ${res.statusCode}`);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response Body:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(data);
    }
    console.log('='.repeat(60));
    process.exit(res.statusCode === 201 ? 0 : 1);
  });
});

req.on('error', (e) => {
  console.error(`\n❌ Error: ${e.message}`);
  process.exit(1);
});

req.write(postData);
req.end();
