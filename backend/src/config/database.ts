import knex from 'knex';
import config from '../../knexfile.js';

const environment = process.env.NODE_ENV || 'development';
const dbConfig = config[environment];

export const db = knex(dbConfig);

// Test database connection
export const testConnection = async () => {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Initialize database connection
testConnection();