"use client"

import { cn } from "@/lib/utils"
import type { Message } from "./chat-shell"
import { User } from "lucide-react"
import { MarkdownRenderer } from "./markdown-renderer"
import Image from "next/image"
import { AnimatedOrb } from "./animated-orb"
import { CanvasRenderer } from "./canvas-renderer"

interface MessageBubbleProps {
  message: Message & { uiBlueprint?: any }
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
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
          isUser ? "bg-white border border-stone-200" : "bg-[#0B2C63] border border-[#10B981]/30",
          !isUser && isStreaming && "animate-pulse",
        )}
      >
        {isUser ? <User className="w-5 h-5 text-stone-800" /> : <AnimatedOrb className="w-9 h-9 shrink-0" />}
      </div>

      <div className={cn("flex flex-col space-y-1.5", isUser ? "items-end" : "items-start")}>
        <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 px-1">
          {isUser ? "Rami" : "Saban AI"}
        </span>

        <div
          className={cn(
            "rounded-[1.5rem] overflow-hidden transition-all duration-500",
            isUser
              ? "bg-[#0B2C63] text-white rounded-tr-sm shadow-md px-5 py-3"
              : "bg-white/5 backdrop-blur-xl border border-white/10 rounded-tl-sm shadow-2xl",
          )}
        >
          {isUser ? (
            <div className="flex flex-col gap-2">
              {message.imageData && (
                <div className="w-32 h-32 rounded-lg overflow-hidden">
                  <Image src={message.imageData} alt="User upload" width={128} height={128} className="object-cover" />
                </div>
              )}
              <p className="text-sm font-medium leading-relaxed italic">{message.content}</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {message.content && (
                <div className="px-4 py-3 text-white/90">
                  <MarkdownRenderer content={message.content} isStreaming={isStreaming} />
                </div>
              )}
              {message.uiBlueprint && (
                <div className="p-1 animate-in zoom-in duration-500">
                  <CanvasRenderer data={message.uiBlueprint} />
                </div>
              )}
            </div>
          )}
        </div>
        <span className="text-[9px] font-bold text-stone-500/60 px-2 uppercase">
          {formatTime(new Date(message.createdAt))}
        </span>
      </div>
    </div>
  )
}
