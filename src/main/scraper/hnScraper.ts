import { chromium, type Browser, type Page } from 'playwright'
import { logger } from '../services/logsService'

const CONTEXT = 'scraper'

export interface ScrapedPost {
  title: string
  author: string
  points: number
  url: string
  hnUrl: string
  commentsCount: number
}

export interface ScrapeResult {
  posts: ScrapedPost[]
  error?: string
}

export async function scrapeHackerNews(maxPosts = 30): Promise<ScrapeResult> {
  let browser: Browser | null = null

  try {
    logger.info('Lanzando navegador para scraping de HN', CONTEXT)

    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    })

    const page = await browser.newPage()

    // User agent realista para evitar bloqueos
    await page.setExtraHTTPHeaders({
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })

    logger.info('Navegando a Hacker News', CONTEXT)

    await page.goto('https://news.ycombinator.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000
    })

    const posts = await extractPosts(page, maxPosts)
    logger.info(`Se scrapearon ${posts.length} posts de HN`, CONTEXT)

    return { posts }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error(`Scrape fallido: ${message}`, CONTEXT)
    return { posts: [], error: message }
  } finally {
    // Siempre cerramos el navegador, incluso si hubo error
    if (browser) {
      await browser.close().catch(() => undefined)
    }
  }
}

async function extractPosts(page: Page, maxPosts: number): Promise<ScrapedPost[]> {
  try {
    // Esperamos que cargue la tabla principal de posts
    await page.waitForSelector('.itemlist', { timeout: 15_000 })
  } catch {
    logger.warn('Timeout esperando selector .itemlist', CONTEXT)
  }

  // Toda la extracción ocurre dentro del contexto del navegador
  const posts = await page.evaluate((max) => {
    const results: Array<{
      title: string
      author: string
      points: number
      url: string
      hnUrl: string
      commentsCount: number
    }> = []

    // HN usa filas con clase 'athing' para cada story
    const storyRows = document.querySelectorAll('tr.athing')

    for (let i = 0; i < Math.min(storyRows.length, max); i++) {
      const storyRow = storyRows[i]
      const id = storyRow.getAttribute('id')
      if (!id) continue

      // La fila de subtext (puntos, autor, comentarios) es la siguiente
      const subtextRow = storyRow.nextElementSibling
      if (!subtextRow) continue

      // Título y URL
      const titleEl = storyRow.querySelector('.titleline > a')
      if (!titleEl) continue
      const title = titleEl.textContent?.trim() ?? ''

      // Algunos posts son internos de HN
      let url = (titleEl as HTMLAnchorElement).href ?? ''
      if (!url || url.includes('item?id=')) {
        url = `https://news.ycombinator.com/item?id=${id}`
      }

      const hnUrl = `https://news.ycombinator.com/item?id=${id}`

      // Puntos
      const pointsEl = subtextRow.querySelector(`.score[id="score_${id}"]`)
      const pointsText = pointsEl?.textContent ?? '0'
      const points = parseInt(pointsText.replace(/[^0-9]/g, ''), 10) || 0

      // Autor
      const authorEl = subtextRow.querySelector('.hnuser')
      const author = authorEl?.textContent?.trim() ?? '[desconocido]'

      // Conteo de comentarios
      const links = subtextRow.querySelectorAll('a')
      let commentsCount = 0
      for (const link of links) {
        const text = link.textContent ?? ''
        if (text.includes('comment') || text.includes('discuss')) {
          const num = parseInt(text.replace(/[^0-9]/g, ''), 10)
          if (!isNaN(num)) commentsCount = num
          break
        }
      }

      if (title) {
        results.push({ title, author, points, url, hnUrl, commentsCount })
      }
    }

    return results
  }, maxPosts)

  return posts
}