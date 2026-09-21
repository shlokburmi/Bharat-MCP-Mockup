"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { resetDemo } from "@/lib/api";
import { rupees, timeOfDay } from "@/lib/format";
import { OPERATOR_STATUS_COPY } from "@/lib/state-machine";
import { STATUS_PILL } from "@/lib/operator-actions";
import { useLiveOrders } from "@/lib/use-live-order";
import { OrderStatus } from "@/lib/types";
import { RotateCcw } from "lucide-react";

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All orders" },
  { value: "live", label: "In flight" },
  { value: "sent_to_restaurant", label: "Awaiting restaurant" },
  { value: "preparing", label: "Preparing" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
];

const LIVE_STATUSES: OrderStatus[] = [
  "paid",
  "sent_to_restaurant",
  "accepted",
  "preparing",
  "ready",
  "picked_up",
  "out_for_delivery",
];

export function OrderOverview() {
  const { orders, loading, error, refresh } = useLiveOrders();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const selected = orders.find((o) => o.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    if (statusFilter === "all") return orders;
    if (statusFilter === "live") return orders.filter((o) => LIVE_STATUSES.includes(o.status));
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const stats = useMemo(
    () => ({
      total: orders.length,
      live: orders.filter((o) => LIVE_STATUSES.includes(o.status)).length,
      delivered: orders.filter((o) => o.status === "delivered" || o.status === "collected").length,
      revenue: orders
        .filter((o) => o.status === "delivered" || o.status === "collected")
        .reduce((sum, o) => sum + o.totals.total, 0),
    }),
    [orders],
  );

  /** Phase 5 demo reset — wipes every order and restores the seed catalogue. */
  async function handleReset() {
    if (!window.confirm("Delete every order and restore the seed data?")) return;
    setResetting(true);
    try {
      await resetDemo();
      await refresh();
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Orders</h2>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${stats.total} total · ${stats.live} in flight`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleReset} disabled={resetting}>
            <RotateCcw className="size-4" />
            Reset demo
          </Button>
        </div>
      </div>

      {error && <p className="rounded bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Orders", value: String(stats.total) },
          { label: "In flight", value: String(stats.live) },
          { label: "Completed", value: String(stats.delivered) },
          { label: "Completed value", value: rupees(stats.revenue) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card px-3 py-2.5">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-lg font-semibold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Restaurant</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Cat</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Placed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((o) => (
            <TableRow key={o.id} className="cursor-pointer" onClick={() => setSelectedId(o.id)}>
              <TableCell className="font-mono text-xs">{o.code}</TableCell>
              <TableCell className="font-medium">{o.restaurantName}</TableCell>
              <TableCell className="text-muted-foreground">{o.customer.name}</TableCell>
              <TableCell className="text-muted-foreground capitalize">{o.mode}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-[10px]">
                  {o.category}
                </Badge>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_PILL[o.status]}`}
                >
                  {OPERATOR_STATUS_COPY[o.status]}
                </span>
              </TableCell>
              <TableCell className="tabular-nums">{rupees(o.totals.total)}</TableCell>
              <TableCell className="text-muted-foreground">{timeOfDay(o.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {!loading && filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {orders.length === 0
            ? "No orders yet. Place one from the assistant chat or the Test Order tab."
            : "No orders match this filter."}
        </p>
      )}

      <Sheet
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.code}</SheetTitle>
                <SheetDescription>
                  {selected.restaurantName} · Category {selected.category} · {selected.mode}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 p-4 text-sm">
                <Link
                  href={`/order/${selected.id}`}
                  className="inline-flex h-9 items-center rounded-lg bg-brand px-3 text-sm font-medium text-white hover:bg-brand-dark"
                >
                  Open the customer link
                </Link>

                <Separator />

                <div>
                  <p className="mb-1 font-semibold">Items</p>
                  {selected.items.map((item) => (
                    <div key={item.menuItemId} className="flex justify-between">
                      <span className="text-muted-foreground">
                        {item.qty}x {item.name}
                      </span>
                      <span className="tabular-nums">{rupees(item.price * item.qty)}</span>
                    </div>
                  ))}
                  <div className="mt-1 flex justify-between border-t pt-1 font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">{rupees(selected.totals.total)}</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="mb-1 font-semibold">Customer</p>
                  <p>{selected.customer.name}</p>
                  <p className="text-muted-foreground">{selected.customer.phone}</p>
                  {selected.mode === "delivery" && (
                    <p className="text-muted-foreground">
                      {selected.customer.address}, {selected.customer.area}
                    </p>
                  )}
                </div>

                {selected.riderName && (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-1 font-semibold">Delivery partner</p>
                      <p>{selected.riderName}</p>
                      <p className="text-muted-foreground">{selected.riderPhone}</p>
                    </div>
                  </>
                )}

                <Separator />

                <div>
                  <p className="mb-1 font-semibold">Timeline</p>
                  {selected.timeline.map((e, i) => (
                    <div key={`${e.status}-${i}`} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {OPERATOR_STATUS_COPY[e.status]} ({e.actor})
                      </span>
                      <span>{timeOfDay(e.at)}</span>
                    </div>
                  ))}
                </div>

                {selected.rejectionReason && (
                  <p className="rounded bg-bad-soft px-2 py-1.5 text-xs text-bad">
                    Rejected: {selected.rejectionReason}
                  </p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
