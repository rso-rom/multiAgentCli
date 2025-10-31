import { QdrantClient } from '@qdrant/js-client-rest';

export class QdrantHelper {
  private readonly client: QdrantClient;
  private readonly collection: string;

  constructor(url = process.env.QDRANT_URL || 'http://localhost:6333', collection = 'codeflow_memory') {
    this.collection = collection;
    this.client = new QdrantClient({ url });
  }

  async ensureCollection(vectorSize = 384) {
    const collections = await this.client.getCollections();
    const exists = collections.collections?.some((c) => c.name === this.collection);
    if (!exists) {
      await this.client.createCollection(this.collection, {
        vectors: { size: vectorSize, distance: 'Cosine' },
      });
    }
  }

  async upsert(id: string, text: string) {
    await this.ensureCollection();
    const vector = await createEmbedding(text);
    await this.client.upsert(this.collection, {
      points: [{ id, vector, payload: { text } }],
    });
  }

  async search(query: string, limit = 5) {
    await this.ensureCollection();
    const vector = await createEmbedding(query);
    const res = await this.client.search(this.collection, {
      vector,
      limit,
      with_payload: true,
    });
    return res.map((r) => String(r.payload?.text ?? ''));
  }
}

export async function createEmbedding(text: string, dim = 384): Promise<number[]> {
  const vector = new Array<number>(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    vector[i % dim] += text.charCodeAt(i) / 255;
  }
  // normalize to unit length
  const norm = Math.sqrt(vector.reduce((acc, v) => acc + v * v, 0)) || 1;
  return vector.map((v) => v / norm);
}
