// context/ChatContext.tsx
import { createContext, useContext, ReactNode } from "react";

interface ChatContextType {
  handleConsult: (product: any, type: string) => void;
  config: any;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children, value }: { children: ReactNode, value: ChatContextType }) {
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChatActions = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChatActions must be used within a ChatProvider");
  return context;
};
