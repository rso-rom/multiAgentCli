import axios from 'axios';
import { LLMAdapter } from '../llm/adapter';

function stripHtml(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchAndSummarize(url: string, modelRef = process.env.CODEFLOW_SUMMARY_MODEL || 'openai:gpt-4o-mini') {
  const response = await axios.get(url, { timeout: 15_000 });
  const text = stripHtml(String(response.data)).slice(0, 5000);
  const prompt = `Provide a concise summary of the following web page content (max 10 bullet points):\n\n${text}`;
  return LLMAdapter.call(modelRef, prompt);
}
