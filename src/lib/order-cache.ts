/**
 * SHARED CONTRACT — the browser's copy of every order it has seen.
 *
 * The mock store lives in the Next server process, which is fine on one
 * laptop and useless on Vercel: each serverless invocation can land on a
 * different, freshly-booted instance whose store has no orders in it. That is
 * why a payment link generated in the chat used to 404 the moment it was
 * opened.
 *
 * So the browser keeps the durable copy. Every order that passes through
 * `src/lib/api.ts` is written here, and any read that comes back empty pushes
 * this cache back to the server (`POST /api/demo/hydrate`) before retrying.
 * localStorage is shared by every tab on the machine, so the restaurant and
 * rider tabs restore the customer's order just as well as the customer's own.
 */
import type { Order } from "./types";

const KEY = "bharat_mcp_orders_v1";
/** Orders older than this are dropped — a demo link from last week helps nobody. */
const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ORDERS = 80;

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    // Private-mode Safari and blocked third-party storage both throw here.
    return null;
  }
}

export function cachedOrders(): Order[] {
  const store = storage();
  if (!store) return [];
  try {
    const raw = store.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Order[];
    if (!Array.isArray(parsed)) return [];
    const cutoff = Date.now() - TTL_MS;
    return parsed.filter((o) => o?.id && Date.parse(o.updatedAt) > cutoff);
  } catch {
    return [];
  }
}

export function cachedOrder(id: string): Order | undefined {
  return cachedOrders().find((o) => o.id === id);
}

/** Last write wins per id, keyed on `updatedAt` so a stale poll never
 *  overwrites a newer state the same tab already knows about. */
export function rememberOrders(orders: Order[]): void {
  const store = storage();
  if (!store || !orders.length) return;
  const byId = new Map(cachedOrders().map((o) => [o.id, o]));
  for (const order of orders) {
    const existing = byId.get(order.id);
    if (existing && Date.parse(existing.updatedAt) > Date.parse(order.updatedAt)) continue;
    byId.set(order.id, order);
  }
  const next = [...byId.values()]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, MAX_ORDERS);
  try {
    store.setItem(KEY, JSON.stringify(next));
  } catch {
    // Quota exceeded — the server copy is still authoritative this session.
  }
}

export function clearOrderCache(): void {
  storage()?.removeItem(KEY);
}
