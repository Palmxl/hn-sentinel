import React from 'react'
import type { Post } from '../../../../shared/types'

interface Props {
  posts: Post[]
  onDelete: (id: number) => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  })
}

export function PostsTable({ posts, onDelete }: Props): React.ReactElement {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-4xl mb-3">◎</span>
        <p className="text-sentinel-text-muted text-sm">
          No hay posts detectados aún
        </p>
        <p className="text-sentinel-text-muted text-xs mt-1">
          Agrega keywords y ejecuta el scraper
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-sentinel-border">
            <th className="text-left px-4 py-3 text-sentinel-text-muted font-medium">Título</th>
            <th className="text-left px-4 py-3 text-sentinel-text-muted font-medium w-28">Autor</th>
            <th className="text-left px-4 py-3 text-sentinel-text-muted font-medium w-20">Puntos</th>
            <th className="text-left px-4 py-3 text-sentinel-text-muted font-medium w-24">Keyword</th>
            <th className="text-left px-4 py-3 text-sentinel-text-muted font-medium w-32">Detectado</th>
            <th className="w-16" />
          </tr>
        </thead>
        <tbody>
          {posts.map(post => (
            <tr
              key={post.id}
              className="border-b border-sentinel-border/50 hover:bg-sentinel-muted/30 transition-colors"
            >
              <td className="px-4 py-3">
                <button
                  className="text-sentinel-text hover:text-sentinel-accent transition-colors selectable text-left"
                  onClick={() => window.open(post.url, '_blank')}
                >
                  {post.title}
                </button>
                <div className="flex items-center gap-2 mt-0.5">
                  <button
                    className="text-xs text-sentinel-text-muted hover:text-sentinel-accent"
                    onClick={() => window.open(post.hnUrl, '_blank')}
                  >
                    ver en HN →
                  </button>
                  {post.commentsCount > 0 && (
                    <span className="text-xs text-sentinel-text-muted">
                      {post.commentsCount} comentarios
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sentinel-text-dim selectable">
                {post.author}
              </td>
              <td className="px-4 py-3">
                <span className="text-sentinel-accent font-medium">
                  {post.points}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="badge-accent">{post.matchedKeyword}</span>
              </td>
              <td className="px-4 py-3 text-sentinel-text-muted">
                {formatDate(post.detectedAt)}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onDelete(post.id)}
                  className="btn-ghost text-xs text-red-400 hover:text-red-300"
                  title="Eliminar post"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}