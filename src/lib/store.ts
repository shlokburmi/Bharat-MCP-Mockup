/**
 * SHARED CONTRACT — server-side mock datastore.
 *
 * Lives in the Next server process, so every browser tab on the laptop reads
 * the same orders. That is how the demo stays consistent across the customer
 * link, the restaurant screen and the rider screen open side by side: the
 * clients poll `/api/orders?since=<version>` rather than syncing localStorage.
 *
 * Swapping this for a real backend means replacing this file and leaving the
 * route handlers' shapes alone.
 */
import "server-only";
import { applyTransition, isTerminal } from "./state-machine";
import { FEES, MENU, RESTAURANTS, RIDERS } from "./seed";
import type {
  CoverageReport,
  CreateOrderInput,
  CreateRestaurantInput,
  NewMenuItem,
} from "./store-input";
import type {
  FulfilmentMode,
  MenuItem,
  Order,
  OrderItem,
  OrderStatus,
  OrderTotals,
  PaymentMethod,
  Restaurant,
  Rider,
  SearchResult,
} from "./types";

/** How long a dynamic link accepts payment. Surfaced to the customer as a
 *  visible countdown on /order/[id]. */
export const PAYMENT_WINDOW_MINS = 30;

interface Db {
  orders: Map<string, Order>;
  restaurants: Restaurant[];
  menu: MenuItem[];
  riders: Rider[];
  /** bumped on every write; clients poll against it */
  version: number;
  seq: number;
}

const globalForDb = globalThis as unknown as { __bharatMcpDb?: Db };

function freshDb(): Db {
  return {
    orders: new Map(),
    restaurants: structuredClone(RESTAURANTS),
    menu: structuredClone(MENU),
    riders: structuredClone(RIDERS),
    version: 1,
    seq: 1000,
  };
}

function db(): Db {
  if (!globalForDb.__bharatMcpDb) globalForDb.__bharatMcpDb = freshDb();
  return globalForDb.__bharatMcpDb;
}

function touch(): number {
  const d = db();
  d.version += 1;
  return d.version;
}

export function currentVersion(): number {
  return db().version;
}

/** Wipes every order and restores seed restaurants/menu. Used by the demo
 *  reset button in Phase 5 and by /api/demo/reset. */
export function resetDb(): void {
  globalForDb.__bharatMcpDb = freshDb();
}

// ---------------------------------------------------------------- restaurants

export function listRestaurants(opts: { area?: string; live?: boolean } = {}): Restaurant[] {
  return db().restaurants.filter((r) => {
    if (opts.live !== undefined && r.live !== opts.live) return false;
    if (opts.area && !r.deliversTo.includes(opts.area) && r.area !== opts.area) return false;
    return true;
  });
}

export function getRestaurant(id: string): Restaurant | undefined {
  return db().restaurants.find((r) => r.id === id);
}

export function getMenu(restaurantId: string): MenuItem[] {
  return db().menu.filter((m) => m.restaurantId === restaurantId);
}

export function getMenuItem(id: string): MenuItem | undefined {
  return db().menu.find((m) => m.id === id);
}

const STOPWORDS = new Set([
  "i", "me", "my", "want", "some", "a", "an", "the", "for", "in", "near", "at",
  "order", "get", "find", "good", "best", "please", "from", "to", "and", "with",
  "something", "food", "delivery", "deliver", "hungry", "craving", "need", "of",
]);

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function scoreItem(item: MenuItem, tokens: string[]): number {
  if (!item.available) return 0;
  const hay = `${item.name} ${item.description} ${item.tags.join(" ")} ${item.section}`.toLowerCase();
  let score = 0;
  for (const t of tokens) {
    if (item.name.toLowerCase().includes(t)) score += 10;
    else if (item.tags.some((tag) => tag.includes(t))) score += 6;
    else if (hay.includes(t)) score += 3;
  }
  if (score > 0) score += (item.rating ?? 4) * 0.5;
  return score;
}

/** Powers the assistant's "here are five places" moment. Groups matched dishes
 *  under their restaurant and returns the best `limit` restaurants. */
