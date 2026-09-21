"use client";

import { useMemo, useState } from "react";
import { transitionOrder } from "@/lib/api";
import { useLiveOrders } from "@/lib/use-live-order";
import { Order, OrderStatus, Restaurant } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { OrderCard } from "./order-card";
import { OrderDetail } from "./order-detail";
import { OrderHistory } from "./order-history";

interface OrderInboxProps {
  restaurant: Restaurant;
  onLogout: () => void;
}

type TabKey = "new" | "active" | "history";

const TAB_STATUS_MAP: Record<TabKey, OrderStatus[]> = {
  new: ["paid", "sent_to_restaurant"],
  active: ["accepted", "preparing", "ready", "picked_up", "out_for_delivery"],
  // everything the restaurant is finished with — its order history
  history: ["delivered", "collected", "rejected", "cancelled"],
};

/** Orders that never reached the restaurant are none of its business. */
const HIDDEN: OrderStatus[] = ["created", "payment_failed", "expired"];

export function OrderInbox({ restaurant, onLogout }: OrderInboxProps) {
  // Polls the shared server store, so an order paid in the customer tab shows
  // up here without a refresh.
  const { orders, loading, error, refresh } = useLiveOrders({ restaurantId: restaurant.id });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  // Kept as an id so the open sheet follows live updates rather than freezing
  // on the snapshot it was opened with.
  const selectedOrder = orders.find((o) => o.id === selectedId) ?? null;

  const ordersByTab = useMemo(() => {
    const result: Record<TabKey, Order[]> = { new: [], active: [], history: [] };
    for (const order of orders) {
      if (HIDDEN.includes(order.status)) continue;
      for (const tab of Object.keys(TAB_STATUS_MAP) as TabKey[]) {
        if (TAB_STATUS_MAP[tab].includes(order.status)) {
          result[tab].push(order);
          break;
        }
      }
    }
    return result;
  }, [orders]);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    setActionError(null);
    try {
      await transitionOrder(orderId, {
        status: newStatus,
        actor: "restaurant",
        // The restaurant promises a time when it accepts.
        etaMins: newStatus === "accepted" ? restaurant.prepTimeMins + 15 : undefined,
      });
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update the order");
    }
  };

  const handleRejectStart = (orderId: string) => {
    setRejectingOrderId(orderId);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectingOrderId) return;
    setActionError(null);
    try {
      await transitionOrder(rejectingOrderId, {
        status: "rejected",
        actor: "restaurant",
        rejectionReason: rejectionReason.trim() || "No reason given",
      });
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not reject the order");
    } finally {
      setRejectDialogOpen(false);
      setRejectingOrderId(null);
      setRejectionReason("");
    }
  };

  const renderEmptyState = (tab: TabKey) => {
    const messages: Record<TabKey, { title: string; desc: string }> = {
      new: {
        title: loading ? "Loading orders…" : "No new orders",
        desc: loading
          ? "Checking the kitchen queue"
          : "New orders appear here the moment a customer pays",
      },
      active: { title: "No active orders", desc: "Orders you accept show up here" },
      history: {
        title: "No past orders yet",
        desc: "Delivered, collected and declined orders are kept here",
      },
    };
    const msg = messages[tab];
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
          <svg
            className="size-6 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground">{msg.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{msg.desc}</p>
      </div>
    );
  };

  const renderTabLabel = (label: string, count: number) => (
    <span className="flex items-center gap-1.5">
      {label}
      {count > 0 && (
        <span className="inline-flex size-5 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-semibold">
          {count}
        </span>
      )}
    </span>
  );

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="shadow-soft sticky top-0 z-40 bg-surface px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold">{restaurant.name}</h1>
            <Badge
              variant="secondary"
              className={`text-[10px] ${
                restaurant.category === "A"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              Cat {restaurant.category}
            </Badge>
            {restaurant.category === "A" ? (
              <span className="text-[10px] text-muted-foreground">own delivery</span>
            ) : (
              <span className="text-[10px] text-muted-foreground">partner delivery</span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            Logout
          </Button>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {restaurant.address}
        </p>
      </header>

      {(error || actionError) && (
        <div className="bg-bad-soft px-4 py-2 text-sm text-bad">{actionError ?? error}</div>
      )}

      <div className="flex-1 px-4 pt-3 pb-6">
        <Tabs defaultValue="new">
          <TabsList className="mb-3 w-full">
            <TabsTrigger value="new">{renderTabLabel("New", ordersByTab.new.length)}</TabsTrigger>
            <TabsTrigger value="active">
              {renderTabLabel("Active", ordersByTab.active.length)}
            </TabsTrigger>
            <TabsTrigger value="history">
              {renderTabLabel("History", ordersByTab.history.length)}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <OrderHistory
              orders={ordersByTab.history}
              onViewDetail={(o) => {
                setSelectedId(o.id);
                setDetailOpen(true);
              }}
            />
          </TabsContent>

          {(["new", "active"] as TabKey[]).map((tab) => (
            <TabsContent key={tab} value={tab}>
              {ordersByTab[tab].length === 0 ? (
                renderEmptyState(tab)
              ) : (
                <div className="space-y-3">
                  {ordersByTab[tab].map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusUpdate={handleStatusUpdate}
                      onReject={handleRejectStart}
                      onViewDetail={(o) => {
                        setSelectedId(o.id);
                        setDetailOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <OrderDetail
        order={selectedOrder}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStatusUpdate={handleStatusUpdate}
        onReject={handleRejectStart}
      />

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject order</DialogTitle>
            <DialogDescription>
              Give a reason. The customer sees it on their tracking link, along with their refund.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g. Out of mutton, kitchen closing early"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>
              Confirm reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
