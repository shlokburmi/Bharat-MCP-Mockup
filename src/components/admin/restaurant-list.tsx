"use client";

import { useEffect, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { fetchCoverage, updateRestaurant } from "@/lib/api";
import { rupees } from "@/lib/format";
import type { CoverageReport } from "@/lib/store-input";
import { useRestaurants } from "@/lib/use-restaurants";
import { OnboardingForm } from "./onboarding-form";
import { MenuBuilder } from "./menu-builder";
import { Plus, CheckCircle2, XCircle } from "lucide-react";

export function RestaurantList() {
  const { restaurants, loading, error, refresh } = useRestaurants();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<{ id: string; report: CoverageReport[] } | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);

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
    try {
      await updateRestaurant(id, { live: next });
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update the restaurant");
    }
  }

  async function handleToggleCategory(id: string, next: "A" | "B") {
    setActionError(null);
    try {
      await updateRestaurant(id, { category: next });
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not change the category");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Restaurants</h2>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${restaurants.length} onboarded · ${restaurants.filter((r) => r.live).length} live`}
          </p>
        </div>
        <Button onClick={() => setShowOnboarding(true)}>
          <Plus className="size-4" />
          Add Restaurant
        </Button>
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {restaurants.map((r) => (
            <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelectedId(r.id)}>
              <TableCell className="font-medium">
                {r.emoji} {r.name}
              </TableCell>
              <TableCell className="text-muted-foreground">{r.area}</TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={
                    r.category === "A"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }
                >
                  Cat {r.category}
                </Badge>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {!loading && restaurants.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No restaurants yet. Onboard one to get started.
        </p>
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
