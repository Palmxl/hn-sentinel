// Tipos principales compartidos entre main y renderer

export interface Post {
  id: number
  title: string
  author: string
  points: number
  url: string
  hnUrl: string
  matchedKeyword: string // palabra clave que disparó la detección
  detectedAt: string // fecha ISO de cuando fue detectado
  commentsCount: number
}

export interface Keyword {
  id: number
  value: string
  createdAt: string
  isActive: boolean // permite desactivar sin eliminar
}

export interface ScraperRun {
  id: number
  startedAt: string
  finishedAt: string | null
  status: 'running' | 'success' | 'error'
  postsScraped: number // total de posts encontrados en HN
  postsMatched: number // cuántos coincidieron con keywords
  error: string | null
}

export interface AppSettings {
  intervalMinutes: number // cada cuántos minutos corre el scraper
  maxPostsToScrape: number // máximo de posts a revisar por corrida
  isSchedulerEnabled: boolean
}

export interface LogEntry {
  id: number
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  context: string | null // módulo que generó el log (ej: 'scraper', 'ipc')
  timestamp: string
}

export interface SchedulerStatus {
  isRunning: boolean
  isScrapingNow: boolean // true si hay un scrape en curso
  lastRunAt: string | null
  nextRunAt: string | null
  lastRunStatus: 'success' | 'error' | null
  lastError: string | null
}

// ─────────────────────────────────────────────
// Nombres de canales IPC — fuente única de verdad
// Así evitamos strings hardcodeados en todo el proyecto
// ─────────────────────────────────────────────

export const IPC_CHANNELS = {
  // Palabras clave
  KEYWORDS_GET_ALL: 'keywords:getAll',
  KEYWORDS_ADD: 'keywords:add',
  KEYWORDS_DELETE: 'keywords:delete',
  KEYWORDS_TOGGLE: 'keywords:toggle',

  // Posts detectados
  POSTS_GET_ALL: 'posts:getAll',
  POSTS_DELETE: 'posts:delete',
  POSTS_CLEAR_ALL: 'posts:clearAll',

  // Scraper
  SCRAPER_RUN_NOW: 'scraper:runNow',
  SCRAPER_GET_STATUS: 'scraper:getStatus',

  // Exportar datos
  POSTS_EXPORT_CSV: 'posts:exportCsv',
  POSTS_EXPORT_JSON: 'posts:exportJson',

  // Scheduler
  SCHEDULER_GET_STATUS: 'scheduler:getStatus',
  SCHEDULER_UPDATE_INTERVAL: 'scheduler:updateInterval',
  SCHEDULER_TOGGLE: 'scheduler:toggle',

  // Configuración
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',

  // Logs
  LOGS_GET_ALL: 'logs:getAll',
  LOGS_CLEAR: 'logs:clear',

  // Eventos que main empuja al renderer (sin invoke, con send)
  EVENT_SCRAPE_COMPLETE: 'event:scrapeComplete',
  EVENT_NEW_POSTS: 'event:newPosts',
  EVENT_SCHEDULER_STATUS: 'event:schedulerStatus',
  EVENT_LOG_ENTRY: 'event:logEntry'
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]

// Wrapper genérico para todas las respuestas IPC
// Así el renderer siempre sabe si la operación fue exitosa o no
export interface IpcResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}