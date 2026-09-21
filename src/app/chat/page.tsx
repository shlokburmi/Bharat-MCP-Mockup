import type { Metadata } from "next";
import { ChatSimulator } from "@/components/customer/chat/ChatSimulator";

export const metadata: Metadata = {
  title: "Assistant · Bharat MCP",
  description: "Order food from an assistant chat, without leaving the conversation",
};

export default function ChatPage() {
  return <ChatSimulator />;
}
