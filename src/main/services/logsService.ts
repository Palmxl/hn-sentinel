import { getDb } from '../database/connection'
import log from 'electron-log'
import type { LogEntry } from '../../shared/types'

interface LogRow {
  id: number
  level: string
  message: string
  context: string | null
  timestamp: string
}

function rowToEntry(row: LogRow): LogEntry {
  return {
    id: row.id,
    level: row.level as LogEntry['level'],
    message: row.message,
    context: row.context,
    timestamp: row.timestamp
  }
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

// Escribe en SQLite Y en electron-log (archivo en disco)
function writeLog(level: LogLevel, message: string, context?: string): LogEntry {
  const db = getDb()

  // Reenvía a electron-log para tener logs en archivo también
  log[level](`[${context ?? 'app'}] ${message}`)

  const row = db
    .prepare(
      `INSERT INTO logs (level, message, context)
       VALUES (?, ?, ?) RETURNING *`
    )
    .get(level, message, context ?? null) as LogRow

  return rowToEntry(row)
}

// Objeto logger que usamos en todo el proceso main
export const logger = {
  info: (message: string, context?: string) => writeLog('info', message, context),
  warn: (message: string, context?: string) => writeLog('warn', message, context),
  error: (message: string, context?: string) => writeLog('error', message, context),
  debug: (message: string, context?: string) => writeLog('debug', message, context)
}

export function getAllLogs(limit = 200): LogEntry[] {
  const db = getDb()
  const rows = db
    .prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?')
    .all(limit) as LogRow[]
  return rows.map(rowToEntry)
}

export function clearLogs(): void {
  const db = getDb()
  db.prepare('DELETE FROM logs').run()
}