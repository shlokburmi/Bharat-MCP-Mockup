import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ops Console — Bharat MCP",
  description: "Internal ops team dashboard for restaurant onboarding, menu management, and order oversight",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-6">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight">Bharat MCP</span>
            <span className="text-sm text-muted-foreground">—</span>
            <span className="text-sm font-medium text-muted-foreground">Ops Console</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}
