"use client";

import { useState } from "react";
import { fetchAllRestaurants } from "@/lib/api";
import { Restaurant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface LoginScreenProps {
  onLogin: (restaurant: Restaurant) => void;
}

const digits = (s: string) => s.replace(/\D/g, "").slice(-10);

/**
 * Restaurant access is mocked as a magic link to the owner's WhatsApp number —
 * no password. Entering a registered number is the whole of "auth" here.
 */
export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const restaurants = await fetchAllRestaurants();
      const match = restaurants.find((r) => digits(r.phone) === digits(phone));
      if (match) onLogin(match);
      else setError("No restaurant is registered with this number");
    } catch {
      setError("Could not reach the server. Is the dev server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-dots flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="shadow-soft mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-good-soft">
            <svg
              className="size-6 text-good"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a1.5 1.5 0 0 1-.386-1.033l.162-2.91A1.5 1.5 0 0 1 5.02 4.05h13.96a1.5 1.5 0 0 1 1.494 1.356l.162 2.91A1.5 1.5 0 0 1 20.25 9.35"
              />
            </svg>
          </div>
          <CardTitle className="text-lg">Restaurant Dashboard</CardTitle>
          <CardDescription>
            Enter your registered WhatsApp number to see your orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp Number</Label>
              <div className="flex gap-2">
                <div className="flex h-8 items-center rounded-lg border border-border bg-muted px-2.5 text-sm text-muted-foreground">
                  +91
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="9845011201"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Seeded restaurants use 9845011201 through 9845011208.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</div>
            )}

            <Button
              type="submit"
              className="w-full bg-good text-white hover:bg-good/90"
              disabled={loading || phone.length !== 10}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
