"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Spinner, VegDot, cx, inputClass } from "@/components/ui/kit";
import { fetchRestaurant } from "@/lib/api";
import { rupees } from "@/lib/format";
import type { CustomerDetails, FulfilmentMode, MenuItem, Restaurant, SearchResult } from "@/lib/types";

/** The tool-call pill. Sells the "your assistant is calling an MCP server"
 *  story without pretending to be a real protocol trace. */
export function ToolCall({
  name,
  args,
  status,
  summary,
}: {
  name: string;
  args: string;
  status: "running" | "done";
  summary?: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-line bg-surface px-3 py-2 font-mono text-xs text-ink-soft">
      {status === "running" ? (
        <Spinner className="mt-0.5 size-3 text-brand" />
      ) : (
        <span aria-hidden className="mt-0.5 text-good">
          ✓
        </span>
      )}
      <div className="min-w-0">
        <span className="text-ink">bharat_mcp.{name}</span>
        <span className="text-ink-faint">({args})</span>
        {summary && <div className="mt-0.5 text-ink-faint">{summary}</div>}
      </div>
    </div>
  );
}

export function ResultCards({
  results,
  onAdd,
}: {
  results: SearchResult[];
  onAdd: (restaurant: Restaurant, item: MenuItem) => void;
}) {
  return (
    <div className="space-y-2">
      {results.map((r) => (
        <ResultCard key={r.restaurant.id} result={r} onAdd={onAdd} />
      ))}
    </div>
  );
}

function ResultCard({
  result,
  onAdd,
}: {
  result: SearchResult;
  onAdd: (restaurant: Restaurant, item: MenuItem) => void;
}) {
  const { restaurant } = result;
  const [fullMenu, setFullMenu] = useState<MenuItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const items = fullMenu ?? result.items;

  async function loadMenu() {
    setLoading(true);
    try {
      const data = await fetchRestaurant(restaurant.id);
      setFullMenu(data.menu);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-3 p-3.5">
        <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-xl bg-canvas text-xl">
          {restaurant.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h3 className="truncate text-[15px] font-semibold text-ink">{restaurant.name}</h3>
            <span className="shrink-0 text-sm text-ink-soft">{restaurant.rating}★</span>
          </div>
          <p className="truncate text-sm text-ink-faint">
            {restaurant.cuisines.join(" · ")} · {restaurant.area}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge>{restaurant.prepTimeMins} min</Badge>
            <Badge>{rupees(restaurant.deliveryFee)} delivery</Badge>
            {restaurant.supportsPickup && <Badge tone="good">Pickup</Badge>}
          </div>
        </div>
      </div>

      <ul className="divide-y divide-line border-t border-line">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-3.5 py-2.5">
            <VegDot veg={item.veg} />
            <div className="min-w-0 flex-1">
              <p className={cx("truncate text-sm font-medium", item.available ? "text-ink" : "text-ink-faint line-through")}>
                {item.name}
              </p>
              <p className="truncate text-xs text-ink-faint">{item.description}</p>
            </div>
            <span className="shrink-0 text-sm tabular-nums text-ink-soft">{rupees(item.price)}</span>
            <button
              type="button"
              disabled={!item.available}
              onClick={() => onAdd(restaurant, item)}
              className={cx(
                "shrink-0 rounded-lg border px-2.5 py-1 text-sm font-medium transition-colors",
                item.available
                  ? "border-brand/30 bg-brand-soft text-brand hover:bg-brand hover:text-white"
                  : "cursor-not-allowed border-line text-ink-faint",
              )}
            >
              {item.available ? "Add" : "Sold out"}
            </button>
          </li>
        ))}
      </ul>

      {!fullMenu && (
        <button
          type="button"
          onClick={loadMenu}
          className="w-full border-t border-line py-2 text-sm text-ink-soft hover:bg-canvas"
        >
          {loading ? "Loading menu…" : "See full menu"}
        </button>
      )}
    </Card>
  );
}

export interface DraftLine {
  item: MenuItem;
  qty: number;
}

export function CartCard({
  restaurant,
  lines,
  onQty,
  onContinue,
}: {
  restaurant: Restaurant;
  lines: DraftLine[];
  onQty: (menuItemId: string, qty: number) => void;
  onContinue: () => void;
}) {
  const subtotal = lines.reduce((sum, l) => sum + l.item.price * l.qty, 0);
  const short = restaurant.minOrder - subtotal;

  return (
    <Card className="p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Your order · {restaurant.name}</h3>
        <span className="text-sm tabular-nums text-ink-soft">{rupees(subtotal)}</span>
      </div>
      <ul className="divide-y divide-line border-t border-line">
        {lines.map(({ item, qty }) => (
          <li key={item.id} className="flex items-center gap-3 py-2.5">
            <VegDot veg={item.veg} />
            <span className="min-w-0 flex-1 truncate text-sm text-ink">{item.name}</span>
            <div className="flex items-center gap-1 rounded-lg border border-line-strong">
              <button
                type="button"
                aria-label={`Remove one ${item.name}`}
                onClick={() => onQty(item.id, qty - 1)}
                className="px-2 py-0.5 text-ink-soft hover:text-ink"
              >
                −
              </button>
              <span className="w-5 text-center text-sm tabular-nums">{qty}</span>
              <button
                type="button"
                aria-label={`Add one ${item.name}`}
                onClick={() => onQty(item.id, qty + 1)}
                className="px-2 py-0.5 text-ink-soft hover:text-ink"
              >
                +
              </button>
            </div>
            <span className="w-16 shrink-0 text-right text-sm tabular-nums text-ink-soft">
              {rupees(item.price * qty)}
            </span>
          </li>
        ))}
      </ul>
      {short > 0 ? (
        <p className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
          Add {rupees(short)} more — {restaurant.name} has a {rupees(restaurant.minOrder)} minimum.
        </p>
      ) : (
        <Button className="mt-3 w-full" onClick={onContinue}>
          Continue
        </Button>
      )}
    </Card>
  );
}

