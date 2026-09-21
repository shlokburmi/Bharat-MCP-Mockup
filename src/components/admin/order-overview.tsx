"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Order, OrderStatus, STATUS_LABELS, STATUS_COLORS } from "@/types";
import { useStore } from "@/data/use-store";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ALL_STATUSES: OrderStatus[] = [
  "created",
  "paid",
  "sent_to_restaurant",
  "accepted",
  "rejected",
  "preparing",
  "ready",
  "picked_up",
  "out_for_delivery",
  "delivered",
];

export function OrderOverview() {
  const store = useStore();
  const orders = store.getOrders();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = useMemo(() => {
    const sorted = [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (statusFilter === "all") return sorted;
    return sorted.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Orders</h2>
          <p className="text-sm text-muted-foreground">
            {orders.length} total orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <Select value={statusFilter} onValueChange={(v) => { if (v !== null) setStatusFilter(v); }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Restaurant</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="text-center">Items</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOrders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                No orders found
              </TableCell>
            </TableRow>
          ) : (
            filteredOrders.map((order) => (
              <TableRow
                key={order.id}
                className="cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <TableCell className="font-mono text-xs">{order.id}</TableCell>
                <TableCell className="font-medium">{order.restaurantName}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell className="text-center">
                  {order.items.reduce((sum, i) => sum + i.quantity, 0)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  &#8377;{order.totalAmount}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={STATUS_COLORS[order.status]}
                  >
                    {STATUS_LABELS[order.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      order.category === "A"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                    }
                  >
                    Cat {order.category}
                  </Badge>
                </TableCell>
                <TableCell className="uppercase text-xs text-muted-foreground">
                  {order.paymentMethod}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {formatTime(order.createdAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Order Detail Dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => {
          if (!open) setSelectedOrder(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order {selectedOrder.id}</DialogTitle>
                <DialogDescription>
                  {selectedOrder.restaurantName} — {formatDate(selectedOrder.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge
                    variant="secondary"
                    className={STATUS_COLORS[selectedOrder.status]}
                  >
                    {STATUS_LABELS[selectedOrder.status]}
                  </Badge>
                </div>

                <Separator />

                {/* Customer */}
                <div>
                  <p className="font-medium">Customer</p>
                  <p>{selectedOrder.customerName}</p>
                  <p className="text-muted-foreground">{selectedOrder.customerPhone}</p>
                  <p className="text-muted-foreground">{selectedOrder.customerAddress}</p>
                </div>

                <Separator />

                {/* Items */}
                <div>
                  <p className="font-medium mb-2">Items</p>
                  <div className="space-y-1">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>
                          {item.name} x{item.quantity}
                        </span>
                        <span className="tabular-nums">
                          &#8377;{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="tabular-nums">&#8377;{selectedOrder.totalAmount}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Category</span>
                    <p>Cat {selectedOrder.category}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Order Type</span>
                    <p className="capitalize">{selectedOrder.orderType}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment</span>
                    <p className="uppercase">{selectedOrder.paymentMethod}</p>
                  </div>
                  {selectedOrder.riderName && (
                    <div>
                      <span className="text-muted-foreground">Rider</span>
                      <p>{selectedOrder.riderName}</p>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div>
                  <p className="font-medium mb-2">Timeline</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Created: {formatDate(selectedOrder.createdAt)}</p>
                    {selectedOrder.paidAt && <p>Paid: {formatDate(selectedOrder.paidAt)}</p>}
                    {selectedOrder.acceptedAt && <p>Accepted: {formatDate(selectedOrder.acceptedAt)}</p>}
                    {selectedOrder.rejectedAt && (
                      <p>
                        Rejected: {formatDate(selectedOrder.rejectedAt)}
                        {selectedOrder.rejectionReason && ` — ${selectedOrder.rejectionReason}`}
                      </p>
                    )}
                    {selectedOrder.preparingAt && <p>Preparing: {formatDate(selectedOrder.preparingAt)}</p>}
                    {selectedOrder.readyAt && <p>Ready: {formatDate(selectedOrder.readyAt)}</p>}
                    {selectedOrder.pickedUpAt && <p>Picked Up: {formatDate(selectedOrder.pickedUpAt)}</p>}
                    {selectedOrder.outForDeliveryAt && <p>Out for Delivery: {formatDate(selectedOrder.outForDeliveryAt)}</p>}
                    {selectedOrder.deliveredAt && <p>Delivered: {formatDate(selectedOrder.deliveredAt)}</p>}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
