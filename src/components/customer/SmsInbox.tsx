"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge, Button, Card, cx, inputClass } from "@/components/ui/kit";
import { SmsBubble } from "./SmsTracker";
import { SMS_SENDER, smsInbox } from "@/lib/sms";
import { useLiveOrders } from "@/lib/use-live-order";

const DEMO_PHONE = "+91 98867 40021";

/**
 * The customer's phone, on the web. Everything the platform texts about an
 * order shows up here as it happens — the tracking a customer gets when they
 * are not inside the assistant.
 */
export function SmsInbox() {
  const params = useSearchParams();
  const [phone, setPhone] = useState(params.get("phone") ?? DEMO_PHONE);
  const [query, setQuery] = useState(phone);

  // Polls the same store every other surface reads, filtered to this number.
  const { orders, loading } = useLiveOrders({ phone: query }, 3000);
  const messages = smsInbox(orders);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-4 pb-8">
      <header className="mb-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span
            aria-hidden
            className="shadow-soft grid size-7 place-items-center rounded-xl bg-brand text-sm text-white"
          >
            B
          </span>
          <span className="text-sm font-semibold text-ink">Bharat MCP</span>
        </Link>
        <span className="text-xs text-ink-faint">SMS tracker</span>
      </header>

      <Card className="mb-3 p-3.5">
        <p className="text-sm font-semibold text-ink">Order updates by SMS</p>
        <p className="mt-0.5 text-sm text-ink-soft">
          Every stage of an order is texted to the number on it. Enter that number to watch the
          messages land.
        </p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(phone.trim());
          }}
        >
          <input
            className={cx(inputClass, "flex-1")}
            placeholder="Phone number"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button type="submit">Track</Button>
        </form>
      </Card>

      <Phone>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{SMS_SENDER}</p>
            <p className="truncate text-xs text-ink-faint">{query || "no number"}</p>
          </div>
          {!loading && messages.length > 0 && (
            <Badge tone="good">
              <span className="animate-pulse-dot size-1.5 rounded-full bg-good" />
              Live
            </Badge>
          )}
        </div>

        <div className="scroll-slim max-h-[60vh] min-h-64 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="py-14 text-center">
              <span aria-hidden className="text-3xl">
                📭
              </span>
              <p className="mt-3 text-sm font-medium text-ink">
                {loading ? "Checking for messages…" : "No messages for this number yet"}
              </p>
              <p className="mx-auto mt-1 max-w-[16rem] text-xs text-ink-soft">
                Place an order in the assistant chat with this phone number and every update will
                appear here.
              </p>
              <Link
                href="/chat"
                className="mt-5 inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
              >
                Open the chat
              </Link>
            </div>
          ) : (
            <ol className="space-y-3">
              {messages.map((msg) => (
                <SmsBubble key={msg.id} message={msg} />
              ))}
            </ol>
          )}
        </div>
      </Phone>

      {orders.length > 0 && (
        <p className="mt-3 text-center text-xs text-ink-faint">
          {messages.length} messages across {orders.length} order
          {orders.length === 1 ? "" : "s"} · updates every few seconds
        </p>
      )}
    </main>
  );
}

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="shadow-lift overflow-hidden rounded-[2rem] bg-surface p-2 ring-1 ring-ink/[0.06]">
      <div className="overflow-hidden rounded-[1.6rem] bg-canvas">{children}</div>
    </div>
  );
}
