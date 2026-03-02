"use client"

import { useRef, useEffect } from "react"
import { PlayCircle, Calculator, Clock, Sparkles } from "lucide-react"
import { AnimatedOrb } from "./animated-orb"

export function MessageList({ messages = [], isStreaming }: any) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // גלילה אוטומטית למטה בכל הודעה חדשה
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isStreaming])

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 scroll-smooth no-scrollbar">
      {messages.map((m: any) => (
        <div 
          key={m.id} 
          className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-500`}
        >
          <div className="max-w-[85%] flex flex-col space-y-3">
            {/* בועת ההודעה */}
            <div 
              className={`p-5 rounded-[26px] text-[15px] font-bold shadow-sm leading-relaxed ${
                m.role === "user" 
                  ? "bg-[#0B2C63] text-white rounded-tr-none shadow-blue-900/20" 
                  : "bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-slate-200/50"
              }`}
            >
              {/* תמיכה ב-HTML עבור הדגשות <b> ו-<u> מה-API */}
              <div 
                className="prose prose-slate max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: m.content }} 
              />
            </div>

            {/* הצגת כרטיס מוצר (uiBlueprint) במידה וקיים */}
            {m.uiBlueprint?.type === "product_card" && (
              <div className="w-[300px] bg-white rounded-[40px] overflow-hidden shadow-2xl border border-slate-50 animate-in zoom-in-95 duration-700">
                <div className="relative h-44 w-full bg-slate-100">
                  {m.uiBlueprint.data.image && (
                    <img src={m.uiBlueprint.data.image} className="w-full h-full object-cover" alt="Product" />
                  )}
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-2xl text-[16px] font-black text-[#0B2C63] shadow-sm">
                    ₪{m.uiBlueprint.data.price}
                  </div>
                </div>
                
                <div className="p-6 text-right space-y-4" dir="rtl">
                  <h3 className="font-black text-[#0B2C63] text-xl tracking-tighter leading-none">
                    {m.uiBlueprint.data.title}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-[24px] text-center border border-slate-100">
                      <Calculator size={16} className="mx-auto text-blue-500 mb-1"/>
                      <div className="text-[9px] font-black text-slate-700 uppercase tracking-tighter">
                        {m.uiBlueprint.data.specs?.coverage || "כיסוי סטנדרטי"}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-[24px] text-center border border-slate-100">
                      <Clock size={16} className="mx-auto text-orange-500 mb-1"/>
                      <div className="text-[9px] font-black text-slate-700 uppercase tracking-tighter">
                        {m.uiBlueprint.data.specs?.drying || "ייבוש מהיר"}
                      </div>
                    </div>
                  </div>
                  
                  <button className="w-full py-4 rounded-[22px] bg-[#0B2C63] text-white text-[13px] font-black shadow-lg shadow-blue-900/30 active:scale-95 transition-transform">
                    הזמנה מהירה למחסן
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* אינדיקטור נשימה בזמן טעינה - Saban AI Breathing */}
      {isStreaming && (
        <div className="flex justify-start animate-in fade-in duration-300">
          <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm p-3 rounded-full border border-slate-100 shadow-sm">
            <AnimatedOrb size={20} variant="default" />
            <span className="text-[10px] font-black text-[#0B2C63] uppercase tracking-[2px] opacity-60">
              SabanAI Processing...
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
