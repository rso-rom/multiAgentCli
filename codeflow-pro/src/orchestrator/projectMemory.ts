import path from 'path';
import fs from 'fs';
import { createShortTermLMDB, QdrantWrapper } from './memory-factory';

export class ProjectMemory {
  shortDb: any;
  qdrant?: QdrantWrapper;
  projectDir: string;

  constructor(projectDir: string, useQdrant = false) {
    this.projectDir = projectDir;
    const shortPath = path.join(projectDir, 'short.lmdb');
    if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });
    this.shortDb = createShortTermLMDB(shortPath);
    if (useQdrant) this.qdrant = new QdrantWrapper(process.env.QDRANT_URL, path.basename(projectDir) + '_long');
  }

  async set(key: string, val: any) {
    await this.shortDb.put(key, val);
  }
  get(key: string) { return this.shortDb.get(key); }
  all(): Record<string, any> {
    const out: Record<string, any> = {};
    for (const [k, v] of this.shortDb.getRange()) out[k] = v;
    return out;
  }
}
