"use client";

import { Order, OrderStatus } from "@/lib/types";
import { riderActions } from "@/lib/operator-actions";
import { rupees } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "cn";

interface ActiveDeliveryProps {
  order: Order;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
}

const TIMELINE_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "ready", label: "Restaurant" },
  { status: "picked_up", label: "Picked Up" },
  { status: "out_for_delivery", label: "On the Way" },
  { status: "delivered", label: "Delivered" },
];

function getStepIndex(status: OrderStatus): number {
  const idx = TIMELINE_STEPS.findIndex((s) => s.status === status);
  // accepted / preparing are still "at the restaurant" from the rider's side
  return idx >= 0 ? idx : 0;
}

export function ActiveDelivery({ order, onUpdateStatus }: ActiveDeliveryProps) {
  const currentStep = getStepIndex(order.status);
  const [action] = riderActions(order);
  const itemCount = order.items.reduce((sum, i) => sum + i.qty, 0);
  const waiting = !action;

  return (
    <Card className="border-2 border-emerald-200 bg-emerald-50/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge className="bg-emerald-600 text-white text-xs">Active Delivery</Badge>
          <span className="text-xs text-muted-foreground font-mono">{order.code}</span>
        </div>
        <CardTitle className="text-xl mt-1">{order.restaurantName}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between px-1">
          {TIMELINE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            return (
              <div key={step.status} className="flex flex-col items-center gap-1.5 flex-1">
                <div className="relative flex items-center w-full justify-center">
                  {idx > 0 && (
                    <div
                      className={cn(
                        "absolute right-1/2 h-0.5 w-full",
                        isCompleted || isCurrent ? "bg-emerald-500" : "bg-muted",
                      )}
                    />
                  )}
                  <div
                    className={cn(
                      "relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2",
                      isCompleted
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : isCurrent
                          ? "bg-white border-emerald-500 text-emerald-600"
                          : "bg-muted border-muted-foreground/20 text-muted-foreground",
                    )}
                  >
                    {isCompleted ? "✓" : idx + 1}
                  </div>
                </div>
                <span
                  className={cn(
                    "text-[10px] text-center leading-tight",
                    isCurrent
                      ? "font-semibold text-emerald-700"
                      : isCompleted
                        ? "text-emerald-600"
                        : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <Separator />

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Pickup from
          </p>
          <p className="font-semibold">{order.restaurantName}</p>
          <p className="text-sm text-muted-foreground">{order.code}</p>
        </div>

        <Separator />

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Deliver to
          </p>
          <p className="font-semibold">{order.customer.name}</p>
          <p className="text-sm text-muted-foreground">
            {order.customer.address}, {order.customer.area}
            {order.customer.landmark && ` (${order.customer.landmark})`}
          </p>
          <a
            href={`tel:${order.customer.phone.replace(/\s/g, "")}`}
            className="text-sm font-medium text-brand"
          >
            Call {order.customer.phone}
          </a>
          {order.paymentMethod === "cod" && (
            <Badge variant="destructive" className="mt-1 text-xs">
              Collect {rupees(order.totals.total)} (COD)
            </Badge>
          )}
        </div>

        <Separator />

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Order Summary
          </p>
          {order.items.map((item) => (
            <div key={item.menuItemId} className="flex justify-between text-sm">
              <span>
                {item.qty}x {item.name}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {rupees(item.qty * item.price)}
              </span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-semibold pt-1 border-t mt-1">
            <span>
              {itemCount} item{itemCount !== 1 ? "s" : ""} total
            </span>
            <span className="tabular-nums">{rupees(order.totals.total)}</span>
          </div>
        </div>

        {action ? (
          <Button
            className={cn(
              "w-full h-14 text-lg font-bold rounded-xl",
              action.status === "delivered"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white",
            )}
            onClick={() => onUpdateStatus(order.id, action.status)}
          >
            {action.label}
          </Button>
        ) : (
          waiting && (
            <p className="rounded-xl bg-muted px-3 py-3 text-center text-sm text-muted-foreground">
              The restaurant is still preparing this order. You can collect it once it is marked
              ready.
            </p>
          )
        )}
      </CardContent>
    </Card>
  );
}
