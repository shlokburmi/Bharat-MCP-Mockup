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
import { RestaurantCategory, Restaurant } from "@/types";
import { useStore } from "@/data/use-store";
import { CheckCircle2, Loader2 } from "lucide-react";

interface OnboardingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingForm({ open, onOpenChange }: OnboardingFormProps) {
  const store = useStore();

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("Bangalore");
  const [cuisineTags, setCuisineTags] = useState("");
  const [openHour, setOpenHour] = useState("11:00");
  const [closeHour, setCloseHour] = useState("23:00");
  const [category, setCategory] = useState<RestaurantCategory>("A");
  const [coverageVerified, setCoverageVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function resetForm() {
    setName("");
    setWhatsapp("");
    setAddress("");
    setArea("");
    setCity("Bangalore");
    setCuisineTags("");
    setOpenHour("11:00");
    setCloseHour("23:00");
    setCategory("A");
    setCoverageVerified(false);
    setVerifying(false);
    setErrors({});
  }

  function handleVerifyCoverage() {
    setVerifying(true);
    setTimeout(() => {
      setCoverageVerified(true);
      setVerifying(false);
    }, 1000);
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Restaurant name is required";
    if (!whatsapp.trim()) newErrors.whatsapp = "WhatsApp number is required";
    else if (!/^\d{10}$/.test(whatsapp.trim()))
      newErrors.whatsapp = "Enter a valid 10-digit number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const cuisine = cuisineTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const id = `rest-${String(Date.now()).slice(-6)}`;

    const restaurant: Restaurant = {
      id,
      name: name.trim(),
      category,
      whatsappNumber: `+91${whatsapp.trim()}`,
      address: address.trim(),
      area: area.trim(),
      city: city.trim() || "Bangalore",
      lat: 12.9716 + (Math.random() - 0.5) * 0.05,
      lng: 77.5946 + (Math.random() - 0.5) * 0.05,
      cuisine,
      hours: { open: openHour, close: closeHour },
      menu: [],
      isActive: true,
      onboardedAt: new Date().toISOString().slice(0, 10),
      ...(category === "B" ? { coverageVerified } : {}),
    };

    store.addRestaurant(restaurant);
    resetForm();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Onboard New Restaurant</DialogTitle>
          <DialogDescription>
            Add a new restaurant partner to the platform.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Name */}
          <div className="grid gap-1.5">
            <Label htmlFor="rest-name">Restaurant Name *</Label>
            <Input
              id="rest-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Meghana Foods"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* WhatsApp */}
          <div className="grid gap-1.5">
            <Label htmlFor="rest-whatsapp">WhatsApp Number *</Label>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-sm text-muted-foreground">+91</span>
              <Input
                id="rest-whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
              />
            </div>
            {errors.whatsapp && (
              <p className="text-xs text-destructive">{errors.whatsapp}</p>
            )}
          </div>

          {/* Address + Area */}
          <div className="grid gap-1.5">
            <Label htmlFor="rest-address">Address</Label>
            <Input
              id="rest-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="rest-area">Area</Label>
              <Input
                id="rest-area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Indiranagar"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rest-city">City</Label>
              <Input
                id="rest-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          {/* Cuisine tags */}
          <div className="grid gap-1.5">
            <Label htmlFor="rest-cuisine">Cuisine Tags</Label>
            <Input
              id="rest-cuisine"
              value={cuisineTags}
              onChange={(e) => setCuisineTags(e.target.value)}
              placeholder="Biryani, South Indian, Andhra"
            />
            <p className="text-xs text-muted-foreground">Comma-separated</p>
          </div>

          {/* Hours */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="rest-open">Opening Time</Label>
              <Input
                id="rest-open"
                type="time"
                value={openHour}
                onChange={(e) => setOpenHour(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rest-close">Closing Time</Label>
              <Input
                id="rest-close"
                type="time"
                value={closeHour}
                onChange={(e) => setCloseHour(e.target.value)}
              />
            </div>
          </div>

          {/* Category */}
          <div className="grid gap-1.5">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(val) => {
                if (val === null) return;
                setCategory(val as RestaurantCategory);
                setCoverageVerified(false);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Category A (Own Delivery)</SelectItem>
                <SelectItem value="B">Category B (Partner Delivery)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Coverage verification for Cat B */}
          {category === "B" && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
              {coverageVerified ? (
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle2 className="size-4" />
                  <span>Coverage verified</span>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerifyCoverage}
                  disabled={verifying}
                >
                  {verifying && <Loader2 className="size-3 animate-spin" />}
                  {verifying ? "Verifying..." : "Verify Coverage"}
                </Button>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Restaurant</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
