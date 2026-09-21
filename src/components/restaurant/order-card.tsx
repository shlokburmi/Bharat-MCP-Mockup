"use client";

import { Order, OrderStatus } from "@/lib/types";
import { OPERATOR_STATUS_COPY } from "@/lib/state-machine";
import { partnerStatusNote, restaurantActions, STATUS_PILL } from "@/lib/operator-actions";
import { rupees } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void;
  onReject: (orderId: string) => void;
  onViewDetail: (order: Order) => void;
}

function timeAgo(dateStr: string, now: number): string {
  const mins = Math.floor((now - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const TONE_CLASS = {
  good: "bg-good text-white hover:bg-good/90",
  primary: "bg-brand text-white hover:bg-brand-dark",
  danger: "",
} as const;

export function OrderCard({ order, onStatusUpdate, onReject, onViewDetail }: OrderCardProps) {
  const actions = restaurantActions(order);
  const partnerNote = partnerStatusNote(order);

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => onViewDetail(order)}
    >
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold">{order.code}</span>
            <Badge variant="secondary" className="text-[10px]">
              {order.mode === "delivery" ? "Delivery" : "Pickup"}
            </Badge>
            {order.paymentMethod && (
              <Badge variant="outline" className="text-[10px]">
                {order.paymentMethod.toUpperCase()}
              </Badge>
            )}
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_PILL[order.status]}`}
          >
            {OPERATOR_STATUS_COPY[order.status]}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{order.customer.name}</span>
          <span className="text-xs text-muted-foreground">
            {timeAgo(order.createdAt, Date.parse(order.updatedAt))}
          </span>
        </div>

        <div className="space-y-0.5">
          {order.items.map((item) => (
            <div
              key={item.menuItemId}
              className="flex justify-between text-xs text-muted-foreground"
            >
              <span>
                {item.qty}x {item.name}
              </span>
              <span className="tabular-nums">{rupees(item.price * item.qty)}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t pt-2">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-sm font-semibold tabular-nums">{rupees(order.totals.total)}</span>
        </div>

        {actions.length > 0 && (
          <div className="flex gap-2">
            {actions.map((action) => (
              <Button
                key={action.status}
                size="sm"
                variant={action.tone === "danger" ? "destructive" : "default"}
                className={`flex-1 ${TONE_CLASS[action.tone]}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (action.needsReason) onReject(order.id);
                  else onStatusUpdate(order.id, action.status);
                }}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {partnerNote && (
          <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">{partnerNote}</div>
        )}
      </CardContent>
    </Card>
  );
}
