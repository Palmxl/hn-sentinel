import React, { useEffect } from 'react'
import { usePosts } from '../hooks/usePosts'
import { useKeywords } from '../hooks/useKeywords'
import { useAppStore } from '../store/appStore'
import { PostsTable } from '../components/posts/PostsTable'
import { PostsFilters } from '../components/posts/PostsFilters'

export function DashboardPage(): React.ReactElement {
  const {
    posts,
    isLoading,
    error,
    searchQuery,
    selectedKeyword,
    sortBy,
    sortOrder,
    fetchPosts,
    deletePost,
    clearAllPosts,
    setSearchQuery,
    setSelectedKeyword,
    setSortBy,
    setSortOrder
  } = usePosts()

  const { keywords } = useKeywords()
  const { schedulerStatus } = useAppStore()

  // Recarga posts cuando llega un evento de scrape completo
  useEffect(() => {
    const unsubscribe = window.electronAPI.on.scrapeComplete(() => {
      fetchPosts()
    })
    return (): void => {
      unsubscribe()
    }
  }, [fetchPosts])

  const handleRunNow = async (): Promise<void> => {
    await window.electronAPI.scraper.runNow()
  }

  const handleClearAll = async (): Promise<void> => {
    if (window.confirm('¿Eliminar todos los posts detectados?')) {
      await clearAllPosts()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filtros y acciones */}
      <PostsFilters
        searchQuery={searchQuery}
        selectedKeyword={selectedKeyword}
        sortBy={sortBy}
        sortOrder={sortOrder}
        keywords={keywords}
        totalPosts={posts.length}
        onSearchChange={setSearchQuery}
        onKeywordChange={setSelectedKeyword}
        onSortByChange={setSortBy}
        onSortOrderChange={setSortOrder}
        onClearAll={handleClearAll}
        onRunNow={handleRunNow}
        isScrapingNow={schedulerStatus?.isScrapingNow ?? false}
      />

      {/* Contenido */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <span className="text-2xl animate-spin inline-block">◌</span>
              <p className="text-sentinel-text-muted text-sm mt-2">
                Cargando posts...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-red-400 text-sm">Error: {error}</p>
              <button
                onClick={fetchPosts}
                className="btn-ghost mt-2 text-xs"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : (
          <PostsTable
            posts={posts}
            onDelete={async id => {
              await deletePost(id)
            }}
          />
        )}
      </div>
    </div>
  )
}