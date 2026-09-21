"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RestaurantList } from "@/components/admin/restaurant-list";
import { OrderOverview } from "@/components/admin/order-overview";
import { TestOrder } from "@/components/admin/test-order";
import { Store, ClipboardList, FlaskConical } from "lucide-react";

export default function AdminPage() {
  return (
    <Tabs defaultValue="restaurants">
      <TabsList>
        <TabsTrigger value="restaurants">
          <Store className="size-4" />
          Restaurants
        </TabsTrigger>
        <TabsTrigger value="orders">
          <ClipboardList className="size-4" />
          Orders
        </TabsTrigger>
        <TabsTrigger value="test-order">
          <FlaskConical className="size-4" />
          Test Order
        </TabsTrigger>
      </TabsList>

      <TabsContent value="restaurants">
        <RestaurantList />
      </TabsContent>

      <TabsContent value="orders">
        <OrderOverview />
      </TabsContent>

      <TabsContent value="test-order">
        <TestOrder />
      </TabsContent>
    </Tabs>
  );
}
