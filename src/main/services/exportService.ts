import { dialog } from 'electron'
import { writeFileSync } from 'fs'
import { getAllPosts } from './postsService'
import { logger } from './logsService'

const CONTEXT = 'export'

export async function exportToCsv(): Promise<string | null> {
  try {
    // Abre el diálogo nativo para guardar archivo
    const result = await dialog.showSaveDialog({
      title: 'Exportar posts a CSV',
      defaultPath: `hn-sentinel-${Date.now()}.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    })

    if (result.canceled || !result.filePath) return null

    const posts = getAllPosts({ limit: 10000 })

    // Cabecera del CSV
    const headers = [
      'titulo',
      'autor',
      'puntos',
      'url',
      'url_hn',
      'keyword',
      'comentarios',
      'detectado_en'
    ].join(',')

    // Filas — escapamos las comas dentro de los valores
    const rows = posts.map(post =>
      [
        `"${post.title.replace(/"/g, '""')}"`,
        `"${post.author}"`,
        post.points,
        `"${post.url}"`,
        `"${post.hnUrl}"`,
        `"${post.matchedKeyword}"`,
        post.commentsCount,
        `"${post.detectedAt}"`
      ].join(',')
    )

    const csv = [headers, ...rows].join('\n')
    writeFileSync(result.filePath, csv, 'utf-8')

    logger.info(
      `Exportados ${posts.length} posts a CSV: ${result.filePath}`,
      CONTEXT
    )

    return result.filePath
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error(`Error exportando CSV: ${message}`, CONTEXT)
    throw err
  }
}

export async function exportToJson(): Promise<string | null> {
  try {
    const result = await dialog.showSaveDialog({
      title: 'Exportar posts a JSON',
      defaultPath: `hn-sentinel-${Date.now()}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })

    if (result.canceled || !result.filePath) return null

    const posts = getAllPosts({ limit: 10000 })

    const json = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        totalPosts: posts.length,
        posts
      },
      null,
      2
    )

    writeFileSync(result.filePath, json, 'utf-8')

    logger.info(
      `Exportados ${posts.length} posts a JSON: ${result.filePath}`,
      CONTEXT
    )

    return result.filePath
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error(`Error exportando JSON: ${message}`, CONTEXT)
    throw err
  }
}