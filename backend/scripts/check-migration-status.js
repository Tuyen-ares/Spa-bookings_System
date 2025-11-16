/**
 * Script to check migration status
 */

const { exec } = require('child_process');
const path = require('path');

console.log('📊 Checking migration status...\n');

process.chdir(path.resolve(__dirname, '..'));

const statusProcess = exec('npx sequelize-cli db:migrate:status', {
  env: { ...process.env, NODE_ENV: 'development' }
});

statusProcess.stdout.on('data', (data) => {
  console.log(data.toString());
});

statusProcess.stderr.on('data', (data) => {
  console.error(data.toString());
});

statusProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Status check completed');
  } else {
    console.error(`\n❌ Status check failed with exit code ${code}`);
    process.exit(1);
  }
});
