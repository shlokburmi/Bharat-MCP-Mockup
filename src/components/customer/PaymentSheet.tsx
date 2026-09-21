"use client";

import { useState } from "react";
import { Button, Sheet, Spinner, cx, inputClass } from "@/components/ui/kit";
import { ApiError, payOrder } from "@/lib/api";
import { rupees } from "@/lib/format";
import type { Order, PaymentMethod } from "@/lib/types";

/**
 * Mock Razorpay checkout. Shape and pacing mirror the real sheet — the method
 * rail, an instrument to pick inside it, a processing beat, then success or a
 * decline the customer can retry. No card detail leaves this component.
 */

type Phase = "choose" | "processing" | "failed";

const UPI_APPS = [
  { id: "gpay", label: "Google Pay", emoji: "🟢", handle: "@okhdfcbank" },
  { id: "phonepe", label: "PhonePe", emoji: "🟣", handle: "@ybl" },
  { id: "paytm", label: "Paytm", emoji: "🔵", handle: "@paytm" },
  { id: "bhim", label: "BHIM", emoji: "🟠", handle: "@upi" },
];

const SAVED_CARDS = [
  { id: "c1", brand: "Visa", bank: "HDFC Bank", kind: "Credit", last4: "4242", expiry: "04/29" },
  { id: "c2", brand: "RuPay", bank: "ICICI Bank", kind: "Debit", last4: "8814", expiry: "11/27" },
];

const BANKS = [
  { id: "hdfc", label: "HDFC Bank", emoji: "🔵" },
  { id: "icici", label: "ICICI Bank", emoji: "🟠" },
  { id: "sbi", label: "State Bank of India", emoji: "🔷" },
  { id: "axis", label: "Axis Bank", emoji: "🟥" },
  { id: "kotak", label: "Kotak Mahindra", emoji: "🔴" },
  { id: "bob", label: "Bank of Baroda", emoji: "🟧" },
];

const WALLETS = [
  { id: "paytm", label: "Paytm Wallet", emoji: "🔵", balance: 128000 },
  { id: "phonepe", label: "PhonePe Wallet", emoji: "🟣", balance: 43500 },
  { id: "amazonpay", label: "Amazon Pay", emoji: "🟡", balance: 91000 },
];

const METHODS: { id: PaymentMethod; label: string; sub: string; emoji: string }[] = [
  { id: "upi", label: "UPI", sub: "Google Pay, PhonePe, Paytm, BHIM", emoji: "📲" },
  { id: "card", label: "Card", sub: "Credit or debit · Visa, Mastercard, RuPay", emoji: "💳" },
  { id: "netbanking", label: "Netbanking", sub: "All major Indian banks", emoji: "🏦" },
  { id: "wallet", label: "Wallet", sub: "Paytm, PhonePe, Amazon Pay", emoji: "👛" },
  { id: "cod", label: "Cash on delivery", sub: "Pay when it arrives", emoji: "💵" },
];

/** First digit is enough to name the network on a mock sheet. */
function cardBrand(number: string): string {
  const digits = number.replace(/\D/g, "");
  if (digits.startsWith("4")) return "Visa";
  if (digits.startsWith("5")) return "Mastercard";
  if (digits.startsWith("6")) return "RuPay";
  if (digits.startsWith("3")) return "Amex";
  return "Card";
}

