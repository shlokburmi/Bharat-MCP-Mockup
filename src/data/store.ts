"use client";

import { Order, Restaurant, Rider, OrderStatus, STATUS_TRANSITIONS } from "@/types";
import { orders as seedOrders, restaurants as seedRestaurants, riders as seedRiders } from "./mock-data";

type Listener = () => void;

class MockStore {
  private orders: Order[];
  private restaurants: Restaurant[];
  private riders: Rider[];
  private listeners: Set<Listener> = new Set();
  private storageKey = "bharat-mcp-store";

  constructor() {
    this.orders = [...seedOrders];
    this.restaurants = [...seedRestaurants];
    this.riders = [...seedRiders];
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.orders) this.orders = data.orders;
        if (data.restaurants) this.restaurants = data.restaurants;
        if (data.riders) this.riders = data.riders;
      }
    } catch {
      // ignore
    }
  }

  private persist() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({
          orders: this.orders,
          restaurants: this.restaurants,
          riders: this.riders,
        })
      );
    } catch {
      // ignore
    }
    this.notify();
    this.broadcastCrossTab();
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  private broadcastCrossTab() {
    if (typeof window === "undefined") return;
    const channel = new BroadcastChannel("bharat-mcp-sync");
    channel.postMessage({ type: "store-update", timestamp: Date.now() });
    channel.close();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  initCrossTabSync() {
    if (typeof window === "undefined") return () => {};
    const channel = new BroadcastChannel("bharat-mcp-sync");
    const handler = () => {
      this.loadFromStorage();
      this.notify();
    };
    channel.addEventListener("message", handler);
    return () => {
      channel.removeEventListener("message", handler);
      channel.close();
    };
  }

  // Orders
  getOrders(): Order[] {
    return [...this.orders];
  }

  getOrdersByRestaurant(restaurantId: string): Order[] {
    return this.orders.filter((o) => o.restaurantId === restaurantId);
  }

  getOrdersByRider(riderId: string): Order[] {
    return this.orders.filter((o) => o.riderId === riderId);
  }

  getOrder(id: string): Order | undefined {
    return this.orders.find((o) => o.id === id);
  }

  updateOrderStatus(orderId: string, newStatus: OrderStatus, extra?: Partial<Order>): boolean {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return false;

    const allowed = STATUS_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) return false;

    const now = new Date().toISOString();
    order.status = newStatus;

    const timestampMap: Partial<Record<OrderStatus, keyof Order>> = {
      accepted: "acceptedAt",
      rejected: "rejectedAt",
      preparing: "preparingAt",
      ready: "readyAt",
      picked_up: "pickedUpAt",
      out_for_delivery: "outForDeliveryAt",
      delivered: "deliveredAt",
    };

    const tsKey = timestampMap[newStatus];
    if (tsKey) {
      (order as unknown as Record<string, unknown>)[tsKey] = now;
    }

    if (extra) {
      Object.assign(order, extra);
    }

    this.persist();
    return true;
  }

  addOrder(order: Order) {
    this.orders.unshift(order);
    this.persist();
  }

  // Restaurants
  getRestaurants(): Restaurant[] {
    return [...this.restaurants];
  }

  getRestaurant(id: string): Restaurant | undefined {
    return this.restaurants.find((r) => r.id === id);
  }

  getRestaurantByWhatsapp(phone: string): Restaurant | undefined {
    return this.restaurants.find((r) => r.whatsappNumber === phone);
  }

  addRestaurant(restaurant: Restaurant) {
    this.restaurants.push(restaurant);
    this.persist();
  }

  updateRestaurant(id: string, updates: Partial<Restaurant>) {
    const idx = this.restaurants.findIndex((r) => r.id === id);
    if (idx === -1) return;
    this.restaurants[idx] = { ...this.restaurants[idx], ...updates };
    this.persist();
  }

  // Riders
  getRiders(): Rider[] {
    return [...this.riders];
  }

  getRider(id: string): Rider | undefined {
    return this.riders.find((r) => r.id === id);
  }

  assignRider(orderId: string, riderId: string): boolean {
    const rider = this.riders.find((r) => r.id === riderId);
    const order = this.orders.find((o) => o.id === orderId);
    if (!rider || !order) return false;
    rider.isAvailable = false;
    rider.currentOrderId = orderId;
    order.riderId = riderId;
    order.riderName = rider.name;
    this.persist();
    return true;
  }

  freeRider(riderId: string) {
    const rider = this.riders.find((r) => r.id === riderId);
    if (!rider) return;
    rider.isAvailable = true;
    rider.currentOrderId = undefined;
    this.persist();
  }

  // Reset
  reset() {
    this.orders = [...seedOrders];
    this.restaurants = [...seedRestaurants];
    this.riders = [...seedRiders];
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.storageKey);
    }
    this.persist();
  }
}

let storeInstance: MockStore | null = null;

export function getStore(): MockStore {
  if (!storeInstance) {
    storeInstance = new MockStore();
  }
  return storeInstance;
}
