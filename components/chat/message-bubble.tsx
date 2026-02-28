"use client"

import { Message } from "./chat-shell"
import { CheckCircle2, PlayCircle } from "lucide-react"

export function MessageBubble({ message }: { message: Message }) {
  const isAssistant = message.role === "assistant"
  const blueprint = message.uiBlueprint

  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"} mb-6`}>
      <div className={`max-w-[85%] ${isAssistant ? "bg-white text-stone-800" : "bg-[#0B2C63] text-white"} rounded-2xl p-4 shadow-sm border border-stone-100`}>
        
        {/* טקסט ההודעה */}
        <p className="text-sm leading-relaxed mb-3">{message.content}</p>

        {/* רכיבי Blueprint (כרטיסי מוצר, חישובים, וידאו) */}
        {blueprint?.components?.map((comp: any, i: number) => (
          <div key={i} className="mt-3 border-t pt-3">
            
            {/* כרטיס מוצר עם תמונה */}
            {comp.type === "productCard" && (
              <div className="flex flex-col gap-2">
                {comp.props.image && (
                  <img src={comp.props.image} alt={comp.props.name} className="rounded-lg w-full h-32 object-cover" />
                )}
                <div className="font-bold text-[#0B2C63]">{comp.props.name}</div>
                <div className="text-xs text-stone-500">מק"ט: {comp.props.sku}</div>
                <div className="text-lg font-bold">₪{comp.props.price}</div>
                
                {/* כפתור וידאו אם קיים */}
                {comp.props.videoUrl && (
                  <a 
                    href={comp.props.videoUrl} 
                    target="_blank" 
                    className="flex items-center gap-2 p-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                  >
                    <PlayCircle size={16} />
                    צפה במדריך יישום (YouTube)
                  </a>
                )}
              </div>
            )}

            {/* כרטיס חישוב */}
            {comp.type === "calcCard" && (
              <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                <div className="text-[10px] text-green-600 font-bold uppercase">תוצאת חישוב</div>
                <div className="text-sm font-bold text-green-800">{comp.props.boxes}</div>
              </div>
            )}
          </div>
        ))}

        {/* חותמת אימות נתונים */}
        {isAssistant && blueprint?.source === "Saban AI - Verified" && (
          <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 w-fit px-2 py-0.5 rounded-full">
            <CheckCircle2 size={10} />
            Verified Saban Data
          </div>
        )}
      </div>
    </div>
  )
}
