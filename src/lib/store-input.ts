/** SHARED CONTRACT — request shapes shared by the browser client and the
 *  server store. Kept separate from store.ts so client bundles never pull in
 *  `server-only`. */
import type {
  CustomerDetails,
  FulfilmentMode,
  MenuItem,
  Order,
  RestaurantCategory,
} from "./types";

export interface CreateOrderInput {
  restaurantId: string;
  items: { menuItemId: string; qty: number; notes?: string }[];
  mode: FulfilmentMode;
  customer: CustomerDetails;
  source?: Order["source"];
}

export interface CreateRestaurantInput {
  name: string;
  category: RestaurantCategory;
  cuisines: string[];
  area: string;
  address: string;
  phone: string;
  prepTimeMins: number;
  deliveryFee: number;
  minOrder: number;
  deliversTo: string[];
  supportsPickup: boolean;
  emoji?: string;
}

export type NewMenuItem = Omit<MenuItem, "id" | "restaurantId">;

/** One row of the Category B coverage check in the ops console. */
export interface CoverageReport {
  area: string;
  riders: string[];
  covered: boolean;
}
