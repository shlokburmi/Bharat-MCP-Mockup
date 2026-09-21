"use client";

import { Order, Restaurant, STATUS_COLORS, STATUS_LABELS, OrderStatus } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WhatsAppPreview } from "./whatsapp-preview";

interface OrderDetailProps {
  order: Order | null;
  restaurant: Restaurant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: (orderId: string, newStatus: OrderStatus, extra?: Partial<Order>) => void;
  onReject: (orderId: string) => void;
}

function formatTimestamp(dateStr?: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const timestampFields: { key: keyof Order; label: string }[] = [
  { key: "createdAt", label: "Created" },
  { key: "paidAt", label: "Paid" },
  { key: "acceptedAt", label: "Accepted" },
  { key: "rejectedAt", label: "Rejected" },
  { key: "preparingAt", label: "Preparing" },
  { key: "readyAt", label: "Ready" },
  { key: "pickedUpAt", label: "Picked Up" },
  { key: "outForDeliveryAt", label: "Out for Delivery" },
  { key: "deliveredAt", label: "Delivered" },
];

export function OrderDetail({
  order,
  restaurant,
  open,
  onOpenChange,
  onStatusUpdate,
  onReject,
}: OrderDetailProps) {
  if (!order) return null;

  const statusColors = STATUS_COLORS[order.status];
  const statusLabel = STATUS_LABELS[order.status];
  const shortId = order.id.slice(-3).toUpperCase();

  const renderActions = () => {
    switch (order.status) {
      case "sent_to_restaurant":
        return (
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-green-600 text-white hover:bg-green-700"
              onClick={() => onStatusUpdate(order.id, "accepted")}
            >
              Accept Order
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => onReject(order.id)}
            >
              Reject
            </Button>
          </div>
        );
      case "accepted":
        return (
          <Button
            className="w-full bg-orange-500 text-white hover:bg-orange-600"
            onClick={() => onStatusUpdate(order.id, "preparing")}
          >
            Start Preparing
          </Button>
        );
      case "preparing":
        return (
          <Button
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => onStatusUpdate(order.id, "ready")}
          >
            Mark Ready
          </Button>
        );
      case "ready":
        if (restaurant.category === "A") {
          if (order.orderType === "pickup") {
            return (
              <Button
                className="w-full bg-cyan-600 text-white hover:bg-cyan-700"
                onClick={() => onStatusUpdate(order.id, "picked_up")}
              >
                Mark as Picked Up by Customer
              </Button>
            );
          }
          return (
            <Button
              className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={() => onStatusUpdate(order.id, "out_for_delivery")}
            >
              Out for Delivery
            </Button>
          );
        }
        return (
          <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
            {order.riderName
              ? `Rider: ${order.riderName} - Awaiting pickup`
              : "Waiting for delivery partner assignment"}
          </div>
        );
      case "picked_up":
      case "out_for_delivery":
        if (restaurant.category === "B") {
          return (
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
              {order.riderName
                ? `Rider: ${order.riderName} - ${STATUS_LABELS[order.status]}`
                : "Delivery partner en route"}
            </div>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-xl">
        <SheetHeader>
          <div className="flex items-center justify-between pr-8">
            <SheetTitle>Order #{shortId}</SheetTitle>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors}`}>
              {statusLabel}
            </span>
          </div>
          <SheetDescription>
            {order.orderType === "delivery" ? "Delivery" : "Pickup"} order via{" "}
            {order.paymentMethod.toUpperCase()}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          {/* Items */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Items</h4>
            <div className="space-y-1.5">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-medium">Rs.{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Total</span>
              <span>Rs.{order.totalAmount}</span>
            </div>
          </div>

          <Separator />

          {/* Customer Info */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Customer</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{order.customerPhone}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="shrink-0 text-muted-foreground">Address</span>
                <span className="text-right font-medium">{order.customerAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <Badge variant="outline" className="text-[10px]">
                  {order.paymentMethod.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Category B delivery partner info */}
          {restaurant.category === "B" && order.riderId && (
            <>
              <div>
                <h4 className="mb-2 text-sm font-semibold text-foreground">
                  Delivery Partner
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rider</span>
                    <span className="font-medium">{order.riderName || "Unassigned"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Timeline */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Timeline</h4>
            <div className="space-y-1.5">
              {timestampFields
                .filter(({ key }) => order[key])
                .map(({ key, label }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">
                      {formatTimestamp(order[key] as string)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <Separator />

          {/* WhatsApp Preview */}
          <WhatsAppPreview order={order} />

          {/* Actions */}
          <div className="pt-2">{renderActions()}</div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
