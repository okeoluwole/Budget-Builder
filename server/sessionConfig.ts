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
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict',
  },
  name: 'budget_app_session'
});