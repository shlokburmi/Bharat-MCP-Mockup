import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Restaurant Dashboard - Bharat MCP",
  description: "Manage your restaurant orders on Bharat MCP",
};

export default function RestaurantLayout({ children }: LayoutProps<"/restaurant">) {
  return <>{children}</>;
}
