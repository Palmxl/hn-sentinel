import type { ScrapedPost } from './hnScraper'

export interface MatchedPost extends ScrapedPost {
  matchedKeyword: string // keyword que disparó la coincidencia
}

/**
 * Compara una lista de posts scrapeados contra las keywords activas.
 * - Case-insensitive
 * - Un post puede coincidir con múltiples keywords
 * - Retorna una entrada por cada coincidencia
 */
export function matchPosts(
  posts: ScrapedPost[],
  keywords: string[]
): MatchedPost[] {
  if (keywords.length === 0) return []

  const matched: MatchedPost[] = []

  for (const post of posts) {
    // Buscamos en el título en minúsculas
    const searchText = post.title.toLowerCase()

    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase().trim()
      if (!keywordLower) continue

      if (searchText.includes(keywordLower)) {
        matched.push({ ...post, matchedKeyword: keyword })
      }
    }
  }

  return matched
}