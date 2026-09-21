"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/data/use-store";
import { Order, Restaurant, OrderStatus } from "@/types";
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

interface OrderInboxProps {
  restaurant: Restaurant;
  onLogout: () => void;
}

type TabKey = "new" | "active" | "completed" | "rejected";

const TAB_STATUS_MAP: Record<TabKey, OrderStatus[]> = {
  new: ["sent_to_restaurant"],
  active: ["accepted", "preparing", "ready", "picked_up", "out_for_delivery"],
  completed: ["delivered"],
  rejected: ["rejected"],
};

export function OrderInbox({ restaurant, onLogout }: OrderInboxProps) {
  const store = useStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const orders = useMemo(
    () => store.getOrdersByRestaurant(restaurant.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store, restaurant.id, store.getOrders().length]
  );

  const ordersByTab = useMemo(() => {
    const result: Record<TabKey, Order[]> = {
      new: [],
      active: [],
      completed: [],
      rejected: [],
    };
    for (const order of orders) {
      for (const tab of Object.keys(TAB_STATUS_MAP) as TabKey[]) {
        if (TAB_STATUS_MAP[tab].includes(order.status)) {
          result[tab].push(order);
          break;
        }
      }
    }
    // Sort newest first
    for (const tab of Object.keys(result) as TabKey[]) {
      result[tab].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return result;
  }, [orders]);

  const handleStatusUpdate = (
    orderId: string,
    newStatus: OrderStatus,
    extra?: Partial<Order>
  ) => {
    store.updateOrderStatus(orderId, newStatus, extra);
    // Refresh selected order if it is the one being updated
    if (selectedOrder?.id === orderId) {
      const updated = store.getOrder(orderId);
      if (updated) setSelectedOrder(updated);
    }
  };

  const handleRejectStart = (orderId: string) => {
    setRejectingOrderId(orderId);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectingOrderId) return;
    store.updateOrderStatus(rejectingOrderId, "rejected", {
      rejectionReason: rejectionReason || "No reason provided",
    });
    setRejectDialogOpen(false);
    setRejectingOrderId(null);
    setRejectionReason("");
    if (selectedOrder?.id === rejectingOrderId) {
      const updated = store.getOrder(rejectingOrderId);
      if (updated) setSelectedOrder(updated);
    }
  };

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const renderEmptyState = (tab: TabKey) => {
    const messages: Record<TabKey, { title: string; desc: string }> = {
      new: {
        title: "No new orders",
        desc: "New orders will appear here when customers place them",
      },
      active: {
        title: "No active orders",
        desc: "Orders you accept will show up here",
      },
      completed: {
        title: "No completed orders",
        desc: "Delivered orders will appear here",
      },
      rejected: {
        title: "No rejected orders",
        desc: "Orders you reject will be listed here",
      },
    };
    const msg = messages[tab];
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-gray-100">
          <svg
            className="size-6 text-gray-400"
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
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white px-4 py-3">
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
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            Logout
          </Button>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {restaurant.address}, {restaurant.area}
        </p>
      </header>

      {/* Tabs */}
      <div className="flex-1 px-4 pt-3 pb-6">
        <Tabs defaultValue="new">
          <TabsList className="mb-3 w-full">
            <TabsTrigger value="new">
              {renderTabLabel("New", ordersByTab.new.length)}
            </TabsTrigger>
            <TabsTrigger value="active">
              {renderTabLabel("Active", ordersByTab.active.length)}
            </TabsTrigger>
            <TabsTrigger value="completed">
              {renderTabLabel("Done", ordersByTab.completed.length)}
            </TabsTrigger>
            <TabsTrigger value="rejected">
              {renderTabLabel("Rejected", ordersByTab.rejected.length)}
            </TabsTrigger>
          </TabsList>

          {(Object.keys(TAB_STATUS_MAP) as TabKey[]).map((tab) => (
            <TabsContent key={tab} value={tab}>
              {ordersByTab[tab].length === 0 ? (
                renderEmptyState(tab)
              ) : (
                <div className="space-y-3">
                  {ordersByTab[tab].map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      restaurant={restaurant}
                      onStatusUpdate={handleStatusUpdate}
                      onReject={handleRejectStart}
                      onViewDetail={handleViewDetail}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Order Detail Sheet */}
      <OrderDetail
        order={selectedOrder}
        restaurant={restaurant}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStatusUpdate={handleStatusUpdate}
        onReject={handleRejectStart}
      />

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Order</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this order. The customer will
              be notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g., Item unavailable, Kitchen closing soon..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
            >
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
