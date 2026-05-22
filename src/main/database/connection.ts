import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import log from 'electron-log'

let db: Database.Database | null = null

// Retorna la instancia de la base de datos
// Lanza error si no fue inicializada primero
export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Base de datos no inicializada. Llama initDatabase() primero.')
  }
  return db
}

export function initDatabase(): void {
  // Guarda el archivo .db en la carpeta de datos del usuario
  // En Linux: ~/.config/hn-sentinel/hn-sentinel.db
  const dbPath = join(app.getPath('userData'), 'hn-sentinel.db')
  log.info(`Ruta de la base de datos: ${dbPath}`)

  db = new Database(dbPath)

  // WAL mode mejora el rendimiento en lecturas concurrentes
  db.pragma('journal_mode = WAL')
  // Activa validación de claves foráneas
  db.pragma('foreign_keys = ON')

  runMigrations(db)
}

function runMigrations(db: Database.Database): void {
  db.exec(`
    -- Tabla de palabras clave configuradas por el usuario
    CREATE TABLE IF NOT EXISTS keywords (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      value       TEXT NOT NULL UNIQUE COLLATE NOCASE,
      is_active   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Tabla de posts detectados que coincidieron con keywords
    CREATE TABLE IF NOT EXISTS posts (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      title            TEXT NOT NULL,
      author           TEXT NOT NULL,
      points           INTEGER NOT NULL DEFAULT 0,
      url              TEXT NOT NULL,
      hn_url           TEXT NOT NULL,
      matched_keyword  TEXT NOT NULL,
      detected_at      TEXT NOT NULL DEFAULT (datetime('now')),
      comments_count   INTEGER NOT NULL DEFAULT 0,
      UNIQUE(hn_url, matched_keyword)
    );

    -- Historial de corridas del scraper
    CREATE TABLE IF NOT EXISTS scraper_runs (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at     TEXT NOT NULL DEFAULT (datetime('now')),
      finished_at    TEXT,
      status         TEXT NOT NULL DEFAULT 'running',
      posts_scraped  INTEGER NOT NULL DEFAULT 0,
      posts_matched  INTEGER NOT NULL DEFAULT 0,
      error          TEXT
    );

    -- Configuración general de la app (clave-valor)
    CREATE TABLE IF NOT EXISTS app_settings (
      key    TEXT PRIMARY KEY,
      value  TEXT NOT NULL
    );

    -- Logs internos visibles desde la UI
    CREATE TABLE IF NOT EXISTS logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      level      TEXT NOT NULL DEFAULT 'info',
      message    TEXT NOT NULL,
      context    TEXT,
      timestamp  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Valores por defecto de configuración
    INSERT OR IGNORE INTO app_settings (key, value) VALUES
      ('intervalMinutes', '15'),
      ('maxPostsToScrape', '30'),
      ('isSchedulerEnabled', 'true');
  `)

  // Índices para acelerar las consultas más comunes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_posts_detected_at ON posts(detected_at DESC);
    CREATE INDEX IF NOT EXISTS idx_posts_matched_keyword ON posts(matched_keyword);
    CREATE INDEX IF NOT EXISTS idx_posts_points ON posts(points DESC);
    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_scraper_runs_started_at ON scraper_runs(started_at DESC);
  `)

  log.info('Migraciones de base de datos completadas')
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}