const AREA_OPTIONS = [
  "Koramangala",
  "Indiranagar",
  "HSR Layout",
  "Jayanagar",
  "JP Nagar",
  "Whitefield",
  "Malleshwaram",
  "Bellandur",
];

export function CheckoutForm({
  restaurant,
  defaultArea,
  submitting,
  onSubmit,
}: {
  restaurant: Restaurant;
  defaultArea: string;
  submitting: boolean;
  onSubmit: (details: CustomerDetails, mode: FulfilmentMode) => void;
}) {
  const [mode, setMode] = useState<FulfilmentMode>("delivery");
  const [details, setDetails] = useState<CustomerDetails>({
    name: "Ananya Rao",
    phone: "+91 98867 40021",
    address: "402, Brigade Sunrise, 5th Block",
    area: defaultArea,
    landmark: "Opposite Jyoti Nivas College",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const canDeliver = restaurant.deliversTo.includes(details.area);
  // Coverage is a function of the current selection, so derive it rather than
  // mirroring it into state.
  const coverageError =
    mode === "delivery" && !canDeliver
      ? `${restaurant.name} doesn't deliver to ${details.area}.`
      : null;
  const error = coverageError ?? formError;

  function submit() {
    if (!details.name.trim() || !details.phone.trim()) {
      setFormError("Name and phone are needed so the restaurant can reach you.");
      return;
    }
    if (mode === "delivery" && !details.address.trim()) {
      setFormError("Add a delivery address.");
      return;
    }
    setFormError(null);
    if (coverageError) return;
    onSubmit(details, mode);
  }

  return (
    <Card className="space-y-3 p-3.5">
      <h3 className="text-sm font-semibold text-ink">Where should this go?</h3>

      <div className="grid grid-cols-2 gap-2">
        {(["delivery", "pickup"] as FulfilmentMode[]).map((m) => {
          const disabled = m === "pickup" && !restaurant.supportsPickup;
          return (
            <button
              key={m}
              type="button"
              disabled={disabled}
              onClick={() => setMode(m)}
              className={cx(
                "rounded-xl border px-3 py-2.5 text-sm font-medium capitalize transition-colors",
                mode === m ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface text-ink-soft",
                disabled && "cursor-not-allowed opacity-45",
              )}
            >
              {m === "pickup" ? "Pickup" : "Delivery"}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          className={inputClass}
          placeholder="Name"
          value={details.name}
          onChange={(e) => setDetails({ ...details, name: e.target.value })}
        />
        <input
          className={inputClass}
          placeholder="Phone"
          value={details.phone}
          onChange={(e) => setDetails({ ...details, phone: e.target.value })}
        />
      </div>

      {mode === "delivery" && (
        <>
          <input
            className={inputClass}
            placeholder="Flat, building, street"
            value={details.address}
            onChange={(e) => setDetails({ ...details, address: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              className={inputClass}
              value={details.area}
              onChange={(e) => setDetails({ ...details, area: e.target.value })}
            >
              {AREA_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <input
              className={inputClass}
              placeholder="Landmark"
              value={details.landmark ?? ""}
              onChange={(e) => setDetails({ ...details, landmark: e.target.value })}
            />
          </div>
        </>
      )}

      {mode === "pickup" && (
        <p className="rounded-lg bg-canvas px-3 py-2 text-sm text-ink-soft">
          Collect from {restaurant.address}
        </p>
      )}

      {error && <p className="text-sm text-bad">{error}</p>}

      <Button className="w-full" loading={submitting} onClick={submit}>
        Generate payment link
      </Button>
    </Card>
  );
}

export function OrderLinkCard({
  orderId,
  code,
  total,
  restaurantName,
}: {
  orderId: string;
  code: string;
  total: number;
  restaurantName: string;
}) {
  const [copied, setCopied] = useState(false);
  const href = `/order/${orderId}`;

  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}${href}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Card className="overflow-hidden border-brand/25">
      <div className="flex items-center gap-3 bg-brand-soft px-3.5 py-3">
        <span aria-hidden className="text-xl">
          🔗
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-ink">{restaurantName}</p>
          <p className="text-sm text-ink-soft">
            {code} · <span className="tabular-nums">{rupees(total)}</span>
          </p>
        </div>
      </div>
      <div className="space-y-2 p-3.5">
        <p className="text-sm text-ink-soft">
          Pay within 30 minutes and the restaurant starts cooking. The same link turns into live
          tracking.
        </p>
        <div className="flex gap-2">
          <Link
            href={href}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-brand font-medium text-white hover:bg-brand-dark"
          >
            Open payment link
          </Link>
          <Button variant="secondary" onClick={copy}>
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
