"use client";
import { useState } from "react";
import { useChat } from "ai/react";
import { Composer } from "./composer";
import { MessageList } from "./message-list";

export function ChatManager() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const { messages, append, isLoading } = useChat({
    api: "/api/chat",
  });

  // פונקציית הליבה שמחברת את הכרטיס לצ'אט
  const handleConsult = (product: any, type: string) => {
    setSelectedProduct(product);
    append(
      { 
        role: "user", 
        content: `אני רוצה להתייעץ על ${type} במוצר: ${product.product_name}` 
      },
      { 
        body: { selectedProduct: product } 
      }
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50" dir="rtl">
      <main className="flex-1 overflow-y-auto p-4">
        {/* חיבור קריטי: העברת הפונקציה לרשימת ההודעות */}
        <MessageList messages={messages} onConsult={handleConsult} />
      </main>
      <footer className="p-4 bg-white border-t">
        {/* חיבור קריטי: העברת הפונקציה לחיפוש הציף */}
        <Composer 
          onSendMessage={(msg) => append({ role: 'user', content: msg }, { body: { selectedProduct } })}
          onSelectProduct={(p) => handleConsult(p, "התייעצות כללית")}
        />
      </footer>
    </div>
  );
}
