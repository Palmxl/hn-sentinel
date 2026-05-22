import React, { useState } from 'react'
import type { Keyword } from '../../../../shared/types'

interface Props {
  keywords: Keyword[]
  onAdd: (value: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onToggle: (id: number) => Promise<void>
  isLoading: boolean
}

export function KeywordsList({
  keywords,
  onAdd,
  onDelete,
  onToggle,
  isLoading
}: Props): React.ReactElement {
  const [inputValue, setInputValue] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async (): Promise<void> => {
    const trimmed = inputValue.trim()
    if (!trimmed) return

    setIsAdding(true)
    setError(null)
    try {
      await onAdd(trimmed)
      setInputValue('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error agregando keyword')
    } finally {
      setIsAdding(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      handleAdd()
    }
  }

  return (
    <div className="space-y-4">
      {/* Input para agregar keyword */}
      <div className="card p-4">
        <h3 className="text-sentinel-text font-medium text-sm mb-3">
          Agregar keyword
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="ej: typescript, rust, openai..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="input"
            maxLength={100}
          />
          <button
            onClick={handleAdd}
            disabled={isAdding || !inputValue.trim()}
            className="btn-primary whitespace-nowrap"
          >
            {isAdding ? '...' : '+ Agregar'}
          </button>
        </div>
        {error && (
          <p className="text-sentinel-error text-xs mt-2">{error}</p>
        )}
        <p className="text-sentinel-text-muted text-xs mt-2">
          Presiona Enter o haz clic en Agregar. La coincidencia es case-insensitive.
        </p>
      </div>

      {/* Lista de keywords */}
      <div className="card">
        <div className="px-4 py-3 border-b border-sentinel-border flex items-center justify-between">
          <h3 className="text-sentinel-text font-medium text-sm">
            Keywords configuradas
          </h3>
          <span className="text-sentinel-text-muted text-xs">
            {keywords.filter(k => k.isActive).length} activas /{' '}
            {keywords.length} total
          </span>
        </div>

        {isLoading ? (
          <div className="px-4 py-8 text-center text-sentinel-text-muted text-sm">
            Cargando...
          </div>
        ) : keywords.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sentinel-text-muted text-sm">
              No hay keywords configuradas
            </p>
            <p className="text-sentinel-text-muted text-xs mt-1">
              Agrega una keyword para comenzar el monitoreo
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-sentinel-border/50">
            {keywords.map(keyword => (
              <li
                key={keyword.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-sentinel-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Toggle activo/inactivo */}
                  <button
                    onClick={() => onToggle(keyword.id)}
                    className={`w-8 h-4 rounded-full transition-colors relative ${
                      keyword.isActive
                        ? 'bg-sentinel-accent'
                        : 'bg-sentinel-muted'
                    }`}
                    title={keyword.isActive ? 'Desactivar' : 'Activar'}
                  >
                    <span
                      className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${
                        keyword.isActive ? 'left-4' : 'left-0.5'
                      }`}
                    />
                  </button>

                  <span
                    className={`text-sm font-medium selectable ${
                      keyword.isActive
                        ? 'text-sentinel-text'
                        : 'text-sentinel-text-muted line-through'
                    }`}
                  >
                    {keyword.value}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sentinel-text-muted text-xs">
                    {new Date(keyword.createdAt).toLocaleDateString('es-CO')}
                  </span>
                  <button
                    onClick={() => onDelete(keyword.id)}
                    className="btn-ghost text-xs text-red-400 hover:text-red-300"
                    title="Eliminar keyword"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}