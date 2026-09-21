import Link from "next/link";
import { OrderExperience } from "@/components/customer/OrderExperience";
import { DemoControls } from "@/components/customer/DemoControls";
import { getOrder } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = getOrder(id);
  return {
    title: order ? `${order.code} · ${order.restaurantName}` : "Order not found",
    description: order ? `Your order from ${order.restaurantName}` : undefined,
  };
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Rendered on the server so the link opens with the order already on screen,
  // then the client takes over polling for live updates. A miss is not a 404:
  // deployed serverless this instance may simply never have seen the order, so
  // the client restores it from its own cache — see `lib/order-cache.ts`.
  const order = getOrder(id);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-4 pb-6">
      <header className="mb-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span aria-hidden className="shadow-soft grid size-7 place-items-center rounded-xl bg-brand text-sm text-white">
            B
          </span>
          <span className="text-sm font-semibold text-ink">Bharat MCP</span>
        </Link>
        <span className="text-xs text-ink-faint">Secure order link</span>
      </header>

      <OrderExperience orderId={id} initialOrder={order} />
      <DemoControls orderId={id} />
    </main>
  );
}
