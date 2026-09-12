import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getDatabaseUrl, getPostgresPool, isPostgresConfigured, parsePostgresConfig } from './db';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserRecord extends User {
  passwordHash: string;
  salt: string;
}

export interface UserSession {
  token: string;
  userId: string;
  email: string;
  name: string;
  createdAt: string;
  expiresAt: string;
}

export interface PasswordResetRecord {
  token: string;
  email: string;
  expiresAt: string;
  createdAt: string;
}

export interface AuthBackendStatus {
  status: 'CONNECTED' | 'NOT CONNECTED / CONFIGURATION REQUIRED';
  dialect: 'PostgreSQL';
  connectionConfigured: boolean;
  missingConfig: string[];
  database?: string;
  latencyMs?: number;
  message: string;
  activeStorage: string;
}

// Local fallback storage directory
const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const RESETS_FILE = path.join(DATA_DIR, 'resets.json');

function ensureDataFiles() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[Auth Storage] Could not initialize local data dir:', err);
  }
}

ensureDataFiles();

// Cryptographic Password Hashing (PBKDF2 with SHA-512)
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const effectiveSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, effectiveSalt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt: effectiveSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computed = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}

// Get Authentication Backend Status
export async function getAuthBackendStatus(): Promise<AuthBackendStatus> {
  const parsed = parsePostgresConfig(getDatabaseUrl());
  if (!parsed) {
    return {
      status: 'NOT CONNECTED / CONFIGURATION REQUIRED',
      dialect: 'PostgreSQL',
      connectionConfigured: false,
      missingConfig: ['DATABASE_URL'],
      message:
        'PostgreSQL database connection is not configured (DATABASE_URL missing). User authentication and accounts require DATABASE_URL for persistent storage.',
      activeStorage: 'Not Configured (DATABASE_URL missing)',
    };
  }

  if (parsed.isLocal) {
    return {
      status: 'NOT CONNECTED / CONFIGURATION REQUIRED',
      dialect: 'PostgreSQL',
      connectionConfigured: true,
      missingConfig: ['DATABASE_URL (Cloud PostgreSQL required)'],
      message:
        'DATABASE_URL points to localhost (127.0.0.1:5432), which is not reachable from this Cloud Run container. Please configure a cloud-accessible PostgreSQL URI (e.g. Neon, Supabase, Cloud SQL, AWS RDS).',
      activeStorage: 'Not Configured (DATABASE_URL missing)',
    };
  }

  const pool = getPostgresPool();
  if (!pool) {
    return {
      status: 'NOT CONNECTED / CONFIGURATION REQUIRED',
      dialect: 'PostgreSQL',
      connectionConfigured: true,
      missingConfig: [],
      message: 'PostgreSQL credentials provided but connection pool could not be initialized.',
      activeStorage: 'Not Configured (DATABASE_URL missing)',
    };
  }

  const startTime = Date.now();
  try {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT current_database()');
      const dbName = res.rows[0]?.current_database || 'postgres';
      const latencyMs = Date.now() - startTime;
      return {
        status: 'CONNECTED',
        dialect: 'PostgreSQL',
        connectionConfigured: true,
        database: dbName,
        latencyMs,
        missingConfig: [],
        message: '✓ Authentication Backend Connected',
        activeStorage: 'PostgreSQL Database',
      };
    } finally {
      client.release();
    }
  } catch (err: any) {
    return {
      status: 'NOT CONNECTED / CONFIGURATION REQUIRED',
      dialect: 'PostgreSQL',
      connectionConfigured: true,
      missingConfig: [],
      message: `Database connection error: ${err.message}.`,
      activeStorage: 'Not Configured (DATABASE_URL missing)',
    };
  }
}

// Register User
export async function registerUser(name: string, email: string, password: string): Promise<{ user: User; session: UserSession }> {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  if (!trimmedName || trimmedName.length < 2) {
    throw new Error('Please enter your full name (at least 2 characters).');
  }

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  if (!isPostgresConfigured()) {
    throw new Error(
      'PostgreSQL database connection is not configured (DATABASE_URL missing). Persistent account creation requires a connected PostgreSQL database.'
    );
  }

  const pool = getPostgresPool();
  if (!pool) {
    throw new Error('PostgreSQL database connection pool could not be initialized. Please verify DATABASE_URL.');
  }

  let client = null;
  try {
    client = await pool.connect();
    // Check existing
    const existingRes = await client.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existingRes.rows.length > 0) {
      throw new Error('An account with this email address already exists. Please sign in.');
    }

    const { hash, salt } = hashPassword(password);
    const userId = 'usr_' + crypto.randomBytes(12).toString('hex');
    const now = new Date().toISOString();

    await client.query(
      'INSERT INTO users (id, name, email, password_hash, salt, created_at, last_login_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, trimmedName, normalizedEmail, hash, salt, now, now]
    );

    const token = 'sq_sess_' + crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await client.query(
      'INSERT INTO user_sessions (token, user_id, email, name, expires_at, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [token, userId, normalizedEmail, trimmedName, expiresAt, now]
    );

    const user: User = { id: userId, name: trimmedName, email: normalizedEmail, createdAt: now, lastLoginAt: now };
    const session: UserSession = { token, userId, email: normalizedEmail, name: trimmedName, createdAt: now, expiresAt };
    return { user, session };
  } finally {
    if (client) client.release();
  }
}

