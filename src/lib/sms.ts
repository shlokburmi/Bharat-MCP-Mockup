/**
 * SHARED CONTRACT — the SMS trail an order leaves on the customer's phone.
 *
 * Not everyone tracking an order is inside the assistant: the link is also
 * texted, and each stage sends a plain SMS the way an Indian delivery service
 * does. Derived from `order.timeline` rather than stored, so a message can
 * never disagree with the order it describes.
 */
import { rupees, timeOfDay } from "./format";
import type { Order, OrderEvent, OrderStatus } from "./types";

/** What a DLT-registered sender id looks like on an Indian handset. */
export const SMS_SENDER = "JM-BHRTMC";

export interface SmsMessage {
  id: string;
  at: string;
  sender: string;
  body: string;
  /** relative href to the order link the message points at, when it has one */
  href?: string;
  orderId: string;
  orderCode: string;
}

/** The short form a real SMS would carry instead of a full URL. */
export function shortLink(order: Order): string {
  return `bhrt.mc/${order.id.slice(-6)}`;
}

function bodyFor(order: Order, event: OrderEvent): string | null {
  const link = shortLink(order);
  const total = rupees(order.totals.total);
  const eta = order.etaAt ? timeOfDay(order.etaAt) : null;
  const pickup = order.mode === "pickup";

  const lines: Partial<Record<OrderStatus, string>> = {
    created: `${order.code}: Your order from ${order.restaurantName} is ready to pay — ${total}. This link is valid 30 mins: ${link}`,
    payment_failed: `${order.code}: Payment failed, nothing was deducted. Retry here: ${link}`,
    expired: `${order.code}: Your payment link has expired. Ask your assistant for a fresh one.`,
    paid: `${order.code}: Payment of ${total} received${
      order.paymentDetail ? ` via ${order.paymentDetail}` : ""
    }. Sending your order to ${order.restaurantName}. Track live: ${link}`,
    sent_to_restaurant: `${order.code}: Sent to ${order.restaurantName}. Waiting for them to confirm.`,
    accepted: `${order.code}: ${order.restaurantName} confirmed your order${
      eta ? `. ${pickup ? "Ready by" : "Arriving by"} ${eta}` : ""
    }. Track: ${link}`,
    preparing: `${order.code}: Your food is being prepared at ${order.restaurantName}.`,
    ready: pickup
      ? `${order.code}: Ready for pickup at ${order.restaurantName}, ${order.customer.area}. Show this code at the counter.`
      : `${order.code}: Packed and waiting for the delivery partner.`,
    picked_up: `${order.code}: ${
      order.riderName ?? `${order.restaurantName} delivery`
    } has picked up your order${order.riderPhone ? ` (${order.riderPhone})` : ""}.`,
    out_for_delivery: `${order.code}: Out for delivery${
      eta ? `, arriving around ${eta}` : ""
    }. Live tracking: ${link}`,
    delivered: `${order.code}: Delivered. Enjoy your meal! Rate your order: ${link}`,
    collected: `${order.code}: Collected — thanks for picking up. See you again soon.`,
    rejected: `${order.code}: ${order.restaurantName} could not take this order${
      order.rejectionReason ? ` (${order.rejectionReason})` : ""
    }.${order.paymentMethod && order.paymentMethod !== "cod" ? ` Refund of ${total} initiated.` : ""}`,
    cancelled: `${order.code}: Your order was cancelled.${
      order.paymentMethod && order.paymentMethod !== "cod" ? ` Refund of ${total} initiated.` : ""
    }`,
  };

  return lines[event.status] ?? null;
}

/** One message per timeline stage the customer would actually be texted. */
export function smsFeed(order: Order): SmsMessage[] {
  return order.timeline
    .map((event, i): SmsMessage | null => {
      const body = bodyFor(order, event);
      if (!body) return null;
      return {
        id: `${order.id}_${i}`,
        at: event.at,
        sender: SMS_SENDER,
        body,
        href: body.includes(shortLink(order)) ? `/order/${order.id}` : undefined,
        orderId: order.id,
        orderCode: order.code,
      };
    })
    .filter((m): m is SmsMessage => m !== null);
}

/** Every message across several orders, newest last — the phone's thread. */
export function smsInbox(orders: Order[]): SmsMessage[] {
  return orders
    .flatMap(smsFeed)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}
