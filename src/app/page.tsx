import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Bharat MCP</h1>
        <p className="text-muted-foreground mt-2">
          Restaurant Ordering & Delivery — Mockup
        </p>
      </div>

      <div className="grid gap-4 w-full max-w-md">
        <Link
          href="/restaurant"
          className="flex flex-col p-6 rounded-xl border bg-card hover:bg-accent transition-colors"
        >
          <span className="text-lg font-semibold">Restaurant Interface</span>
          <span className="text-sm text-muted-foreground">
            Order inbox, accept/reject, status updates
          </span>
        </Link>

        <Link
          href="/rider"
          className="flex flex-col p-6 rounded-xl border bg-card hover:bg-accent transition-colors"
        >
          <span className="text-lg font-semibold">Rider Interface</span>
          <span className="text-sm text-muted-foreground">
            Delivery partner — pickup & delivery tracking
          </span>
        </Link>

        <Link
          href="/admin"
          className="flex flex-col p-6 rounded-xl border bg-card hover:bg-accent transition-colors"
        >
          <span className="text-lg font-semibold">Ops Console</span>
          <span className="text-sm text-muted-foreground">
            Onboarding, menu builder, test orders
          </span>
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">
        Dev B surfaces — operator-facing
      </p>
    </div>
  );
}
