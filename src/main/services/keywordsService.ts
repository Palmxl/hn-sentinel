import { getDb } from '../database/connection'
import type { Keyword } from '../../shared/types'

// Representa una fila raw de la tabla keywords
interface KeywordRow {
  id: number
  value: string
  is_active: number
  created_at: string
}

// Convierte fila de SQLite al tipo del dominio
function rowToKeyword(row: KeywordRow): Keyword {
  return {
    id: row.id,
    value: row.value,
    isActive: row.is_active === 1,
    createdAt: row.created_at
  }
}

export function getAllKeywords(): Keyword[] {
  const db = getDb()
  const rows = db
    .prepare('SELECT * FROM keywords ORDER BY created_at DESC')
    .all() as KeywordRow[]
  return rows.map(rowToKeyword)
}

export function addKeyword(value: string): Keyword {
  const db = getDb()
  const trimmed = value.trim()

  if (!trimmed) {
    throw new Error('La palabra clave no puede estar vacía')
  }

  if (trimmed.length > 100) {
    throw new Error('La palabra clave no puede superar 100 caracteres')
  }

  const row = db
    .prepare('INSERT INTO keywords (value) VALUES (?) RETURNING *')
    .get(trimmed) as KeywordRow

  return rowToKeyword(row)
}

export function deleteKeyword(id: number): void {
  const db = getDb()
  const result = db.prepare('DELETE FROM keywords WHERE id = ?').run(id)
  if (result.changes === 0) {
    throw new Error(`Keyword con id ${id} no encontrada`)
  }
}

export function toggleKeyword(id: number): Keyword {
  const db = getDb()
  const row = db
    .prepare('SELECT * FROM keywords WHERE id = ?')
    .get(id) as KeywordRow | undefined

  if (!row) {
    throw new Error(`Keyword con id ${id} no encontrada`)
  }

  // Invierte el estado activo
  const newState = row.is_active === 1 ? 0 : 1

  const updated = db
    .prepare('UPDATE keywords SET is_active = ? WHERE id = ? RETURNING *')
    .get(newState, id) as KeywordRow

  return rowToKeyword(updated)
}

// Solo retorna los valores de keywords activas
// Lo usa el scraper para hacer el matching
export function getActiveKeywords(): string[] {
  const db = getDb()
  const rows = db
    .prepare('SELECT value FROM keywords WHERE is_active = 1')
    .all() as { value: string }[]
  return rows.map(r => r.value)
}