"use client";

import { useMemo, useState } from "react";
import { Order } from "@/lib/types";
import { OPERATOR_STATUS_COPY } from "@/lib/state-machine";
import { STATUS_PILL } from "@/lib/operator-actions";
import { rupees, timeOfDay } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface OrderHistoryProps {
  /** terminal orders for this restaurant, newest first */
  orders: Order[];
  onViewDetail: (order: Order) => void;
}

/** Orders the owner actually earned money on. */
const EARNING = new Set(["delivered", "collected"]);

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** "Today" / "Yesterday" / "18 Sep 2026" */
function dayLabel(iso: string): string {
  const day = startOfDay(new Date(iso));
  const today = startOfDay(new Date());
  if (day === today) return "Today";
  if (day === today - 86_400_000) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function OrderHistory({ orders, onViewDetail }: OrderHistoryProps) {
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const todays = orders.filter((o) => startOfDay(new Date(o.createdAt)) === today);
    return {
      todayCount: todays.length,
      todayRevenue: todays
        .filter((o) => EARNING.has(o.status))
        .reduce((sum, o) => sum + o.totals.total, 0),
      completed: orders.filter((o) => EARNING.has(o.status)).length,
    };
  }, [orders]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? orders.filter((o) =>
          `${o.code} ${o.customer.name} ${o.items.map((i) => i.name).join(" ")}`
            .toLowerCase()
            .includes(q),
        )
      : orders;

    const byDay: { label: string; orders: Order[] }[] = [];
    for (const order of matched) {
      const label = dayLabel(order.createdAt);
      const last = byDay[byDay.length - 1];
      if (last && last.label === label) last.orders.push(order);
      else byDay.push({ label, orders: [order] });
    }
    return byDay;
  }, [orders, query]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Orders today" value={String(stats.todayCount)} />
        <Stat label="Earned today" value={rupees(stats.todayRevenue)} />
        <Stat label="Completed, all time" value={String(stats.completed)} />
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search order code, customer or dish"
          className="pl-8"
        />
      </div>

      {groups.length === 0 ? (
        <p className="py-14 text-center text-sm text-muted-foreground">
          {orders.length === 0
            ? "Finished orders are listed here once you complete your first one."
            : "No past order matches that search."}
        </p>
      ) : (
        groups.map((group) => (
          <div key={group.label} className="space-y-2">
            <p className="px-1 pt-2 text-xs font-semibold text-muted-foreground">
              {group.label}
            </p>
            {group.orders.map((order) => (
              <div
                key={order.id}
                className="shadow-soft flex items-center gap-3 rounded-xl bg-surface px-3.5 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{order.code}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_PILL[order.status]}`}
                    >
                      {OPERATOR_STATUS_COPY[order.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {timeOfDay(order.createdAt)} · {order.customer.name} ·{" "}
                    {order.items.reduce((n, i) => n + i.qty, 0)} items
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium tabular-nums">
                  {rupees(order.totals.total)}
                </span>
                <Button size="sm" variant="outline" onClick={() => onViewDetail(order)}>
                  View
                </Button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="shadow-soft rounded-xl bg-surface px-3 py-2.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
}
