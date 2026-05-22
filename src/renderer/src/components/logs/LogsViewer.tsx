import React from 'react'
import type { LogEntry } from '../../../../shared/types'

interface Props {
  logs: LogEntry[]
  onClear: () => void
}

function getLevelStyles(level: LogEntry['level']): string {
  switch (level) {
    case 'error':
      return 'text-red-400'
    case 'warn':
      return 'text-yellow-400'
    case 'debug':
      return 'text-blue-400'
    default:
      return 'text-sentinel-text-dim'
  }
}

function getLevelBadge(level: LogEntry['level']): string {
  switch (level) {
    case 'error':
      return 'badge-error'
    case 'warn':
      return 'badge-warning'
    case 'debug':
      return 'badge-info'
    default:
      return 'badge-success'
  }
}

export function LogsViewer({ logs, onClear }: Props): React.ReactElement {
  return (
    <div className="card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sentinel-border">
        <h3 className="text-sentinel-text font-medium text-sm">
          Logs del sistema
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sentinel-text-muted text-xs">
            {logs.length} entradas
          </span>
          {logs.length > 0 && (
            <button onClick={onClear} className="btn-ghost text-xs">
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Lista de logs */}
      {logs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sentinel-text-muted text-sm">
            No hay logs registrados
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto font-mono text-xs">
          {logs.map(entry => (
            <div
              key={entry.id}
              className="flex items-start gap-3 px-4 py-2 border-b border-sentinel-border/30 hover:bg-sentinel-muted/20"
            >
              {/* Timestamp */}
              <span className="text-sentinel-text-muted whitespace-nowrap shrink-0">
                {new Date(entry.timestamp).toLocaleTimeString('es-CO')}
              </span>

              {/* Level badge */}
              <span className={`${getLevelBadge(entry.level)} shrink-0`}>
                {entry.level.toUpperCase()}
              </span>

              {/* Contexto */}
              {entry.context && (
                <span className="text-sentinel-accent shrink-0">
                  [{entry.context}]
                </span>
              )}

              {/* Mensaje */}
              <span className={`${getLevelStyles(entry.level)} selectable break-all`}>
                {entry.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}