import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rider - Bharat MCP",
  description: "Delivery partner interface",
};

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
