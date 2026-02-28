"use client"

import { useEffect, useRef } from "react"
import { PlayCircle, Calculator, Clock, Package, ShoppingCart } from "lucide-react"

// ממשק ההודעה כפי שמוגדר ב-ChatShell
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
  uiBlueprint?: {
    type: string
    data: {
      title: string
      price: number | string
      image?: string
      video?: string
      specs: {
        coverage?: string
        drying?: string
        method?: string
      }
    }
  }
}

interface MessageListProps {
  messages: Message[]
  isStreaming: boolean
  error: string | null
  isLoaded: boolean
}

export function MessageList({ messages, isStreaming, error, isLoaded }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // גלילה אוטומטית בכל פעם שמגיעה הודעה חדשה
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isStreaming])

  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 font-bold animate-pulse">
        טוען את הקטלוג של סבן...
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 pb-40 scroll-smooth">
      {messages.map((message) => (
        <div 
          key={message.id} 
          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-3 duration-500`}
        >
          <div className={`max-w-[88%] flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
            
            {/* בועת הטקסט - עיצוב אייפון פרו */}
            <div className={`p-4 rounded-[28px] text-[14px] font-bold shadow-sm leading-relaxed tracking-tight ${
              message.role === "user" 
              ? "bg-[#0B2C63] text-white rounded-tr-none shadow-blue-100" 
              : "bg-white text-slate-900 border border-slate-100 rounded-tl-none shadow-slate-50"
            }`}>
              {message.content}
            </div>

            {/* כרטיס מוצר ויזואלי - ההצלבה מהסטודיו */}
            {message.uiBlueprint?.type === "product_card" && (
              <div className="mt-4 w-[290px] bg-white rounded-[35px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-50 animate-in zoom-in-95 duration-700 delay-150">
                
                {/* תמונת המוצר */}
                <div className="relative h-44 w-full bg-slate-100">
                  {message.uiBlueprint.data.image ? (
                    <img 
                      src={message.uiBlueprint.data.image} 
                      alt={message.uiBlueprint.data.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Package size={48} strokeWidth={1} />
                    </div>
                  )}
                  {/* תג מחיר צף */}
                  <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-2xl shadow-xl border border-slate-100">
                    <span className="text-[15px] font-black text-[#0B2C63]">₪{message.uiBlueprint.data.price || '---'}</span>
                  </div>
                </div>

                <div className="p-5 text-right space-y-4">
                  <h3 className="font-black text-[#0B2C63] text-lg leading-tight">
                    {message.uiBlueprint.data.title}
                  </h3>

                  {/* טבלת מפרט טכני מהירה */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-blue-50/40 p-3 rounded-[20px] border border-blue-100/30 flex flex-col items-center">
                      <Calculator size={16} className="text-blue-600 mb-1.5" />
                      <span className="text-[10px] font-black text-[#0B2C63]">{message.uiBlueprint.data.specs.coverage || 'לפי שטח'}</span>
                    </div>
                    <div className="bg-orange-50/40 p-3 rounded-[20px] border border-orange-100/30 flex flex-col items-center">
                      <Clock size={16} className="text-orange-600 mb-1.5" />
                      <span className="text-[10px] font-black text-[#0B2C63]">{message.uiBlueprint.data.specs.drying || 'משתנה'}</span>
                    </div>
                  </div>

                  {/* כפתור וידאו הדרכה */}
                  {message.uiBlueprint.data.video && (
                    <a 
                      href={message.uiBlueprint.data.video} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-red-50 text-red-600 rounded-2xl text-[11px] font-black border border-red-100 hover:bg-red-100 transition-all active:scale-95"
                    >
                      <PlayCircle size={16} />
                      צפה בסרטון הדרכה (YouTube)
                    </a>
                  )}

                  {/* כפתור פעולה - הזמנה בוואטסאפ */}
                  <button className="w-full py-4 bg-[#0B2C63] text-white rounded-2xl text-[13px] font-black shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <ShoppingCart size={16} />
                    הזמן עכשיו למשלוח
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* אנימציית טעינה של ה-AI */}
      {isStreaming && (
        <div className="flex justify-start items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center animate-bounce">
             <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
          </div>
          <div className="bg-slate-100 h-8 w-16 rounded-2xl rounded-tl-none animate-pulse" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-3xl text-[11px] font-black border border-red-100 text-center animate-shake">
          {error}
        </div>
      )}
    </div>
  )
}
