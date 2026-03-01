"use client";
import { useState } from "react";
import { MessageBubble } from "./message-bubble";
import { ProductCard } from "./product-card";

export function ChatManager() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (input: string) => {
    setLoading(true);
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);

    const response = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: newMessages, userId: "user_123" }),
    });
    
    const data = await response.json();
    setMessages([...newMessages, { role: "assistant", content: data.text, products: data.products }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-4">
      <div className="flex-1 overflow-y-auto space-y-6 pb-20">
        {messages.map((m, i) => (
          <div key={i}>
            <MessageBubble message={m} />
            {m.products && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {m.products.map(p => <ProductCard key={p.sku} product={p} />)}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Input Component כאן */}
    </div>
  );
}
