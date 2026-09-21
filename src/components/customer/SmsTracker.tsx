"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Card, cx } from "@/components/ui/kit";
import { timeOfDay } from "@/lib/format";
import { SMS_SENDER, smsFeed, type SmsMessage } from "@/lib/sms";
import type { Order } from "@/lib/types";

/**
 * The same order, told over SMS. Not every customer stays in the assistant —
 * the texts are what they actually get on their phone, so the mockup shows
 * them rather than claiming they were sent.
 */
export function SmsTracker({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const feed = smsFeed(order);
  const latest = feed[feed.length - 1];

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-xl bg-canvas text-lg">
          💬
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink">SMS updates</span>
            <Badge tone="good">{feed.length} sent</Badge>
          </span>
          <span className="block truncate text-xs text-ink-faint">
            {latest ? latest.body : `Texting ${order.customer.phone}`}
          </span>
        </span>
        <span aria-hidden className={cx("text-ink-faint transition-transform", open && "rotate-180")}>
          ⌄
        </span>
      </button>

      {open && (
        <div className="border-t border-line bg-canvas px-4 py-4">
          <p className="mb-3 text-center text-xs text-ink-faint">
            {SMS_SENDER} → {order.customer.phone}
          </p>
          <ol className="space-y-2.5">
            {feed.map((msg) => (
              <SmsBubble key={msg.id} message={msg} />
            ))}
          </ol>
          <Link
            href={`/sms?phone=${encodeURIComponent(order.customer.phone)}`}
            className="mt-4 block text-center text-sm font-medium text-brand"
          >
            Open the SMS tracker →
          </Link>
        </div>
      )}
    </Card>
  );
}

export function SmsBubble({ message }: { message: SmsMessage }) {
  return (
    <li className="max-w-[92%]">
      <div className="shadow-soft rounded-2xl rounded-bl-md bg-surface px-3.5 py-2.5">
        <p className="text-[13px] leading-relaxed whitespace-pre-line text-ink">{message.body}</p>
        {message.href && (
          <Link href={message.href} className="mt-1 block text-[13px] font-medium text-brand">
            Open tracking link
          </Link>
        )}
      </div>
      <p className="mt-1 pl-1 text-[11px] text-ink-faint">{timeOfDay(message.at)}</p>
    </li>
  );
}
