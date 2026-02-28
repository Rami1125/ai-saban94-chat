"use client"

import { useEffect, useRef } from "react"
import { PlayCircle, Calculator, Clock, Package, ExternalLink } from "lucide-react"
import { Message } from "./chat-shell" // וודא שהטייפ Message מיובא נכון

interface MessageListProps {
  messages: Message[]
  isStreaming: boolean
  error: string | null
  isLoaded: boolean
  onRetry: () => void
}

export function MessageList({ messages, isStreaming, error, isLoaded }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // גלילה אוטומטית להודעה האחרונה
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isStreaming])

  if (!isLoaded) return <div className="flex-1 flex items-center justify-center text-slate-400">טוען צ'אט...</div>

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 pb-32 custom-scrollbar">
      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
          <div className={`max-w-[85%] space-y-2 ${message.role === "user" ? "items-end" : "items-start"}`}>
            
            {/* בועת הטקסט הרגילה */}
            <div className={`p-4 rounded-[24px] text-sm font-bold shadow-sm ${
              message.role === "user" 
              ? "bg-[#0B2C63] text-white rounded-tr-none" 
              : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
            }`}>
              {message.content}
            </div>

            {/* כרטיס מוצר חכם - מופיע רק אם יש uiBlueprint מהשרת */}
            {message.uiBlueprint?.type === "product_card" && (
              <div className="mt-3 w-[280px] bg-white rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-500">
                
                {/* תמונת המוצר מהסטודיו */}
                {message.uiBlueprint.data.image ? (
                  <div className="relative h-40 w-full">
                    <img 
                      src={message.uiBlueprint.data.image} 
                      alt={message.uiBlueprint.data.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black text-[#0B2C63] shadow-sm">
                       ₪{message.uiBlueprint.data.price}
                    </div>
                  </div>
                ) : (
                  <div className="h-32 bg-slate-100 flex items-center justify-center text-slate-300">
                    <Package size={32} />
                  </div>
                )}

                <div className="p-4 text-right space-y-3">
                  <h3 className="font-black text-[#0B2C63] text-base leading-tight">
                    {message.uiBlueprint.data.title}
                  </h3>

                  {/* נתונים טכניים (הצלבה מה-Database) */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-blue-50/50 p-2 rounded-xl border border-blue-100/50 flex flex-col items-center justify-center">
                      <Calculator size={14} className="text-blue-600 mb-1" />
                      <span className="text-[9px] font-bold text-blue-900">{message.uiBlueprint.data.specs.coverage || 'לפי דרישה'}</span>
                    </div>
                    <div className="bg-orange-50/50 p-2 rounded-xl border border-orange-100/50 flex flex-col items-center justify-center">
                      <Clock size={14} className="text-orange-600 mb-1" />
                      <span className="text-[9px] font-bold text-orange-900">{message.uiBlueprint.data.specs.drying || 'משתנה'}</span>
                    </div>
                  </div>

                  {/* כפתור וידאו אם קיים לינק בסטודיו */}
                  {message.uiBlueprint.data.video && (
                    <a 
                      href={message.uiBlueprint.data.video} 
                      target="_blank" 
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-50 text-red-600 rounded-xl text-[11px] font-black border border-red-100 hover:bg-red-100 transition-colors"
                    >
                      <PlayCircle size={14} />
                      צפה בסרטון הדרכה
                    </a>
                  )}

                  <button className="w-full py-3 bg-[#0B2C63] text-white rounded-xl text-xs font-black shadow-lg shadow-blue-100 active:scale-95 transition-all">
                    הוסף להזמנה מהירה
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {isStreaming && (
        <div className="flex justify-start animate-pulse">
          <div className="bg-slate-100 h-10 w-24 rounded-2xl rounded-tl-none" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 text-center">
          {error}
        </div>
      )}
    </div>
  )
}
