"use client";
import { useState } from "react";
import { useChat } from "ai/react";
import { Composer } from "./composer";
import { MessageList } from "./message-list";
import { ProductCard } from "./ProductCard";

export function ChatManager() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const { messages, append, isLoading } = useChat({
    api: "/api/chat",
    body: { selectedProduct },
  });

  const handleConsult = (product: any, type: string) => {
    setSelectedProduct(product);
    append({
      role: "user",
      content: `אני רוצה להתייעץ על ${type} במוצר: ${product.product_name}`,
    });
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50" dir="rtl">
      <main className="flex-1 overflow-y-auto p-4">
        {/* העברת handleConsult ל-MessageList כדי שכרטיסים בתוך הצ'אט יעבדו */}
        <MessageList messages={messages} onConsult={handleConsult} />
      </main>
      <footer className="p-4 bg-white border-t">
        <Composer 
          onSendMessage={(msg) => append({ role: 'user', content: msg })}
          onSelectProduct={(p) => handleConsult(p, "התייעצות כללית")}
        />
      </footer>
    </div>
  );
}
