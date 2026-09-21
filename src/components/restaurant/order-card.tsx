"use client";

import { Order, Restaurant, STATUS_COLORS, STATUS_LABELS } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface OrderCardProps {
  order: Order;
  restaurant: Restaurant;
  onStatusUpdate: (orderId: string, newStatus: Order["status"], extra?: Partial<Order>) => void;
  onReject: (orderId: string) => void;
  onViewDetail: (order: Order) => void;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function OrderCard({
  order,
  restaurant,
  onStatusUpdate,
  onReject,
  onViewDetail,
}: OrderCardProps) {
  const statusColors = STATUS_COLORS[order.status];
  const statusLabel = STATUS_LABELS[order.status];
  const shortId = order.id.slice(-3).toUpperCase();

  const renderActions = () => {
    switch (order.status) {
      case "sent_to_restaurant":
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-green-600 text-white hover:bg-green-700"
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate(order.id, "accepted");
              }}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onReject(order.id);
              }}
            >
              Reject
            </Button>
          </div>
        );
      case "accepted":
        return (
          <Button
            size="sm"
            className="w-full bg-orange-500 text-white hover:bg-orange-600"
            onClick={(e) => {
              e.stopPropagation();
              onStatusUpdate(order.id, "preparing");
            }}
          >
            Start Preparing
          </Button>
        );
      case "preparing":
        return (
          <Button
            size="sm"
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={(e) => {
              e.stopPropagation();
              onStatusUpdate(order.id, "ready");
            }}
          >
            Mark Ready
          </Button>
        );
      case "ready":
        if (restaurant.category === "A") {
          if (order.orderType === "pickup") {
            return (
              <Button
                size="sm"
                className="w-full bg-cyan-600 text-white hover:bg-cyan-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusUpdate(order.id, "picked_up");
                }}
              >
                Mark as Picked Up by Customer
              </Button>
            );
          }
          return (
            <Button
              size="sm"
              className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate(order.id, "out_for_delivery");
              }}
            >
              Out for Delivery
            </Button>
          );
        }
        // Category B: read-only rider info
        return (
          <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
            {order.riderName
              ? `Rider: ${order.riderName} - Awaiting pickup`
              : "Waiting for delivery partner assignment"}
          </div>
        );
      case "picked_up":
      case "out_for_delivery":
        if (restaurant.category === "B") {
          return (
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
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
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => onViewDetail(order)}
    >
      <CardContent className="space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold">#{shortId}</span>
            <Badge variant="secondary" className="text-[10px]">
              {order.orderType === "delivery" ? "Delivery" : "Pickup"}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {order.paymentMethod.toUpperCase()}
            </Badge>
          </div>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors}`}>
            {statusLabel}
          </span>
        </div>

        {/* Customer and time */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {order.customerName}
          </span>
          <span className="text-xs text-muted-foreground">
            {timeAgo(order.createdAt)}
          </span>
        </div>

        {/* Items */}
        <div className="space-y-0.5">
          {order.items.map((item, i) => (
            <div
              key={i}
              className="flex justify-between text-xs text-muted-foreground"
            >
              <span>
                {item.quantity}x {item.name}
              </span>
              <span>Rs.{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between border-t pt-2">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-sm font-semibold">Rs.{order.totalAmount}</span>
        </div>

        {/* Actions */}
        {renderActions()}
      </CardContent>
    </Card>
  );
}
