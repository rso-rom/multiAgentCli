import axios from 'axios';

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function webSearch(query: string, limit = 5): Promise<WebSearchResult[]> {
  const endpoint = 'https://duckduckgo.com/?q=' + encodeURIComponent(query) + '&format=json&no_redirect=1&no_html=1';
  try {
    const res = await axios.get(endpoint, { timeout: 10_000 });
    const data = res.data;
    const results: WebSearchResult[] = [];
    if (Array.isArray(data?.RelatedTopics)) {
      for (const item of data.RelatedTopics) {
        if (item?.Text && item?.FirstURL) {
          results.push({ title: item.Text.split(' - ')[0], url: item.FirstURL, snippet: item.Text });
          if (results.length >= limit) break;
        }
      }
    }
    return results;
  } catch (err) {
    return [{ title: 'search-error', url: '', snippet: String(err) }];
  }
}
