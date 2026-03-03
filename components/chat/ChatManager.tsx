"use client";
import { useState } from "react";
import { useChat } from "ai/react";
import { Composer } from "./composer";
import { MessageList } from "./message-list";

export function ChatManager() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const { messages, append, isLoading } = useChat({
    api: "/api/chat",
    // הערה: נשמור את ה-body הכללי אבל נחזק אותו ב-append
    body: { selectedProduct },
  });

  // התיקון הקריטי לבאג האסינכרוני:
  const handleConsult = (product: any, type: string) => {
    setSelectedProduct(product);
    
    // שליחת המוצר ישירות בבקשה הנוכחית כדי לעקוף את הדיליי של ה-State
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
      <main className="flex-1 overflow-y-auto p-4 scroll-smooth">
        {/* חשוב: העברת handleConsult כפונקציה ולא כקריאה לפונקציה */}
        <MessageList messages={messages} onConsult={handleConsult} />
      </main>
      <footer className="p-4 bg-white border-t z-10">
        <Composer 
          onSendMessage={(msg) => append({ role: 'user', content: msg }, { body: { selectedProduct } })}
          onSelectProduct={(p) => handleConsult(p, "התייעצות כללית")}
        />
      </footer>
    </div>
  );
}
