import { create } from 'zustand'
import type { Post } from '../../../shared/types'

interface PostsState {
  posts: Post[]
  isLoading: boolean
  error: string | null
  searchQuery: string
  selectedKeyword: string | null
  sortBy: 'detectedAt' | 'points'
  sortOrder: 'asc' | 'desc'

  // Acciones
  setPosts: (posts: Post[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSearchQuery: (query: string) => void
  setSelectedKeyword: (keyword: string | null) => void
  setSortBy: (sortBy: 'detectedAt' | 'points') => void
  setSortOrder: (order: 'asc' | 'desc') => void
  removePost: (id: number) => void
  clearPosts: () => void
}

export const usePostsStore = create<PostsState>(set => ({
  posts: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedKeyword: null,
  sortBy: 'detectedAt',
  sortOrder: 'desc',

  setPosts: posts => set({ posts }),
  setLoading: isLoading => set({ isLoading }),
  setError: error => set({ error }),
  setSearchQuery: searchQuery => set({ searchQuery }),
  setSelectedKeyword: selectedKeyword => set({ selectedKeyword }),
  setSortBy: sortBy => set({ sortBy }),
  setSortOrder: sortOrder => set({ sortOrder }),
  removePost: id =>
    set(state => ({ posts: state.posts.filter(p => p.id !== id) })),
  clearPosts: () => set({ posts: [] })
}))