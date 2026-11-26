import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema.js'

const DB_DIR = path.resolve(process.cwd(), 'data')
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

const DB_PATH = process.env.DATABASE_PATH || path.join(DB_DIR, 'guess-geo.db')

// Global singleton pattern for Next.js hot-reloading
const globalForDb = globalThis

if (!globalForDb._guessGeoSqlite) {
  const sqlite = new Database(DB_PATH)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  globalForDb._guessGeoSqlite = sqlite
  globalForDb._guessGeoDrizzle = drizzle(sqlite, { schema })
}

export const sqlite = globalForDb._guessGeoSqlite
export const db = globalForDb._guessGeoDrizzle

export function initDb() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      avatar TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      total_score INTEGER NOT NULL,
      max_score INTEGER NOT NULL DEFAULT 25000,
      rounds_played INTEGER NOT NULL DEFAULT 5,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
    CREATE INDEX IF NOT EXISTS idx_scores_total_score ON scores(total_score DESC);
  `)
}

// Ensure tables exist on boot
initDb()
