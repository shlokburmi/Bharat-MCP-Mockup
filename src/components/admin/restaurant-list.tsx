"use client";

import { useState } from "react";
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
import { Restaurant } from "@/types";
import { useStore } from "@/data/use-store";
import { OnboardingForm } from "./onboarding-form";
import { MenuBuilder } from "./menu-builder";
import { Plus, CheckCircle2, XCircle } from "lucide-react";

export function RestaurantList() {
  const store = useStore();
  const restaurants = store.getRestaurants();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  function handleToggleActive(id: string, current: boolean) {
    store.updateRestaurant(id, { isActive: !current });
  }

  // Re-read the restaurant when viewing detail (in case menu was changed)
  const detailRestaurant = selectedRestaurant
    ? store.getRestaurant(selectedRestaurant.id) ?? selectedRestaurant
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Restaurants</h2>
          <p className="text-sm text-muted-foreground">
            {restaurants.length} restaurants onboarded
          </p>
        </div>
        <Button onClick={() => setShowOnboarding(true)}>
          <Plus className="size-4" />
          Add Restaurant
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Area</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Cuisine</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead>Onboarded</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {restaurants.map((r) => (
            <TableRow
              key={r.id}
              className="cursor-pointer"
              onClick={() => setSelectedRestaurant(r)}
            >
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell className="text-muted-foreground">{r.area}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className={
                      r.category === "A"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                    }
                  >
                    Cat {r.category}
                  </Badge>
                  {r.category === "B" && (
                    r.coverageVerified ? (
                      <CheckCircle2 className="size-3.5 text-green-600" />
                    ) : (
                      <XCircle className="size-3.5 text-red-400" />
                    )
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground">
                  {r.cuisine.slice(0, 2).join(", ")}
                  {r.cuisine.length > 2 && ` +${r.cuisine.length - 2}`}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-block size-2 rounded-full ${
                      r.isActive ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  <span className="text-sm">{r.isActive ? "Active" : "Inactive"}</span>
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {r.whatsappNumber}
              </TableCell>
              <TableCell className="text-muted-foreground">{r.onboardedAt}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Onboarding Dialog */}
      <OnboardingForm open={showOnboarding} onOpenChange={setShowOnboarding} />

      {/* Restaurant Detail Sheet */}
      <Sheet
        open={!!selectedRestaurant}
        onOpenChange={(open) => {
          if (!open) setSelectedRestaurant(null);
        }}
      >
        <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
          {detailRestaurant && (
            <>
              <SheetHeader>
                <SheetTitle>{detailRestaurant.name}</SheetTitle>
                <SheetDescription>
                  {detailRestaurant.address}, {detailRestaurant.area}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 p-4">
                {/* Restaurant Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Category</span>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className={
                          detailRestaurant.category === "A"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }
                      >
                        Cat {detailRestaurant.category}
                      </Badge>
                      {detailRestaurant.category === "B" && (
                        detailRestaurant.coverageVerified ? (
                          <span className="flex items-center gap-1 text-xs text-green-700">
                            <CheckCircle2 className="size-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-red-500">
                            <XCircle className="size-3" />
                            Not verified
                          </span>
                        )
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">WhatsApp</span>
                    <p className="mt-0.5 font-mono text-xs">
                      {detailRestaurant.whatsappNumber}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Hours</span>
                    <p className="mt-0.5">
                      {detailRestaurant.hours.open} – {detailRestaurant.hours.close}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cuisine</span>
                    <p className="mt-0.5">{detailRestaurant.cuisine.join(", ")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <div className="mt-1 flex items-center gap-2">
                      <Switch
                        size="sm"
                        checked={detailRestaurant.isActive}
                        onCheckedChange={() =>
                          handleToggleActive(detailRestaurant.id, detailRestaurant.isActive)
                        }
                      />
                      <span className="text-xs">
                        {detailRestaurant.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Onboarded</span>
                    <p className="mt-0.5">{detailRestaurant.onboardedAt}</p>
                  </div>
                </div>

                <Separator />

                {/* Menu Builder */}
                <MenuBuilder restaurant={detailRestaurant} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
