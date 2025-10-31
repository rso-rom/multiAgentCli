// src/memory/MemoryHeuristics.ts
/**
 * Heuristic classifier for outputs:
 * - returns 'auto'  -> store without asking
 * - returns 'discard' -> don't store
 * - returns 'ask' -> request user confirmation
 *
 * Rules (simple initial rules; can be improved with an LLM-based classifier):
 * - Code fences or lots of code-like tokens -> auto
 * - Contains 'architecture' 'design' 'api' 'auth' -> auto
 * - Very short polite messages (<=3 words, like "thanks") -> discard
 * - Error messages only (contains "Error" but no solution) -> discard
 * - Else -> ask
 */

export type StoreDecision = 'auto' | 'discard' | 'ask';

export function shouldStore(text: string): StoreDecision {
  if (!text || !text.trim()) return 'discard';
  const t = text.trim();

  // discard very short thank-you-like replies
  if (t.split(/\s+/).length <= 3) {
    const small = t.toLowerCase();
    if (/^(thanks|thank you|ok|done|roger|yep|nope)$/i.test(small)) return 'discard';
  }

  // code fence detection
  if (/```[\s\S]*?```/.test(t)) return 'auto';

  // many code tokens heuristics
  const codeTokens = ['function', 'const', 'let', 'class', 'def', 'import', 'require', 'return', '=>', '{', '}', ';'];
  let codeScore = 0;
  for (const token of codeTokens) if (t.includes(token)) codeScore++;
  if (codeScore >= 2) return 'auto';

  // architecture / design signals
  const designKeywords = ['architecture', 'design', 'pattern', 'api', 'endpoint', 'schema', 'authentication', 'authorization', 'oauth', 'jwt', 'migration', 'refactor'];
  for (const k of designKeywords) if (t.toLowerCase().includes(k)) return 'auto';

  // error-only: "Error: ..." and no fix
  if (/error[:\s]/i.test(t) && !/fix|solution|workaround|resolved|patch/i.test(t)) return 'discard';

  // default: ask
  return 'ask';
}
