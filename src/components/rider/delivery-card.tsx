"use client";

import { useState } from "react";
import { Order } from "@/lib/types";
import { OPERATOR_STATUS_COPY } from "@/lib/state-machine";
import { STATUS_PILL } from "@/lib/operator-actions";
import { rupees } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "cn";

interface DeliveryCardProps {
  order: Order;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: "default" | "outline" | "secondary" | "destructive";
}

export function DeliveryCard({
  order,
  actionLabel,
  onAction,
  actionVariant = "default",
}: DeliveryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const itemCount = order.items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <Card
      className="cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => setExpanded((prev) => !prev)}
    >
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate">{order.restaurantName}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {order.customer.area} · {order.code}
            </p>
          </div>
          <Badge className={cn("shrink-0 text-[10px]", STATUS_PILL[order.status])}>
            {OPERATOR_STATUS_COPY[order.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </span>
          <span className="font-semibold tabular-nums">{rupees(order.totals.total)}</span>
        </div>

        {expanded && (
          <div className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
            <Separator />

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Items
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
            </div>

            <Separator />

            <div className="space-y-1 text-sm">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Customer
              </p>
              <p className="font-medium">{order.customer.name}</p>
              <p className="text-muted-foreground text-xs">
                {order.customer.address}, {order.customer.area}
              </p>
              <a
                href={`tel:${order.customer.phone.replace(/\s/g, "")}`}
                className="text-xs font-medium text-brand"
              >
                {order.customer.phone}
              </a>
            </div>

            <div className="space-y-1 text-sm">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Payment
              </p>
              <p>
                {order.paymentMethod === "cod"
                  ? `Cash on delivery — collect ${rupees(order.totals.total)}`
                  : `${order.paymentMethod?.toUpperCase() ?? "Prepaid"} (paid)`}
              </p>
            </div>

            {actionLabel && onAction && (
              <>
                <Separator />
                <Button
                  variant={actionVariant}
                  className="w-full h-11 text-base font-semibold"
                  onClick={onAction}
                >
                  {actionLabel}
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
