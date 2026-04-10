// Vercel KV wrapper that falls back to in-memory storage for local dev
// In production (Vercel), uses @vercel/kv. Locally, uses a JSON file or memory.

let kvClient = null;
let memoryStore = {};

async function getClient() {
  if (kvClient) return kvClient;
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const { kv } = await import("@vercel/kv");
    kvClient = kv;
    return kv;
  }
  return null;
}

export async function kvGet(key) {
  const client = await getClient();
  if (client) {
    return await client.get(key);
  }
  return memoryStore[key] ?? null;
}

export async function kvSet(key, value) {
  const client = await getClient();
  if (client) {
    return await client.set(key, value);
  }
  memoryStore[key] = value;
  return "OK";
}

export async function kvDel(key) {
  const client = await getClient();
  if (client) {
    return await client.del(key);
  }
  delete memoryStore[key];
  return 1;
}
