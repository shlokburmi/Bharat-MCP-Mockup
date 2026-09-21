"use client";

import { useState, useCallback, useMemo } from "react";
import { useStore } from "@/data/use-store";
import { OrderStatus, Order } from "@/types";
import { RiderLogin } from "@/components/rider/rider-login";
import { ActiveDelivery } from "@/components/rider/active-delivery";
import { OrderList } from "@/components/rider/order-list";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function RiderPage() {
  const store = useStore();
  const [riderId, setRiderId] = useState<string | null>(null);

  const riders = store.getRiders();
  const rider = riderId ? store.getRider(riderId) : null;

  // Get all orders for computations
  const allOrders = store.getOrders();

  // Active order for this rider
  const activeOrder = useMemo(() => {
    if (!rider?.currentOrderId) return null;
    return store.getOrder(rider.currentOrderId) ?? null;
  }, [rider?.currentOrderId, store, allOrders]);

  // Available Category B orders in "ready" status with no rider assigned
  const availableOrders = useMemo(() => {
    return allOrders.filter(
      (o: Order) =>
        o.category === "B" &&
        o.status === "ready" &&
        !o.riderId &&
        o.orderType === "delivery"
    );
  }, [allOrders]);

  // Completed orders by this rider
  const completedOrders = useMemo(() => {
    if (!riderId) return [];
    return allOrders.filter(
      (o: Order) => o.riderId === riderId && o.status === "delivered"
    );
  }, [allOrders, riderId]);

  const handleUpdateStatus = useCallback(
    (orderId: string, newStatus: OrderStatus) => {
      store.updateOrderStatus(orderId, newStatus);
      // If delivered, free the rider
      if (newStatus === "delivered" && riderId) {
        store.freeRider(riderId);
      }
    },
    [store, riderId]
  );

  const handleAcceptOrder = useCallback(
    (orderId: string) => {
      if (!riderId) return;
      store.assignRider(orderId, riderId);
    },
    [store, riderId]
  );

  const handleLogout = useCallback(() => {
    setRiderId(null);
  }, []);

  // Login screen
  if (!riderId || !rider) {
    return (
      <div className="max-w-sm mx-auto">
        <RiderLogin riders={riders} onSelect={setRiderId} />
      </div>
    );
  }

  // Main rider dashboard
  return (
    <div className="max-w-sm mx-auto pb-8">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold">
              {rider.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">{rider.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Delivery Partner</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={
                rider.isAvailable
                  ? "bg-emerald-100 text-emerald-700 text-[10px]"
                  : "bg-orange-100 text-orange-700 text-[10px]"
              }
            >
              {rider.isAvailable ? "Available" : "On Delivery"}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 pt-4 space-y-6">
        {/* Active Delivery */}
        {activeOrder &&
          activeOrder.status !== "delivered" && (
            <ActiveDelivery
              order={activeOrder}
              onUpdateStatus={handleUpdateStatus}
            />
          )}

        {/* No active delivery message */}
        {!activeOrder && rider.isAvailable && (
          <div className="text-center py-6 space-y-2">
            <p className="text-3xl">&#x2705;</p>
            <p className="text-sm font-medium">You&apos;re available for deliveries</p>
            <p className="text-xs text-muted-foreground">
              Accept an order below to start delivering
            </p>
          </div>
        )}

        <Separator />

        {/* Order Lists */}
        <OrderList
          availableOrders={availableOrders}
          completedOrders={completedOrders}
          onAcceptOrder={handleAcceptOrder}
        />
      </div>
    </div>
  );
}
