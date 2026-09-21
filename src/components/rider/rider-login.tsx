"use client";

import { Rider } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RiderLoginProps {
  riders: Rider[];
  onSelect: (riderId: string) => void;
}

export function RiderLogin({ riders, onSelect }: RiderLoginProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="text-4xl">&#x1F6F5;</div>
          <h1 className="text-2xl font-bold tracking-tight">Rider Login</h1>
          <p className="text-sm text-muted-foreground">
            Select your profile to start delivering
          </p>
        </div>

        <div className="space-y-3">
          {riders.map((rider) => (
            <Card
              key={rider.id}
              className="cursor-pointer active:scale-[0.98] transition-transform hover:bg-accent"
              onClick={() => onSelect(rider.id)}
            >
              <CardContent className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-lg font-semibold">
                    {rider.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{rider.name}</p>
                    <p className="text-xs text-muted-foreground">{rider.phone}</p>
                  </div>
                </div>
                <Badge
                  variant={rider.isAvailable ? "default" : "secondary"}
                  className={
                    rider.isAvailable
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-orange-100 text-orange-700"
                  }
                >
                  {rider.isAvailable ? "Available" : "On Delivery"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
