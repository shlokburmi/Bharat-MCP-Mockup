/**
 * SHARED CONTRACT — typed browser client for the mock API.
 * UI components call these, never `fetch` directly, so swapping the mock for a
 * real backend is a change in this file plus the route handlers.
 */
import type {
  MenuItem,
  Order,
  OrderStatus,
  PaymentMethod,
  Restaurant,
  Rider,
  SearchResult,
} from "./types";
import type {
  CoverageReport,
  CreateOrderInput,
  CreateRestaurantInput,
  NewMenuItem,
} from "./store-input";
import { cachedOrder, cachedOrders, clearOrderCache, rememberOrders } from "./order-cache";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(body.error ?? `Request failed (${res.status})`, res.status);
  }
  return (await res.json()) as T;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function searchRestaurants(
  query: string,
  opts: { area?: string; limit?: number } = {},
): Promise<SearchResult[]> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (opts.area) params.set("area", opts.area);
  if (opts.limit) params.set("limit", String(opts.limit));
  const data = await json<{ results: SearchResult[] }>(
    await fetch(`/api/restaurants?${params}`, { cache: "no-store" }),
  );
  return data.results;
}

export async function fetchRestaurant(
  id: string,
): Promise<{ restaurant: Restaurant; menu: MenuItem[] }> {
  return json(await fetch(`/api/restaurants/${id}`, { cache: "no-store" }));
}

/**
 * Pushes the browser's cached orders back into whichever server instance
 * answered. Deployed serverless, the store a request lands on may never have
 * seen the order being asked about — see `order-cache.ts`.
 */
async function hydrateServer(): Promise<boolean> {
  const orders = cachedOrders();
  if (!orders.length) return false;
  const res = await fetch("/api/demo/hydrate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ orders }),
  });
  if (!res.ok) return false;
  const { restored } = (await res.json()) as { restored: number };
  return restored > 0;
}

/** Runs `attempt`, and on a 404 restores the local order cache and tries once
 *  more before giving up. */
async function withRecovery<T>(attempt: () => Promise<T>): Promise<T> {
  try {
    return await attempt();
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 404) throw err;
    if (!(await hydrateServer())) throw err;
    return attempt();
  }
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const data = await json<{ order: Order }>(
    await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
  rememberOrders([data.order]);
  return data.order;
}

export async function fetchOrder(id: string): Promise<Order> {
  try {
    const order = await withRecovery(async () => {
      const data = await json<{ order: Order }>(
        await fetch(`/api/orders/${id}`, { cache: "no-store" }),
      );
      return data.order;
    });
    rememberOrders([order]);
    return order;
  } catch (err) {
    // Last resort: show the customer the copy this browser is holding rather
    // than a dead link. Any action they take re-hydrates the server first.
    const fallback = cachedOrder(id);
    if (fallback) return fallback;
    throw err;
  }
}

export async function fetchOrders(
  opts: { restaurantId?: string; riderId?: string; phone?: string; active?: boolean } = {},
): Promise<Order[]> {
  const params = new URLSearchParams();
  if (opts.restaurantId) params.set("restaurantId", opts.restaurantId);
  if (opts.riderId) params.set("riderId", opts.riderId);
  if (opts.phone) params.set("phone", opts.phone);
  if (opts.active) params.set("active", "1");

  const load = async () => {
    const data = await json<{ orders: Order[] }>(
      await fetch(`/api/orders?${params}`, { cache: "no-store" }),
    );
    return data.orders;
  };

  let orders = await load();
  // A list can't 404, it just comes back short — so compare against what this
  // browser knows should be in it before trusting an empty inbox.
  if (missingFromCache(orders, opts) && (await hydrateServer())) orders = await load();
  rememberOrders(orders);
  return orders;
}

const last10 = (phone: string) => phone.replace(/\D/g, "").slice(-10);

function missingFromCache(
  orders: Order[],
  opts: { restaurantId?: string; riderId?: string; phone?: string },
): boolean {
  const seen = new Set(orders.map((o) => o.id));
  return cachedOrders().some((o) => {
    if (seen.has(o.id)) return false;
    if (opts.restaurantId && o.restaurantId !== opts.restaurantId) return false;
    if (opts.riderId && o.riderId !== opts.riderId) return false;
    if (opts.phone && last10(o.customer.phone) !== last10(opts.phone)) return false;
    return true;
  });
}

