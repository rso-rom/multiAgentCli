import path from 'path';
import { open, RootDatabase } from 'lmdb';
import { QdrantClient } from '@qdrant/js-client-rest';

export function createShortTermLMDB(dbPath: string) {
  const db = open({
    path: dbPath,
    compression: true
  });
  return db; // basic LMDB root DB object; methods: get, put, remove, getRange
}

export class QdrantWrapper {
  client: QdrantClient;
  collection: string;
  constructor(url = process.env.QDRANT_URL || 'http://localhost:6333', collection='global') {
    this.client = new QdrantClient({ url });
    this.collection = collection;
  }

  async ensureCollection(vectorSize = 1536) {
    const cols = await this.client.getCollections();
    if (!cols.collections.some(c => c.name === this.collection)) {
      await this.client.createCollection(this.collection, { vectors: { size: vectorSize, distance: 'Cosine' } });
    }
  }

  async upsert(id: string, vector: number[], payload: any) {
    await this.client.upsert(this.collection, { points: [{ id, vector, payload }] });
  }

  async search(queryVec: number[], limit=5) {
    const res = await this.client.search(this.collection, { vector: queryVec, limit });
    return res;
  }
}
