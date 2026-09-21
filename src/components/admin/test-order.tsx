"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createOrder, fetchMenu, payOrder } from "@/lib/api";
import { rupees } from "@/lib/format";
import { useRestaurants } from "@/lib/use-restaurants";
import { FulfilmentMode, MenuItem, Order, PaymentMethod } from "@/lib/types";
import { Loader2 } from "lucide-react";

function VegIcon({ isVeg }: { isVeg: boolean }) {
  return (
    <span
      className={`inline-flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border ${
        isVeg ? "border-good" : "border-bad"
      }`}
    >
      <span className={`size-1.5 rounded-full ${isVeg ? "bg-good" : "bg-bad"}`} />
    </span>
  );
}

/**
 * "Run a test order" — builds a real order through the same API the customer
 * link uses, so the restaurant and rider screens see it exactly as they would
 * a genuine one.
 */
export function TestOrder() {
  const { restaurants } = useRestaurants();
  const live = useMemo(() => restaurants.filter((r) => r.live), [restaurants]);

  const [restaurantId, setRestaurantId] = useState("");
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [name, setName] = useState("Test Customer");
  const [phone, setPhone] = useState("+91 90000 00000");
  const [address, setAddress] = useState("1, Test Street, Ground Floor");
  const [mode, setMode] = useState<FulfilmentMode>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const restaurant = live.find((r) => r.id === restaurantId) ?? null;

  const loadMenu = useCallback(async (id: string) => {
    setLoadingMenu(true);
    try {
      setMenu(await fetchMenu(id));
    } finally {
      setLoadingMenu(false);
    }
  }, []);

  useEffect(() => {
    if (!restaurantId) return;
    const timer = setTimeout(() => void loadMenu(restaurantId), 0);
    return () => clearTimeout(timer);
  }, [restaurantId, loadMenu]);

  const subtotal = useMemo(
    () =>
      Object.entries(cart).reduce((sum, [id, qty]) => {
        const item = menu.find((m) => m.id === id);
        return item ? sum + item.price * qty : sum;
      }, 0),
    [cart, menu],
  );

  const short = restaurant ? restaurant.minOrder - subtotal : 0;
  const lines = Object.entries(cart).filter(([, qty]) => qty > 0);

  function setQty(id: string, delta: number) {
    setCart((prev) => {
      const next = Math.max(0, (prev[id] ?? 0) + delta);
      const copy = { ...prev };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  }

  async function handlePlaceOrder() {
    if (!restaurant) return;
    setPlacing(true);
    setError(null);
    try {
      const order = await createOrder({
        restaurantId: restaurant.id,
        items: lines.map(([menuItemId, qty]) => ({ menuItemId, qty })),
        mode,
        customer: {
          name,
          phone,
          address: mode === "pickup" ? "" : address,
          area: restaurant.deliversTo[0] ?? restaurant.area,
          landmark: "Ops console test order",
        },
        source: "ops_test",
      });
      // Pay immediately so it lands in the restaurant inbox, like a real one.
      setPlaced(await payOrder(order.id, paymentMethod));
      setCart({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place the test order");
    } finally {
      setPlacing(false);
    }
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-10 text-center">
        <p className="text-4xl">✅</p>
        <div>
          <h2 className="text-lg font-semibold">Test order {placed.code} placed</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {placed.restaurantName} · {rupees(placed.totals.total)} · paid by{" "}
            {placed.paymentMethod?.toUpperCase()}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            It is now sitting in the restaurant inbox
            {placed.riderName ? `, with ${placed.riderName} assigned to deliver it` : ""}.
          </p>
        </div>
        <div className="flex justify-center gap-2">
          <Link
            href={`/order/${placed.id}`}
            className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Open customer link
          </Link>
          <Link
            href="/restaurant"
            className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-accent"
          >
            Restaurant inbox
          </Link>
          <Button variant="outline" onClick={() => setPlaced(null)}>
            Place another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Test Order</h2>
        <p className="text-sm text-muted-foreground">
          Places a real order through the same API a customer would, then pays it.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Restaurant</Label>
        <Select
          value={restaurantId}
          onValueChange={(v) => {
            setRestaurantId(v ?? "");
            setCart({});
            setMenu([]);
          }}
        >
          <SelectTrigger className="w-full sm:w-96">
            <SelectValue placeholder="Pick a live restaurant" />
          </SelectTrigger>
          <SelectContent>
            {live.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name} — Cat {r.category} · min {rupees(r.minOrder)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {live.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No live restaurants. Switch one live on the Restaurants tab first.
          </p>
        )}
      </div>

      {restaurant && (
        <>
          <Separator />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-semibold">Menu</p>
              {loadingMenu && <p className="text-sm text-muted-foreground">Loading menu…</p>}
              <ul className="divide-y divide-border">
                {menu.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 py-2">
                    <VegIcon isVeg={item.veg} />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm ${item.available ? "" : "text-muted-foreground line-through"}`}
                      >
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {rupees(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg border border-border">
                      <button
                        type="button"
                        aria-label={`Remove one ${item.name}`}
                        className="px-2 text-muted-foreground disabled:opacity-40"
                        disabled={!cart[item.id]}
                        onClick={() => setQty(item.id, -1)}
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm tabular-nums">
                        {cart[item.id] ?? 0}
                      </span>
                      <button
                        type="button"
                        aria-label={`Add one ${item.name}`}
                        className="px-2 text-muted-foreground disabled:opacity-40"
                        disabled={!item.available}
                        onClick={() => setQty(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold">Order details</p>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="t-name">Customer</Label>
                  <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="t-phone">Phone</Label>
                  <Input id="t-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>

              {mode === "delivery" && (
                <div className="space-y-1">
                  <Label htmlFor="t-address">Address</Label>
                  <Input
                    id="t-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Mode</Label>
                  <Select
                    value={mode}
                    onValueChange={(v) => setMode((v as FulfilmentMode | null) ?? "delivery")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delivery">Delivery</SelectItem>
                      {restaurant.supportsPickup && <SelectItem value="pickup">Pickup</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Payment</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(v) => setPaymentMethod((v as PaymentMethod | null) ?? "upi")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      {mode === "delivery" && <SelectItem value="cod">Cash on delivery</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                {lines.length === 0 && (
                  <p className="text-sm text-muted-foreground">Add items from the menu.</p>
                )}
                {lines.map(([id, qty]) => {
                  const item = menu.find((m) => m.id === id);
                  if (!item) return null;
                  return (
                    <div key={id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {qty}x {item.name}
                      </span>
                      <span className="tabular-nums">{rupees(item.price * qty)}</span>
                    </div>
                  );
                })}
                {lines.length > 0 && (
                  <div className="flex justify-between border-t pt-1 text-sm font-semibold">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{rupees(subtotal)}</span>
                  </div>
                )}
              </div>

              {lines.length > 0 && short > 0 && (
                <Badge variant="secondary" className="bg-warn-soft text-warn">
                  {rupees(short)} below this restaurant&apos;s minimum
                </Badge>
              )}

              {error && <p className="rounded bg-bad-soft px-2 py-1.5 text-sm text-bad">{error}</p>}

              <Button
                className="w-full"
                disabled={placing || lines.length === 0 || short > 0}
                onClick={handlePlaceOrder}
              >
                {placing && <Loader2 className="size-4 animate-spin" />}
                Place and pay test order
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
