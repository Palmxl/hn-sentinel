import { getDb } from '../database/connection'
import type { Post } from '../../shared/types'

// Representa una fila raw de la tabla posts
interface PostRow {
  id: number
  title: string
  author: string
  points: number
  url: string
  hn_url: string
  matched_keyword: string
  detected_at: string
  comments_count: number
}

// Convierte fila de SQLite al tipo del dominio
function rowToPost(row: PostRow): Post {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    points: row.points,
    url: row.url,
    hnUrl: row.hn_url,
    matchedKeyword: row.matched_keyword,
    detectedAt: row.detected_at,
    commentsCount: row.comments_count
  }
}

// Opciones de filtrado y ordenamiento para la query
export interface GetPostsOptions {
  keyword?: string
  search?: string
  sortBy?: 'detectedAt' | 'points'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export function getAllPosts(options: GetPostsOptions = {}): Post[] {
  const db = getDb()
  const {
    keyword,
    search,
    sortBy = 'detectedAt',
    sortOrder = 'desc',
    limit = 500,
    offset = 0
  } = options

  const conditions: string[] = []
  const params: (string | number)[] = []

  // Filtro por keyword específica
  if (keyword) {
    conditions.push('matched_keyword = ?')
    params.push(keyword)
  }

  // Búsqueda por título o autor
  if (search) {
    conditions.push('(title LIKE ? OR author LIKE ?)')
    const pattern = `%${search}%`
    params.push(pattern, pattern)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Mapa de campos del dominio a columnas de SQLite
  const columnMap: Record<string, string> = {
    detectedAt: 'detected_at',
    points: 'points'
  }

  const orderColumn = columnMap[sortBy] ?? 'detected_at'
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC'

  const query = `
    SELECT * FROM posts
    ${where}
    ORDER BY ${orderColumn} ${order}
    LIMIT ? OFFSET ?
  `

  params.push(limit, offset)
  const rows = db.prepare(query).all(...params) as PostRow[]
  return rows.map(rowToPost)
}

export interface PostInsertData {
  title: string
  author: string
  points: number
  url: string
  hnUrl: string
  matchedKeyword: string
  commentsCount: number
}

export function insertPost(data: PostInsertData): Post | null {
  const db = getDb()

  // INSERT OR IGNORE evita duplicados por (hn_url, matched_keyword)
  const result = db
    .prepare(
      `INSERT OR IGNORE INTO posts
        (title, author, points, url, hn_url, matched_keyword, comments_count)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.title,
      data.author,
      data.points,
      data.url,
      data.hnUrl,
      data.matchedKeyword,
      data.commentsCount
    )

  // Si no hubo cambios, era un duplicado
  if (result.changes === 0) return null

  const row = db
    .prepare('SELECT * FROM posts WHERE id = ?')
    .get(result.lastInsertRowid) as PostRow

  return rowToPost(row)
}

export function deletePost(id: number): void {
  const db = getDb()
  const result = db.prepare('DELETE FROM posts WHERE id = ?').run(id)
  if (result.changes === 0) {
    throw new Error(`Post con id ${id} no encontrado`)
  }
}

export function clearAllPosts(): number {
  const db = getDb()
  const result = db.prepare('DELETE FROM posts').run()
  return result.changes
}