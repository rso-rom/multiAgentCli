// src/memory/MemoryManager.ts
import path from 'path';
import { ShortMemory } from './ShortMemory';
import { MidMemory } from './MidMemory';
import { LongMemory } from './LongMemory';
import { shouldStore, StoreDecision } from './MemoryHeuristics';

export interface MemoryManagerOptions {
  projectDir: string;
  useQdrant?: boolean;
  qdrantUrl?: string;
  shortUseLmdb?: boolean; // not used for now (S1)
}

export class MemoryManager {
  short: ShortMemory;
  mid: MidMemory;
  long?: LongMemory;
  projectId: string;

  constructor(projectDir: string, options: Partial<MemoryManagerOptions> = {}) {
    this.projectId = path.basename(projectDir);
    this.short = new ShortMemory();
    const midPath = path.join(projectDir, 'mid.lmdb');
    this.mid = new MidMemory(midPath);
    if (options.useQdrant) {
      this.long = new LongMemory(options.qdrantUrl || process.env.QDRANT_URL || 'http://localhost:6333', `${this.projectId}_long`);
    }
  }

  /**
   * store(agent, text)
   * - decides via heuristic whether to store automatically, discard, or ask
   * - if auto: write to mid; if long exists and text looks important -> upsert to long
   * - returns { decision, storedMid, storedLong, askRequired }
   */
  async store(agent: string, text: string) {
    const decision: StoreDecision = shouldStore(text);
    const meta: any = { decision, storedMid: false, storedLong: false, askRequired: false };

    if (decision === 'discard') {
      return meta;
    }

    if (decision === 'ask') {
      meta.askRequired = true;
      return meta;
    }

    // auto: store into mid-term under key `${agent}.history:<timestamp>`
    const ts = Date.now();
    const key = `${agent}.history:${ts}`;
    const record = { agent, text, ts };
    await this.mid.set(key, record);
    await this.short.set(key, record);
    meta.storedMid = true;

    // decide whether to store in long-term (if configured)
    if (this.long) {
      // simple rule: if text length > 200 or contains 'architecture' or code fence -> store in long
      const shouldLong = text.length > 200 || /```[\s\S]*?```/.test(text) || /architecture|design|pattern|authentication|authorization/i.test(text);
      if (shouldLong) {
        await this.long.upsert(`${this.projectId}::${agent}::${ts}`, text);
        meta.storedLong = true;
      }
    }

    return meta;
  }

  async storeForced(agent: string, text: string, options: { storeLong?: boolean } = {}) {
    const ts = Date.now();
    const key = `${agent}.history:${ts}`;
    const record = { agent, text, ts };
    await this.mid.set(key, record);
    await this.short.set(key, record);
    let storedLong = false;
    if (this.long && options.storeLong !== false) {
      await this.long.upsert(`${this.projectId}::${agent}::${ts}`, text);
      storedLong = true;
    }
    return { key, storedMid: true, storedLong };
  }

  // convenience to fetch recent history keys for agent
  recent(agent: string, limit = 10) {
    const all = this.mid.keys().filter(k => k.startsWith(agent + '.history:')).sort().slice(-limit);
    return all.map(k => this.mid.get(k));
  }

  // assemble context keys (delegates to previous MemoryManager idea) - simple version
  async assembleContext(keys: string[], includeLong = false, relevanceQuery?: string, longLimit = 3) {
    const parts: string[] = [];
    for (const k of keys) {
      const v = this.short.get(k) ?? this.mid.get(k);
      if (v) parts.push(`=== ${k} ===\n${String(v)}`);
    }
    if (includeLong && this.long && relevanceQuery) {
      const hits = await this.long.search(relevanceQuery, longLimit);
      if (hits && hits.length) parts.push('=== Related from LongTerm ===\n' + hits.join('\n\n'));
    }
    return parts.join('\n\n');
  }
}
