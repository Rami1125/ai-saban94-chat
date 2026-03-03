"use client";
import { useState } from "react";
import { useChat } from "ai/react";
import { MessageList } from "./message-list";
import { Composer } from "./composer";

export function ChatManager() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const { messages, append, isLoading } = useChat({ api: "/api/chat" });

  const handleConsult = (product: any, type: string) => {
    setSelectedProduct(product);
    // שליחה ב-body של ה-append עוקפת את האסינכרוניות של ה-State
    append(
      { role: "user", content: `התייעצות על ${type}: ${product.product_name}` },
      { body: { selectedProduct: product } }
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50" dir="rtl">
      <main className="flex-1 overflow-y-auto p-4">
        <MessageList messages={messages} onConsult={handleConsult} isLoading={isLoading} />
      </main>
      <footer className="p-4 bg-white border-t">
        <Composer 
          onSendMessage={(msg) => append({ role: 'user', content: msg }, { body: { selectedProduct } })}
          onSelectProduct={(p) => handleConsult(p, "התייעצות כללית")}
        />
      </footer>
    </div>
  );
}
