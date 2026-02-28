"use client"

import { useState, useEffect, useCallback } from "react"
import { MessageSquareDashed, Sparkles } from "lucide-react"
import { MessageList } from "./message-list"
import { Composer } from "./composer"
import { Button } from "@/components/ui/button"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
  uiBlueprint?: any
}

export function ChatShell() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      createdAt: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsStreaming(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      })

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.text || "הנה המידע שמצאתי:",
        uiBlueprint: data.uiBlueprint,
        createdAt: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (e) {
      console.error(e)
    } finally {
      setIsStreaming(false)
    }
  }, [messages, isStreaming])

  return (
    <div className="relative h-dvh bg-[#fbfbfb] overflow-hidden font-sans" dir="rtl">
      
      {/* העיגול הנושם - העיצוב המקורי שביקשת */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-blue-100/40 rounded-full blur-[80px] animate-pulse pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[-5%] w-[250px] h-[250px] bg-orange-100/30 rounded-full blur-[70px] animate-bounce duration-[10s] pointer-events-none z-0" />

      {/* כפתור איפוס צדדי */}
      <Button 
        onClick={() => setMessages([])} 
        variant="ghost" 
        className="absolute top-6 left-6 z-20 h-12 w-12 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-slate-100 active:scale-90 transition-all"
      >
        <MessageSquareDashed className="w-5 h-5 text-slate-400" />
      </Button>

      {/* רשימת הודעות */}
      <div className="relative z-10 h-full flex flex-col pt-4">
        <MessageList 
          messages={messages} 
          isStreaming={isStreaming} 
          isLoaded={isLoaded} 
        />
        
        {/* אזור ה-Composer (שדה הצאט) */}
        <div className="relative z-20 px-4 pb-8 bg-gradient-to-t from-[#fbfbfb] via-[#fbfbfb] to-transparent">
           <Composer 
             onSend={sendMessage} 
             isStreaming={isStreaming} 
             disabled={isStreaming} 
           />
           <div className="flex justify-center items-center gap-2 mt-3 opacity-30">
              <Sparkles size={12} className="text-[#0B2C63]" />
              <span className="text-[10px] font-black tracking-[2px] text-[#0B2C63] uppercase">SabanOS Artificial Intelligence</span>
           </div>
        </div>
      </div>
    </div>
  )
}
