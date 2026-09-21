"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { addMenuItems, deleteMenuItem, fetchMenu, updateMenuItem } from "@/lib/api";
import { rupees } from "@/lib/format";
import type { NewMenuItem } from "@/lib/store-input";
import { MenuItem, Restaurant } from "@/lib/types";
import { Loader2, Plus, ScanLine, Trash2 } from "lucide-react";

interface MenuBuilderProps {
  restaurant: Restaurant;
  onChanged?: () => void;
}

function VegIcon({ isVeg }: { isVeg: boolean }) {
  return (
    <span
      className={`inline-flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border ${
        isVeg ? "border-good" : "border-bad"
      }`}
    >
      <span className={`size-1.5 rounded-full ${isVeg ? "bg-good" : "bg-bad"}`} />
    </span>
  );
}

interface ItemFormState {
  name: string;
  description: string;
  /** rupees in the form, paise in the contract */
  price: string;
  section: string;
  veg: boolean;
  emoji: string;
}

const emptyItem: ItemFormState = {
  name: "",
  description: "",
  price: "",
  section: "Mains",
  veg: true,
  emoji: "🍽️",
};

/**
 * Stands in for "photograph the menu and we'll structure it". There is no OCR
 * here — the draft rows are generated from the restaurant's own cuisines, and
 * ops edits them before saving, which is the workflow the real thing would have.
 */
function draftFromPhoto(restaurant: Restaurant): ItemFormState[] {
  const cuisine = restaurant.cuisines[0]?.toLowerCase() ?? "";
  if (cuisine.includes("south") || cuisine.includes("breakfast")) {
    return [
      { name: "Masala Dosa", description: "Potato palya, chutney, sambar", price: "140", section: "Tiffin", veg: true, emoji: "🥞" },
      { name: "Idli Vada", description: "Two idlis and a vada", price: "90", section: "Tiffin", veg: true, emoji: "🍩" },
      { name: "Filter Coffee", description: "Served in a tumbler", price: "60", section: "Beverages", veg: true, emoji: "☕" },
    ];
  }
  if (cuisine.includes("biryani") || cuisine.includes("andhra") || cuisine.includes("mughlai")) {
    return [
      { name: "Chicken Biryani", description: "Dum cooked, raita and salan", price: "340", section: "Biryani", veg: false, emoji: "🍛" },
      { name: "Paneer Butter Masala", description: "Rich tomato gravy", price: "280", section: "Curries", veg: true, emoji: "🧀" },
      { name: "Chicken 65", description: "Curry leaf and chilli", price: "260", section: "Starters", veg: false, emoji: "🍗" },
    ];
  }
  if (cuisine.includes("dessert") || cuisine.includes("ice")) {
    return [
      { name: "Hot Chocolate Fudge", description: "Vanilla under warm fudge", price: "260", section: "Sundaes", veg: true, emoji: "🍨" },
      { name: "Butterscotch Tub", description: "500ml take-home tub", price: "340", section: "Tubs", veg: true, emoji: "🍧" },
    ];
  }
  return [
    { name: "House Burger", description: "Double patty, cheese", price: "320", section: "Mains", veg: false, emoji: "🍔" },
    { name: "Peri Peri Fries", description: "Thick cut, tossed", price: "180", section: "Sides", veg: true, emoji: "🍟" },
    { name: "Cold Coffee", description: "Blended, served chilled", price: "160", section: "Beverages", veg: true, emoji: "🥤" },
  ];
}

function toNewMenuItem(form: ItemFormState): NewMenuItem {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    price: Math.round((Number(form.price) || 0) * 100),
    veg: form.veg,
    section: form.section.trim() || "Mains",
    tags: form.name.toLowerCase().split(/\s+/).filter(Boolean),
    emoji: form.emoji || "🍽️",
    available: true,
  };
}

