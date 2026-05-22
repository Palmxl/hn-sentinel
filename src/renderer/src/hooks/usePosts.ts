import { useCallback, useEffect } from 'react'
import { usePostsStore } from '../store/postsStore'
import type { Post, IpcResponse } from '../../../shared/types'

export function usePosts(): {
  posts: Post[]
  isLoading: boolean
  error: string | null
  searchQuery: string
  selectedKeyword: string | null
  sortBy: 'detectedAt' | 'points'
  sortOrder: 'asc' | 'desc'
  fetchPosts: () => Promise<void>
  deletePost: (id: number) => Promise<IpcResponse<void>>
  clearAllPosts: () => Promise<IpcResponse<number>>
  setSearchQuery: (query: string) => void
  setSelectedKeyword: (keyword: string | null) => void
  setSortBy: (sortBy: 'detectedAt' | 'points') => void
  setSortOrder: (order: 'asc' | 'desc') => void
} {
  const {
    posts,
    isLoading,
    error,
    searchQuery,
    selectedKeyword,
    sortBy,
    sortOrder,
    setPosts,
    setLoading,
    setError,
    setSearchQuery,
    setSelectedKeyword,
    setSortBy,
    setSortOrder,
    removePost,
    clearPosts
  } = usePostsStore()

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await window.electronAPI.posts.getAll({
        search: searchQuery || undefined,
        keyword: selectedKeyword || undefined,
        sortBy,
        sortOrder
      })
      if (response.success && response.data) {
        setPosts(response.data)
      } else {
        setError(response.error ?? 'Error cargando posts')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedKeyword, sortBy, sortOrder, setPosts, setLoading, setError])

  // Recarga posts cuando cambian los filtros
  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const deletePost = useCallback(
    async (id: number): Promise<IpcResponse<void>> => {
      const response = await window.electronAPI.posts.delete(id)
      if (response.success) {
        removePost(id)
      }
      return response
    },
    [removePost]
  )

  const clearAllPosts = useCallback(async (): Promise<IpcResponse<number>> => {
    const response = await window.electronAPI.posts.clearAll()
    if (response.success) {
      clearPosts()
    }
    return response
  }, [clearPosts])

  return {
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
  }
}