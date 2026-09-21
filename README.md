# Bharat MCP — mockup

Ordering food from inside an assistant conversation. Four surfaces, one order, no real
payments, restaurants or riders anywhere.

```bash
npm install
npm run dev     # http://localhost:3000
```

| Surface | Route | Who it's for |
| --- | --- | --- |
| Assistant chat simulator | `/chat` | Customer — search, pick a dish, get a link |
| Dynamic order link | `/order/[id]` | Customer — summary → payment → live tracking |
| Restaurant interface | `/restaurant` | Owner — inbox, accept/reject, preparing/ready |
| Delivery partner | `/rider` | Partner rider — picked up, delivered |
| Ops console | `/admin` | Internal — onboarding, menu builder, Cat A/B, test orders |

Read [`docs/CONTRACT.md`](docs/CONTRACT.md) before touching `src/lib/`. That is the shared
piece every surface depends on.

## Demo script

Open three tabs side by side: `/chat`, `/restaurant`, `/rider`.

1. **`/chat`** — ask for *"best biryani near Koramangala"*. Five restaurants come back from
   what looks like an MCP tool call. Add a dish, adjust quantities, confirm the address,
   generate the payment link.
2. **`/order/[id]`** — the bill and a 30-minute countdown. Pay by UPI, card or cash. Tick
   *simulate a declined payment* first if you want to show the failure path.
3. **`/restaurant`** — sign in with `9845011202` (Meghana Foods). The order is already in
   the inbox, with the WhatsApp message the owner would have received. Accept it, start
   preparing, mark it ready. Watch the customer tab update without a refresh.
4. **`/rider`** — pick a rider. Meghana is Category B, so a partner rider has the job:
   mark it picked up, then out for delivery, then delivered.
5. Run it again with Mavalli Tiffin Rooms (`9845011201`). That one is **Category A**, so the
   restaurant drives the delivery leg itself and no rider is involved — and the customer's
   tracking screen looks exactly the same. That is the point.

**Ops console** (`/admin`): onboard a restaurant, scan a menu photo into structured items,
flip Category A/B, check partner coverage, and place a test order that lands in the
restaurant inbox like a real one. The **Reset demo** button on the Orders tab wipes
everything back to seed.

Working alone? **Demo controls** at the bottom of the order page advances an order one
step as the restaurant or rider would.

## Decisions this mockup makes

- **Dynamic links stay valid 30 minutes.** The countdown is visible to the customer, and
  unpaid links flip to `expired` on the next read.
- **Restaurant access is a magic link to the owner's WhatsApp number** — no password.
- **The customer is never told whether an order is Category A or B.** The tracking
  timeline is identical; only who performs the delivery leg differs.
- **One restaurant per order.** Mixing is rejected at creation.
- **A restaurant can't go live without an available menu item.**

## Architecture

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · shadcn/ui.

State lives in the **server process**, behind route handlers under `/api`, and clients
poll it. That is why three tabs on one laptop stay consistent, and why swapping the mock
for a real backend means replacing `src/lib/store.ts` rather than rewriting screens.
Nothing is persisted — restarting the dev server clears every order.

The operator surfaces use the shadcn primitives in `src/components/ui`; the customer
surfaces use the small hand-rolled kit in `src/components/ui/kit.tsx`. Both are driven by
one palette defined in `src/app/globals.css`.

## Checks

```bash
npm run build      # also generates the route types typecheck needs
npm run typecheck
npm run lint
```

CI runs all three on every PR.
