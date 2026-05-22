import { ipcMain } from 'electron'
import { IPC_CHANNELS, type IpcResponse } from '../../shared/types'
import {
  getAllKeywords,
  addKeyword,
  deleteKeyword,
  toggleKeyword
} from '../services/keywordsService'
import {
  getAllPosts,
  deletePost,
  clearAllPosts
} from '../services/postsService'
import { getAllLogs, clearLogs, logger } from '../services/logsService'
import { getSettings, updateSettings } from '../services/settingsService'
import type { ScraperScheduler } from '../scheduler/scraperScheduler'

// Referencia al scheduler, se inyecta después de su inicialización
let schedulerRef: ScraperScheduler | null = null

export function setSchedulerRef(scheduler: ScraperScheduler): void {
  schedulerRef = scheduler
}

// Wrapper genérico que envuelve cada handler con manejo de errores
// Así nunca un error en un handler rompe la app
function handle<T>(
  channel: string,
  handler: (...args: unknown[]) => T | Promise<T>
): void {
  ipcMain.handle(channel, async (_event, ...args) => {
    try {
      const data = await handler(...args)
      return { success: true, data } satisfies IpcResponse<T>
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error(`Error IPC en [${channel}]: ${message}`, 'ipc')
      return { success: false, error: message } satisfies IpcResponse<T>
    }
  })
}

export function registerAllIpcHandlers(): void {
  // ── Keywords ──────────────────────────────────
  handle(IPC_CHANNELS.KEYWORDS_GET_ALL, () => getAllKeywords())

  handle(IPC_CHANNELS.KEYWORDS_ADD, (value: unknown) => {
    if (typeof value !== 'string') throw new Error('Valor de keyword inválido')
    return addKeyword(value)
  })

  handle(IPC_CHANNELS.KEYWORDS_DELETE, (id: unknown) => {
    if (typeof id !== 'number') throw new Error('ID de keyword inválido')
    deleteKeyword(id)
  })

  handle(IPC_CHANNELS.KEYWORDS_TOGGLE, (id: unknown) => {
    if (typeof id !== 'number') throw new Error('ID de keyword inválido')
    return toggleKeyword(id)
  })

  // ── Posts ─────────────────────────────────────
  handle(IPC_CHANNELS.POSTS_GET_ALL, (options: unknown) => {
    return getAllPosts((options as Parameters<typeof getAllPosts>[0]) ?? {})
  })

  handle(IPC_CHANNELS.POSTS_DELETE, (id: unknown) => {
    if (typeof id !== 'number') throw new Error('ID de post inválido')
    deletePost(id)
  })

  handle(IPC_CHANNELS.POSTS_CLEAR_ALL, () => clearAllPosts())

  // ── Scraper ───────────────────────────────────
  handle(IPC_CHANNELS.SCRAPER_RUN_NOW, async () => {
    if (!schedulerRef) throw new Error('Scheduler no inicializado')
    await schedulerRef.runNow()
  })

  handle(IPC_CHANNELS.SCRAPER_GET_STATUS, () => {
    if (!schedulerRef) return null
    return schedulerRef.getStatus()
  })

  // ── Scheduler ─────────────────────────────────
  handle(IPC_CHANNELS.SCHEDULER_GET_STATUS, () => {
    if (!schedulerRef) return null
    return schedulerRef.getStatus()
  })

  handle(IPC_CHANNELS.SCHEDULER_UPDATE_INTERVAL, (minutes: unknown) => {
    if (typeof minutes !== 'number') throw new Error('Intervalo inválido')
    schedulerRef?.updateInterval(minutes)
    return getSettings()
  })

  handle(IPC_CHANNELS.SCHEDULER_TOGGLE, (enabled: unknown) => {
    if (typeof enabled !== 'boolean') throw new Error('Valor de activación inválido')
    schedulerRef?.toggle(enabled)
    return getSettings()
  })

  // ── Settings ──────────────────────────────────
  handle(IPC_CHANNELS.SETTINGS_GET, () => getSettings())

  handle(IPC_CHANNELS.SETTINGS_UPDATE, (updates: unknown) => {
    return updateSettings(updates as Parameters<typeof updateSettings>[0])
  })

  // ── Logs ──────────────────────────────────────
  handle(IPC_CHANNELS.LOGS_GET_ALL, () => getAllLogs())
  handle(IPC_CHANNELS.LOGS_CLEAR, () => clearLogs())
}