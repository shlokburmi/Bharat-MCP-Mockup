"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AREAS } from "@/lib/seed";
import { createRestaurant, fetchRiders } from "@/lib/api";
import { RestaurantCategory } from "@/lib/types";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

interface OnboardingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

interface CoverageResult {
  area: string;
  riders: string[];
}

export function OnboardingForm({ open, onOpenChange, onCreated }: OnboardingFormProps) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState<string>(AREAS[0]);
  const [cuisineTags, setCuisineTags] = useState("");
  const [prepTime, setPrepTime] = useState("25");
  const [deliveryFee, setDeliveryFee] = useState("35");
  const [minOrder, setMinOrder] = useState("150");
  const [deliversTo, setDeliversTo] = useState<string[]>([AREAS[0]]);
  const [supportsPickup, setSupportsPickup] = useState(true);
  const [category, setCategory] = useState<RestaurantCategory>("A");
  const [coverage, setCoverage] = useState<CoverageResult[] | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function resetForm() {
    setName("");
    setWhatsapp("");
    setAddress("");
    setArea(AREAS[0]);
    setCuisineTags("");
    setPrepTime("25");
    setDeliveryFee("35");
    setMinOrder("150");
    setDeliversTo([AREAS[0]]);
    setSupportsPickup(true);
    setCategory("A");
    setCoverage(null);
    setVerifying(false);
    setErrors({});
  }

  /** Category B only works where a partner rider actually covers the area, so
   *  ops checks before switching a restaurant over. */
  async function handleVerifyCoverage() {
    setVerifying(true);
    try {
      const riders = await fetchRiders();
      setCoverage(
        deliversTo.map((a) => ({
          area: a,
          riders: riders.filter((r) => r.online && r.zone.includes(a)).map((r) => r.name),
        })),
      );
    } finally {
      setVerifying(false);
    }
  }

  function toggleArea(a: string) {
    setDeliversTo((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
    setCoverage(null);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Restaurant name is required";
    if (!/^\d{10}$/.test(whatsapp.trim())) next.whatsapp = "Enter a valid 10-digit number";
    if (!address.trim()) next.address = "Address is required";
    if (!deliversTo.length) next.deliversTo = "Pick at least one delivery area";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      await createRestaurant({
        name: name.trim(),
        category,
        cuisines: cuisineTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        area,
        address: address.trim(),
        phone: `+91 ${whatsapp.trim()}`,
        prepTimeMins: Number(prepTime) || 25,
        // The form talks rupees; the contract stores paise.
        deliveryFee: Math.round((Number(deliveryFee) || 0) * 100),
        minOrder: Math.round((Number(minOrder) || 0) * 100),
        deliversTo,
        supportsPickup,
      });
      resetForm();
      onCreated();
      onOpenChange(false);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Could not save the restaurant" });
    } finally {
      setSaving(false);
    }
  }

  const uncovered = coverage?.filter((c) => c.riders.length === 0) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Onboard New Restaurant</DialogTitle>
          <DialogDescription>
            New restaurants start dark. Add a menu item, then switch them live.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-4">
          <div className="space-y-1.5">
            <Label htmlFor="r-name">Restaurant name</Label>
            <Input id="r-name" value={name} onChange={(e) => setName(e.target.value)} />
            {errors.name && <p className="text-xs text-bad">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="r-phone">WhatsApp number</Label>
              <Input
                id="r-phone"
                placeholder="9845011209"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
              {errors.whatsapp && <p className="text-xs text-bad">{errors.whatsapp}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Home area</Label>
              <Select value={area} onValueChange={(v) => setArea(v ?? AREAS[0])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AREAS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="r-address">Address</Label>
            <Input id="r-address" value={address} onChange={(e) => setAddress(e.target.value)} />
            {errors.address && <p className="text-xs text-bad">{errors.address}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="r-cuisine">Cuisines (comma separated)</Label>
            <Input
              id="r-cuisine"
              placeholder="South Indian, Breakfast"
              value={cuisineTags}
              onChange={(e) => setCuisineTags(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="r-prep">Prep time (min)</Label>
              <Input id="r-prep" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-fee">Delivery fee (₹)</Label>
              <Input
                id="r-fee"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-min">Min order (₹)</Label>
              <Input id="r-min" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory((v as RestaurantCategory | null) ?? "A");
                setCoverage(null);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Category A — restaurant delivers itself</SelectItem>
                <SelectItem value="B">Category B — partner rider delivers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Delivers to</Label>
            <div className="flex flex-wrap gap-1.5">
              {AREAS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleArea(a)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    deliversTo.includes(a)
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            {errors.deliversTo && <p className="text-xs text-bad">{errors.deliversTo}</p>}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={supportsPickup}
              onChange={(e) => setSupportsPickup(e.target.checked)}
              className="accent-brand"
            />
            Offers pickup
          </label>

          {category === "B" && (
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Partner coverage</p>
                  <p className="text-xs text-muted-foreground">
                    Category B needs a rider in every delivery area
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleVerifyCoverage}
                  disabled={verifying || !deliversTo.length}
                >
                  {verifying && <Loader2 className="size-3.5 animate-spin" />}
                  Check
                </Button>
              </div>

              {coverage && (
                <ul className="mt-2 space-y-1">
                  {coverage.map((c) => (
                    <li key={c.area} className="flex items-center gap-1.5 text-xs">
                      {c.riders.length ? (
                        <CheckCircle2 className="size-3.5 text-good" />
                      ) : (
                        <XCircle className="size-3.5 text-bad" />
                      )}
                      <span className="font-medium">{c.area}</span>
                      <span className="text-muted-foreground">
                        {c.riders.length ? c.riders.join(", ") : "no rider covers this area"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {coverage && uncovered.length > 0 && (
                <p className="mt-2 rounded bg-warn-soft px-2 py-1.5 text-xs text-warn">
                  {uncovered.length} area{uncovered.length > 1 ? "s have" : " has"} no partner
                  cover. You can still onboard, but those orders will sit unassigned.
                </p>
              )}
            </div>
          )}

          {errors.form && <p className="text-sm text-bad">{errors.form}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Onboard restaurant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
