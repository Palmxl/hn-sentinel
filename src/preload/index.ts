import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/types'
import type {
  Keyword,
  Post,
  AppSettings,
  LogEntry,
  SchedulerStatus,
  IpcResponse
} from '../shared/types'

// API tipada que se expone al renderer a través de contextBridge
// El renderer accede a esto via window.electronAPI
const electronAPI = {
  // ── Keywords ──────────────────────────────────
  keywords: {
    getAll: (): Promise<IpcResponse<Keyword[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.KEYWORDS_GET_ALL),
    add: (value: string): Promise<IpcResponse<Keyword>> =>
      ipcRenderer.invoke(IPC_CHANNELS.KEYWORDS_ADD, value),
    delete: (id: number): Promise<IpcResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.KEYWORDS_DELETE, id),
    toggle: (id: number): Promise<IpcResponse<Keyword>> =>
      ipcRenderer.invoke(IPC_CHANNELS.KEYWORDS_TOGGLE, id)
  },

  // ── Posts ─────────────────────────────────────
  posts: {
    getAll: (options?: {
      keyword?: string
      search?: string
      sortBy?: 'detectedAt' | 'points'
      sortOrder?: 'asc' | 'desc'
    }): Promise<IpcResponse<Post[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.POSTS_GET_ALL, options),
    delete: (id: number): Promise<IpcResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.POSTS_DELETE, id),
    clearAll: (): Promise<IpcResponse<number>> =>
      ipcRenderer.invoke(IPC_CHANNELS.POSTS_CLEAR_ALL)
  },

  // ── Scraper ───────────────────────────────────
  scraper: {
    runNow: (): Promise<IpcResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SCRAPER_RUN_NOW),
    getStatus: (): Promise<IpcResponse<SchedulerStatus>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SCRAPER_GET_STATUS)
  },

  // ── Scheduler ─────────────────────────────────
  scheduler: {
    getStatus: (): Promise<IpcResponse<SchedulerStatus>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SCHEDULER_GET_STATUS),
    updateInterval: (minutes: number): Promise<IpcResponse<AppSettings>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SCHEDULER_UPDATE_INTERVAL, minutes),
    toggle: (enabled: boolean): Promise<IpcResponse<AppSettings>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SCHEDULER_TOGGLE, enabled)
  },

  // ── Settings ──────────────────────────────────
  settings: {
    get: (): Promise<IpcResponse<AppSettings>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
    update: (updates: Partial<AppSettings>): Promise<IpcResponse<AppSettings>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE, updates)
  },

  // ── Logs ──────────────────────────────────────
  logs: {
    getAll: (): Promise<IpcResponse<LogEntry[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.LOGS_GET_ALL),
    clear: (): Promise<IpcResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.LOGS_CLEAR)
  },

  // ── Eventos push de main → renderer ───────────
  // Retornan una función para desuscribirse (cleanup en useEffect)
  on: {
    scrapeComplete: (
      callback: (result: {
        postsScraped: number
        postsMatched: number
        postsInserted: number
      }) => void
    ) => {
      const handler = (_: Electron.IpcRendererEvent, data: unknown): void =>
        callback(
          data as Parameters<typeof callback>[0]
        )
      ipcRenderer.on(IPC_CHANNELS.EVENT_SCRAPE_COMPLETE, handler)
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.EVENT_SCRAPE_COMPLETE, handler)
    },

    newPosts: (callback: (data: { count: number }) => void) => {
      const handler = (_: Electron.IpcRendererEvent, data: unknown): void =>
        callback(data as { count: number })
      ipcRenderer.on(IPC_CHANNELS.EVENT_NEW_POSTS, handler)
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.EVENT_NEW_POSTS, handler)
    },

    schedulerStatus: (callback: (status: SchedulerStatus) => void) => {
      const handler = (_: Electron.IpcRendererEvent, data: unknown): void =>
        callback(data as SchedulerStatus)
      ipcRenderer.on(IPC_CHANNELS.EVENT_SCHEDULER_STATUS, handler)
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.EVENT_SCHEDULER_STATUS, handler)
    },

    logEntry: (callback: (entry: LogEntry) => void) => {
      const handler = (_: Electron.IpcRendererEvent, data: unknown): void =>
        callback(data as LogEntry)
      ipcRenderer.on(IPC_CHANNELS.EVENT_LOG_ENTRY, handler)
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.EVENT_LOG_ENTRY, handler)
    }
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI