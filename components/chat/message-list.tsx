"use client"

import { useRef, useEffect } from "react"
import { PlayCircle, Calculator, Clock } from "lucide-react"

export function MessageList({ messages = [], isStreaming }: any) {
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [messages])

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 pb-10 scroll-smooth">
      {messages.map((m: any) => (
        <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
          <div className="max-w-[85%] flex flex-col space-y-3">
            <div className={`p-4 rounded-[26px] text-[15px] font-bold shadow-sm ${m.role === "user" ? "bg-[#0B2C63] text-white rounded-tr-none" : "bg-white text-slate-800 border border-slate-50 rounded-tl-none"}`}>
              {m.content}
            </div>

            {m.uiBlueprint?.type === "product_card" && (
              <div className="w-[300px] bg-white rounded-[40px] overflow-hidden shadow-2xl border border-slate-50 animate-in zoom-in-95">
                <div className="relative h-44 w-full bg-slate-100">
                  {m.uiBlueprint.data.image && <img src={m.uiBlueprint.data.image} className="w-full h-full object-cover" />}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-2xl text-[16px] font-black text-[#0B2C63]">₪{m.uiBlueprint.data.price}</div>
                </div>
                <div className="p-6 text-right space-y-4">
                  <h3 className="font-black text-[#0B2C63] text-xl tracking-tighter">{m.uiBlueprint.data.title}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-[24px] text-center"><Calculator size={16} className="mx-auto text-blue-500 mb-1"/><div className="text-[9px] font-black text-slate-700">{m.uiBlueprint.data.specs.coverage}</div></div>
                    <div className="bg-slate-50 p-3 rounded-[24px] text-center"><Clock size={16} className="mx-auto text-orange-500 mb-1"/><div className="text-[9px] font-black text-slate-700">{m.uiBlueprint.data.specs.drying}</div></div>
                  </div>
                  <button className="w-full py-4 rounded-[22px] bg-[#0B2C63] text-white text-[13px] font-black shadow-lg">הזמנה מהירה</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
