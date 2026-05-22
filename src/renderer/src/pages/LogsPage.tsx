import React, { useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { LogsViewer } from '../components/logs/LogsViewer'

export function LogsPage(): React.ReactElement {
  const { logs, setLogs, clearLogs } = useAppStore()

  // Carga los logs al montar la página
  useEffect(() => {
    const loadLogs = async (): Promise<void> => {
      const response = await window.electronAPI.logs.getAll()
      if (response.success && response.data) {
        setLogs(response.data)
      }
    }
    loadLogs()
  }, [setLogs])

  const handleClear = async (): Promise<void> => {
    await window.electronAPI.logs.clear()
    clearLogs()
  }

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-sentinel-text font-semibold text-base">
          Logs del sistema
        </h2>
        <p className="text-sentinel-text-muted text-xs mt-1">
          Registro de todas las actividades del scraper y la aplicación
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <LogsViewer logs={logs} onClear={handleClear} />
      </div>
    </div>
  )
}