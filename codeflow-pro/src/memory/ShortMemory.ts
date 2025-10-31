// src/memory/ShortMemory.ts
export type JSONValue = string | number | boolean | null | { [k: string]: JSONValue } | JSONValue[];

/**
 * Short-term memory: RAM-only Map (S1).
 * Volatile: lÃÂ¶schen beim Beenden der CLI.
 */
export class ShortMemory {
  private map: Map<string, JSONValue>;

  constructor() {
    this.map = new Map();
  }

  async set(key: string, value: JSONValue) {
    this.map.set(key, value);
  }

  get<T = any>(key: string): T | undefined {
    return this.map.get(key) as T | undefined;
  }

  all(): Record<string, JSONValue> {
    return Object.fromEntries(this.map.entries());
  }

  clear() {
    this.map.clear();
  }

  has(key: string) {
    return this.map.has(key);
  }

  remove(key: string) {
    this.map.delete(key);
  }
}
