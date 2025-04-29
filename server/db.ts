import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a connection pool with specific settings for better stability
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum number of connections
  idleTimeoutMillis: 30000, // How long a connection can remain idle before being closed
  connectionTimeoutMillis: 5000, // How long to wait for a connection
  ssl: true // Enable SSL for Neon
});

// Create a database instance with our schema
export const db = drizzle(pool, { schema });

// Add event handlers for connection errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

// Test the database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

// Run the test connection on startup
testConnection();