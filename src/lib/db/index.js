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
      username TEXT UNIQUE,
      password TEXT,
      email TEXT,
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

    CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
    CREATE INDEX IF NOT EXISTS idx_scores_total_score ON scores(total_score DESC);
  `)

  // Check for column migrations if users table was created previously without username/password
  let tableInfo = sqlite.pragma('table_info(users)')
  let columnNames = tableInfo.map((col) => col.name)

  if (!columnNames.includes('username')) {
    sqlite.exec(`ALTER TABLE users ADD COLUMN username TEXT;`)
  }
  if (!columnNames.includes('password')) {
    sqlite.exec(`ALTER TABLE users ADD COLUMN password TEXT;`)
  }

  // Ensure scores table has player_name and player_avatar columns for guests & unlinked scores
  const scoresInfo = sqlite.pragma('table_info(scores)')
  const scoreCols = scoresInfo.map((col) => col.name)
  if (!scoreCols.includes('player_name')) {
    sqlite.exec(`ALTER TABLE scores ADD COLUMN player_name TEXT;`)
  }
  if (!scoreCols.includes('player_avatar')) {
    sqlite.exec(`ALTER TABLE scores ADD COLUMN player_avatar TEXT;`)
  }

  // Backfill existing guest scores without player_name
  sqlite.exec(`
    UPDATE scores SET player_name = 'Guest Explorer', player_avatar = 'felix'
    WHERE user_id IS NULL AND (player_name IS NULL OR TRIM(player_name) = '');
  `)

  // If email was previously created with NOT NULL constraint, migrate users table to make it nullable
  tableInfo = sqlite.pragma('table_info(users)')
  const emailCol = tableInfo.find((col) => col.name === 'email')
  if (emailCol && emailCol.notnull === 1) {
    sqlite.pragma('foreign_keys = OFF')
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users_migration (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        email TEXT,
        name TEXT NOT NULL,
        avatar TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      INSERT INTO users_migration (id, username, password, email, name, avatar, created_at, updated_at)
      SELECT id, username, password, email, name, avatar, created_at, updated_at FROM users;
      DROP TABLE users;
      ALTER TABLE users_migration RENAME TO users;
    `)
    sqlite.pragma('foreign_keys = ON')
  }

  // Create unique index on username after column is guaranteed to exist
  sqlite.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);`)
}

// Ensure tables exist on boot
initDb()
