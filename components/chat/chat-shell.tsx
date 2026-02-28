"use client"

import { useState, useEffect, useCallback } from "react"
import { MessageSquareDashed } from "lucide-react"
import { MessageList } from "./message-list"
import { Composer, type AIModel } from "./composer"
import { Button } from "@/components/ui/button"

// מודל נתונים מורחב לתמיכה בכרטיסים חכמים
export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
  imageData?: string
  uiBlueprint?: any // השדה שמכיל את נתוני ה-UI מה-API
}

const STORAGE_KEY = "saban-chat-messages"
const MODEL_STORAGE_KEY = "saban-selected-model"

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function ChatShell() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<AIModel>("google/gemini-2.0-flash-001")
  const [isLoaded, setIsLoaded] = useState(false)

  // טעינה מה-localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const messagesWithDates = parsed.map((msg: Message) => ({
          ...msg,
          createdAt: new Date(msg.createdAt),
        }))
        setMessages(messagesWithDates)
      }
      const savedModel = localStorage.getItem(MODEL_STORAGE_KEY) as AIModel | null
      if (savedModel) setSelectedModel(savedModel)
    } catch (e) {
      console.error("Failed to load history:", e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // שמירה ל-localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    }
  }, [messages, isLoaded])

  const handleModelChange = useCallback((model: AIModel) => {
    setSelectedModel(model)
    localStorage.setItem(MODEL_STORAGE_KEY, model)
  }, [])

  const sendMessage = useCallback(
    async (content: string, imageData?: string) => {
      if ((!content.trim() && !imageData) || isStreaming) return

      setError(null)
      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: content.trim() || "חיפוש מוצר...",
        createdAt: new Date(),
        imageData,
      }

      setMessages((prev) => [...prev, userMessage])
      setIsStreaming(true)

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            model: selectedModel,
          }),
        })

        if (!response.ok) throw new Error(`שגיאת שרת: ${response.status}`)

        const data = await response.json()

        const assistantMessage: Message = {
          id: generateId(),
          role: "assistant",
          content: data.text || "", // הטקסט החופשי
          uiBlueprint: data,        // ה-Blueprint השלם (כרטיסים, מחשבונים וכו')
          createdAt: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch (e: any) {
        console.error("Error sending message:", e)
        setError(e.message || "אירעה שגיאה בחיבור לשרת")
      } finally {
        setIsStreaming(false)
      }
    },
    [messages, isStreaming, selectedModel]
  )

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const retry = useCallback(() => {
    if (messages.length === 0) return
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")
    if (lastUserMessage) {
      sendMessage(lastUserMessage.content, lastUserMessage.imageData)
    }
  }, [messages, sendMessage])

  return (
    <div
      className="relative h-dvh bg-stone-50 overflow-hidden"
      style={{
        boxShadow: "rgba(14, 63, 126, 0.06) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px",
      }}
    >
      {/* כפתור איפוס צ'אט */}
      <Button
        onClick={clearChat}
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-20 h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-zinc-100 text-stone-600 border border-stone-200"
        aria-label="Reset chat"
      >
        <MessageSquareDashed className="w-5 h-5" />
      </Button>

      {/* רשימת ההודעות */}
      <MessageList 
        messages={messages} 
        isStreaming={isStreaming} 
        error={error} 
        onRetry={retry} 
        isLoaded={isLoaded} 
      />

      {/* שורת הקלט (Composer) */}
      <Composer
        onSend={sendMessage}
        onStop={() => setIsStreaming(false)}
        isStreaming={isStreaming}
        disabled={isStreaming}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
      />
    </div>
  )
}
