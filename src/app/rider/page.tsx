"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchRiders, transitionOrder } from "@/lib/api";
import { isTerminal } from "@/lib/state-machine";
import { useLiveOrders } from "@/lib/use-live-order";
import { Order, OrderStatus, Rider } from "@/lib/types";
import { RiderLogin } from "@/components/rider/rider-login";
import { ActiveDelivery } from "@/components/rider/active-delivery";
import { OrderList } from "@/components/rider/order-list";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

/** An order still on a rider's plate — anything assigned and not finished. */
function isLive(order: Order): boolean {
  return !isTerminal(order.status) && order.status !== "created";
}

export default function RiderPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [riderId, setRiderId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { orders, error, refresh } = useLiveOrders();

  useEffect(() => {
    // Macrotask so the first fetch does not setState inside the effect body.
    const timer = setTimeout(() => {
      void fetchRiders()
        .then(setRiders)
        .catch(() => setRiders([]));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const rider = riders.find((r) => r.id === riderId) ?? null;

  const activeOrder = useMemo(
    () => orders.find((o) => o.riderId === riderId && isLive(o)) ?? null,
    [orders, riderId],
  );

  // Category B jobs nobody has claimed yet.
  const availableOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.category === "B" && o.mode === "delivery" && o.status === "ready" && !o.riderId,
      ),
    [orders],
  );

  const completedOrders = useMemo(
    () => orders.filter((o) => o.riderId === riderId && o.status === "delivered"),
    [orders, riderId],
  );

  const busyRiderIds = useMemo(
    () => orders.filter(isLive).flatMap((o) => (o.riderId ? [o.riderId] : [])),
    [orders],
  );

  const handleUpdateStatus = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      setActionError(null);
      try {
        await transitionOrder(orderId, { status: newStatus, actor: "rider" });
        await refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Could not update the delivery");
      }
    },
    [refresh],
  );

  const handleAcceptOrder = useCallback(
    async (orderId: string) => {
      if (!riderId) return;
      setActionError(null);
      try {
        // No status change — claiming a job only attaches the rider.
        await transitionOrder(orderId, { assignRiderId: riderId, actor: "rider" });
        await refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Could not accept the delivery");
      }
    },
    [riderId, refresh],
  );

  if (!riderId || !rider) {
    return (
      <div className="max-w-sm mx-auto">
        <RiderLogin riders={riders} busyRiderIds={busyRiderIds} onSelect={setRiderId} />
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto pb-8">
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
                activeOrder
                  ? "bg-orange-100 text-orange-700 text-[10px]"
                  : "bg-good-soft text-good text-[10px]"
              }
            >
              {activeOrder ? "On Delivery" : "Available"}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setRiderId(null)}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {(error || actionError) && (
        <p className="bg-bad-soft px-4 py-2 text-sm text-bad">{actionError ?? error}</p>
      )}

      <div className="px-4 pt-4 space-y-6">
        {activeOrder && <ActiveDelivery order={activeOrder} onUpdateStatus={handleUpdateStatus} />}

        {!activeOrder && (
          <div className="text-center py-6 space-y-2">
            <p className="text-3xl">&#x2705;</p>
            <p className="text-sm font-medium">You&apos;re available for deliveries</p>
            <p className="text-xs text-muted-foreground">
              Accept an order below to start delivering
            </p>
          </div>
        )}

        <Separator />

        <OrderList
          availableOrders={availableOrders}
          completedOrders={completedOrders}
          onAcceptOrder={handleAcceptOrder}
        />
      </div>
    </div>
  );
}
