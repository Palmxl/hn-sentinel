import React, { useEffect } from 'react'
import { Sidebar } from './components/layout/Sidebar'
import { StatusBar } from './components/status/StatusBar'
import { DashboardPage } from './pages/DashboardPage'
import { KeywordsPage } from './pages/KeywordsPage'
import { LogsPage } from './pages/LogsPage'
import { SettingsPage } from './pages/SettingsPage'
import { useAppStore } from './store/appStore'

export default function App(): React.ReactElement {
  const { activeTab, setSchedulerStatus, setSettings } = useAppStore()

  // Carga inicial del estado
  useEffect(() => {
    const init = async (): Promise<void> => {
      // Carga settings
      const settingsRes = await window.electronAPI.settings.get()
      if (settingsRes.success && settingsRes.data) {
        setSettings(settingsRes.data)
      }

      // Carga estado del scheduler
      const statusRes = await window.electronAPI.scheduler.getStatus()
      if (statusRes.success && statusRes.data) {
        setSchedulerStatus(statusRes.data)
      }
    }
    init()
  }, [setSettings, setSchedulerStatus])

  // Escucha actualizaciones del scheduler en tiempo real
  useEffect(() => {
    const unsubscribe = window.electronAPI.on.schedulerStatus(status => {
      setSchedulerStatus(status)
    })
    return (): void => {
      unsubscribe()
    }
  }, [setSchedulerStatus])

  const renderPage = (): React.ReactElement => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />
      case 'keywords':
        return <KeywordsPage />
      case 'logs':
        return <LogsPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-sentinel-bg">
      {/* Sidebar de navegación */}
      <Sidebar />

      {/* Contenido principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Barra de estado superior */}
        <StatusBar />

        {/* Página activa */}
        <main className="flex-1 overflow-hidden">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}