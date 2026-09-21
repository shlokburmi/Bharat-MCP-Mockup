"use client";

import { useState } from "react";
import { Restaurant } from "@/lib/types";
import { LoginScreen } from "@/components/restaurant/login-screen";
import { OrderInbox } from "@/components/restaurant/order-inbox";

export default function RestaurantPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  if (!restaurant) {
    return <LoginScreen onLogin={setRestaurant} />;
  }

  return (
    <OrderInbox
      restaurant={restaurant}
      onLogout={() => setRestaurant(null)}
    />
  );
}
