"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { fetchCoverage, updateRestaurant } from "@/lib/api";
import { rupees } from "@/lib/format";
import type { CoverageReport } from "@/lib/store-input";
import { useRestaurants } from "@/lib/use-restaurants";
import { OnboardingForm } from "./onboarding-form";
import { MenuBuilder } from "./menu-builder";
import { Plus, CheckCircle2, XCircle, Pause, Play, Settings2, Search } from "lucide-react";

type StatusFilter = "all" | "live" | "dark";
type CategoryFilter = "all" | "A" | "B";

export function RestaurantList() {
  const { restaurants, loading, error, refresh } = useRestaurants();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<{ id: string; report: CoverageReport[] } | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  /** id of the row with a request in flight, so its buttons can't be double-fired */
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [areaFilter, setAreaFilter] = useState("all");

  const areas = useMemo(
    () => [...new Set(restaurants.map((r) => r.area))].sort((a, b) => a.localeCompare(b)),
    [restaurants],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return restaurants.filter((r) => {
      if (statusFilter === "live" && !r.live) return false;
      if (statusFilter === "dark" && r.live) return false;
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (areaFilter !== "all" && r.area !== areaFilter) return false;
      if (!q) return true;
      return `${r.name} ${r.area} ${r.cuisines.join(" ")} ${r.phone}`.toLowerCase().includes(q);
    });
  }, [restaurants, query, statusFilter, categoryFilter, areaFilter]);

  const filtered = visible.length !== restaurants.length;

  const detail = restaurants.find((r) => r.id === selectedId) ?? null;

  // Coverage is only meaningful for Category B, and only for the open sheet.
  // Tagged with the restaurant id so a stale report is never shown against a
  // different restaurant.
  const coverageFor = detail && coverage?.id === detail.id ? coverage.report : null;

  useEffect(() => {
    if (!detail || detail.category !== "B") return;
    const id = detail.id;
    const timer = setTimeout(() => {
      void fetchCoverage(id)
        .then((report) => setCoverage({ id, report }))
        .catch(() => setCoverage(null));
    }, 0);
    return () => clearTimeout(timer);
  }, [detail]);

  async function handleToggleLive(id: string, next: boolean) {
    setActionError(null);
    setBusyId(id);
    try {
      await updateRestaurant(id, { live: next });
      await refresh();
    } catch (err) {
      const name = restaurants.find((r) => r.id === id)?.name ?? "This restaurant";
      setActionError(
        `${name}: ${err instanceof Error ? err.message : "could not be updated"}`,
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleCategory(id: string, next: "A" | "B") {
    setActionError(null);
    setBusyId(id);
    try {
      await updateRestaurant(id, { category: next });
      await refresh();
    } catch (err) {
      const name = restaurants.find((r) => r.id === id)?.name ?? "This restaurant";
      setActionError(
        `${name}: ${err instanceof Error ? err.message : "could not change category"}`,
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Restaurants</h2>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Loading…"
              : filtered
                ? `${visible.length} of ${restaurants.length} shown · ${visible.filter((r) => r.live).length} live`
                : `${restaurants.length} onboarded · ${restaurants.filter((r) => r.live).length} live`}
          </p>
        </div>
        <Button onClick={() => setShowOnboarding(true)}>
          <Plus className="size-4" />
          Add Restaurant
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, area, cuisine or number"
            className="pl-8"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-canvas p-0.5">
          {(["all", "live", "dark"] as StatusFilter[]).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "secondary" : "ghost"}
              className="h-7 px-2.5 text-xs capitalize"
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-canvas p-0.5">
          {(["all", "A", "B"] as CategoryFilter[]).map((c) => (
            <Button
              key={c}
              size="sm"
              variant={categoryFilter === c ? "secondary" : "ghost"}
              className="h-7 px-2.5 text-xs"
              onClick={() => setCategoryFilter(c)}
            >
              {c === "all" ? "All" : `Cat ${c}`}
            </Button>
          ))}
        </div>

        <Select value={areaFilter} onValueChange={(v) => setAreaFilter((v as string | null) ?? "all")}>
          <SelectTrigger size="sm" className="min-w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All areas</SelectItem>
            {areas.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(error || actionError) && (
        <p className="rounded bg-bad-soft px-3 py-2 text-sm text-bad">{actionError ?? error}</p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Area</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Cuisine</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead>Min order</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((r) => (
            <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelectedId(r.id)}>
              <TableCell className="font-medium">
                {r.emoji} {r.name}
              </TableCell>
              <TableCell className="text-muted-foreground">{r.area}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                {/* The badge is the control — clicking it flips the category,
                    which keeps the row narrow enough for the action buttons. */}
                <button
                  type="button"
                  disabled={busyId === r.id}
                  title={
                    r.category === "A"
                      ? "Delivers itself — switch to a partner rider"
                      : "Partner rider delivers — switch to own delivery"
                  }
                  onClick={() => handleToggleCategory(r.id, r.category === "A" ? "B" : "A")}
                  className="disabled:opacity-50"
                >
                  <Badge
                    variant="secondary"
                    className={`cursor-pointer ${
                      r.category === "A"
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                    }`}
                  >
                    Cat {r.category} ⇄
                  </Badge>
                </button>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground">
                  {r.cuisines.slice(0, 2).join(", ")}
                  {r.cuisines.length > 2 && ` +${r.cuisines.length - 2}`}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-block size-2 rounded-full ${
                      r.live ? "bg-good" : "bg-muted-foreground/40"
                    }`}
                  />
                  <span className="text-sm">{r.live ? "Live" : "Dark"}</span>
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{r.phone}</TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {rupees(r.minOrder)}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === r.id}
                    className="h-7 px-2 text-xs"
                    onClick={() => handleToggleLive(r.id, !r.live)}
                  >
                    {r.live ? (
                      <>
                        <Pause className="size-3" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="size-3" />
                        Go live
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => setSelectedId(r.id)}
                  >
                    <Settings2 className="size-3" />
                    Manage
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {!loading && restaurants.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No restaurants yet. Onboard one to get started.
        </p>
      )}

      {!loading && restaurants.length > 0 && visible.length === 0 && (
        <div className="py-10 text-center">
          <p className="text-sm text-muted-foreground">No restaurant matches these filters.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              setQuery("");
              setStatusFilter("all");
              setCategoryFilter("all");
              setAreaFilter("all");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      <OnboardingForm
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onCreated={refresh}
      />

      <Sheet
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {detail.emoji} {detail.name}
                </SheetTitle>
                <SheetDescription>{detail.address}</SheetDescription>
              </SheetHeader>

              <div className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Category</span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant={detail.category === "A" ? "default" : "outline"}
                        onClick={() => handleToggleCategory(detail.id, "A")}
                      >
                        A
                      </Button>
                      <Button
                        size="sm"
                        variant={detail.category === "B" ? "default" : "outline"}
                        onClick={() => handleToggleCategory(detail.id, "B")}
                      >
                        B
                      </Button>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {detail.category === "A" ? "Delivers itself" : "Partner rider delivers"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">WhatsApp</span>
                    <p className="mt-0.5 font-mono text-xs">{detail.phone}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Prep time</span>
                    <p className="mt-0.5">{detail.prepTimeMins} min</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cuisine</span>
                    <p className="mt-0.5">{detail.cuisines.join(", ")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Delivery fee</span>
                    <p className="mt-0.5 tabular-nums">{rupees(detail.deliveryFee)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Min order</span>
                    <p className="mt-0.5 tabular-nums">{rupees(detail.minOrder)}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Live</span>
                    <div className="mt-1 flex items-center gap-2">
                      <Switch
                        size="sm"
                        checked={detail.live}
                        onCheckedChange={() => handleToggleLive(detail.id, !detail.live)}
                      />
                      <span className="text-xs">
                        {detail.live
                          ? "Visible in assistant search"
                          : "Hidden until it has an available menu item"}
                      </span>
                    </div>
                  </div>
                </div>

                {detail.category === "B" && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-semibold">Partner coverage</p>
                      <p className="text-xs text-muted-foreground">
                        Every delivery area needs an online rider
                      </p>
                      <ul className="mt-2 space-y-1">
                        {(coverageFor ?? []).map((c) => (
                          <li key={c.area} className="flex items-center gap-1.5 text-xs">
                            {c.covered ? (
                              <CheckCircle2 className="size-3.5 text-good" />
                            ) : (
                              <XCircle className="size-3.5 text-bad" />
                            )}
                            <span className="font-medium">{c.area}</span>
                            <span className="text-muted-foreground">
                              {c.covered ? c.riders.join(", ") : "no rider covers this area"}
                            </span>
                          </li>
                        ))}
                        {!coverageFor && (
                          <li className="text-xs text-muted-foreground">Checking coverage…</li>
                        )}
                      </ul>
                    </div>
                  </>
                )}

                <Separator />

                <MenuBuilder restaurant={detail} onChanged={refresh} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
