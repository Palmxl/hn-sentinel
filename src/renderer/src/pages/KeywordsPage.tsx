import React from 'react'
import { useKeywords } from '../hooks/useKeywords'
import { KeywordsList } from '../components/keywords/KeywordsList'

export function KeywordsPage(): React.ReactElement {
  const { keywords, isLoading, addKeyword, deleteKeyword, toggleKeyword } =
    useKeywords()

  return (
    <div className="flex flex-col h-full overflow-auto p-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-sentinel-text font-semibold text-base">
          Keywords
        </h2>
        <p className="text-sentinel-text-muted text-xs mt-1">
          Los posts de HN que contengan estas palabras serán detectados
          automáticamente
        </p>
      </div>

      <KeywordsList
        keywords={keywords}
        onAdd={async value => {
          await addKeyword(value)
        }}
        onDelete={async id => {
          await deleteKeyword(id)
        }}
        onToggle={async id => {
          await toggleKeyword(id)
        }}
        isLoading={isLoading}
      />
    </div>
  )
}