function groupCardNumber(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

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
  const [vpa, setVpa] = useState("");
  const [cardId, setCardId] = useState<string>(SAVED_CARDS[0].id);
  const [newCard, setNewCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [bank, setBank] = useState(BANKS[0].id);
  const [wallet, setWallet] = useState(WALLETS[0].id);
  const [forceFailure, setForceFailure] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const codDisabled = order.mode === "pickup";
  const usingNewCard = cardId === "new";

  /** What the receipt, the SMS and the restaurant screen will say. */
  function instrument(): string {
    switch (method) {
      case "upi": {
        if (vpa.trim()) return `UPI · ${vpa.trim()}`;
        const app = UPI_APPS.find((a) => a.id === upiApp) ?? UPI_APPS[0];
        return `${app.label} · ${order.customer.name.split(" ")[0].toLowerCase()}${app.handle}`;
      }
      case "card": {
        if (usingNewCard) {
          const digits = newCard.number.replace(/\D/g, "");
          return `${cardBrand(newCard.number)} Card •••• ${digits.slice(-4) || "0000"}`;
        }
        const card = SAVED_CARDS.find((c) => c.id === cardId) ?? SAVED_CARDS[0];
        return `${card.bank} ${card.brand} ${card.kind} •••• ${card.last4}`;
      }
      case "netbanking":
        return `${BANKS.find((b) => b.id === bank)?.label ?? "Bank"} Netbanking`;
      case "wallet":
        return WALLETS.find((w) => w.id === wallet)?.label ?? "Wallet";
      case "cod":
        return "Cash on delivery";
    }
  }

  function validate(): string | null {
    if (method === "upi" && vpa.trim() && !/^[\w.-]{2,}@[a-z]{2,}$/i.test(vpa.trim())) {
      return "That UPI ID doesn't look right — try name@bank.";
    }
    if (method === "card" && usingNewCard) {
      if (newCard.number.replace(/\D/g, "").length < 16) return "Enter a 16-digit card number.";
      if (!/^\d{2}\s?\/\s?\d{2}$/.test(newCard.expiry)) return "Expiry should be MM/YY.";
      if (!/^\d{3,4}$/.test(newCard.cvv)) return "CVV is 3 digits (4 on Amex).";
    }
    return null;
  }

  async function submit() {
    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }
    const detail = instrument();
    setPhase("processing");
    setError(null);
    await new Promise((r) => setTimeout(r, method === "cod" ? 900 : 1900));
    try {
      const next = await payOrder(order.id, method, forceFailure ? "failure" : "success", detail);
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

  const processingCopy: Record<PaymentMethod, string> = {
    upi: `Approve the ${rupees(order.totals.total)} request in ${
      UPI_APPS.find((a) => a.id === upiApp)?.label ?? "your UPI app"
    }`,
    card: "Verifying with your bank · 3-D Secure",
    netbanking: `Redirecting to ${BANKS.find((b) => b.id === bank)?.label ?? "your bank"}`,
    wallet: "Debiting your wallet",
    cod: "Confirming your order",
  };

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
          <p className="text-[15px] font-medium text-ink">{processingCopy[method]}</p>
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
                  <div key={m.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setMethod(m.id);
                        setError(null);
                      }}
                      className={cx(
                        "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                        selected
                          ? "border-brand bg-brand-soft"
                          : "border-line bg-surface hover:bg-canvas",
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
                          "size-4 shrink-0 rounded-full border-2",
                          selected ? "border-brand bg-brand" : "border-line-strong",
                        )}
                      />
                    </button>

                    {selected && !disabled && (
                      <div className="mt-2 mb-1 rounded-xl bg-canvas p-3">
                        {m.id === "upi" && (
                          <UpiPanel
                            app={upiApp}
                            onApp={setUpiApp}
                            vpa={vpa}
                            onVpa={setVpa}
                            amount={order.totals.total}
                          />
                        )}
                        {m.id === "card" && (
                          <CardPanel
                            cardId={cardId}
                            onCard={setCardId}
                            newCard={newCard}
                            onNewCard={setNewCard}
                          />
                        )}
                        {m.id === "netbanking" && <BankPanel bank={bank} onBank={setBank} />}
                        {m.id === "wallet" && (
                          <WalletPanel
                            wallet={wallet}
                            onWallet={setWallet}
                            total={order.totals.total}
                          />
                        )}
                        {m.id === "cod" && (
                          <p className="text-sm text-ink-soft">
                            Keep {rupees(order.totals.total)} ready. The restaurant confirms right
                            away and you pay the delivery partner.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {error && <p className="mt-3 text-sm text-bad">{error}</p>}

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
            <p className="mt-2 text-center text-xs text-ink-faint">
              🔒 Test mode — nothing is charged
            </p>
          </div>
        </>
      )}
    </Sheet>
  );
}

function UpiPanel({
  app,
  onApp,
  vpa,
  onVpa,
  amount,
}: {
  app: string;
  onApp: (id: string) => void;
  vpa: string;
  onVpa: (v: string) => void;
  amount: number;
}) {
  const [showQr, setShowQr] = useState(false);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {UPI_APPS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => {
              onApp(a.id);
              onVpa("");
            }}
            className={cx(
              "rounded-xl border px-1 py-2.5 text-center text-xs transition-colors",
              app === a.id && !vpa
                ? "border-brand bg-brand-soft text-brand"
                : "border-line bg-surface text-ink-soft hover:bg-canvas",
            )}
          >
            <span aria-hidden className="block text-lg">
              {a.emoji}
            </span>
            {a.label}
          </button>
        ))}
      </div>

      <input
        className={inputClass}
        placeholder="Or enter UPI ID — name@bank"
        value={vpa}
        onChange={(e) => onVpa(e.target.value)}
        inputMode="email"
      />

      <button
        type="button"
        onClick={() => setShowQr((v) => !v)}
        className="text-sm font-medium text-brand"
      >
        {showQr ? "Hide QR" : "Show QR code instead"}
      </button>

      {showQr && (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-surface p-4">
          <QrBlock />
          <p className="text-xs text-ink-faint">
            Scan with any UPI app to pay{" "}
            <span className="tabular-nums">{rupees(amount)}</span>
          </p>
        </div>
      )}
    </div>
  );
}

