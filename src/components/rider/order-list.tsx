"use client";

import { Order } from "@/types";
import { DeliveryCard } from "./delivery-card";
import { Separator } from "@/components/ui/separator";

interface OrderListProps {
  availableOrders: Order[];
  completedOrders: Order[];
  onAcceptOrder: (orderId: string) => void;
}

export function OrderList({
  availableOrders,
  completedOrders,
  onAcceptOrder,
}: OrderListProps) {
  return (
    <div className="space-y-6">
      {/* Available Orders Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Available Orders</h2>
          {availableOrders.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {availableOrders.length}
            </span>
          )}
        </div>

        {availableOrders.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p className="text-2xl mb-2">&#x1F4ED;</p>
            <p>No available orders right now</p>
            <p className="text-xs mt-1">New orders will appear here when ready</p>
          </div>
        ) : (
          <div className="space-y-2">
            {availableOrders.map((order) => (
              <DeliveryCard
                key={order.id}
                order={order}
                actionLabel="Accept Delivery"
                onAction={() => onAcceptOrder(order.id)}
              />
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* Completed Orders Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Completed Today</h2>
          {completedOrders.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {completedOrders.length}
            </span>
          )}
        </div>

        {completedOrders.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p className="text-2xl mb-2">&#x1F3C1;</p>
            <p>No deliveries completed yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {completedOrders.map((order) => (
              <DeliveryCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
