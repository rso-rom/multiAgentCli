/**
 * Model pricing (USD per 1K tokens)
 */
export const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.001, output: 0.002 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
  'text-embedding-3-small': { input: 0.00002, output: 0 },
  'text-embedding-ada-002': { input: 0.0001, output: 0 }
};

/**
 * Calculate cost for token usage
 */
export function calculateCost(tokens: number, model: string, isOutput = false): number {
  const pricing = MODEL_COSTS[model];
  if (!pricing) return 0; // Unknown model or local model (free)

  const rate = isOutput ? pricing.output : pricing.input;
  return (tokens / 1000) * rate;
}

/**
 * Estimate tokens from text (rough approximation: 1 token ≈ 4 characters)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
