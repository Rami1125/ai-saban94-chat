"use client";
import React from 'react';
import { MessageCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

interface WhatsAppButtonProps {
  phone?: string;
  message?: string;
  label?: string;
  showQuestion?: boolean;
}

export default function SabanWhatsAppButton({ 
  phone = "972544527513", 
  message = "היי אלי, אני לקוח של ח.סבן ואשמח לייעוץ טכני לגבי מוצר סיקה",
  label = "לחץ כאן להתייעצות עם אלי ב-WhatsApp",
  showQuestion = true 
}: WhatsAppButtonProps) {
  
  // פונקציה להסתרת הלינק והפניה בטוחה
  const handleRedirect = () => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full max-w-sm mx-auto p-1 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-[2rem] border border-white/5 backdrop-blur-md shadow-2xl" dir="rtl">
      <div className="bg-[#0F172A]/90 p-5 rounded-[1.9rem]">
        
        {/* כותרת מוסתרת */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-green-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ערוץ שירות מאובטח</span>
          </div>
          <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></div>
        </div>

        {/* הכפתור העוטף - הלינק מוסתר בתוך ה-onClick */}
        <button 
          onClick={handleRedirect}
          className="group relative w-full h-16 bg-[#25D366] hover:bg-[#1da851] text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300 transform hover:-translate-y-1 shadow-[0_10px_30px_rgba(37,211,102,0.3)] overflow-hidden"
        >
          {/* אפקט הברקה שעובר על הכפתור */}
          <div className="absolute inset-0 w-1/2 h-full bg-white/20 -skew-x-[45deg] -translate-x-[150%] group-hover:translate-x-[250%] transition-transform duration-700"></div>
          
          <div className="bg-white/20 p-2 rounded-xl">
            <MessageCircle size={22} className="group-hover:rotate-12 transition-transform" />
          </div>
          
          <span className="text-sm md:text-base font-black tracking-tight leading-none">
            {label}
          </span>
          
          <ArrowLeft size={18} className="mr-auto ml-4 opacity-50 group-hover:translate-x-[-5px] transition-transform" />
        </button>

        {/* הנעה לפעולה לאחר הכפתור */}
        {showQuestion && (
          <div className="mt-5 pt-4 border-t border-white/5">
            <p className="text-center text-blue-400 font-bold text-sm tracking-tight">
              האם תרצה שנרכיב עבורך הזמנה לביצוע?
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