/** A deterministic checkerboard that reads as a QR without pretending to be one. */
function QrBlock() {
  const cells = Array.from({ length: 121 }, (_, i) => {
    const x = i % 11;
    const y = Math.floor(i / 11);
    const corner = (x < 3 && y < 3) || (x > 7 && y < 3) || (x < 3 && y > 7);
    return corner || (x * 7 + y * 13 + x * y) % 3 === 0;
  });
  return (
    <div aria-hidden className="grid grid-cols-11 gap-px rounded-lg bg-surface p-1">
      {cells.map((on, i) => (
        <span key={i} className={cx("size-2.5 rounded-[1px]", on ? "bg-ink" : "bg-transparent")} />
      ))}
    </div>
  );
}

function CardPanel({
  cardId,
  onCard,
  newCard,
  onNewCard,
}: {
  cardId: string;
  onCard: (id: string) => void;
  newCard: { number: string; expiry: string; cvv: string; name: string };
  onNewCard: (c: { number: string; expiry: string; cvv: string; name: string }) => void;
}) {
  return (
    <div className="space-y-2">
      {SAVED_CARDS.map((card) => (
        <button
          key={card.id}
          type="button"
          onClick={() => onCard(card.id)}
          className={cx(
            "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
            cardId === card.id ? "border-brand bg-brand-soft" : "border-line bg-surface",
          )}
        >
          <span aria-hidden className="text-lg">
            💳
          </span>
          <span className="flex-1">
            <span className="block text-sm font-medium text-ink">
              {card.brand} •••• {card.last4}
            </span>
            <span className="block text-xs text-ink-faint">
              {card.bank} {card.kind} · expires {card.expiry}
            </span>
          </span>
          <span
            className={cx(
              "size-4 shrink-0 rounded-full border-2",
              cardId === card.id ? "border-brand bg-brand" : "border-line-strong",
            )}
          />
        </button>
      ))}

      {cardId !== "new" && (
        <label className="flex items-center gap-2 px-1 text-xs text-ink-faint">
          CVV
          <input
            className="w-16 rounded-lg bg-surface px-2 py-1 text-center text-sm ring-1 ring-line-strong ring-inset"
            maxLength={4}
            inputMode="numeric"
            defaultValue="123"
            aria-label="CVV for the saved card"
          />
        </label>
      )}

      <button
        type="button"
        onClick={() => onCard("new")}
        className={cx(
          "w-full rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors",
          cardId === "new" ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface text-ink-soft",
        )}
      >
        + Use a different card
      </button>

      {cardId === "new" && (
        <div className="space-y-2 pt-1">
          <div className="relative">
            <input
              className={inputClass}
              placeholder="1234 5678 9012 3456"
              inputMode="numeric"
              value={newCard.number}
              onChange={(e) => onNewCard({ ...newCard, number: groupCardNumber(e.target.value) })}
            />
            {newCard.number.length > 0 && (
              <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-ink-faint">
                {cardBrand(newCard.number)}
              </span>
            )}
          </div>
          <input
            className={inputClass}
            placeholder="Name on card"
            value={newCard.name}
            onChange={(e) => onNewCard({ ...newCard, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className={inputClass}
              placeholder="MM / YY"
              value={newCard.expiry}
              onChange={(e) => onNewCard({ ...newCard, expiry: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="CVV"
              maxLength={4}
              inputMode="numeric"
              value={newCard.cvv}
              onChange={(e) => onNewCard({ ...newCard, cvv: e.target.value.replace(/\D/g, "") })}
            />
          </div>
          <p className="text-xs text-ink-faint">
            Test mode — try 4111 1111 1111 1111. Nothing is stored or charged.
          </p>
        </div>
      )}
    </div>
  );
}

function BankPanel({ bank, onBank }: { bank: string; onBank: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {BANKS.map((b) => (
        <button
          key={b.id}
          type="button"
          onClick={() => onBank(b.id)}
          className={cx(
            "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
            bank === b.id ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface text-ink-soft",
          )}
        >
          <span aria-hidden>{b.emoji}</span>
          <span className="truncate">{b.label}</span>
        </button>
      ))}
    </div>
  );
}

function WalletPanel({
  wallet,
  onWallet,
  total,
}: {
  wallet: string;
  onWallet: (id: string) => void;
  total: number;
}) {
  return (
    <div className="space-y-2">
      {WALLETS.map((w) => {
        const short = w.balance < total;
        return (
          <button
            key={w.id}
            type="button"
            disabled={short}
            onClick={() => onWallet(w.id)}
            className={cx(
              "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
              wallet === w.id ? "border-brand bg-brand-soft" : "border-line bg-surface",
              short && "cursor-not-allowed opacity-45",
            )}
          >
            <span aria-hidden className="text-lg">
              {w.emoji}
            </span>
            <span className="flex-1 text-sm font-medium text-ink">{w.label}</span>
            <span className="text-xs tabular-nums text-ink-faint">
              {short ? "Low balance · " : "Balance "}
              {rupees(w.balance)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
