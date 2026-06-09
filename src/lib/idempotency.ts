type Entry = { status: number; body: unknown; expiresAt: number };

const store = new Map<string, Entry>();
const TTL_MS = 5 * 60 * 1000; // 5 minutos

export function checkIdempotency(key: string): Entry | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(key);
    return null;
  }
  return entry;
}

export function storeIdempotency(key: string, status: number, body: unknown): void {
  if (store.size >= 5000) {
    const now = Date.now();
    for (const [k, v] of store) {
      if (v.expiresAt < now) store.delete(k);
      if (store.size < 4000) break;
    }
  }
  store.set(key, { status, body, expiresAt: Date.now() + TTL_MS });
}

export function buildStoreKey(usuarioId: string, clientKey: string): string {
  return `${usuarioId}:${clientKey}`;
}
