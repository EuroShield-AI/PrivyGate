const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function addSelectedModelColumn() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  // Parse DATABASE_URL: mysql://user:password@host:port/database
  const url = new URL(process.env.DATABASE_URL);
  const config = {
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1), // Remove leading '/'
  };

  const connection = await mysql.createConnection(config);

  try {
    console.log('Adding selectedModel column to users table...');
    
    // Check if column already exists
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'selectedModel'",
      [config.database]
    );

    if (columns.length > 0) {
      console.log('Column selectedModel already exists. Skipping...');
      return;
    }

    // Add the column
    await connection.execute(
      "ALTER TABLE `users` ADD COLUMN `selectedModel` VARCHAR(50) DEFAULT 'mistral-large-2512' AFTER `mistralApiKey`"
    );

    console.log('✓ Successfully added selectedModel column');
  } catch (error) {
    console.error('Error adding column:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

addSelectedModelColumn();
