"use client";
import { useState } from "react";
import { useChat } from "ai/react";
import { MessageList } from "./message-list";
import { Composer } from "./composer";

export function ChatManager() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // שימוש ב-onFinish כדי לתפוס את התגובה מהשרת ולעדכן את המטא-דאטה של ההודעה
  const { messages, append, isLoading, setMessages } = useChat({ 
    api: "/api/chat",
    onFinish: (message) => {
      // כאן אנחנו יכולים להוסיף לוגיקה שמעבדת את ה-JSON שחזר מה-API
      // אם ה-API מחזיר JSON מורכב, ה-SDK שומר אותו ב-experimental_attachments או ב-data
      console.log("Message finished:", message);
    }
  });

  const handleConsult = (product: any, type: string) => {
    setSelectedProduct(product);
    
    // שליחת הודעה עם הקשר של המוצר הנבחר
    append(
      { 
        role: "user", 
        content: `אני רוצה להתייעץ לגבי ${product.product_name} בנושא ${type}.` 
      },
      { 
        body: { 
          // הנתונים האלו יישלחו ל-API ב-route.ts תחת req.body
          selectedProduct: product 
        } 
      }
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50" dir="rtl">
      {/* כותרת קטנה לזיהוי המערכת */}
      <header className="p-3 bg-white border-b flex justify-between items-center shadow-sm">
        <h1 className="font-bold text-blue-600">Saban AI Assistant</h1>
        {selectedProduct && (
          <div className="text-xs bg-blue-50 px-2 py-1 rounded border border-blue-100">
            מתייעץ על: <span className="font-semibold">{selectedProduct.product_name}</span>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-4 scroll-smooth">
        <MessageList 
          messages={messages} 
          onConsult={handleConsult} 
          isLoading={isLoading} 
        />
      </main>

      <footer className="p-4 bg-white border-t">
        <Composer 
          onSendMessage={(msg) => {
            append(
              { role: 'user', content: msg }, 
              { body: { selectedProduct } }
            );
          }}
          onSelectProduct={(p) => handleConsult(p, "התייעצות כללית")}
        />
      </footer>
    </div>
  );
}
