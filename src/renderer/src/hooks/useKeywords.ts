import { useCallback, useEffect } from 'react'
import { useKeywordsStore } from '../store/keywordsStore'
import type { Keyword, IpcResponse } from '../../../shared/types'

export function useKeywords(): {
  keywords: Keyword[]
  isLoading: boolean
  error: string | null
  fetchKeywords: () => Promise<void>
  addKeyword: (value: string) => Promise<IpcResponse<Keyword>>
  deleteKeyword: (id: number) => Promise<IpcResponse<void>>
  toggleKeyword: (id: number) => Promise<IpcResponse<Keyword>>
} {
  const {
    keywords,
    isLoading,
    error,
    setKeywords,
    addKeyword,
    removeKeyword,
    updateKeyword,
    setLoading,
    setError
  } = useKeywordsStore()

  const fetchKeywords = useCallback(async () => {
    setLoading(true)
    try {
      const response = await window.electronAPI.keywords.getAll()
      if (response.success && response.data) {
        setKeywords(response.data)
      } else {
        setError(response.error ?? 'Error cargando keywords')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [setKeywords, setLoading, setError])

  useEffect(() => {
    fetchKeywords()
  }, [fetchKeywords])

  const addKeywordHandler = useCallback(
    async (value: string): Promise<IpcResponse<Keyword>> => {
      const response = await window.electronAPI.keywords.add(value)
      if (response.success && response.data) {
        addKeyword(response.data)
      }
      return response
    },
    [addKeyword]
  )

  const deleteKeywordHandler = useCallback(
    async (id: number): Promise<IpcResponse<void>> => {
      const response = await window.electronAPI.keywords.delete(id)
      if (response.success) {
        removeKeyword(id)
      }
      return response
    },
    [removeKeyword]
  )

  const toggleKeywordHandler = useCallback(
    async (id: number): Promise<IpcResponse<Keyword>> => {
      const response = await window.electronAPI.keywords.toggle(id)
      if (response.success && response.data) {
        updateKeyword(response.data)
      }
      return response
    },
    [updateKeyword]
  )

  return {
    keywords,
    isLoading,
    error,
    fetchKeywords,
    addKeyword: addKeywordHandler,
    deleteKeyword: deleteKeywordHandler,
    toggleKeyword: toggleKeywordHandler
  }
}