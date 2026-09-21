export type RestaurantCategory = "A" | "B";

export type OrderStatus =
  | "created"
  | "paid"
  | "sent_to_restaurant"
  | "accepted"
  | "rejected"
  | "preparing"
  | "ready"
  | "picked_up"
  | "out_for_delivery"
  | "delivered";

export type OrderType = "delivery" | "pickup";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  isVeg: boolean;
  isAvailable: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  category: RestaurantCategory;
  whatsappNumber: string;
  address: string;
  area: string;
  city: string;
  lat: number;
  lng: number;
  cuisine: string[];
  hours: { open: string; close: string };
  menu: MenuItem[];
  isActive: boolean;
  onboardedAt: string;
  coverageVerified?: boolean;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  isAvailable: boolean;
  currentOrderId?: string;
}

export interface Order {
  id: string;
  restaurantId: string;
  restaurantName: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: { menuItemId: string; name: string; quantity: number; price: number }[];
  totalAmount: number;
  status: OrderStatus;
  orderType: OrderType;
  category: RestaurantCategory;
  riderId?: string;
  riderName?: string;
  paymentMethod: "upi" | "cod";
  createdAt: string;
  paidAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  pickedUpAt?: string;
  outForDeliveryAt?: string;
  deliveredAt?: string;
  rejectionReason?: string;
  dynamicLinkExpiresAt: string;
}

export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  created: ["paid"],
  paid: ["sent_to_restaurant"],
  sent_to_restaurant: ["accepted", "rejected"],
  accepted: ["preparing"],
  rejected: [],
  preparing: ["ready"],
  ready: ["picked_up", "out_for_delivery"],
  picked_up: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  created: "Order Created",
  paid: "Payment Received",
  sent_to_restaurant: "Sent to Restaurant",
  accepted: "Accepted",
  rejected: "Rejected",
  preparing: "Preparing",
  ready: "Ready for Pickup",
  picked_up: "Picked Up",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  created: "bg-gray-100 text-gray-700",
  paid: "bg-blue-100 text-blue-700",
  sent_to_restaurant: "bg-yellow-100 text-yellow-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  preparing: "bg-orange-100 text-orange-700",
  ready: "bg-emerald-100 text-emerald-700",
  picked_up: "bg-cyan-100 text-cyan-700",
  out_for_delivery: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-800",
};
