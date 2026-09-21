import { Suspense } from "react";
import { SmsInbox } from "@/components/customer/SmsInbox";

export const metadata = {
  title: "SMS tracker · Bharat MCP",
  description: "Order updates as they arrive on the customer's phone",
};

export default function SmsPage() {
  return (
    <Suspense>
      <SmsInbox />
    </Suspense>
  );
}
