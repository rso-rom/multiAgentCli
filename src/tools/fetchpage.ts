import axios from 'axios';

/**
 * Fetch and extract text content from a web page
 * For production, consider using libraries like cheerio for better HTML parsing
 */
export async function fetchPage(url: string, maxLength = 5000): Promise<string> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CodeChatBot/1.0)'
      },
      timeout: 15000,
      maxContentLength: 1024 * 1024 // 1MB limit
    });

    let text = response.data;

    if (typeof text !== 'string') {
      text = String(text);
    }

    // Very basic HTML stripping (for production, use a proper HTML parser)
    text = text
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Truncate if too long
    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + '... [truncated]';
    }

    return text;
  } catch (error: any) {
    return `Error fetching page: ${error.message}`;
  }
}

/**
 * Extract code snippets from text
 */
export function extractCodeSnippets(text: string): string[] {
  const codeBlocks: string[] = [];

  // Match code blocks in various formats
  const patterns = [
    /```[\w]*\n([\s\S]*?)```/g,  // Markdown code blocks
    /<code>([\s\S]*?)<\/code>/g,  // HTML code tags
    /<pre>([\s\S]*?)<\/pre>/g     // HTML pre tags
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (match[1]) {
        codeBlocks.push(match[1].trim());
      }
    }
  });

  return codeBlocks;
}
