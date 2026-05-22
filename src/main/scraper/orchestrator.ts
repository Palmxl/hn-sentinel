import { scrapeHackerNews } from './hnScraper'
import { matchPosts } from './matcher'
import { getActiveKeywords } from '../services/keywordsService'
import { insertPost } from '../services/postsService'
import { startRun, completeRun, failRun } from '../services/scraperRunsService'
import { logger } from '../services/logsService'
import { getSettings } from '../services/settingsService'

const CONTEXT = 'orchestrator'

export interface ScrapeOrchestrationResult {
  postsScraped: number
  postsMatched: number
  postsInserted: number
  error?: string
}

// Coordina todo el flujo: scrape → match → persistencia
export async function runScrapeOrchestration(): Promise<ScrapeOrchestrationResult> {
  const runId = startRun()
  logger.info(`Iniciando corrida de scraping #${runId}`, CONTEXT)

  try {
    const settings = getSettings()
    const keywords = getActiveKeywords()

    // Si no hay keywords activas no tiene sentido scrapear
    if (keywords.length === 0) {
      logger.warn('No hay keywords activas — saltando scrape', CONTEXT)
      completeRun(runId, 0, 0)
      return { postsScraped: 0, postsMatched: 0, postsInserted: 0 }
    }

    logger.info(`Keywords activas: ${keywords.join(', ')}`, CONTEXT)

    // 1. Scraping
    const { posts, error } = await scrapeHackerNews(settings.maxPostsToScrape)

    if (error && posts.length === 0) {
      throw new Error(error)
    }

    if (error) {
      logger.warn(`Scrape completado con advertencia: ${error}`, CONTEXT)
    }

    logger.info(`Posts scrapeados: ${posts.length}`, CONTEXT)

    // 2. Matching contra keywords
    const matched = matchPosts(posts, keywords)
    logger.info(`Posts que coincidieron: ${matched.length}`, CONTEXT)

    // 3. Persistencia — solo inserta los nuevos
    let inserted = 0
    for (const post of matched) {
      const result = insertPost({
        title: post.title,
        author: post.author,
        points: post.points,
        url: post.url,
        hnUrl: post.hnUrl,
        matchedKeyword: post.matchedKeyword,
        commentsCount: post.commentsCount
      })
      if (result !== null) inserted++
    }

    logger.info(
      `Insertados: ${inserted} nuevos (${matched.length - inserted} duplicados ignorados)`,
      CONTEXT
    )

    completeRun(runId, posts.length, matched.length)

    return {
      postsScraped: posts.length,
      postsMatched: matched.length,
      postsInserted: inserted
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error(`Orquestación fallida: ${message}`, CONTEXT)
    failRun(runId, message)
    return {
      postsScraped: 0,
      postsMatched: 0,
      postsInserted: 0,
      error: message
    }
  }
}