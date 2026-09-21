# The shared contract

Everything in `src/lib/` is jointly owned. Change it by PR that both devs review;
everything else splits cleanly by audience.

| Owner | Files |
| --- | --- |
| Both | `src/lib/types.ts`, `state-machine.ts`, `operator-actions.ts`, `store.ts`, `store-input.ts`, `seed.ts`, `api.ts`, `order-cache.ts`, `sms.ts`, `format.ts`, `use-live-order.ts`, `use-restaurants.ts`, `src/app/api/**` |
| Dev A (customer) | `src/app/chat`, `src/app/order/[id]`, `src/app/sms`, `src/components/customer/**` |
| Dev B (operator) | `src/app/restaurant`, `src/app/rider`, `src/app/admin`, `src/components/{restaurant,rider,admin}/**` |
| Both | `src/components/ui/**` — shadcn primitives, plus `kit.tsx` for the customer surfaces. Additive changes only. |

## Order states

```
created ──pay──▶ paid ──▶ sent_to_restaurant ──▶ accepted ──▶ preparing ──▶ ready ──┐
   │                                     └──▶ rejected                              │
   ├──▶ payment_failed ──retry──▶ paid                        delivery ◀────────────┤
   └──▶ expired (30 min unpaid)                                  │                  │
                                                       picked_up ┘        pickup ───┤
                                                           │                        │
                                                  out_for_delivery              collected
                                                           │
                                                       delivered
```

Terminal: `delivered`, `collected`, `rejected`, `cancelled`, `expired`.

Rules that matter:

- **Nothing sets `order.status` directly.** Go through `applyTransition` (server) or
  `PATCH /api/orders/:id` (client). Illegal moves throw `IllegalTransitionError` → HTTP 409.
- `ready → picked_up` is delivery only; `ready → collected` is pickup only.
  `nextStatuses(order)` already filters by mode — use it to drive operator buttons.
- Category **A** restaurants run their own delivery leg, so the restaurant screen owns
  `picked_up → out_for_delivery → delivered`. Category **B** hands that leg to a partner
  rider, so the rider screen owns it. The customer sees the same stages either way —
  never surface the category on `/order/[id]`.
- Unpaid links expire 30 minutes after creation. Expiry is applied lazily on read, so
  any `GET` can return `expired` without anyone having called anything.

## API

All money is **paise** (`24900` = ₹249). All responses include the store `version`,
which bumps on every write — useful if you want a cheap change check.

| Method | Route | Notes |
| --- | --- | --- |
| `GET` | `/api/restaurants?q=&area=&limit=` | Search → `SearchResult[]`. No `q` returns top-rated. `?all=1` returns the raw list, for the ops console. |
| `GET` | `/api/restaurants/:id` | `{ restaurant, menu }` |
| `GET` | `/api/orders?restaurantId=&riderId=&phone=&status=&active=1` | The restaurant inbox, rider queue and SMS tracker all come from here. `active=1` drops terminal orders; `phone=` matches on the last 10 digits. |
| `POST` | `/api/orders` | `CreateOrderInput` → the order. Validates minimum order, sold-out items, single restaurant, pickup support. |
| `GET` | `/api/orders/:id` | One order |
| `PATCH` | `/api/orders/:id` | `{ status, actor, note?, rejectionReason?, etaMins?, assignRiderId? }` |
| `POST` | `/api/orders/:id/pay` | `{ method, outcome?, detail? }` — mock Razorpay. `method` is `upi \| card \| netbanking \| wallet \| cod`, `detail` is the instrument shown on the receipt. Success moves straight through `paid → sent_to_restaurant` and attaches a rider for Category B. |
| `POST` | `/api/demo/hydrate` | `{ orders }` — puts back orders this instance is missing. Called by `src/lib/api.ts`, not by screens. |
| `POST` | `/api/demo/reset` | Wipes orders, restores seed |
| `POST` | `/api/demo/advance` | `{ orderId }` — nudges an order one step. Demo/testing only. |

Use the typed client in `src/lib/api.ts` rather than `fetch`, so swapping the mock for a
real backend is one file plus the route handlers.

### Operator PATCH examples

```ts
// restaurant accepts, promising 35 minutes
transitionOrder(id, { status: "accepted", actor: "restaurant", etaMins: 35 });

// restaurant declines
transitionOrder(id, { status: "rejected", actor: "restaurant", rejectionReason: "Out of mutton" });

// rider picks a Category B order up
transitionOrder(id, { status: "picked_up", actor: "rider" });
```

## Operator buttons

Never hand-roll the action list on an operator screen. `src/lib/operator-actions.ts`
exports `restaurantActions(order)` and `riderActions(order)`, both filtered through
`canTransition`, so a surface can only offer a move the server will accept. It also
exports `partnerStatusNote(order)` — what the restaurant sees instead of buttons while a
Category B rider has the order — and `STATUS_PILL` for the status chips.

## State across tabs

The store lives in the Next server process (`globalThis`). Three tabs on one laptop are
three clients of the same store, so an order paid in the customer tab appears in the
restaurant tab on its next poll. `useLiveOrder` polls one order every 2s and backs off when
the tab is hidden; `useLiveOrders` does the same for a list.

Deployed serverless there is no single process, so the browser holds the durable copy:
`src/lib/order-cache.ts` mirrors every order the typed client sees into `localStorage`, and
a read that 404s or comes back short re-posts that cache to `/api/demo/hydrate` and retries.
Screens never touch it — go through `src/lib/api.ts` and it happens for you. Orders older
than 24h are dropped, and `resetDemo()` clears both sides.

## SMS

`src/lib/sms.ts` turns an order's timeline into the texts its customer would have received.
Derived, never stored, so a message cannot disagree with the order. `smsFeed(order)` backs
the card on `/order/[id]`; `smsInbox(orders)` backs `/sms`.
