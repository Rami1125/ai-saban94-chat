"use client";
import React, { useState, useEffect } from 'react';
import { getSupabase } from "@/lib/supabase";
import { 
  Bell, ShieldCheck, Truck, MessageSquare, 
  Check, X, Zap, Crown, ExternalLink 
} from "lucide-react";
import { toast, Toaster } from "sonner";

export default function RamiMasterDashboard() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [liveStatus, setLiveStatus] = useState("מחובר לסורק ה-AI");
  const supabase = getSupabase();

  // האזנה בזמן אמת להתראות חדשות מהמוח
  useEffect(() => {
    const channel = supabase
      .channel('ai_alerts')
      .on('postgres_changes', { event: 'INSERT', table: 'ai_notifications' }, (payload) => {
        setAlerts(prev => [payload.new, ...prev]);
        playAlertSound();
        toast.message("פנייה חדשה מאיציק או לקוח VIP", {
          description: payload.new.summary,
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const playAlertSound = () => {
    const audio = new Audio('/alert-chime.mp3');
    audio.play().catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[#050A18] text-white p-4 md:p-8 font-sans" dir="rtl">
      <Toaster position="top-left" richColors />
      
      {/* Header - הכתר של הבוס */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-[#1E293B] to-[#0F172A] p-8 rounded-[3rem] border border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.1)] mb-10">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse"></div>
            <div className="bg-blue-600 p-4 rounded-full border-4 border-blue-400/30">
              <Crown size={40} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter">SABAN MASTER OS</h1>
            <p className="text-blue-400 font-bold flex items-center gap-2">
              <ShieldCheck size={16} /> בוקר טוב ראמי | המוח פעיל וסורק
            </p>
          </div>
        </div>
        
        <div className="flex gap-4 mt-6 md:mt-0">
          <div className="bg-green-500/10 border border-green-500/20 px-6 py-3 rounded-2xl flex items-center gap-3">
            <div className="h-3 w-3 bg-green-500 rounded-full animate-ping"></div>
            <span className="text-green-400 font-bold text-sm">{liveStatus}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* עמודה 1: התראות AI "חמות" על מגש של זהב */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-black flex items-center gap-3 px-4">
            <Zap className="text-yellow-400 fill-yellow-400" /> פניות דחופות לעיבוד
          </h2>
          
          {alerts.length === 0 && (
            <div className="bg-[#1E293B]/50 border border-dashed border-slate-700 p-20 rounded-[2.5rem] text-center">
              <p className="text-slate-500 font-bold text-xl text-center">אין פניות דחופות כרגע. הכל תחת שליטה. 🦾</p>
            </div>
          )}

          {alerts.map((alert) => (
            <div key={alert.id} className="bg-[#1E293B] border border-blue-500/10 p-6 rounded-[2.5rem] hover:border-blue-500/40 transition-all group shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600/20 p-3 rounded-2xl">
                    <MessageSquare className="text-blue-400" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-blue-400 uppercase tracking-widest">{alert.category}</span>
                    <h3 className="text-xl font-bold">{alert.sender_name}</h3>
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-bold">{new Date(alert.created_at).toLocaleTimeString('he-IL')}</span>
              </div>
              
              <div className="bg-black/20 p-5 rounded-2xl border border-white/5 mb-6">
                <p className="text-slate-300 font-medium leading-relaxed">{alert.summary}</p>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 h-14 bg-green-600 hover:bg-green-500 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/20">
                  <Check size={20} /> אשר ושדר לסידור
                </button>
                <button className="h-14 px-8 bg-slate-700 hover:bg-slate-600 rounded-2xl font-black transition-all">
                  <ExternalLink size={20} /> פתח צ'אט
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* עמודה 2: סטטוס לוגיסטי מהיר */}
        <div className="space-y-8">
          <div className="bg-gradient-to-b from-blue-600 to-blue-800 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
            <Truck className="absolute -bottom-4 -right-4 size-32 opacity-10 rotate-12" />
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <Truck /> מצב נהגים
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl">
                <span className="font-bold">חכמת (מנוף)</span>
                <span className="bg-green-400 text-black px-3 py-1 rounded-full text-xs font-black">בפריקה - רעננה</span>
              </div>
              <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl">
                <span className="font-bold">עלי (ידני)</span>
                <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-black">העברה - החרש</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1E293B] p-8 rounded-[3rem] border border-white/5">
            <h3 className="text-xl font-black mb-6">מילון ה-DNA של המוח</h3>
            <div className="space-y-2 text-sm text-slate-400 font-medium">
              <p>• חכמת מעמיס רק מהחרש 10</p>
              <p>• בר (אורניל) = הרצליה סטרומה 4</p>
              <p>• שחר שאול = עדיפות הובלה בוקר</p>
              <p>• סיקה = להפנות לאלי מסיקה</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
