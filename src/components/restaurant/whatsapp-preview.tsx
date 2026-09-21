"use client";

import { Order } from "@/types";

interface WhatsAppPreviewProps {
  order: Order;
}

export function WhatsAppPreview({ order }: WhatsAppPreviewProps) {
  const itemsList = order.items
    .map((item) => `${item.quantity}x ${item.name} - Rs.${item.price * item.quantity}`)
    .join("\n");

  const message = `New order from Bharat MCP!

Order #${order.id.slice(-3).toUpperCase()}
${itemsList}
Total: Rs.${order.totalAmount}

Customer: ${order.customerName}
Address: ${order.customerAddress}
Payment: ${order.paymentMethod.toUpperCase()}

Reply 'Accept' to confirm`;

  return (
    <div className="rounded-lg bg-gray-100 p-3">
      <p className="mb-2 text-xs font-medium text-gray-500">
        WhatsApp Message Preview
      </p>
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-lg rounded-tl-none bg-[#dcf8c6] px-3 py-2 shadow-sm">
          <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-gray-800">
            {message}
          </pre>
          <div className="mt-1 flex items-center justify-end gap-1">
            <span className="text-[10px] text-gray-500">
              {new Date(order.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <svg
              className="size-4 text-blue-500"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M11.07 5.55a.5.5 0 0 1 .08.7l-4 5a.5.5 0 0 1-.74.04l-2-2a.5.5 0 0 1 .7-.7l1.6 1.58 3.65-4.55a.5.5 0 0 1 .7-.08Z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
