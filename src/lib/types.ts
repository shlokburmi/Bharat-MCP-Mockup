/**
 * SHARED CONTRACT — owned jointly by Dev A (customer) and Dev B (operator).
 * Changes here go through a PR both devs review. Do not edit unilaterally.
 */

/** Category A = restaurant delivers with its own staff (no platform rider).
 *  Category B = platform partner rider handles delivery.
 *  The customer must never be able to tell which one they got. */
export type RestaurantCategory = "A" | "B";

export type FulfilmentMode = "delivery" | "pickup";

export type PaymentMethod = "upi" | "card" | "cod";

export type OrderStatus =
  // pre-payment
  | "created"
  | "payment_failed"
  | "expired"
  // paid, in flight
  | "paid"
  | "sent_to_restaurant"
  | "accepted"
  | "preparing"
  | "ready"
  // delivery leg (Cat A: restaurant staff, Cat B: partner rider)
  | "picked_up"
  | "out_for_delivery"
  // terminal
  | "delivered"
  | "collected" // pickup orders: customer collected it themselves
  | "rejected"
  | "cancelled";

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  /** paise. 24900 = ₹249 */
  price: number;
  veg: boolean;
  /** e.g. "Biryani", "Starters" */
  section: string;
  tags: string[];
  /** emoji stand-in for a photo — keeps the mock dependency-free */
  emoji: string;
  available: boolean;
  /** 0-5, one decimal */
  rating?: number;
  spicy?: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  category: RestaurantCategory;
  cuisines: string[];
  /** Bangalore locality, e.g. "Indiranagar" */
  area: string;
  address: string;
  /** owner's WhatsApp number — the magic-link identity for /restaurant */
  phone: string;
  rating: number;
  ratingCount: number;
  /** minutes */
  prepTimeMins: number;
  deliveryFee: number;
  /** paise */
  minOrder: number;
  /** localities this restaurant delivers to */
  deliversTo: string[];
  supportsPickup: boolean;
  emoji: string;
  /** true when the ops console has finished onboarding it */
  live: boolean;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicle: "bike" | "scooter" | "cycle";
  /** localities this rider covers */
  zone: string[];
  online: boolean;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  /** unit price in paise, snapshotted at order time */
  price: number;
  qty: number;
  emoji: string;
  veg: boolean;
  notes?: string;
}

export interface OrderEvent {
  status: OrderStatus;
  at: string; // ISO
  /** who moved it: helps the demo narrate itself */
  actor: "customer" | "system" | "restaurant" | "rider" | "ops";
  note?: string;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  /** full delivery address; empty for pickup orders */
  address: string;
  area: string;
  landmark?: string;
}

export interface OrderTotals {
  /** all paise */
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  platformFee: number;
  discount: number;
  total: number;
}

export interface Order {
  id: string;
  /** short human code shown to everyone, e.g. "BM-7241" */
  code: string;
  restaurantId: string;
  restaurantName: string;
  /** snapshotted so the operator UI never has to join */
  category: RestaurantCategory;
  mode: FulfilmentMode;
  items: OrderItem[];
  totals: OrderTotals;
  customer: CustomerDetails;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  /** mock Razorpay payment id, set on successful payment */
  paymentId?: string;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  /** reason the restaurant gave when rejecting */
  rejectionReason?: string;
  /** ISO. The dynamic link stops accepting payment after this. */
  payBy: string;
  createdAt: string;
  updatedAt: string;
  /** promised delivery/pickup time, set when the restaurant accepts */
  etaAt?: string;
  timeline: OrderEvent[];
  /** set when the assistant created it, for the demo narrative */
  source: "assistant" | "ops_test" | "direct";
}

/** What /api/restaurants?q= returns — the five cards the assistant shows. */
export interface SearchResult {
  restaurant: Restaurant;
  /** the matched dishes, best first */
  items: MenuItem[];
  /** why it matched, shown as a chip in the chat */
  matchReason: string;
}
