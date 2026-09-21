"use client";

import { useSyncExternalStore, useEffect } from "react";
import { getStore } from "./store";

export function useStore() {
  const store = getStore();

  const snapshot = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getOrders().length + store.getRestaurants().length + store.getRiders().length,
    () => 0
  );

  useEffect(() => {
    return store.initCrossTabSync();
  }, [store]);

  void snapshot;
  return store;
}
