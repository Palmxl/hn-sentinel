import React, { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'
import type { AppSettings } from '../../../shared/types'

export function SettingsPage(): React.ReactElement {
  const { settings, setSettings } = useAppStore()
  const [localSettings, setLocalSettings] = useState<AppSettings | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState(false)

  // Carga settings al montar
  useEffect(() => {
    const loadSettings = async (): Promise<void> => {
      const response = await window.electronAPI.settings.get()
      if (response.success && response.data) {
        setSettings(response.data)
        setLocalSettings(response.data)
      }
    }
    loadSettings()
  }, [setSettings])

  // Sincroniza settings locales cuando cambian en el store
  useEffect(() => {
    if (settings && !localSettings) {
      setLocalSettings(settings)
    }
  }, [settings, localSettings])

  const handleSave = async (): Promise<void> => {
    if (!localSettings) return
    setIsSaving(true)
    try {
      const response = await window.electronAPI.settings.update(localSettings)
      if (response.success && response.data) {
        setSettings(response.data)

        // Actualiza el intervalo del scheduler
        await window.electronAPI.scheduler.updateInterval(
          localSettings.intervalMinutes
        )

        // Muestra mensaje de guardado
        setSavedMessage(true)
        setTimeout(() => setSavedMessage(false), 2000)
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (!localSettings) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sentinel-text-muted text-sm">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-auto p-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-sentinel-text font-semibold text-base">
          Configuración
        </h2>
        <p className="text-sentinel-text-muted text-xs mt-1">
          Ajusta el comportamiento del scraper y el scheduler
        </p>
      </div>

      <div className="space-y-4 max-w-lg">
        {/* Intervalo de scraping */}
        <div className="card p-4">
          <h3 className="text-sentinel-text font-medium text-sm mb-1">
            Intervalo de scraping
          </h3>
          <p className="text-sentinel-text-muted text-xs mb-3">
            Cada cuántos minutos se ejecuta el scraper automáticamente
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={1440}
              value={localSettings.intervalMinutes}
              onChange={e =>
                setLocalSettings({
                  ...localSettings,
                  intervalMinutes: parseInt(e.target.value, 10)
                })
              }
              className="input w-24"
            />
            <span className="text-sentinel-text-muted text-sm">minutos</span>
          </div>
        </div>

        {/* Máximo de posts */}
        <div className="card p-4">
          <h3 className="text-sentinel-text font-medium text-sm mb-1">
            Posts por corrida
          </h3>
          <p className="text-sentinel-text-muted text-xs mb-3">
            Cuántos posts revisar en cada ejecución del scraper (máx. 100)
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={100}
              value={localSettings.maxPostsToScrape}
              onChange={e =>
                setLocalSettings({
                  ...localSettings,
                  maxPostsToScrape: parseInt(e.target.value, 10)
                })
              }
              className="input w-24"
            />
            <span className="text-sentinel-text-muted text-sm">posts</span>
          </div>
        </div>

        {/* Scheduler activo */}
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sentinel-text font-medium text-sm mb-1">
                Scheduler automático
              </h3>
              <p className="text-sentinel-text-muted text-xs">
                Activa o desactiva el scraping automático
              </p>
            </div>
            <button
              onClick={() =>
                setLocalSettings({
                  ...localSettings,
                  isSchedulerEnabled: !localSettings.isSchedulerEnabled
                })
              }
              className={`w-10 h-5 rounded-full transition-colors relative ${
                localSettings.isSchedulerEnabled
                  ? 'bg-sentinel-accent'
                  : 'bg-sentinel-muted'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  localSettings.isSchedulerEnabled
                    ? 'left-5'
                    : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Botón guardar */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary"
          >
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {savedMessage && (
            <span className="text-sentinel-success text-sm animate-fade-in">
              ✓ Guardado
            </span>
          )}
        </div>
      </div>
    </div>
  )
}