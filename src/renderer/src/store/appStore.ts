import { create } from 'zustand'
import type { SchedulerStatus, LogEntry, AppSettings } from '../../../shared/types'

// Tabs disponibles en la navegación principal
type ActiveTab = 'dashboard' | 'keywords' | 'logs' | 'settings'

interface AppState {
  schedulerStatus: SchedulerStatus | null
  logs: LogEntry[]
  settings: AppSettings | null
  activeTab: ActiveTab

  // Acciones
  setSchedulerStatus: (status: SchedulerStatus) => void
  setLogs: (logs: LogEntry[]) => void
  addLog: (entry: LogEntry) => void
  clearLogs: () => void
  setSettings: (settings: AppSettings) => void
  setActiveTab: (tab: ActiveTab) => void
}

export const useAppStore = create<AppState>(set => ({
  schedulerStatus: null,
  logs: [],
  settings: null,
  activeTab: 'dashboard',

  setSchedulerStatus: schedulerStatus => set({ schedulerStatus }),
  setLogs: logs => set({ logs }),

  // Agrega log al inicio y limita a 500 entradas en memoria
  addLog: entry =>
    set(state => ({
      logs: [entry, ...state.logs].slice(0, 500)
    })),

  clearLogs: () => set({ logs: [] }),
  setSettings: settings => set({ settings }),
  setActiveTab: activeTab => set({ activeTab })
}))