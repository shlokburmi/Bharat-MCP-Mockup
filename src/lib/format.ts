/** SHARED CONTRACT — display helpers. All money in the app is paise. */

export function rupees(paise: number): string {
  const value = paise / 100;
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function timeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function relativeMins(iso: string): number {
  return Math.round((Date.parse(iso) - Date.now()) / 60_000);
}

/** "12:04" style countdown from now until `iso`. Clamps at zero. */
export function countdown(iso: string, now: number = Date.now()): string {
  const ms = Math.max(0, Date.parse(iso) - now);
  const mins = Math.floor(ms / 60_000);
  const secs = Math.floor((ms % 60_000) / 1000);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function expired(iso: string, now: number = Date.now()): boolean {
  return Date.parse(iso) <= now;
}
