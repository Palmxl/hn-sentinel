import { create } from 'zustand'
import type { Keyword } from '../../../shared/types'

interface KeywordsState {
  keywords: Keyword[]
  isLoading: boolean
  error: string | null

  // Acciones
  setKeywords: (keywords: Keyword[]) => void
  addKeyword: (keyword: Keyword) => void
  removeKeyword: (id: number) => void
  updateKeyword: (keyword: Keyword) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useKeywordsStore = create<KeywordsState>(set => ({
  keywords: [],
  isLoading: false,
  error: null,

  setKeywords: keywords => set({ keywords }),

  // Agrega al inicio de la lista para mostrar el más reciente primero
  addKeyword: keyword =>
    set(state => ({ keywords: [keyword, ...state.keywords] })),

  removeKeyword: id =>
    set(state => ({ keywords: state.keywords.filter(k => k.id !== id) })),

  // Reemplaza la keyword modificada manteniendo el orden
  updateKeyword: updated =>
    set(state => ({
      keywords: state.keywords.map(k => (k.id === updated.id ? updated : k))
    })),

  setLoading: isLoading => set({ isLoading }),
  setError: error => set({ error })
}))