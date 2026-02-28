"use client"

import { useEffect, useRef } from "react"
import { PlayCircle, Calculator, Clock, CheckCircle2 } from "lucide-react"

export function MessageList({ messages = [], isStreaming, isLoaded }: any) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, isStreaming])

  if (!isLoaded) return <div className="flex-1 flex items-center justify-center font-bold text-slate-300">SabanOS נטען...</div>

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 pb-40 scroll-smooth" dir="rtl">
      {messages.map((message: any) => (
        <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
          <div className="max-w-[85%] flex flex-col space-y-3">
            
            <div className={`p-4 rounded-[26px] text-[15px] font-bold shadow-sm ${
              message.role === "user" ? "bg-[#0B2C63] text-white rounded-tr-none" : "bg-white text-slate-800 border border-slate-50 rounded-tl-none"
            }`}>
              {message.content}
            </div>

            {message.uiBlueprint?.type === "product_card" && message.uiBlueprint.data && (
              <div className="w-[300px] bg-white rounded-[40px] overflow-hidden shadow-2xl border border-slate-50">
                <div className="relative h-48 w-full">
                  {message.uiBlueprint.data.image ? (
                    <img src={message.uiBlueprint.data.image} className="w-full h-full object-cover" alt="product" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300 font-bold">סבן חומרי בניין</div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-2xl text-[16px] font-black text-[#0B2C63] shadow-sm">
                    ₪{message.uiBlueprint.data.price || "---"}
                  </div>
                </div>

                <div className="p-6 text-right space-y-4">
                  <h3 className="font-black text-[#0B2C63] text-xl tracking-tight">{message.uiBlueprint.data.title}</h3>
                  
                  {message.uiBlueprint.data.features?.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-end">
                      {message.uiBlueprint.data.features.map((f: string, i: number) => (
                        <span key={i} className="bg-green-50 text-green-700 text-[9px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                          <CheckCircle2 size={10} /> {f}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-50 p-3 rounded-3xl text-center border border-slate-100/50">
                      <Calculator size={16} className="mx-auto text-blue-500 mb-1" />
                      <div className="text-[10px] font-black text-slate-700">{message.uiBlueprint.data.specs?.coverage || "לפי שטח"}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-3xl text-center border border-slate-100/50">
                      <Clock size={16} className="mx-auto text-orange-500 mb-1" />
                      <div className="text-[10px] font-black text-slate-700">{message.uiBlueprint.data.specs?.drying || "בבדיקה"}</div>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    {message.uiBlueprint.data.video && (
                      <a href={message.uiBlueprint.data.video} target="_blank" className="w-full py-3 rounded-2xl bg-red-50 text-red-600 text-[11px] font-black flex items-center justify-center gap-2">
                        <PlayCircle size={16} /> לצפייה בהדרכה
                      </a>
                    )}
                    <button className="w-full py-4 rounded-[22px] bg-[#0B2C63] text-white text-xs font-black shadow-lg shadow-blue-100 active:scale-95 transition-all">
                      הוספה לסל הקניות
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      {isStreaming && <div className="w-8 h-8 bg-slate-100 rounded-full animate-pulse ml-2" />}
    </div>
  )
}
