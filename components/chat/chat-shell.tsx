"use client"

import { useState, useCallback } from "react"
import { MessageSquareDashed, Sparkles } from "lucide-react"
import { MessageList } from "./message-list"
import { Composer } from "./composer"
import { Button } from "@/components/ui/button"

export function ChatShell() {
  const [messages, setMessages] = useState<any[]>([])
  const [isStreaming, setIsStreaming] = useState(false)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return
    
    const userMessage = { id: Date.now().toString(), role: "user", content, createdAt: new Date() }
    setMessages(prev => [...prev, userMessage])
    setIsStreaming(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      })
      const data = await response.json()
      setMessages(prev => [...prev, { 
        id: (Date.now()+1).toString(), 
        role: "assistant", 
        content: data.text, 
        uiBlueprint: data.uiBlueprint, 
        createdAt: new Date() 
      }])
    } catch (e) { console.error(e) } finally { setIsStreaming(false) }
  }, [messages, isStreaming])

  return (
    <div className="relative h-dvh bg-[#fbfbfb] overflow-hidden font-sans" dir="rtl">
      
      {/* העיגול הנושם המקורי שביקשת */}
      <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-blue-100/40 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-5%] w-[350px] h-[350px] bg-orange-100/30 rounded-full blur-[90px] animate-bounce duration-[15s] pointer-events-none" />

      <Button onClick={() => setMessages([])} variant="ghost" className="absolute top-6 left-6 z-20 h-12 w-12 rounded-full bg-white shadow-sm border border-slate-100">
        <MessageSquareDashed className="w-5 h-5 text-slate-400" />
      </Button>

      <div className="relative z-10 h-full flex flex-col pt-4">
        <MessageList messages={messages} isStreaming={isStreaming} isLoaded={true} />
        
        <div className="px-4 pb-10 bg-gradient-to-t from-[#fbfbfb] to-transparent pt-10">
           <Composer onSend={sendMessage} isStreaming={isStreaming} disabled={isStreaming} />
           <div className="flex justify-center items-center gap-2 mt-4 opacity-40">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span className="text-[10px] font-black tracking-[3px] text-[#0B2C63] uppercase">SabanOS Active AI</span>
           </div>
        </div>
      </div>
    </div>
  )
}
