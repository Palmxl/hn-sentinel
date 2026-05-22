import { getDb } from '../database/connection'
import type { AppSettings } from '../../shared/types'

export function getSettings(): AppSettings {
  const db = getDb()
  const rows = db
    .prepare('SELECT key, value FROM app_settings')
    .all() as { key: string; value: string }[]

  // Convierte el array de filas a un mapa para acceso fácil
  const map = new Map(rows.map(r => [r.key, r.value]))

  return {
    intervalMinutes: parseInt(map.get('intervalMinutes') ?? '15', 10),
    maxPostsToScrape: parseInt(map.get('maxPostsToScrape') ?? '30', 10),
    isSchedulerEnabled: (map.get('isSchedulerEnabled') ?? 'true') === 'true'
  }
}

export function updateSettings(updates: Partial<AppSettings>): AppSettings {
  const db = getDb()

  const stmt = db.prepare(
    'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)'
  )

  // Usamos una transacción para que todos los cambios sean atómicos
  const updateMany = db.transaction((entries: [string, string][]) => {
    for (const [key, value] of entries) {
      stmt.run(key, value)
    }
  })

  const entries: [string, string][] = []

  if (updates.intervalMinutes !== undefined) {
    if (updates.intervalMinutes < 1 || updates.intervalMinutes > 1440) {
      throw new Error('El intervalo debe estar entre 1 y 1440 minutos')
    }
    entries.push(['intervalMinutes', String(updates.intervalMinutes)])
  }

  if (updates.maxPostsToScrape !== undefined) {
    if (updates.maxPostsToScrape < 1 || updates.maxPostsToScrape > 100) {
      throw new Error('El máximo de posts debe estar entre 1 y 100')
    }
    entries.push(['maxPostsToScrape', String(updates.maxPostsToScrape)])
  }

  if (updates.isSchedulerEnabled !== undefined) {
    entries.push(['isSchedulerEnabled', String(updates.isSchedulerEnabled)])
  }

  updateMany(entries)
  return getSettings()
}