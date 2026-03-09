"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Package, ArrowRight, Home, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const method = searchParams.get("method");
  
  useEffect(() => {
    // הפעלת קונפטי לחגיגת ההצלחה
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } });
    }, 250);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6" dir="rtl">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        
        {/* Icon & Success Message */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-green-500 blur-3xl opacity-20 animate-pulse"></div>
          <CheckCircle2 size={120} className="text-green-500 relative z-10 mx-auto" strokeWidth={1.5} />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">ההזמנה נשלחה!</h1>
          <p className="text-slate-500 font-medium">הפרטים הועברו למחסן להכנה וליקוט.</p>
        </div>

        {/* Order Status Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-2xl p-8 space-y-6">
          <div className="flex items-center justify-between text-right p-4 bg-slate-50 rounded-2xl">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">סטטוס הזמנה</p>
              <p className="font-bold text-slate-800">ממתין לליקוט</p>
            </div>
            <Package className="text-blue-600" size={24} />
          </div>

          <div className="text-right space-y-4">
            <h3 className="font-black text-slate-800 text-sm mr-1">מה עכשיו?</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-slate-600">
                <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                <span>המחסנאי קיבל התראה על ההזמנה שלך.</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600">
                <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                <span>{method === 'counter' ? 'נא לגשת לקופה להסדרת תשלום.' : 'ההזמנה תעובד לאחר אישור האשראי.'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={() => router.push("/checkout")}
            variant="outline"
            className="h-14 rounded-2xl font-bold border-slate-200 hover:bg-white flex items-center gap-2"
          >
            <ArrowRight size={18} className="rotate-180" /> הזמנה חדשה
          </Button>
          <Button 
            onClick={() => router.push("/")}
            className="h-14 rounded-2xl font-black bg-slate-900 hover:bg-blue-600 text-white shadow-lg shadow-slate-200 flex items-center gap-2"
          >
            <Home size={18} /> דף הבית
          </Button>
        </div>

        {/* Support */}
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          SabanOS Logistics AI System
        </p>
      </div>
    </div>
  );
}
