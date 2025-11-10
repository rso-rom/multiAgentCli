import { open, RootDatabase } from 'lmdb';
import path from 'path';
import fs from 'fs';

/**
 * LMDB-based memory store for short-term and mid-term memory
 * Fast, lightweight, and optionally persistent
 */
export class LMDBMemory {
  private db: RootDatabase;
  private dbPath: string;

  constructor(dbPath: string, persistent = false) {
    this.dbPath = dbPath;

    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Open LMDB database
    this.db = open({
      path: dbPath,
      compression: true,
      // If not persistent, use temporary storage
      noSync: !persistent
    });
  }

  /**
   * Set a key-value pair
   */
  async set(key: string, value: any): Promise<void> {
    await this.db.put(key, value);
  }

  /**
   * Get a value by key
   */
  async get(key: string): Promise<any> {
    return await this.db.get(key);
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    const val = await this.db.get(key);
    return val !== undefined;
  }

  /**
   * Delete a key
   */
  async delete(key: string): Promise<boolean> {
    return await this.db.remove(key);
  }

  /**
   * Get all keys
   */
  async keys(): Promise<string[]> {
    const keys: string[] = [];
    for await (const key of this.db.getKeys()) {
      keys.push(key as string);
    }
    return keys;
  }

  /**
   * Get all key-value pairs
   */
  async all(): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    for await (const { key, value } of this.db.getRange()) {
      result[key as string] = value;
    }
    return result;
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    await this.db.clearAsync();
  }

  /**
   * Close the database
   */
  async close(): Promise<void> {
    await this.db.close();
  }

  /**
   * Get database size info
   */
  async getSize(): Promise<number> {
    const keys = await this.keys();
    return keys.length;
  }
}
