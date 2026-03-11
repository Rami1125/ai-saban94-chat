"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

// ייבוא הכלים מהקובץ שציינת
import { ChatManager } from "./components/ChatManager";
import { MessageList } from "./components/message-list";
import { Composer } from "./components/Composer";
import { AnimatedOrb } from "./components/animated-orb";
import { ActionOverlays } from "./components/ActionOverlays";
import { CalculatorOverlay } from "./components/CalculatorOverlay";
import { ProductOrderSheet } from "./components/ProductOrderSheet";
import { TypingIndicator } from "./components/typing-indicator";
import { ChatShell } from "./components/chat-shell";

export default function SabanAICanvas() {
  // 1. ניהול מצב (State) מרכזי
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<null | 'calc' | 'order'>(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  // 2. פונקציית השליחה המרכזית (מחוברת ל-API הרוטטיבי שלנו)
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    setIsLoading(true);
    setIsTyping(true);
    
    // הוספת הודעת משתמש דרך ה-Manager
    const newUserMsg = { id: Date.now(), role: 'user', content };
    setMessages(prev => [...prev, newUserMsg]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, newUserMsg],
          phone: "972508860896", // הצינור של רמי
          user_id: "canvas-pro"
        }),
      });

      const data = await response.json();
      
      // הזרקת הודעת ה-Assistant
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.text,
        product: data.product // אם המוח מצא מוצר ב-Supabase
      }]);

      // אם חזר מוצר, נפתח אוטומטית את שכבת ההזמנה
      if (data.product) {
        setSelectedProduct(data.product);
      }
    } catch (error) {
      console.error("Canvas Error:", error);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  return (
    <ChatShell>
      {/* רקע אינטראקטיבי - ה-Orb המפורסם */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center opacity-40">
        <AnimatedOrb />
      </div>

      <div className="relative z-10 flex flex-col h-screen max-w-5xl mx-auto px-4 overflow-hidden">
        
        {/* שכבות פעולה (Overlays) - מחשבון ומלאי */}
        <ActionOverlays 
          onOpenCalc={() => setActiveOverlay('calc')} 
          activeKey={activeOverlay}
        />

        {/* גוף הצאט - רשימת הודעות חכמה */}
        <div className="flex-1 overflow-y-auto pt-20 pb-4 no-scrollbar">
          <MessageList 
            messages={messages} 
            onProductClick={(p) => {
              setSelectedProduct(p);
              setActiveOverlay('order');
            }}
          />
          {isTyping && <TypingIndicator />}
        </div>

        {/* קומפוזר (Composer) - שורת הכתיבה המעוצבת */}
        <div className="pb-8">
          <Composer 
            onSend={handleSendMessage} 
            disabled={isLoading} 
            placeholder="שאל את סבן AI על מלאי או סידור עבודה..."
          />
        </div>
      </div>

      {/* רכיבים צפים (Modals/Sheets) */}
      <AnimatePresence>
        {activeOverlay === 'calc' && (
          <CalculatorOverlay onClose={() => setActiveOverlay(null)} />
        )}
      </AnimatePresence>

      <ProductOrderSheet 
        product={selectedProduct} 
        isOpen={activeOverlay === 'order'} 
        onClose={() => {
          setActiveOverlay(null);
          setSelectedProduct(null);
        }}
      />

    </ChatShell>
  );
}
