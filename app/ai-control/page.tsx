"use client";
import React, { useState, useEffect } from 'react';
import { SabanBrain } from "@/lib/saban-brain";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, Zap, Bell, RefreshCw, Truck, Activity } from "lucide-react";
import { toast, Toaster } from "sonner";

export default function AIControlCenter() {
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // פונקציית צלצול בטוחה (רק אחרי אינטראקציה)
  const playSafeSound = () => {
    if (typeof window !== 'undefined' && (window as any).playNotificationSound) {
        (window as any).playNotificationSound();
    }
  };

  const runAnalysis = async () => {
    setLoading(true);
    const result = await SabanBrain.analyzeLogistics();
    setInsight(result);
    if (result.priority === 'high') playSafeSound();
    setLoading(false);
  };

  useEffect(() => { 
    // הפעלה ראשונית
    runAnalysis(); 
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header WOW */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-[#0B2C63] rounded-[2rem] text-white shadow-xl shadow-blue-100">
            <Brain size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#0B2C63] italic">Saban Brain</h1>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest text-left">Intelligence Layer</p>
          </div>
        </div>
        <Button onClick={runAnalysis} disabled={loading} className="bg-white text-[#0B2C63] border-2 border-slate-100 rounded-2xl gap-2 px-6 h-14 font-black shadow-sm hover:bg-slate-50 transition-all">
          {loading ? <RefreshCw className="animate-spin" /> : <Sparkles size={20} className="text-blue-500" />}
          רענן תובנות
        </Button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* כרטיס המלצה מרכזי */}
        <Card className="lg:col-span-2 p-8 rounded-[3rem] border-none shadow-2xl bg-white relative overflow-hidden">
          <div className="absolute -left-10 -top-10 opacity-5 text-[#0B2C63]">
            <Truck size={300} />
          </div>
          
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-3">
              <Badge className={`${insight?.priority === 'high' ? 'bg-red-500' : 'bg-blue-600'} px-6 py-2 rounded-2xl text-sm font-black animate-pulse`}>
                {insight?.priority === 'high' ? 'דורש טיפול מיידי' : 'מצב סידור: תקין'}
              </Badge>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black text-slate-800 leading-[1.2]">
              {insight?.recommendation || "מנתח נתונים..."}
            </h2>

            <div className="space-y-4 pt-8 border-t border-slate-50">
              <h3 className="font-black text-[#0B2C63] text-lg flex items-center gap-2">
                <Zap size={22} className="text-orange-500"/> צעדים לביצוע עכשיו:
              </h3>
              <div className="grid gap-3">
                {insight?.actionable_items.length > 0 ? insight.actionable_items.map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-5 bg-slate-50 rounded-[1.5rem] border border-transparent hover:border-blue-200 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#0B2C63] font-black text-xl">{i+1}</div>
                    <span className="font-bold text-lg text-slate-700">{item}</span>
                  </div>
                )) : (
                  <p className="text-slate-400 font-bold italic">אין פעולות דחופות כרגע</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Sidebar - מדדים חכמים */}
        <div className="space-y-6">
          <Card className="p-6 rounded-[2.5rem] border-none shadow-lg bg-[#0B2C63] text-white">
            <h3 className="font-black mb-4 flex items-center gap-2 opacity-80">
              <Activity size={18}/> בריאות המערכת
            </h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl">
                  <span className="font-bold">דיוק שיבוץ</span>
                  <span className="text-2xl font-black">98%</span>
               </div>
               <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl">
                  <span className="font-bold">זמן תגובה</span>
                  <span className="text-2xl font-black">2.4m</span>
               </div>
            </div>
          </Card>

          <Card className="p-6 rounded-[2.5rem] border-none shadow-lg bg-white overflow-hidden relative">
            <div className="flex items-center gap-2 font-black text-slate-800 mb-2">
               <Bell size={20} className="text-blue-600"/> התראות "מלשינון"
            </div>
            <p className="text-sm text-slate-400 font-bold leading-relaxed">
              המוח סרק את הודעות איציק וזיהה חריגה במסמך #4020. כדאי לבדוק.
            </p>
            <Button className="w-full mt-4 bg-slate-100 text-[#0B2C63] font-black rounded-xl hover:bg-slate-200 border-none h-12">
               פתח היסטוריית למידה
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
