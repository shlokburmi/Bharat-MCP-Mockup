"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Order, MenuItem, Restaurant } from "@/types";
import { useStore } from "@/data/use-store";
import { Minus, Plus, CheckCircle2, RotateCcw, ShoppingCart } from "lucide-react";

function VegIcon({ isVeg }: { isVeg: boolean }) {
  if (isVeg) {
    return (
      <span className="inline-flex size-4 items-center justify-center rounded-sm border-2 border-green-600" title="Vegetarian">
        <span className="size-2 rounded-full bg-green-600" />
      </span>
    );
  }
  return (
    <span className="inline-flex size-4 items-center justify-center rounded-sm border-2 border-red-600" title="Non-vegetarian">
      <svg viewBox="0 0 10 10" className="size-2.5 fill-red-600">
        <polygon points="5,0 10,10 0,10" />
      </svg>
    </span>
  );
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export function TestOrder() {
  const store = useStore();
  const restaurants = store.getRestaurants().filter((r) => r.isActive);

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [customerName, setCustomerName] = useState("Test User");
  const [customerPhone, setCustomerPhone] = useState("9999999999");
  const [customerAddress, setCustomerAddress] = useState("123, Test Street, Bangalore");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cod">("upi");
  const [submitted, setSubmitted] = useState<string | null>(null);

  const selectedRestaurant = useMemo(() => {
    if (!selectedRestaurantId) return null;
    return store.getRestaurant(selectedRestaurantId) ?? null;
  }, [store, selectedRestaurantId]);

  const total = useMemo(() => {
    let sum = 0;
    cart.forEach((item) => {
      sum += item.menuItem.price * item.quantity;
    });
    return sum;
  }, [cart]);

  function handleSelectRestaurant(id: string) {
    setSelectedRestaurantId(id);
    setCart(new Map());
    setSubmitted(null);
  }

  function handleQuantityChange(item: MenuItem, delta: number) {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(item.id);
      const newQty = (existing?.quantity ?? 0) + delta;
      if (newQty <= 0) {
        next.delete(item.id);
      } else {
        next.set(item.id, { menuItem: item, quantity: newQty });
      }
      return next;
    });
  }

  function handlePlaceOrder() {
    if (!selectedRestaurant || cart.size === 0) return;

    const items = Array.from(cart.values()).map((ci) => ({
      menuItemId: ci.menuItem.id,
      name: ci.menuItem.name,
      quantity: ci.quantity,
      price: ci.menuItem.price,
    }));

    const orderId = `ord-test-${Date.now().toString(36)}`;

    const order: Order = {
      id: orderId,
      restaurantId: selectedRestaurant.id,
      restaurantName: selectedRestaurant.name,
      customerName: customerName.trim() || "Test User",
      customerPhone: `+91${customerPhone.trim()}`,
      customerAddress: customerAddress.trim(),
      items,
      totalAmount: total,
      status: "sent_to_restaurant",
      orderType: "delivery",
      category: selectedRestaurant.category,
      paymentMethod,
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
      dynamicLinkExpiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
    };

    store.addOrder(order);
    setSubmitted(orderId);
    setCart(new Map());
  }

  function handleReset() {
    store.reset();
    setSelectedRestaurantId("");
    setCart(new Map());
    setSubmitted(null);
    setCustomerName("Test User");
    setCustomerPhone("9999999999");
    setCustomerAddress("123, Test Street, Bangalore");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Test Order</h2>
          <p className="text-sm text-muted-foreground">
            Create a mock test order for any active restaurant
          </p>
        </div>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="size-4" />
          Reset All Data
        </Button>
      </div>

      {/* Restaurant Selection */}
      <div className="grid gap-1.5">
        <Label>Select Restaurant</Label>
        <Select value={selectedRestaurantId} onValueChange={(v) => { if (v !== null) handleSelectRestaurant(v); }}>
          <SelectTrigger className="w-full max-w-sm">
            <SelectValue placeholder="Choose a restaurant..." />
          </SelectTrigger>
          <SelectContent>
            {restaurants.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name} ({r.area})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Success Message */}
      {submitted && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950/30">
          <CheckCircle2 className="size-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-400">
              Order placed successfully!
            </p>
            <p className="text-sm text-green-700 dark:text-green-500">
              Order ID: <span className="font-mono">{submitted}</span>
            </p>
          </div>
        </div>
      )}

      {selectedRestaurant && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Menu Items */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-semibold">
              Menu — {selectedRestaurant.name}
            </h3>

            {selectedRestaurant.menu.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                This restaurant has no menu items yet.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {selectedRestaurant.menu
                  .filter((item) => item.isAvailable)
                  .map((item) => {
                    const inCart = cart.get(item.id);
                    return (
                      <Card
                        key={item.id}
                        className={`flex items-start gap-3 p-3 transition-colors ${
                          inCart ? "ring-2 ring-primary/20 bg-primary/5" : ""
                        }`}
                      >
                        <VegIcon isVeg={item.isVeg} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                          <p className="text-sm font-semibold mt-1 tabular-nums">
                            &#8377;{item.price}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {inCart ? (
                            <>
                              <Button
                                size="icon-xs"
                                variant="outline"
                                onClick={() => handleQuantityChange(item, -1)}
                              >
                                <Minus className="size-3" />
                              </Button>
                              <span className="w-6 text-center text-sm font-semibold tabular-nums">
                                {inCart.quantity}
                              </span>
                              <Button
                                size="icon-xs"
                                variant="outline"
                                onClick={() => handleQuantityChange(item, 1)}
                              >
                                <Plus className="size-3" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuantityChange(item, 1)}
                            >
                              Add
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-4">
            <Card className="p-4 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <ShoppingCart className="size-4" />
                Order Summary
              </h3>

              {cart.size === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No items selected yet
                </p>
              ) : (
                <div className="space-y-2">
                  {Array.from(cart.values()).map((ci) => (
                    <div key={ci.menuItem.id} className="flex justify-between text-sm">
                      <span>
                        {ci.menuItem.name} x{ci.quantity}
                      </span>
                      <span className="tabular-nums font-medium">
                        &#8377;{ci.menuItem.price * ci.quantity}
                      </span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">&#8377;{total}</span>
                  </div>
                </div>
              )}

              <Separator />

              {/* Customer Details */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Customer Details
                </p>
                <div className="grid gap-1.5">
                  <Input
                    placeholder="Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-xs text-muted-foreground">+91</span>
                    <Input
                      placeholder="Phone"
                      value={customerPhone}
                      onChange={(e) =>
                        setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                    />
                  </div>
                  <Input
                    placeholder="Delivery Address"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                  />
                </div>

                <div className="grid gap-1">
                  <Label className="text-xs">Payment Method</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(v) => { if (v !== null) setPaymentMethod(v as "upi" | "cod"); }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="cod">Cash on Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full"
                disabled={cart.size === 0}
                onClick={handlePlaceOrder}
              >
                Place Test Order
              </Button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
