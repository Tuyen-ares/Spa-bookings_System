/**
 * Script to run database migrations
 * This creates all tables according to the schema defined in migration files
 */

const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Starting database migration...\n');

// Change to backend directory
process.chdir(path.resolve(__dirname, '..'));

// Run migration command
const migrationProcess = exec('npx sequelize-cli db:migrate', {
  env: { ...process.env, NODE_ENV: 'development' }
});

migrationProcess.stdout.on('data', (data) => {
  console.log(data.toString());
});

migrationProcess.stderr.on('data', (data) => {
  console.error(data.toString());
});

migrationProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Migration completed successfully!');
    console.log('All database tables have been created.\n');
  } else {
    console.error(`\n❌ Migration failed with exit code ${code}`);
    process.exit(1);
  }
});
