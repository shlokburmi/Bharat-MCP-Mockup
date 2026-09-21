"use client";

import { useState } from "react";
import { Button, Sheet, Spinner, cx, inputClass } from "@/components/ui/kit";
import { ApiError, payOrder } from "@/lib/api";
import { rupees } from "@/lib/format";
import type { Order, PaymentMethod } from "@/lib/types";

/**
 * Mock Razorpay checkout. Shape and pacing mirror the real sheet — method
 * list, a processing beat, then success or a decline the customer can retry.
 */

type Phase = "choose" | "processing" | "failed";

const UPI_APPS = [
  { id: "gpay", label: "Google Pay", emoji: "🟢" },
  { id: "phonepe", label: "PhonePe", emoji: "🟣" },
  { id: "paytm", label: "Paytm", emoji: "🔵" },
];

const METHODS: { id: PaymentMethod; label: string; sub: string; emoji: string }[] = [
  { id: "upi", label: "UPI", sub: "Pay by any UPI app", emoji: "📲" },
  { id: "card", label: "Card", sub: "Credit or debit", emoji: "💳" },
  { id: "cod", label: "Cash on delivery", sub: "Pay when it arrives", emoji: "💵" },
];

export function PaymentSheet({
  order,
  open,
  onClose,
  onPaid,
}: {
  order: Order;
  open: boolean;
  onClose: () => void;
  onPaid: (order: Order) => void;
}) {
  const [phase, setPhase] = useState<Phase>("choose");
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [upiApp, setUpiApp] = useState(UPI_APPS[0].id);
  const [forceFailure, setForceFailure] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const codDisabled = order.mode === "pickup";

  async function submit() {
    setPhase("processing");
    setError(null);
    await new Promise((r) => setTimeout(r, method === "cod" ? 900 : 1900));
    try {
      const next = await payOrder(order.id, method, forceFailure ? "failure" : "success");
      if (next.status === "payment_failed") {
        setPhase("failed");
        return;
      }
      onPaid(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Payment could not be processed");
      setPhase("failed");
    }
  }

  function reset() {
    setPhase("choose");
    setError(null);
  }

  return (
    <Sheet open={open} onClose={phase === "processing" ? undefined : onClose} title="Payment">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">Razorpay</p>
          <p className="text-sm text-ink-soft">{order.restaurantName}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold tabular-nums text-ink">{rupees(order.totals.total)}</p>
          <p className="text-xs text-ink-faint">{order.code}</p>
        </div>
      </div>

      {phase === "processing" && (
        <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
          <Spinner className="size-7 text-brand" />
          <p className="text-[15px] font-medium text-ink">
            {method === "cod" ? "Confirming your order" : "Waiting for your bank"}
          </p>
          <p className="text-sm text-ink-faint">Do not close this window</p>
        </div>
      )}

      {phase === "failed" && (
        <div className="px-5 py-8 text-center">
          <span aria-hidden className="text-4xl">
            ⚠️
          </span>
          <p className="mt-3 text-[15px] font-semibold text-ink">Payment failed</p>
          <p className="mt-1 text-sm text-ink-soft">
            {error ?? "Your bank declined the transaction. No money was deducted."}
          </p>
          <div className="mt-6 flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button className="flex-1" onClick={reset}>
              Try again
            </Button>
          </div>
        </div>
      )}

      {phase === "choose" && (
        <>
          <div className="max-h-[52vh] overflow-y-auto px-5 py-4">
            <p className="mb-2 text-xs font-medium tracking-wide text-ink-faint uppercase">
              Pay using
            </p>
            <div className="space-y-2">
              {METHODS.map((m) => {
                const disabled = m.id === "cod" && codDisabled;
                const selected = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setMethod(m.id)}
                    className={cx(
                      "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                      selected ? "border-brand bg-brand-soft" : "border-line bg-surface hover:bg-canvas",
                      disabled && "cursor-not-allowed opacity-45",
                    )}
                  >
                    <span aria-hidden className="text-xl">
                      {m.emoji}
                    </span>
                    <span className="flex-1">
                      <span className="block text-[15px] font-medium text-ink">{m.label}</span>
                      <span className="block text-sm text-ink-faint">
                        {disabled ? "Not available for pickup orders" : m.sub}
                      </span>
                    </span>
                    <span
                      className={cx(
                        "size-4 rounded-full border-2",
                        selected ? "border-brand bg-brand" : "border-line-strong",
                      )}
                    />
                  </button>
                );
              })}
            </div>

            {method === "upi" && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium tracking-wide text-ink-faint uppercase">
                  Choose an app
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {UPI_APPS.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setUpiApp(app.id)}
                      className={cx(
                        "rounded-xl border px-2 py-3 text-center text-sm transition-colors",
                        upiApp === app.id
                          ? "border-brand bg-brand-soft text-brand"
                          : "border-line bg-surface text-ink-soft hover:bg-canvas",
                      )}
                    >
                      <span aria-hidden className="block text-lg">
                        {app.emoji}
                      </span>
                      {app.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {method === "card" && (
              <div className="mt-4 space-y-2">
                <input className={inputClass} placeholder="Card number" inputMode="numeric" defaultValue="4111 1111 1111 1111" />
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputClass} placeholder="MM / YY" defaultValue="04 / 29" />
                  <input className={inputClass} placeholder="CVV" defaultValue="123" />
                </div>
                <p className="text-xs text-ink-faint">Test card, prefilled for the demo.</p>
              </div>
            )}

            {method === "cod" && (
              <p className="mt-4 rounded-xl bg-canvas px-3.5 py-3 text-sm text-ink-soft">
                Keep {rupees(order.totals.total)} ready. The restaurant confirms the order right
                away and you pay on delivery.
              </p>
            )}

            <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs text-ink-faint">
              <input
                type="checkbox"
                checked={forceFailure}
                onChange={(e) => setForceFailure(e.target.checked)}
                className="accent-brand"
              />
              Demo: simulate a declined payment
            </label>
          </div>

          <div className="border-t border-line px-5 py-4">
            <Button size="lg" className="w-full" onClick={submit}>
              {method === "cod" ? "Confirm order" : `Pay ${rupees(order.totals.total)}`}
            </Button>
          </div>
        </>
      )}
    </Sheet>
  );
}
