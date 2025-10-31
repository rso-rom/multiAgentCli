// src/memory/MidMemory.ts
import { open, RootDatabase } from 'lmdb';
import path from 'path';
import fs from 'fs';
import { JSONValue } from './ShortMemory';

/**
 * Mid-term memory: per-project LMDB persistent store.
 * Used for project-scoped storage (config, decisions, code snippets).
 */
export class MidMemory {
  private db: RootDatabase<any>;
  private indexKeyPrefix = '__meta:';

  constructor(lmdbPath: string) {
    if (!fs.existsSync(path.dirname(lmdbPath))) fs.mkdirSync(path.dirname(lmdbPath), { recursive: true });
    this.db = open({ path: lmdbPath, compression: true });
  }

  async set(key: string, value: JSONValue, ttlSeconds?: number) {
    await this.db.put(key, value);
    if (ttlSeconds && ttlSeconds > 0) {
      const meta = { expiresAt: Date.now() + ttlSeconds * 1000 };
      await this.db.put(this.indexKeyPrefix + key, meta);
    }
  }

  get<T = any>(key: string): T | undefined {
    return this.db.get(key);
  }

  remove(key: string) {
    return this.db.remove(key);
  }

  all(): Record<string, JSONValue> {
    const out: Record<string, JSONValue> = {};
    for (const [k, v] of this.db.getRange()) {
      if (!k.startsWith(this.indexKeyPrefix)) out[k] = v;
    }
    return out;
  }

  async sweepExpired() {
    const now = Date.now();
    const toRemove: string[] = [];
    for (const [k, v] of this.db.getRange(this.indexKeyPrefix)) {
      const key = k.replace(this.indexKeyPrefix, '');
      if (v?.expiresAt && v.expiresAt < now) toRemove.push(key);
    }
    for (const k of toRemove) {
      await this.db.remove(k);
      await this.db.remove(this.indexKeyPrefix + k);
    }
    return toRemove.length;
  }

  keys(): string[] {
    const ks: string[] = [];
    for (const [k] of this.db.getRange()) if (!k.startsWith(this.indexKeyPrefix)) ks.push(k);
    return ks;
  }
}
