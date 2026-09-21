"use client";

import { useState } from "react";
import { Button, cx } from "@/components/ui/kit";
import { advanceOrder } from "@/lib/api";

/**
 * Demo-only. Lets one person walk an order through the whole flow without the
 * restaurant and rider screens open. Collapsed by default so it stays out of
 * the way during a real demo.
 */
export function DemoControls({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function advance() {
    setBusy(true);
    setError(null);
    try {
      await advanceOrder(orderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not advance");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-auto pt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mx-auto block text-xs text-ink-faint hover:text-ink-soft"
      >
        {open ? "Hide" : "Demo controls"}
      </button>
      <div className={cx("mt-2 space-y-2", !open && "hidden")}>
        <Button variant="secondary" size="sm" className="w-full" loading={busy} onClick={advance}>
          Advance one step (as restaurant / rider)
        </Button>
        {error && <p className="text-center text-xs text-bad">{error}</p>}
        <p className="text-center text-xs text-ink-faint">
          Stands in for the operator screens while they are being built.
        </p>
      </div>
    </div>
  );
}