export function search(query: string, opts: { area?: string; limit?: number } = {}): SearchResult[] {
  const tokens = tokenize(query);
  const pool = listRestaurants({ live: true, area: opts.area });
  if (!tokens.length) return topRestaurants(opts);

  const ranked: { result: SearchResult; score: number }[] = [];
  for (const restaurant of pool) {
    const scored = getMenu(restaurant.id)
      .map((item) => ({ item, score: scoreItem(item, tokens) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    const cuisineHit = tokens.some(
      (t) =>
        restaurant.cuisines.some((c) => c.toLowerCase().includes(t)) ||
        restaurant.name.toLowerCase().includes(t),
    );
    if (!scored.length && !cuisineHit) continue;

    const items = scored.length
      ? scored.slice(0, 3).map((s) => s.item)
      : getMenu(restaurant.id).filter((m) => m.available).slice(0, 3);

    ranked.push({
      result: {
        restaurant,
        items,
        matchReason: scored.length
          ? `Matches "${scored[0].item.name}"`
          : `${restaurant.cuisines[0]} · ${restaurant.rating}★`,
      },
      score:
        scored.reduce((sum, s) => sum + s.score, 0) + (cuisineHit ? 8 : 0) + restaurant.rating,
    });
  }

  return ranked
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.limit ?? 5)
    .map((r) => r.result);
}

/** No-query browse, used when the assistant is asked "what's good nearby". */
export function topRestaurants(opts: { area?: string; limit?: number } = {}): SearchResult[] {
  return listRestaurants({ live: true, area: opts.area })
    .slice()
    .sort((a, b) => b.rating - a.rating)
    .slice(0, opts.limit ?? 5)
    .map((restaurant) => ({
      restaurant,
      items: getMenu(restaurant.id).filter((m) => m.available).slice(0, 3),
      matchReason: `${restaurant.rating}★ · ${restaurant.cuisines[0]}`,
    }));
}

export function listRiders(): Rider[] {
  return db().riders;
}

// --------------------------------------------------------------------- orders

export function computeTotals(
  items: OrderItem[],
  restaurant: Restaurant,
  mode: FulfilmentMode,
): OrderTotals {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const deliveryFee = mode === "pickup" ? 0 : restaurant.deliveryFee;
  const taxes = Math.round(subtotal * FEES.taxRate);
  const platformFee = FEES.platformFee;
  const discount = 0;
  return {
    subtotal,
    deliveryFee,
    taxes,
    platformFee,
    discount,
    total: subtotal + deliveryFee + taxes + platformFee - discount,
  };
}

function nextCode(): string {
  const d = db();
  d.seq += 1;
  return `BM-${d.seq}`;
}

export class StoreError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "StoreError";
    this.status = status;
  }
}

export type { CoverageReport, CreateOrderInput, CreateRestaurantInput, NewMenuItem };

