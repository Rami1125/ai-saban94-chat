"use client";
import React, { useState, useEffect } from 'react';
import { SabanBrain, BrainInference } from "@/lib/saban-brain";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, Sparkles, Zap, Brain, ChevronRight, 
  MessageSquare, BarChart3, Settings, Bell, RefreshCw
} from "lucide-react";
import { toast, Toaster } from "sonner";

export default function AIControlCenter() {
  const [insight, setInsight] = useState<BrainInference | null>(null);
  const [loading, setLoading] = useState(false);

  const runBrainAnalysis = async () => {
    setLoading(true);
    try {
      const result = await SabanBrain.analyzeLogistics();
      setInsight(result);
      (window as any).playNotificationSound?.();
    } catch (e) {
      toast.error("שגיאה בתקשורת עם המוח");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runBrainAnalysis(); }, []);

  return (
    <div className="min-h-screen bg-[#020817] text-white p-6 font-sans" dir="rtl">
      <Toaster position="top-left" richColors />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.5)]">
            <Brain size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Saban Brain <span className="text-blue-500 text-sm font-bold uppercase ml-2">v1.0</span></h1>
            <p className="text-slate-400 font-medium">מרכז שליטה חכם לניהול הלוגיסטיקה</p>
          </div>
        </div>
        <Button onClick={runBrainAnalysis} disabled={loading} className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl gap-2 px-6 h-12">
          {loading ? <RefreshCw className="animate-spin" /> : <Sparkles size={18} className="text-blue-400" />}
          עדכן תובנות
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Recommendation Card */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-blue-900/40 to-slate-900/40 border-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <Bot size={200} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <Badge className={`${insight?.priority === 'high' ? 'bg-red-500' : 'bg-blue-500'} px-4 py-1 rounded-full animate-pulse`}>
                {insight?.priority === 'high' ? 'עדיפות גבוהה' : 'ניתוח שוטף'}
              </Badge>
              <span className="text-slate-400 text-sm font-bold">עודכן לפני דקה</span>
            </div>
            
            <h2 className="text-4xl font-black mb-6 leading-tight max-w-xl">
              {insight?.recommendation || "מנתח נתונים..."}
            </h2>

            <div className="space-y-4 pt-6 border-t border-white/10">
              <h3 className="font-bold text-blue-400 flex items-center gap-2">
                <Zap size={18}/> פעולות מומלצות לביצוע:
              </h3>
              {insight?.actionable_items.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group cursor-pointer border border-transparent hover:border-blue-500/50">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">{i+1}</div>
                    <span className="font-bold text-lg">{item}</span>
                  </div>
                  <ChevronRight className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <Card className="bg-white/5 border-white/10 p-6 rounded-[2rem] backdrop-blur-sm">
            <h3 className="font-black text-slate-400 mb-4 flex items-center gap-2 uppercase text-xs">
              <BarChart3 size={16}/> ביצועים היום
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-white/5 rounded-2xl">
                <div className="text-2xl font-black">94%</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">דיוק שיבוץ</div>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl">
                <div className="text-2xl font-black">12</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">הובלות בוצעו</div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-6 rounded-[2rem] shadow-lg shadow-blue-500/20">
            <h3 className="font-black text-white mb-2 flex items-center gap-2">
              <MessageSquare size={18}/> "המלשינון" החכם
            </h3>
            <p className="text-blue-100 text-sm font-medium mb-4">
              המוח סורק הודעות מאיציק ומזהה חוסרים במלאי או שינויי כתובת אוטומטית.
            </p>
            <Button className="w-full bg-white text-blue-600 font-black rounded-xl hover:bg-blue-50">
              צפה בכל ההתראות
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
