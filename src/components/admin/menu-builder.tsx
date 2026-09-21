"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Restaurant, MenuItem } from "@/types";
import { useStore } from "@/data/use-store";
import { Plus, Pencil, X, Check } from "lucide-react";

interface MenuBuilderProps {
  restaurant: Restaurant;
}

function VegIcon({ isVeg }: { isVeg: boolean }) {
  if (isVeg) {
    return (
      <span className="inline-flex size-4 items-center justify-center rounded-sm border-2 border-green-600" title="Vegetarian">
        <span className="size-2 rounded-full bg-green-600" />
      </span>
    );
  }
  return (
    <span className="inline-flex size-4 items-center justify-center rounded-sm border-2 border-red-600" title="Non-vegetarian">
      <svg viewBox="0 0 10 10" className="size-2.5 fill-red-600">
        <polygon points="5,0 10,10 0,10" />
      </svg>
    </span>
  );
}

interface ItemFormState {
  name: string;
  price: string;
  category: string;
  description: string;
  isVeg: boolean;
}

const emptyItem: ItemFormState = {
  name: "",
  price: "",
  category: "",
  description: "",
  isVeg: true,
};

export function MenuBuilder({ restaurant }: MenuBuilderProps) {
  const store = useStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemFormState>(emptyItem);

  const menu = restaurant.menu;

  function handleToggleAvailability(itemId: string) {
    const updatedMenu = menu.map((item) =>
      item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
    );
    store.updateRestaurant(restaurant.id, { menu: updatedMenu });
  }

  function handleAddItem() {
    if (!form.name.trim() || !form.price) return;

    const newItem: MenuItem = {
      id: `${restaurant.id.replace("rest-", "m")}-${Date.now().toString(36)}`,
      name: form.name.trim(),
      price: parseFloat(form.price),
      category: form.category.trim() || "General",
      description: form.description.trim() || undefined,
      isVeg: form.isVeg,
      isAvailable: true,
    };

    store.updateRestaurant(restaurant.id, { menu: [...menu, newItem] });
    setForm(emptyItem);
    setShowAddForm(false);
  }

  function handleStartEdit(item: MenuItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      price: String(item.price),
      category: item.category,
      description: item.description || "",
      isVeg: item.isVeg,
    });
  }

  function handleSaveEdit() {
    if (!editingId || !form.name.trim() || !form.price) return;

    const updatedMenu = menu.map((item) =>
      item.id === editingId
        ? {
            ...item,
            name: form.name.trim(),
            price: parseFloat(form.price),
            category: form.category.trim() || "General",
            description: form.description.trim() || undefined,
            isVeg: form.isVeg,
          }
        : item
    );

    store.updateRestaurant(restaurant.id, { menu: updatedMenu });
    setEditingId(null);
    setForm(emptyItem);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyItem);
  }

  // Group items by category
  const categories = Array.from(new Set(menu.map((i) => i.category)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Menu Items ({menu.length})</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingId(null);
            setForm(emptyItem);
          }}
        >
          <Plus className="size-3" />
          Add Item
        </Button>
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            New Menu Item
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label className="text-xs">Item Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Item name"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Price (INR)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label className="text-xs">Category</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Biryani, Starters"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Description (optional)</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short description"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isVeg}
                onCheckedChange={(checked) => setForm({ ...form, isVeg: checked })}
              />
              <span className="text-sm">{form.isVeg ? "Veg" : "Non-veg"}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setShowAddForm(false); setForm(emptyItem); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddItem}>
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      <Separator />

      {/* Menu Items by Category */}
      {categories.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No menu items yet. Add your first item above.
        </p>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {cat}
              </p>
              <div className="space-y-1">
                {menu
                  .filter((item) => item.category === cat)
                  .map((item) => (
                    <div key={item.id}>
                      {editingId === item.id ? (
                        /* Edit inline form */
                        <div className="rounded-lg border bg-muted/30 p-2 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={form.name}
                              onChange={(e) => setForm({ ...form, name: e.target.value })}
                              placeholder="Name"
                            />
                            <Input
                              type="number"
                              value={form.price}
                              onChange={(e) => setForm({ ...form, price: e.target.value })}
                              placeholder="Price"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={form.category}
                              onChange={(e) => setForm({ ...form, category: e.target.value })}
                              placeholder="Category"
                            />
                            <Input
                              value={form.description}
                              onChange={(e) => setForm({ ...form, description: e.target.value })}
                              placeholder="Description"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={form.isVeg}
                                onCheckedChange={(checked) => setForm({ ...form, isVeg: checked })}
                              />
                              <span className="text-xs">{form.isVeg ? "Veg" : "Non-veg"}</span>
                            </div>
                            <div className="flex gap-1">
                              <Button size="xs" variant="ghost" onClick={handleCancelEdit}>
                                <X className="size-3" />
                              </Button>
                              <Button size="xs" onClick={handleSaveEdit}>
                                <Check className="size-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Normal display row */
                        <div
                          className={`flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50 ${
                            !item.isAvailable ? "opacity-50" : ""
                          }`}
                        >
                          <VegIcon isVeg={item.isVeg} />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium">{item.name}</span>
                            {item.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 text-sm font-medium tabular-nums">
                            &#8377;{item.price}
                          </span>
                          <div className="flex items-center gap-1">
                            <Switch
                              size="sm"
                              checked={item.isAvailable}
                              onCheckedChange={() => handleToggleAvailability(item.id)}
                            />
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              onClick={() => handleStartEdit(item)}
                            >
                              <Pencil className="size-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
