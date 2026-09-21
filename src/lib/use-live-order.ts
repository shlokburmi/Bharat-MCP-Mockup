"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, fetchOrder, fetchOrders } from "./api";
import { isTerminal } from "./state-machine";
import type { Order } from "./types";

/**
 * Polls one order so the customer's link updates as the restaurant and rider
 * act in other tabs. Backs off when the tab is hidden and stops once the order
 * reaches a terminal state.
 */
export function useLiveOrder(orderId: string, initial?: Order) {
  const [order, setOrder] = useState<Order | undefined>(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initial);
  const stopped = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchOrder(orderId);
      setOrder(next);
      setError(null);
      if (isTerminal(next.status)) stopped.current = true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reach the server");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    stopped.current = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      if (!stopped.current && document.visibilityState === "visible") await refresh();
      timer = setTimeout(tick, stopped.current ? 8000 : 2000);
    };

    // Kicked off on a macrotask so the first fetch doesn't setState inside
    // the effect body and cascade a render.
    timer = setTimeout(tick, 0);

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  /** Lets a mutation (payment, cancel) push its result in without waiting for
   *  the next poll. */
  const apply = useCallback((next: Order) => {
    setOrder(next);
    stopped.current = isTerminal(next.status);
  }, []);

  return { order, loading, error, refresh, apply };
}

/** Ticks once a second — for countdowns and "x mins ago" labels. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * Polls a list of orders — the restaurant inbox, the rider queue, the ops
 * overview. Same contract as `useLiveOrder`: the server store is the single
 * source of truth, so whatever another tab did shows up on the next tick.
 */
export function useLiveOrders(
  opts: { restaurantId?: string; riderId?: string; phone?: string; active?: boolean } = {},
  intervalMs = 2500,
) {
  const { restaurantId, riderId, phone, active } = opts;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setOrders(await fetchOrders({ restaurantId, riderId, phone, active }));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reach the server");
    } finally {
      setLoading(false);
    }
  }, [restaurantId, riderId, phone, active]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (document.visibilityState === "visible") await refresh();
      timer = setTimeout(tick, intervalMs);
    };
    // Macrotask, so the first fetch doesn't setState inside the effect body.
    timer = setTimeout(tick, 0);

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh, intervalMs]);

  return { orders, loading, error, refresh };
}
