import React from 'react'
import { useAppStore } from '../../store/appStore'

function formatDate(iso: string | null): string {
  if (!iso) return 'Nunca'
  return new Date(iso).toLocaleString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit'
  })
}

export function StatusBar(): React.ReactElement {
  const { schedulerStatus } = useAppStore()

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-sentinel-surface border-b border-sentinel-border text-xs">
      {/* Estado del scraper */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${
            schedulerStatus?.isScrapingNow
              ? 'bg-sentinel-accent animate-pulse'
              : schedulerStatus?.lastRunStatus === 'error'
              ? 'bg-sentinel-error'
              : 'bg-sentinel-success'
          }`}
        />
        <span className="text-sentinel-text-muted">
          {schedulerStatus?.isScrapingNow
            ? 'Scraping...'
            : schedulerStatus?.lastRunStatus === 'error'
            ? 'Error en última corrida'
            : 'En espera'}
        </span>
      </div>

      <div className="w-px h-3 bg-sentinel-border" />

      {/* Última corrida */}
      <div className="flex items-center gap-1">
        <span className="text-sentinel-text-muted">Última:</span>
        <span className="text-sentinel-text-dim">
          {formatDate(schedulerStatus?.lastRunAt ?? null)}
        </span>
      </div>

      <div className="w-px h-3 bg-sentinel-border" />

      {/* Próxima corrida */}
      <div className="flex items-center gap-1">
        <span className="text-sentinel-text-muted">Próxima:</span>
        <span className="text-sentinel-text-dim">
          {formatDate(schedulerStatus?.nextRunAt ?? null)}
        </span>
      </div>

      {/* Error si hay */}
      {schedulerStatus?.lastError && (
        <>
          <div className="w-px h-3 bg-sentinel-border" />
          <div className="flex items-center gap-1">
            <span className="text-sentinel-error truncate max-w-xs">
              ⚠ {schedulerStatus.lastError}
            </span>
          </div>
        </>
      )}
    </div>
  )
}