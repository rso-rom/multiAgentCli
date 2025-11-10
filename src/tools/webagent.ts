import { ModelBackend } from '../backends/base';
import { webSearch, formatSearchResults } from './websearch';
import { fetchPage } from './fetchpage';

/**
 * Simple tool-using agent loop.
 * The agent can call:
 *   TOOL: search("python async examples")
 *   TOOL: read("https://example.com/async")
 */
export async function runWebAgent(
  backend: ModelBackend,
  prompt: string,
  maxLoops = 4
): Promise<string> {
  let context = `You are a coding assistant with access to web tools.
You can use these tools only when needed:

- TOOL: search("query") - search the web
- TOOL: read("url") - read a webpage

When you need information, output the tool call on its own line, then wait for results.
When you're done, output your final answer without any tool calls.

`;

  let full = context + `\nUSER: ${prompt}\nASSISTANT:`;
  let loops = 0;

  while (loops < maxLoops) {
    const onStream = (chunk: string) => process.stdout.write(chunk);
    const reply = await backend.chat(full, onStream);
    const response = (reply && typeof reply === 'string') ? reply : '';

    full += response;
    console.log(''); // newline after stream

    // Check for tool calls
    const searchMatch = response.match(/TOOL:\s*search\("([^"]+)"\)/i);
    const readMatch = response.match(/TOOL:\s*read\("([^"]+)"\)/i);

    if (searchMatch) {
      const q = searchMatch[1];
      console.log(`\n🔍 Searching for: ${q}`);
      const results = await webSearch(q, 3);
      const formatted = formatSearchResults(results);
      full += `\nTOOL_RESULT: Results for search("${q}"):\n${formatted}\nASSISTANT:`;
      loops++;
      continue;
    }

    if (readMatch) {
      const url = readMatch[1];
      console.log(`\n📄 Reading: ${url}`);
      const content = await fetchPage(url, 3000);
      full += `\nTOOL_RESULT: Content from ${url}:\n${content}\nASSISTANT:`;
      loops++;
      continue;
    }

    // no more tools requested — assume done
    break;
  }

  return full;
}
