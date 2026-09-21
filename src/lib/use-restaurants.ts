"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, fetchAllRestaurants } from "./api";
import type { Restaurant } from "./types";

/** The ops console's view of the catalogue. Not polled as aggressively as
 *  orders — restaurants change when someone onboards one, not every few
 *  seconds — so this refreshes on demand after a write. */
export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setRestaurants(await fetchAllRestaurants());
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load restaurants");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Macrotask so the first fetch does not setState inside the effect body.
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  return { restaurants, loading, error, refresh };
}
