import axios from 'axios';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * Simple web search using DuckDuckGo HTML API
 * Note: For production use, consider using official search APIs (Bing, Google Custom Search, etc.)
 */
export async function webSearch(query: string, maxResults = 5): Promise<SearchResult[]> {
  try {
    // DuckDuckGo HTML search
    const url = 'https://html.duckduckgo.com/html/';
    const response = await axios.post(url,
      `q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (compatible; CodeChatBot/1.0)'
        },
        timeout: 10000
      }
    );

    // Simple HTML parsing to extract results
    const html = response.data;
    const results: SearchResult[] = [];

    // Very basic regex-based extraction (for production, use a proper HTML parser like cheerio)
    const resultRegex = /<a rel="nofollow" class="result__a" href="([^"]+)">([^<]+)<\/a>/g;
    const snippetRegex = /<a class="result__snippet"[^>]*>([^<]+)</g;

    let match;
    const urls: string[] = [];
    const titles: string[] = [];

    while ((match = resultRegex.exec(html)) !== null && urls.length < maxResults) {
      urls.push(match[1]);
      titles.push(match[2]);
    }

    const snippets: string[] = [];
    while ((match = snippetRegex.exec(html)) !== null && snippets.length < maxResults) {
      snippets.push(match[1].trim());
    }

    for (let i = 0; i < Math.min(urls.length, titles.length); i++) {
      results.push({
        title: titles[i],
        url: urls[i],
        snippet: snippets[i] || ''
      });
    }

    return results;
  } catch (error: any) {
    console.error('Web search error:', error.message);
    return [];
  }
}

/**
 * Format search results for LLM consumption
 */
export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No results found.';
  }

  return results
    .map((r, i) => `${i + 1}. ${r.title}\n   URL: ${r.url}\n   ${r.snippet}`)
    .join('\n\n');
}
