"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Product, ChatMessage } from "@/types";
import { useConfig } from "./BusinessConfigContext";

interface ChatActionsContextType {
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  handleConsult: (product: Product, type: string) => void;
  isLoading: boolean;
  clearChat: () => void;
}

const ChatActionsContext = createContext<ChatActionsContextType | undefined>(undefined);

export function ChatActionsProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const config = useConfig();

  const clearChat = useCallback(() => setMessages([]), []);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // 1. הוספת הודעת המשתמש
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch(config.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      const data = await res.json();

      // 2. הוספת הודעת העוזר עם המוצר (אם קיים)
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.text || "סליחה, אירעה שגיאה בתקשורת.",
        product: data.product, // הזרקת המוצר לכרטיס
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsult = useCallback((product: Product, type: string) => {
    // פונקציה שמופעלת בלחיצה על כרטיס מוצר בחיפוש או בצ'אט
    const prompt = `אני רוצה להתייעץ לגבי ${product.product_name} בנושא ${type}. מה תוכל לספר לי?`;
    sendMessage(prompt);
  }, [sendMessage]);

  return (
    <ChatActionsContext.Provider value={{ 
      messages, 
      sendMessage, 
      handleConsult, 
      isLoading, 
      clearChat 
    }}>
      {children}
    </ChatActionsContext.Provider>
  );
}

export function useChatActions() {
  const context = useContext(ChatActionsContext);
  if (!context) {
    throw new Error("useChatActions must be used within a ChatActionsProvider");
  }
  return context;
}
