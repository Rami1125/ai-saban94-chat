"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Package, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const method = searchParams.get("method");
  
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-right" dir="rtl">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        
        {/* Checkmark Icon with Pulse Effect */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-green-500 blur-3xl opacity-20 animate-pulse"></div>
          <div className="relative z-10 bg-white rounded-full p-4 shadow-xl">
            <CheckCircle2 size={100} className="text-green-500" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">ההזמנה נשלחה!</h1>
          <p className="text-slate-500 font-medium">הפרטים הועברו למחסן להכנה וליקוט.</p>
        </div>

        {/* Info Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-2xl p-8 space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">סטטוס הזמנה</p>
              <p className="font-bold text-slate-800">נשלח למחסן</p>
            </div>
            <Package className="text-blue-600" size={24} />
          </div>

          <div className="text-right space-y-4">
            <h3 className="font-black text-slate-800 text-sm mr-1">מה עכשיו?</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">1</span>
                <span>הזמנתך ממתינה בתור לליקוט על ידי צוות המחסן.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">2</span>
                <span>{method === 'counter' ? 'נא לגשת לדלפק הקופה להסדרת תשלום.' : 'המערכת תשלח אישור סופי לאחר חיוב האשראי.'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={() => router.push("/checkout")}
            variant="outline"
            className="h-14 rounded-2xl font-bold border-slate-200 hover:bg-white flex items-center justify-center gap-2"
          >
            <ArrowRight size={18} className="rotate-180" /> הזמנה נוספת
          </Button>
          <Button 
            onClick={() => router.push("/")}
            className="h-14 rounded-2xl font-black bg-slate-900 hover:bg-blue-600 text-white shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Home size={18} /> דף הבית
          </Button>
        </div>

        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
          SabanOS • AI Logistics Management
        </p>
      </div>
    </div>
  );
}
