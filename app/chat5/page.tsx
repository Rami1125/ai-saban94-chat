"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

/**
 * יבוא דינמי של הקומפוננטות כדי להבטיח שה-Build יעבור חלק ב-Vercel.
 * זה פותר בעיות שבהן השרת מחפש קובץ עם אותיות גדולות/קטנות ולא מוצא.
 */

const ChatShell = dynamic(() => import("./components/chat-shell").then(m => m.ChatShell || m.default), { 
  ssr: true,
  fallback: <div className="min-h-screen bg-black" /> 
});

const AnimatedOrb = dynamic(() => import("./components/animated-orb").then(m => m.AnimatedOrb || m.default), { 
  ssr: false 
});

const MessageList = dynamic(() => import("./components/message-list").then(m => m.MessageList || m.default), { 
  ssr: false 
});

const Composer = dynamic(() => import("./components/Composer").then(m => m.Composer || m.default), { 
  ssr: false 
});

const ProductCard = dynamic(() => import("./components/ProductCard").then(m => m.ProductCard || m.default), { 
  ssr: false 
});

const CalculatorOverlay = dynamic(() => import("./components/CalculatorOverlay").then(m => m.CalculatorOverlay || m.default), { 
  ssr: false 
});

const ActionOverlays = dynamic(() => import("./components/ActionOverlays").then(m => m.ActionOverlays || m.default), { 
  ssr: false 
});

export default function SabanAICanvas() {
  const [messages, setMessages] = useState<any[]>([]);

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;
    
    const newUserMessage = {
      id: Date.now(),
      role: "user",
      content: content
    };
    
    setMessages((prev) => [...prev, newUserMessage]);
    
    // כאן תוסיף בעתיד את הקריאה ל-API של Gemini/SabanOS
  };

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      <ChatShell>
        {/* אלמנטים ויזואליים מרכזיים */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <AnimatedOrb />
        </div>

        {/* שכבת התוכן */}
        <div className="relative z-10 flex flex-col h-full w-full max-w-4xl mx-auto px-4">
          
          {/* רשימת ההודעות */}
          <section className="flex-1 overflow-y-auto py-20 no-scrollbar">
            <MessageList messages={messages} />
          </section>

          {/* רכיבים צפים (Overlays) */}
          <div className="space-y-4 mb-4">
            <ProductCard />
            <CalculatorOverlay />
            <ActionOverlays />
          </div>

          {/* שורת הקלט */}
          <footer className="pb-8">
            <Composer onSend={handleSendMessage} />
          </footer>
        </div>
      </ChatShell>
    </main>
  );
}
