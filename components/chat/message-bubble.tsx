"use client"

import { cn } from "@/lib/utils"
import type { Message } from "./chat-shell"
import { User } from "lucide-react"
import { MarkdownRenderer } from "./markdown-renderer"
import Image from "next/image"
import { AnimatedOrb } from "./animated-orb"
import CanvasRenderer from "./CanvasRenderer" // ייבוא המרנדר החדש

interface MessageBubbleProps {
  message: Message & { uiBlueprint?: any } // הוספת תמיכה ב-UIBlueprint
  isStreaming?: boolean
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex max-w-[95%] md:max-w-[85%] gap-3 mb-6",
        isUser
          ? "ml-auto flex-row-reverse user-message-enter"
          : "mr-auto animate-in fade-in slide-in-from-bottom-2 duration-500 items-end",
      )}
    >
      {/* Avatar - Orb לסבן, User למשתמש */}
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
          isUser ? "bg-white border border-stone-200" : "bg-[#0B2C63] border border-[#10B981]/30",
          !isUser && isStreaming && "animate-pulse",
        )}
      >
        {isUser ? (
          <User className="w-5 h-5 text-stone-800" />
        ) : (
          <AnimatedOrb className="w-9 h-9 shrink-0" />
        )}
      </div>

      {/* Message content */}
      <div className={cn("flex flex-col space-y-1.5", isUser ? "items-end" : "items-start")}>
        <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 px-1">
          {isUser ? "Rami" : "Saban AI"}
        </span>

        {/* Bubble - Glassmorphism לסבן, נקי למשתמש */}
        <div
          className={cn(
            "rounded-[1.5rem] overflow-hidden transition-all duration-500",
            isUser
              ? "bg-[#0B2C63] text-white rounded-tr-sm shadow-md"
              : "bg-white/5 backdrop-blur-xl border border-white/10 rounded-tl-sm shadow-2xl",
          )}
          style={{
            minWidth: isUser ? "auto" : "280px",
          }}
        >
          <div className={cn("flex flex-col gap-3", isUser ? "px-5 py-3" : "px-1 py-1")}>
            {isUser ? (
              <div className="flex flex-col gap-2">
                {message.imageData && (
                  <div className="w-32 h-32 rounded-lg overflow-hidden border border-white/10">
                    <Image
                      src={message.imageData || "/placeholder.svg"}
                      alt="Uploaded image"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap break-words italic">
                  {message.content}
                </p>
              </div>
            ) : (
              <div className="flex flex-col space-y-4">
                {/* הצגת טקסט חופשי אם קיים */}
                {message.content && (
                  <div className="px-4 py-3">
                    <MarkdownRenderer content={message.content} isStreaming={isStreaming} />
                  </div>
                )}

                {/* הקסם: רינדור כרטיסי ה-Generative UI מהמאגר הראשי */}
                {message.uiBlueprint && (
                  <div className="animate-in fade-in zoom-in duration-700">
                    <CanvasRenderer data={message.uiBlueprint} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-1.5 px-2">
          <span className="text-[9px] font-bold text-stone-500/60 uppercase tracking-tighter">
            {formatTime(new Date(message.createdAt))}
          </span>
          {!isUser && message.uiBlueprint && (
            <div className="flex items-center gap-1 text-[9px] font-black text-[#10B981] uppercase">
              <div className="w-1 h-1 bg-[#10B981] rounded-full animate-pulse" />
              Verified Data
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
