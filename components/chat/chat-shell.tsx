"use client"

import { useState, useEffect, useCallback } from "react"
import { MessageSquareDashed } from "lucide-react"
import { MessageList } from "./message-list"
import { Composer, type AIModel } from "./composer"
import { Button } from "@/components/ui/button"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
  imageData?: string
  uiBlueprint?: any
}

const STORAGE_KEY = "saban-chat-messages"

export function ChatShell() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setMessages(JSON.parse(stored).map((m: any) => ({ ...m, createdAt: new Date(m.createdAt) })))
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages, isLoaded])

  const sendMessage = useCallback(async (content: string, imageData?: string) => {
    if (!content.trim() || isStreaming) return
    setError(null)
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      createdAt: new Date(),
      imageData
    }

    setMessages(prev => [...prev, userMessage])
    setIsStreaming(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || `שגיאה ${response.status}`)
      }

      const data = await response.json()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.text || "מצאתי את המידע הבא:",
        uiBlueprint: data,
        createdAt: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsStreaming(false)
    }
  }, [messages, isStreaming])

  return (
    <div className="relative h-dvh bg-stone-50 overflow-hidden">
      <Button onClick={() => setMessages([])} variant="ghost" className="absolute top-4 left-4 z-20 h-10 w-10 rounded-full bg-white shadow-sm border">
        <MessageSquareDashed className="w-5 h-5" />
      </Button>
      <MessageList messages={messages} isStreaming={isStreaming} error={error} isLoaded={isLoaded} onRetry={() => {}} />
      <Composer onSend={sendMessage} isStreaming={isStreaming} disabled={isStreaming} onStop={() => setIsStreaming(false)} />
    </div>
  )
}