export function createOrder(input: CreateOrderInput): Order {
  const restaurant = getRestaurant(input.restaurantId);
  if (!restaurant) throw new StoreError("Unknown restaurant", 404);
  if (input.mode === "pickup" && !restaurant.supportsPickup) {
    throw new StoreError(`${restaurant.name} does not offer pickup`, 400);
  }
  if (!input.items.length) throw new StoreError("Order has no items", 400);

  const items: OrderItem[] = input.items.map((line) => {
    const menuItem = getMenuItem(line.menuItemId);
    if (!menuItem) throw new StoreError(`Unknown menu item ${line.menuItemId}`, 404);
    if (menuItem.restaurantId !== restaurant.id) {
      throw new StoreError("Items must come from a single restaurant", 400);
    }
    if (!menuItem.available) throw new StoreError(`${menuItem.name} is sold out`, 409);
    return {
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      qty: Math.max(1, Math.min(20, Math.round(line.qty))),
      emoji: menuItem.emoji,
      veg: menuItem.veg,
      notes: line.notes,
    };
  });

  const totals = computeTotals(items, restaurant, input.mode);
  if (totals.subtotal < restaurant.minOrder) {
    throw new StoreError(
      `Minimum order for ${restaurant.name} is ₹${Math.round(restaurant.minOrder / 100)}`,
      400,
    );
  }

  const now = new Date();
  const id = `ord_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
  const order: Order = {
    id,
    code: nextCode(),
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    category: restaurant.category,
    mode: input.mode,
    items,
    totals,
    customer: input.customer,
    status: "created",
    payBy: new Date(now.getTime() + PAYMENT_WINDOW_MINS * 60_000).toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    timeline: [{ status: "created", at: now.toISOString(), actor: "customer", note: "Order link generated" }],
    source: input.source ?? "assistant",
  };

  db().orders.set(id, order);
  touch();
  return order;
}

/** Lazily expires unpaid links whose window has closed. Called on every read. */
function withExpiry(order: Order): Order {
  const unpaid = order.status === "created" || order.status === "payment_failed";
  if (!unpaid || Date.now() <= Date.parse(order.payBy)) return order;
  const expired = applyTransition(order, "expired", {
    actor: "system",
    note: "Payment window closed",
  });
  db().orders.set(expired.id, expired);
  touch();
  return expired;
}

export function getOrder(id: string): Order | undefined {
  const order = db().orders.get(id);
  return order ? withExpiry(order) : undefined;
}

export function listOrders(
  opts: { restaurantId?: string; riderId?: string; status?: OrderStatus[]; active?: boolean } = {},
): Order[] {
  return [...db().orders.values()]
    .map(withExpiry)
    .filter((o) => {
      if (opts.restaurantId && o.restaurantId !== opts.restaurantId) return false;
      if (opts.riderId && o.riderId !== opts.riderId) return false;
      if (opts.status && !opts.status.includes(o.status)) return false;
      if (opts.active && isTerminal(o.status)) return false;
      return true;
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function save(order: Order): Order {
  db().orders.set(order.id, order);
  touch();
  return order;
}

/** Generic transition entry point, used by every surface. */
export function transitionOrder(
  id: string,
  to: OrderStatus,
  opts: { actor: "customer" | "system" | "restaurant" | "rider" | "ops"; note?: string; patch?: Partial<Order> },
): Order {
  const order = getOrder(id);
  if (!order) throw new StoreError("Order not found", 404);
  return save(applyTransition(order, to, opts));
}

/** Mock Razorpay. `outcome` lets the customer UI demo a failed payment. */
export function payOrder(
  id: string,
  method: PaymentMethod,
  outcome: "success" | "failure" = "success",
): Order {
  const order = getOrder(id);
  if (!order) throw new StoreError("Order not found", 404);
  if (order.status === "expired") throw new StoreError("This payment link has expired", 410);
  if (order.status !== "created" && order.status !== "payment_failed") {
    throw new StoreError("This order has already been paid for", 409);
  }

  if (outcome === "failure") {
    return save(
      applyTransition(order, "payment_failed", {
        actor: "system",
        note: "Bank declined the transaction",
      }),
    );
  }

  const paid = applyTransition(order, "paid", {
    actor: "customer",
    note: method === "cod" ? "Cash on delivery confirmed" : `Paid via ${method.toUpperCase()}`,
    patch: {
      paymentMethod: method,
      paymentId: `pay_mock_${Math.random().toString(36).slice(2, 12)}`,
    },
  });

  // The real system would fire a WhatsApp message here; the mock forwards
  // straight to the restaurant so Dev B's inbox lights up immediately.
  const sent = applyTransition(paid, "sent_to_restaurant", {
    actor: "system",
    note: "WhatsApp sent to restaurant",
  });
  return save(sent);
}

/** Assigns a partner rider to a Category B order. Picks the first online rider
 *  covering the customer's area, else any online rider. */
export function assignRider(id: string, riderId?: string): Order {
  const order = getOrder(id);
  if (!order) throw new StoreError("Order not found", 404);
  const riders = listRiders();
  // Riders already carrying a live order are picked last, so a demo with
  // several orders in flight spreads them across the partner fleet.
  const busy = new Set(
    listOrders()
      .filter((o) => o.riderId && !isTerminal(o.status) && o.status !== "created")
      .map((o) => o.riderId as string),
  );
  const free = riders.filter((r) => r.online && !busy.has(r.id));
  const rider = riderId
    ? riders.find((r) => r.id === riderId)
    : free.find((r) => r.zone.includes(order.customer.area)) ??
      free[0] ??
      riders.find((r) => r.online && r.zone.includes(order.customer.area)) ??
      riders.find((r) => r.online);
  if (!rider) throw new StoreError("No rider available", 409);
  return save({
    ...order,
    riderId: rider.id,
    riderName: rider.name,
    riderPhone: rider.phone,
    updatedAt: new Date().toISOString(),
  });
}

export function setMenuItemAvailability(itemId: string, available: boolean): MenuItem {
  const item = db().menu.find((m) => m.id === itemId);
  if (!item) throw new StoreError("Unknown menu item", 404);
  item.available = available;
  touch();
  return item;
}

// --------------------------------------------------------------- onboarding
// Everything below backs the ops console: onboarding a restaurant, building
// its menu and flipping it live.

export function createRestaurant(input: CreateRestaurantInput): Restaurant {
  if (!input.name.trim()) throw new StoreError("Name is required", 400);
  if (!input.deliversTo.length) throw new StoreError("Pick at least one delivery area", 400);
  const restaurant: Restaurant = {
    id: `r_${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 18)}_${Math.random()
      .toString(36)
      .slice(2, 5)}`,
    name: input.name.trim(),
    category: input.category,
    cuisines: input.cuisines.length ? input.cuisines : ["Indian"],
    area: input.area,
    address: input.address,
    phone: input.phone,
    rating: 0,
    ratingCount: 0,
    prepTimeMins: input.prepTimeMins,
    deliveryFee: input.deliveryFee,
    minOrder: input.minOrder,
    deliversTo: input.deliversTo,
    supportsPickup: input.supportsPickup,
    emoji: input.emoji || "🍽️",
    // A new restaurant stays dark until it has a menu — see `setRestaurantLive`.
    live: false,
  };
  db().restaurants.push(restaurant);
  touch();
  return restaurant;
}

export function updateRestaurant(id: string, patch: Partial<Restaurant>): Restaurant {
  const restaurant = getRestaurant(id);
  if (!restaurant) throw new StoreError("Unknown restaurant", 404);
  Object.assign(restaurant, patch, { id: restaurant.id });
  touch();
  return restaurant;
}

/** Going live needs a menu — an empty restaurant in search results is worse
 *  than no restaurant at all. */
export function setRestaurantLive(id: string, live: boolean): Restaurant {
  const restaurant = getRestaurant(id);
  if (!restaurant) throw new StoreError("Unknown restaurant", 404);
  if (live && !getMenu(id).some((m) => m.available)) {
    throw new StoreError("Add at least one available menu item before going live", 400);
  }
  if (live && restaurant.category === "B" && !restaurant.deliversTo.length) {
    throw new StoreError("Category B restaurants need at least one covered area", 400);
  }
  restaurant.live = live;
  touch();
  return restaurant;
}

export function addMenuItems(restaurantId: string, incoming: NewMenuItem[]): MenuItem[] {
  if (!getRestaurant(restaurantId)) throw new StoreError("Unknown restaurant", 404);
  const d = db();
  const created = incoming.map((item, i) => ({
    ...item,
    id: `${restaurantId}_m${d.menu.filter((m) => m.restaurantId === restaurantId).length + i + 1}_${Math.random()
      .toString(36)
      .slice(2, 5)}`,
    restaurantId,
  }));
  d.menu.push(...created);
  touch();
  return created;
}

export function updateMenuItem(id: string, patch: Partial<MenuItem>): MenuItem {
  const item = db().menu.find((m) => m.id === id);
  if (!item) throw new StoreError("Unknown menu item", 404);
  Object.assign(item, patch, { id: item.id, restaurantId: item.restaurantId });
  touch();
  return item;
}

export function deleteMenuItem(id: string): void {
  const d = db();
  const i = d.menu.findIndex((m) => m.id === id);
  if (i === -1) throw new StoreError("Unknown menu item", 404);
  d.menu.splice(i, 1);
  touch();
}

export function getRider(id: string): Rider | undefined {
  return db().riders.find((r) => r.id === id);
}

export function setRiderOnline(id: string, online: boolean): Rider {
  const rider = getRider(id);
  if (!rider) throw new StoreError("Unknown rider", 404);
  rider.online = online;
  touch();
  return rider;
}

/** Category B needs a partner rider covering the area, so ops can see the gap
 *  before switching a restaurant over. */
export function coverageFor(restaurantId: string): CoverageReport[] {
  const restaurant = getRestaurant(restaurantId);
  if (!restaurant) throw new StoreError("Unknown restaurant", 404);
  return restaurant.deliversTo.map((area) => {
    const riders = listRiders().filter((r) => r.online && r.zone.includes(area));
    return { area, riders: riders.map((r) => r.name), covered: riders.length > 0 };
  });
}
