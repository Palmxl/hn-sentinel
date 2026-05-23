import React from 'react'
import type { Keyword } from '../../../../shared/types'

interface Props {
  searchQuery: string
  selectedKeyword: string | null
  sortBy: 'detectedAt' | 'points'
  sortOrder: 'asc' | 'desc'
  keywords: Keyword[]
  totalPosts: number
  onSearchChange: (value: string) => void
  onKeywordChange: (keyword: string | null) => void
  onSortByChange: (sortBy: 'detectedAt' | 'points') => void
  onSortOrderChange: (order: 'asc' | 'desc') => void
  onClearAll: () => void
  onRunNow: () => void
  onExportCsv: () => void
  onExportJson: () => void
  isScrapingNow: boolean
}

export function PostsFilters({
  searchQuery,
  selectedKeyword,
  sortBy,
  sortOrder,
  keywords,
  totalPosts,
  onSearchChange,
  onKeywordChange,
  onSortByChange,
  onSortOrderChange,
  onClearAll,
  onRunNow,
  onExportCsv,
  onExportJson,
  isScrapingNow
}: Props): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-sentinel-border">
      {/* Buscador */}
      <input
        type="text"
        placeholder="Buscar posts..."
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        className="input w-52"
      />

      {/* Filtro por keyword */}
      <select
        value={selectedKeyword ?? ''}
        onChange={e => onKeywordChange(e.target.value || null)}
        className="input w-40"
      >
        <option value="">Todas las keywords</option>
        {keywords
          .filter(k => k.isActive)
          .map(k => (
            <option key={k.id} value={k.value}>
              {k.value}
            </option>
          ))}
      </select>

      {/* Ordenar por */}
      <select
        value={sortBy}
        onChange={e => onSortByChange(e.target.value as 'detectedAt' | 'points')}
        className="input w-36"
      >
        <option value="detectedAt">Por fecha</option>
        <option value="points">Por puntos</option>
      </select>

      {/* Orden ascendente/descendente */}
      <button
        onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
        className="btn-ghost"
        title="Cambiar orden"
      >
        {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
      </button>

      {/* Espaciador */}
      <div className="flex-1" />

      {/* Total de posts */}
      <span className="text-sentinel-text-muted text-xs">
        {totalPosts} post{totalPosts !== 1 ? 's' : ''}
      </span>

      {/* Botones de exportar — solo si hay posts */}
      {totalPosts > 0 && (
        <>
          <button onClick={onExportCsv} className="btn-ghost text-xs">
            ↓ CSV
          </button>
          <button onClick={onExportJson} className="btn-ghost text-xs">
            ↓ JSON
          </button>
        </>
      )}

      {/* Botón limpiar todo */}
      {totalPosts > 0 && (
        <button onClick={onClearAll} className="btn-danger">
          Limpiar todo
        </button>
      )}

      {/* Botón ejecutar ahora */}
      <button
        onClick={onRunNow}
        disabled={isScrapingNow}
        className="btn-primary flex items-center gap-2"
      >
        {isScrapingNow ? (
          <>
            <span className="animate-spin">◌</span>
            Scraping...
          </>
        ) : (
          <>▶ Ejecutar ahora</>
        )}
      </button>
    </div>
  )
}