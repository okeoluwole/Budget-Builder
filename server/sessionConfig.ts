import session from 'express-session';
import ConnectPgSimple from 'connect-pg-simple';
import { pool } from './db';

const PostgresStore = ConnectPgSimple(session);

export const sessionConfig = session({
  secret: process.env.SESSION_SECRET || 'budget-app-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: new PostgresStore({
    pool: pool,
    tableName: 'sessions',
    createTableIfMissing: false, // We'll create it via Drizzle
  }),
  cookie: {
    secure: false, // Set to false for Replit deployment compatibility
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax', // Changed from 'strict' to 'lax' for deployment compatibility
  },
  name: 'budget_app_session'
});