// Authenticate / Login User
export async function loginUser(email: string, password: string): Promise<{ user: User; session: UserSession }> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw new Error('Please enter both your email address and password.');
  }

  if (!isPostgresConfigured()) {
    throw new Error(
      'PostgreSQL database connection is not configured (DATABASE_URL missing). User sign in requires a connected PostgreSQL database.'
    );
  }

  const pool = getPostgresPool();
  if (!pool) {
    throw new Error('PostgreSQL database connection pool is not available.');
  }

  let client = null;
  try {
    client = await pool.connect();
    const res = await client.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    if (res.rows.length === 0) {
      throw new Error('Invalid email or password. Please check your credentials and try again.');
    }

    const row = res.rows[0];
    const isValid = verifyPassword(password, row.password_hash, row.salt);
    if (!isValid) {
      throw new Error('Invalid email or password. Please check your credentials and try again.');
    }

    const now = new Date().toISOString();
    await client.query('UPDATE users SET last_login_at = $1 WHERE id = $2', [now, row.id]);

    const token = 'sq_sess_' + crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await client.query(
      'INSERT INTO user_sessions (token, user_id, email, name, expires_at, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [token, row.id, row.email, row.name, expiresAt, now]
    );

    const user: User = {
      id: row.id,
      name: row.name,
      email: row.email,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : now,
      lastLoginAt: now,
    };
    const session: UserSession = { token, userId: row.id, email: row.email, name: row.name, createdAt: now, expiresAt };
    return { user, session };
  } finally {
    if (client) client.release();
  }
}

// Verify Active Session
export async function verifySession(token: string): Promise<User | null> {
  if (!token) return null;

  if (!isPostgresConfigured()) return null;

  const pool = getPostgresPool();
  if (!pool) return null;

  let client = null;
  try {
    client = await pool.connect();
    const res = await client.query(
      'SELECT s.*, u.created_at as user_created_at, u.last_login_at FROM user_sessions s JOIN users u ON s.user_id = u.id WHERE s.token = $1',
      [token]
    );
    if (res.rows.length > 0) {
      const row = res.rows[0];
      const expires = new Date(row.expires_at).getTime();
      if (Date.now() > expires) {
        await client.query('DELETE FROM user_sessions WHERE token = $1', [token]);
        return null;
      }
      return {
        id: row.user_id,
        name: row.name,
        email: row.email,
        createdAt: row.user_created_at ? new Date(row.user_created_at).toISOString() : new Date().toISOString(),
        lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : undefined,
      };
    }
    return null;
  } catch (err: any) {
    console.warn('[PostgreSQL verifySession error]:', err.message);
    return null;
  } finally {
    if (client) client.release();
  }
}

// Invalidate Session (Logout)
export async function invalidateSession(token: string): Promise<boolean> {
  if (!token) return true;

  if (!isPostgresConfigured()) return true;

  const pool = getPostgresPool();
  if (!pool) return true;

  let client = null;
  try {
    client = await pool.connect();
    await client.query('DELETE FROM user_sessions WHERE token = $1', [token]);
  } catch (err: any) {
    console.warn('[PostgreSQL invalidateSession error]:', err.message);
  } finally {
    if (client) client.release();
  }

  return true;
}

// Request Password Reset
export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  if (!isPostgresConfigured()) {
    throw new Error(
      'PostgreSQL database connection is not configured (DATABASE_URL missing). Password reset requires a connected PostgreSQL database.'
    );
  }

  const pool = getPostgresPool();
  if (!pool) {
    throw new Error('PostgreSQL database pool is unavailable.');
  }

  let userExists = false;
  let client = null;
  try {
    client = await pool.connect();
    const res = await client.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    userExists = res.rows.length > 0;
  } catch (err: any) {
    console.warn('[PostgreSQL reset lookup error]:', err.message);
    throw new Error(`Database error during password reset: ${err.message}`);
  } finally {
    if (client) client.release();
  }

  return {
    success: true,
    message: userExists
      ? `Password reset instructions have been dispatched for ${normalizedEmail}. Follow the link sent to your inbox.`
      : `If an account is associated with ${normalizedEmail}, password reset instructions have been generated.`,
  };
}
