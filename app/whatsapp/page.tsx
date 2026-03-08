"use client";

import React, { useState } from "react";
import SabanAICanvas from "@/components/chat/SabanAICanvas";
import { Sparkles, MessageCircle, ArrowLeft } from "lucide-react";
import Image from "next/image";

export default function WhatsAppPage() {
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans" dir="rtl">
      {/* רקע דקורטיבי עדין */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-slate-200/50 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md text-center space-y-8">
        {/* לוגו / כותרת */}
        <div className="space-y-2">
          <div className="inline-flex p-4 bg-white rounded-[30px] shadow-xl mb-4 border border-slate-100">
            <Sparkles className="text-blue-600 w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic">
            SABAN <span className="text-blue-600">AI</span>
          </h1>
          <p className="text-slate-500 font-medium">ייעוץ טכני ולוגיסטי מתקדם מבית ח. סבן</p>
        </div>

        {/* כרטיס הזמנה לפעולה */}
        <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-white space-y-6">
          <div className="text-right space-y-4">
            <h3 className="text-xl font-bold text-slate-800">איך אפשר לעזור היום?</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-slate-600">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                <span>ייעוץ בחירת חומרי בניין ואיטום</span>
              </li>
              <li className="flex items-center gap-3 text-slate-600">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                <span>תיאום משלוח (מנוף / פריקה ידנית)</span>
              </li>
              <li className="flex items-center gap-3 text-slate-600">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                <span>בדיקת מלאי בזמן אמת</span>
              </li>
            </ul>
          </div>

          {/* כפתור ההפעלה המרכזי שפותח את ה-Canvas */}
          <button
            onClick={() => setIsCanvasOpen(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-[24px] font-black text-xl flex items-center justify-center gap-3 shadow-lg shadow-blue-200 transition-all active:scale-95 group"
          >
            <span>התחל שיחה עם סבן AI</span>
            <MessageCircle className="group-hover:rotate-12 transition-transform" />
          </button>

          <p className="text-[10px] text-slate-400">
            בלחיצה על הכפתור יפתח ממשק ייעוץ אינטראקטיבי
          </p>
        </div>

        {/* קישור חזרה לאתר / קטלוג */}
        <button className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors mx-auto font-bold text-sm">
          <ArrowLeft size={16} />
          <span>חזרה לקטלוג המוצרים</span>
        </button>
      </div>

      {/* קומפוננטת ה-Canvas שנפתחת מעל הכל */}
      <SabanAICanvas 
        isOpen={isCanvasOpen} 
        onClose={() => setIsCanvasOpen(false)} 
      />
    </div>
  );
}
