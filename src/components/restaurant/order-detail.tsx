"use client";

import { Order, OrderStatus } from "@/lib/types";
import { OPERATOR_STATUS_COPY } from "@/lib/state-machine";
import { partnerStatusNote, restaurantActions, STATUS_PILL } from "@/lib/operator-actions";
import { rupees } from "@/lib/format";
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void;
  onReject: (orderId: string) => void;
}

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TONE_CLASS = {
  good: "bg-good text-white hover:bg-good/90",
  primary: "bg-brand text-white hover:bg-brand-dark",
  danger: "",
} as const;

export function OrderDetail({
  order,
  open,
  onOpenChange,
  onStatusUpdate,
  onReject,
}: OrderDetailProps) {
  if (!order) return null;

  const actions = restaurantActions(order);
  const partnerNote = partnerStatusNote(order);
  const pill = STATUS_PILL[order.status];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-xl">
        <SheetHeader>
          <div className="flex items-center justify-between pr-8">
            <SheetTitle>Order {order.code}</SheetTitle>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${pill}`}
            >
              {OPERATOR_STATUS_COPY[order.status]}
            </span>
          </div>
          <SheetDescription>
            {order.mode === "delivery" ? "Delivery" : "Pickup"} order
            {order.paymentMethod ? ` via ${order.paymentMethod.toUpperCase()}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Items</h4>
            <div className="space-y-1.5">
              {order.items.map((item) => (
                <div key={item.menuItemId} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.qty}x {item.name}
                    {item.notes && <span className="italic"> · {item.notes}</span>}
                  </span>
                  <span className="font-medium tabular-nums">
                    {rupees(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
            <Separator className="my-2" />
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Item total</span>
                <span className="tabular-nums">{rupees(order.totals.subtotal)}</span>
              </div>
              {order.mode === "delivery" && (
                <div className="flex justify-between">
                  <span>Delivery fee</span>
                  <span className="tabular-nums">{rupees(order.totals.deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Taxes and fees</span>
                <span className="tabular-nums">
                  {rupees(order.totals.taxes + order.totals.platformFee)}
                </span>
              </div>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{rupees(order.totals.total)}</span>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Customer</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{order.customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{order.customer.phone}</span>
              </div>
              {order.mode === "delivery" && (
                <div className="flex justify-between gap-4">
                  <span className="shrink-0 text-muted-foreground">Address</span>
                  <span className="text-right font-medium">
                    {order.customer.address}, {order.customer.area}
                    {order.customer.landmark && ` (${order.customer.landmark})`}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <Badge variant="outline" className="text-[10px]">
                  {order.paymentMethod ? order.paymentMethod.toUpperCase() : "PENDING"}
                </Badge>
              </div>
            </div>
          </div>

          {order.category === "B" && order.riderId && (
            <>
              <Separator />
              <div>
                <h4 className="mb-2 text-sm font-semibold text-foreground">Delivery Partner</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rider</span>
                    <span className="font-medium">{order.riderName ?? "Unassigned"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{order.riderPhone ?? "-"}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Timeline</h4>
            <div className="space-y-1.5">
              {order.timeline.map((event, i) => (
                <div key={`${event.status}-${i}`} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {OPERATOR_STATUS_COPY[event.status]}
                    <span className="ml-1 text-[10px] opacity-70">({event.actor})</span>
                  </span>
                  <span className="font-medium">{formatTimestamp(event.at)}</span>
                </div>
              ))}
            </div>
          </div>

          {order.rejectionReason && (
            <div className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">
              Rejected: {order.rejectionReason}
            </div>
          )}

          <Separator />

          <WhatsAppPreview order={order} />

          {(actions.length > 0 || partnerNote) && (
            <div className="space-y-2 pt-2">
              {actions.length > 0 && (
                <div className="flex gap-2">
                  {actions.map((action) => (
                    <Button
                      key={action.status}
                      variant={action.tone === "danger" ? "destructive" : "default"}
                      className={`flex-1 ${TONE_CLASS[action.tone]}`}
                      onClick={() => {
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
                <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                  {partnerNote}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