export function MenuBuilder({ restaurant, onChanged }: MenuBuilderProps) {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemFormState>(emptyItem);
  const [scanning, setScanning] = useState(false);
  const [drafts, setDrafts] = useState<ItemFormState[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    try {
      setMenu(await fetchMenu(restaurant.id));
      setError(null);
    } catch {
      setError("Could not load the menu");
    } finally {
      setLoading(false);
    }
  }, [restaurant.id]);

  useEffect(() => {
    const timer = setTimeout(() => void reload(), 0);
    return () => clearTimeout(timer);
  }, [reload]);

  async function mutate(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      await reload();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't save");
    }
  }

  async function handleScan() {
    setScanning(true);
    // The parse a real service would do, mocked with a beat so the UI reads right.
    await new Promise((r) => setTimeout(r, 1400));
    setDrafts(draftFromPhoto(restaurant));
    setScanning(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Menu</h3>
          <p className="text-xs text-muted-foreground">
            {loading ? "Loading…" : `${menu.length} items`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
            <ScanLine className="size-4" />
            Scan photo
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setForm(emptyItem);
              setEditingId(null);
              setShowAddForm(true);
            }}
          >
            <Plus className="size-4" />
            Add item
          </Button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={() => void handleScan()}
      />

      {error && <p className="rounded bg-bad-soft px-2 py-1.5 text-xs text-bad">{error}</p>}

      {scanning && (
        <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Reading the menu photo…
        </div>
      )}

      {drafts && (
        <div className="space-y-2 rounded-lg border border-brand/30 bg-brand-soft/40 p-3">
          <p className="text-sm font-medium">
            Found {drafts.length} items. Check them before saving.
          </p>
          {drafts.map((d, i) => (
            <div key={i} className="grid grid-cols-[1fr_5rem_2rem] items-center gap-2">
              <Input
                value={d.name}
                onChange={(e) =>
                  setDrafts((prev) =>
                    prev!.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                  )
                }
              />
              <Input
                value={d.price}
                onChange={(e) =>
                  setDrafts((prev) =>
                    prev!.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)),
                  )
                }
              />
              <button
                type="button"
                aria-label={`Discard ${d.name}`}
                className="text-muted-foreground hover:text-bad"
                onClick={() => setDrafts((prev) => prev!.filter((_, j) => j !== i))}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => setDrafts(null)}>
              Discard
            </Button>
            <Button
              size="sm"
              disabled={!drafts.length}
              onClick={() =>
                mutate(async () => {
                  await addMenuItems(restaurant.id, drafts.map(toNewMenuItem));
                  setDrafts(null);
                })
              }
            >
              Save {drafts.length} items
            </Button>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="m-name">Name</Label>
              <Input
                id="m-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="m-price">Price (₹)</Label>
              <Input
                id="m-price"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="m-desc">Description</Label>
            <Input
              id="m-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="m-section">Section</Label>
              <Input
                id="m-section"
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="m-emoji">Icon</Label>
              <Input
                id="m-emoji"
                value={form.emoji}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.veg}
              onChange={(e) => setForm({ ...form, veg: e.target.checked })}
              className="accent-good"
            />
            Vegetarian
          </label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!form.name.trim() || !form.price}
              onClick={() =>
                mutate(async () => {
                  if (editingId) await updateMenuItem(editingId, toNewMenuItem(form));
                  else await addMenuItems(restaurant.id, [toNewMenuItem(form)]);
                  setShowAddForm(false);
                  setEditingId(null);
                  setForm(emptyItem);
                })
              }
            >
              {editingId ? "Save changes" : "Add item"}
            </Button>
          </div>
        </div>
      )}

      <Separator />

      {!loading && menu.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No menu yet. Scan a photo or add items by hand — a restaurant can&apos;t go live without
          one.
        </p>
      )}

      <ul className="divide-y divide-border">
        {menu.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-2">
            <VegIcon isVeg={item.veg} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {item.section} · {item.description}
              </p>
            </div>
            <span className="shrink-0 text-sm tabular-nums">{rupees(item.price)}</span>
            <Switch
              size="sm"
              checked={item.available}
              onCheckedChange={() =>
                mutate(() => updateMenuItem(item.id, { available: !item.available }))
              }
            />
            <button
              type="button"
              aria-label={`Edit ${item.name}`}
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setForm({
                  name: item.name,
                  description: item.description,
                  price: String(item.price / 100),
                  section: item.section,
                  veg: item.veg,
                  emoji: item.emoji,
                });
                setEditingId(item.id);
                setShowAddForm(true);
              }}
            >
              Edit
            </button>
            <button
              type="button"
              aria-label={`Delete ${item.name}`}
              className="text-muted-foreground hover:text-bad"
              onClick={() => mutate(() => deleteMenuItem(item.id))}
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>

      {!loading && menu.length > 0 && !menu.some((m) => m.available) && (
        <Badge variant="secondary" className="bg-warn-soft text-warn">
          Everything is marked sold out — this restaurant can&apos;t go live
        </Badge>
      )}
    </div>
  );
}
