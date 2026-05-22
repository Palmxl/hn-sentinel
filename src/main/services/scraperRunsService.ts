import { getDb } from '../database/connection'
import type { ScraperRun, SchedulerStatus } from '../../shared/types'

interface RunRow {
  id: number
  started_at: string
  finished_at: string | null
  status: string
  posts_scraped: number
  posts_matched: number
  error: string | null
}

function rowToRun(row: RunRow): ScraperRun {
  return {
    id: row.id,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    status: row.status as ScraperRun['status'],
    postsScraped: row.posts_scraped,
    postsMatched: row.posts_matched,
    error: row.error
  }
}

// Registra el inicio de una nueva corrida
export function startRun(): number {
  const db = getDb()
  const result = db
    .prepare("INSERT INTO scraper_runs (status) VALUES ('running')")
    .run()
  return result.lastInsertRowid as number
}

// Marca una corrida como exitosa
export function completeRun(
  id: number,
  postsScraped: number,
  postsMatched: number
): void {
  const db = getDb()
  db.prepare(
    `UPDATE scraper_runs
     SET status = 'success',
         finished_at = datetime('now'),
         posts_scraped = ?,
         posts_matched = ?
     WHERE id = ?`
  ).run(postsScraped, postsMatched, id)
}

// Marca una corrida como fallida con el mensaje de error
export function failRun(id: number, error: string): void {
  const db = getDb()
  db.prepare(
    `UPDATE scraper_runs
     SET status = 'error',
         finished_at = datetime('now'),
         error = ?
     WHERE id = ?`
  ).run(error, id)
}

// Retorna la última corrida registrada
export function getLastRun(): ScraperRun | null {
  const db = getDb()
  const row = db
    .prepare('SELECT * FROM scraper_runs ORDER BY started_at DESC LIMIT 1')
    .get() as RunRow | undefined
  return row ? rowToRun(row) : null
}

// Construye el objeto de estado del scheduler para enviarlo al renderer
export function getSchedulerStatus(
  isScrapingNow: boolean,
  nextRunAt: string | null
): SchedulerStatus {
  const lastRun = getLastRun()
  return {
    isRunning: true,
    isScrapingNow,
    lastRunAt: lastRun?.startedAt ?? null,
    nextRunAt,
    lastRunStatus:
      lastRun?.status === 'running'
        ? null
        : (lastRun?.status as 'success' | 'error' | null) ?? null,
    lastError: lastRun?.error ?? null
  }
}