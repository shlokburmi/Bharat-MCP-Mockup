"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, cx, inputClass } from "@/components/ui/kit";
import { CartCard, CheckoutForm, OrderLinkCard, ResultCards, ToolCall, type DraftLine } from "./Cards";
import { ApiError, createOrder, searchRestaurants } from "@/lib/api";
import { rupees } from "@/lib/format";
import type {
  CustomerDetails,
  FulfilmentMode,
  MenuItem,
  Restaurant,
  SearchResult,
} from "@/lib/types";

/**
 * A stand-in for ChatGPT/Claude with the Bharat MCP server connected. Nothing
 * here talks to a model — the "tool calls" hit our own mock API — but it is the
 * fastest way to show what ordering through an assistant feels like.
 */

type Msg =
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "assistant"; text: string }
  | { id: string; kind: "tool"; name: string; args: string; status: "running" | "done"; summary?: string }
  | { id: string; kind: "results"; results: SearchResult[] }
  | { id: string; kind: "cart" }
  | { id: string; kind: "checkout" }
  | { id: string; kind: "link"; orderId: string; code: string; total: number; restaurantName: string };

interface Draft {
  restaurant: Restaurant;
  lines: DraftLine[];
}

const SUGGESTIONS = [
  "Best biryani near Koramangala",
  "Masala dosa for breakfast",
  "Something sweet for dessert",
  "Burgers under ₹400",
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const uid = () => Math.random().toString(36).slice(2, 9);

export function ChatSimulator() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [area, setArea] = useState("Koramangala");
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, draft]);

  const push = useCallback((msg: Msg) => setMessages((prev) => [...prev, msg]), []);

  /** Adds a message only if one of that kind isn't already on screen — the cart
   *  and checkout cards read from live state, so a second copy would confuse. */
  const pushOnce = useCallback((msg: Msg) => {
    setMessages((prev) => (prev.some((m) => m.kind === msg.kind) ? prev : [...prev, msg]));
  }, []);

  const finishTool = useCallback((id: string, summary: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id && m.kind === "tool" ? { ...m, status: "done", summary } : m)),
    );
  }, []);

  async function send(text: string) {
    const query = text.trim();
    if (!query || busy) return;
    setInput("");
    setBusy(true);
    push({ id: uid(), kind: "user", text: query });

    await wait(450);
    const toolId = uid();
    push({
      id: toolId,
      kind: "tool",
      name: "search_restaurants",
      args: `query: "${query}", area: "${area}"`,
      status: "running",
    });

    try {
      const results = await searchRestaurants(query, { area, limit: 5 });
      await wait(650);
      finishTool(toolId, `${results.length} restaurants`);

      if (!results.length) {
        push({
          id: uid(),
          kind: "assistant",
          text: `I couldn't find anything matching that in ${area}. Try a dish name — biryani, dosa, burger — or pick another area.`,
        });
        return;
      }

      push({
        id: uid(),
        kind: "assistant",
        text: `Here's what's good for "${query}" around ${area}. Add a dish and I'll put an order together.`,
      });
      push({ id: uid(), kind: "results", results });
    } catch {
      push({
        id: uid(),
        kind: "assistant",
        text: "The restaurant service didn't respond. Give it another try in a moment.",
      });
    } finally {
      setBusy(false);
    }
  }

  function addItem(restaurant: Restaurant, item: MenuItem) {
    setDraft((prev) => {
      if (!prev || prev.restaurant.id !== restaurant.id) {
        if (prev) {
          push({
            id: uid(),
            kind: "assistant",
            text: `Switched your order to ${restaurant.name} — one restaurant per order keeps delivery honest.`,
          });
        }
        return { restaurant, lines: [{ item, qty: 1 }] };
      }
      const existing = prev.lines.find((l) => l.item.id === item.id);
      return {
        restaurant,
        lines: existing
          ? prev.lines.map((l) => (l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l))
          : [...prev.lines, { item, qty: 1 }],
      };
    });
    pushOnce({ id: uid(), kind: "cart" });
  }

  function setQty(menuItemId: string, qty: number) {
    setDraft((prev) => {
      if (!prev) return prev;
      const lines = prev.lines
        .map((l) => (l.item.id === menuItemId ? { ...l, qty } : l))
        .filter((l) => l.qty > 0);
      return lines.length ? { ...prev, lines } : null;
    });
  }

  function onContinue() {
    pushOnce({ id: uid(), kind: "checkout" });
    push({
      id: uid(),
      kind: "assistant",
      text: "Confirm where this is going and I'll generate a payment link.",
    });
  }

  async function submitCheckout(details: CustomerDetails, mode: FulfilmentMode) {
    if (!draft) return;
    setSubmitting(true);
    setArea(details.area);

    const toolId = uid();
    push({
      id: toolId,
      kind: "tool",
      name: "create_order",
      args: `restaurant: "${draft.restaurant.name}", items: ${draft.lines.length}, mode: "${mode}"`,
      status: "running",
    });

    try {
      await wait(700);
      const order = await createOrder({
        restaurantId: draft.restaurant.id,
        items: draft.lines.map((l) => ({ menuItemId: l.item.id, qty: l.qty })),
        mode,
        customer: details,
        source: "assistant",
      });
      finishTool(toolId, `${order.code} · ${rupees(order.totals.total)}`);
      push({
        id: uid(),
        kind: "assistant",
        text: `Done. ${order.code} is held for 30 minutes — pay on the link and ${draft.restaurant.name} gets it straight away.`,
      });
      push({
        id: uid(),
        kind: "link",
        orderId: order.id,
        code: order.code,
        total: order.totals.total,
        restaurantName: order.restaurantName,
      });
      setMessages((prev) => prev.filter((m) => m.kind !== "cart" && m.kind !== "checkout"));
      setDraft(null);
    } catch (err) {
      finishTool(toolId, "failed");
      push({
        id: uid(),
        kind: "assistant",
        text:
          err instanceof ApiError
            ? `That didn't go through — ${err.message.toLowerCase()}`
            : "I couldn't create that order. Try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-canvas">
      <header className="shadow-soft relative z-10 flex items-center justify-between bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <span aria-hidden className="grid size-7 place-items-center rounded-xl bg-ink text-sm text-white">
            ✦
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Assistant</p>
            <p className="text-xs text-ink-faint">Bharat MCP connected</p>
          </div>
        </div>
        <label className="flex items-center gap-1.5 rounded-full bg-canvas py-1 pr-2 pl-2.5 text-xs text-ink-faint">
          <span aria-hidden>📍</span>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="rounded-lg bg-canvas py-0.5 text-xs text-ink outline-none"
          >
            {["Koramangala", "Indiranagar", "HSR Layout", "Jayanagar", "JP Nagar", "Whitefield", "Malleshwaram", "Bellandur"].map(
              (a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ),
            )}
          </select>
        </label>
      </header>

      <div ref={scrollRef} className="scroll-slim flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto w-full max-w-lg space-y-4">
          {messages.length === 0 && <Welcome onPick={send} />}

          {messages.map((msg) => (
            <div key={msg.id} className="animate-rise">
              {msg.kind === "user" && (
                <div className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-3.5 py-2.5 text-[15px] text-white">
                    {msg.text}
                  </p>
                </div>
              )}

              {msg.kind === "assistant" && (
                <div className="flex gap-2.5">
                  <span
                    aria-hidden
                    className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-ink text-xs text-white"
                  >
                    ✦
                  </span>
                  <p className="text-[15px] leading-relaxed text-ink">{msg.text}</p>
                </div>
              )}

              {msg.kind === "tool" && (
                <div className="pl-8.5">
                  <ToolCall name={msg.name} args={msg.args} status={msg.status} summary={msg.summary} />
                </div>
              )}

              {msg.kind === "results" && (
                <div className="pl-8.5">
                  <ResultCards results={msg.results} onAdd={addItem} />
                </div>
              )}

              {msg.kind === "cart" && draft && (
                <div className="pl-8.5">
                  <CartCard
                    restaurant={draft.restaurant}
                    lines={draft.lines}
                    onQty={setQty}
                    onContinue={onContinue}
                  />
                </div>
              )}

              {msg.kind === "checkout" && draft && (
                <div className="pl-8.5">
                  <CheckoutForm
                    restaurant={draft.restaurant}
                    defaultArea={area}
                    submitting={submitting}
                    onSubmit={submitCheckout}
                  />
                </div>
              )}

              {msg.kind === "link" && (
                <div className="pl-8.5">
                  <OrderLinkCard
                    orderId={msg.orderId}
                    code={msg.code}
                    total={msg.total}
                    restaurantName={msg.restaurantName}
                  />
                </div>
              )}
            </div>
          ))}

          {busy && (
            <div className="flex gap-2.5 pl-0">
              <span
                aria-hidden
                className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-ink text-xs text-white"
              >
                ✦
              </span>
              <span className="flex items-center gap-1 pt-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="animate-pulse-dot size-1.5 rounded-full bg-ink-faint"
                    style={{ animationDelay: `${i * 0.18}s` }}
                  />
                ))}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="shadow-lift relative z-10 bg-surface px-4 py-3">
        <form
          className="mx-auto flex w-full max-w-lg items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <input
            className={cx(inputClass, "flex-1")}
            placeholder="Ask for food…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={!input.trim() || busy}
            className="hover-float grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-white transition-colors hover:bg-brand-dark disabled:opacity-40"
            aria-label="Send"
          >
            ↑
          </button>
        </form>
      </div>
    </div>
  );
}

function Welcome({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="pt-6">
      <span
        aria-hidden
        className="shadow-soft grid size-11 place-items-center rounded-2xl bg-surface text-xl"
      >
        ✦
      </span>
      <h1 className="mt-4 text-xl font-semibold text-ink">What are you hungry for?</h1>
      <p className="mt-1 text-[15px] text-ink-soft">
        I can search restaurants near you, put an order together and hand you a payment link — all
        without leaving this chat.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="hover-float shadow-soft rounded-full bg-surface px-3 py-1.5 text-sm text-ink-soft hover:text-brand"
          >
            {s}
          </button>
        ))}
      </div>
      <Card className="mt-6 p-3.5 text-sm text-ink-soft">
        <p className="font-medium text-ink">How this works</p>
        <p className="mt-1">
          Every restaurant card below comes from the Bharat MCP server — the same tools an assistant
          would call. Nothing here is a real transaction.
        </p>
      </Card>
    </div>
  );
}