export async function payOrder(
  id: string,
  method: PaymentMethod,
  outcome: "success" | "failure" = "success",
  detail?: string,
): Promise<Order> {
  const order = await withRecovery(async () => {
    const data = await json<{ order: Order }>(
      await fetch(`/api/orders/${id}/pay`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ method, outcome, detail }),
      }),
    );
    return data.order;
  });
  rememberOrders([order]);
  return order;
}

export interface TransitionInput {
  /** omit to assign a rider or set an ETA without moving the order */
  status?: OrderStatus;
  actor?: "customer" | "system" | "restaurant" | "rider" | "ops";
  note?: string;
  rejectionReason?: string;
  etaMins?: number;
  assignRiderId?: string;
}

export async function transitionOrder(id: string, input: TransitionInput): Promise<Order> {
  const order = await withRecovery(async () => {
    const data = await json<{ order: Order }>(
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
    return data.order;
  });
  rememberOrders([order]);
  return order;
}

/** Demo helper — pushes an order one step along its happy path. */
export async function advanceOrder(orderId: string): Promise<Order> {
  const order = await withRecovery(async () => {
    const data = await json<{ order: Order }>(
      await fetch("/api/demo/advance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId }),
      }),
    );
    return data.order;
  });
  rememberOrders([order]);
  return order;
}

export async function resetDemo(): Promise<void> {
  // Clear the browser copy too, or the next poll would hydrate every order
  // straight back into the store it just wiped.
  clearOrderCache();
  await json(await fetch("/api/demo/reset", { method: "POST" }));
}

// ------------------------------------------------------------ operator side

export async function fetchAllRestaurants(): Promise<Restaurant[]> {
  const data = await json<{ restaurants: Restaurant[] }>(
    await fetch("/api/restaurants?all=1", { cache: "no-store" }),
  );
  return data.restaurants;
}

export async function createRestaurant(input: CreateRestaurantInput): Promise<Restaurant> {
  const data = await json<{ restaurant: Restaurant }>(
    await fetch("/api/restaurants", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
  return data.restaurant;
}

export async function updateRestaurant(
  id: string,
  patch: Partial<Restaurant>,
): Promise<Restaurant> {
  const data = await json<{ restaurant: Restaurant }>(
    await fetch(`/api/restaurants/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    }),
  );
  return data.restaurant;
}

export async function fetchMenu(restaurantId: string): Promise<MenuItem[]> {
  const data = await json<{ menu: MenuItem[] }>(
    await fetch(`/api/restaurants/${restaurantId}/menu`, { cache: "no-store" }),
  );
  return data.menu;
}

export async function addMenuItems(
  restaurantId: string,
  items: NewMenuItem[],
): Promise<MenuItem[]> {
  const data = await json<{ items: MenuItem[] }>(
    await fetch(`/api/restaurants/${restaurantId}/menu`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items }),
    }),
  );
  return data.items;
}

export async function updateMenuItem(id: string, patch: Partial<MenuItem>): Promise<MenuItem> {
  const data = await json<{ item: MenuItem }>(
    await fetch(`/api/menu/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    }),
  );
  return data.item;
}

export async function deleteMenuItem(id: string): Promise<void> {
  await json(await fetch(`/api/menu/${id}`, { method: "DELETE" }));
}

export async function fetchCoverage(restaurantId: string): Promise<CoverageReport[]> {
  const data = await json<{ coverage: CoverageReport[] }>(
    await fetch(`/api/restaurants/${restaurantId}/coverage`, { cache: "no-store" }),
  );
  return data.coverage;
}

export async function fetchRiders(): Promise<Rider[]> {
  const data = await json<{ riders: Rider[] }>(await fetch("/api/riders", { cache: "no-store" }));
  return data.riders;
}

export async function setRiderOnline(id: string, online: boolean): Promise<Rider> {
  const data = await json<{ rider: Rider }>(
    await fetch(`/api/riders/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ online }),
    }),
  );
  return data.rider;
}

export async function runTestOrder(
  restaurantId: string,
  mode: "delivery" | "pickup" = "delivery",
): Promise<Order> {
  const data = await json<{ order: Order }>(
    await fetch("/api/demo/test-order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ restaurantId, mode }),
    }),
  );
  rememberOrders([data.order]);
  return data.order;
}

/** Phase 5 demo seeding — plants one order at each stage of the journey. */
export async function seedScenario(): Promise<{ created: string[]; total: number }> {
  return json(await fetch("/api/demo/seed-scenario", { method: "POST" }));
}
