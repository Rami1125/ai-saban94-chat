"use client";
import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Product, ChatMessage } from "../types";
import { buildConsultMessage } from "../utils/chat-helpers"; // וודא שהנתיב תקין
import { safeFetch } from "../lib/api-client";
import { useConfig } from "./BusinessConfigContext";

interface ChatActionsContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  handleConsult: (product: Product, type: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
}

const ChatActionsContext = createContext<ChatActionsContextType | null>(null);

export function ChatActionsProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const config = useConfig();

  const executeQuery = useCallback(async (userMsg: Partial<ChatMessage>, selectedProduct?: Product) => {
    setIsLoading(true);
    setError(null);
    
    const newUserMsg = { ...userMsg, id: crypto.randomUUID(), role: 'user' as const, timestamp: Date.now() } as ChatMessage;
    setMessages(prev => [...prev, newUserMsg]);

    try {
      const response = await safeFetch<{ text: string }>(config.apiUrl, {
        method: "POST",
        body: JSON.stringify({
          messages: [...messages, newUserMsg],
          selectedProduct: selectedProduct || newUserMsg.product,
          businessId: config.businessId
        })
      });

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.text,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setError("מצטער, חלה שגיאה בתקשורת. אנא נסה שוב.");
    } finally {
      setIsLoading(false);
    }
  }, [messages, config]);

  const handleConsult = async (product: Product, type: string) => {
    const consultMsg = buildConsultMessage(product, type);
    await executeQuery(consultMsg, product);
  };

  const sendMessage = async (content: string) => {
    await executeQuery({ content });
  };

  return (
    <ChatActionsContext.Provider value={{ messages, isLoading, error, handleConsult, sendMessage }}>
      {children}
    </ChatActionsContext.Provider>
  );
}

export function useChatActions() {
  const context = useContext(ChatActionsContext);
  if (!context) throw new Error("useChatActions must be used within ChatActionsProvider");
  return context;
}
