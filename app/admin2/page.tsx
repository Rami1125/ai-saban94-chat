"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  Save, ShieldCheck, Zap, MessageSquare, 
  RefreshCw, CheckCircle2, AlertCircle 
} from "lucide-react";
import { motion } from "framer-motion";

// חיבור ל-Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminDNAPage() {
  const [dna, setDna] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // טעינת ה-DNA מה-Supabase
  useEffect(() => {
    async function loadDNA() {
      const { data, error } = await supabase
        .from('system_settings')
        .select('content')
        .eq('key', 'saban_ai_dna')
        .single();
      
      if (data) setDna(data.content);
      if (error) console.error("Error loading DNA:", error);
    }
    loadDNA();
  }, []);

  const saveDNA = async () => {
    setIsSaving(true);
    setStatus('idle');

    const { error } = await supabase
      .from('system_settings')
      .upsert({ 
        key: 'saban_ai_dna', 
        content: dna, 
        updated_at: new Date() 
      });

    setIsSaving(false);
    if (!error) {
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans p-6 md:p-12" dir="rtl">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                <ShieldCheck size={24} />
              </div>
              <h1 className="text-3xl font-black italic tracking-tighter">SABAN <span className="text-blue-500">ADMIN</span></h1>
            </div>
            <p className="text-slate-400 text-sm">ניהול ה-DNA והנחיות המוח עבור SabanOS AI</p>
          </motion.div>

          <div className="flex gap-3">
             {status === 'success' && (
               <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-xl border border-emerald-400/20 text-xs font-bold">
                 <CheckCircle2 size={16} /> עודכן בהצלחה
               </motion.div>
             )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Editor */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-4"
          >
            <div className="bg-slate-900/50 border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-xl">
              <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-yellow-400" />
                  <span className="text-xs font-black uppercase tracking-widest opacity-70">System DNA Editor</span>
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>
                </div>
              </div>

              <textarea
                value={dna}
                onChange={(e) => setDna(e.target.value)}
                className="w-full h-[600px] p-8 bg-transparent outline-none text-slate-200 font-mono text-sm leading-relaxed resize-none border-none focus:ring-0"
                placeholder="הזן כאן את הנחיות המוח..."
              />

              <div className="p-6 border-t border-white/5 bg-black/20 flex justify-between items-center">
                <p className="text-[10px] text-slate-500 font-medium">
                  * כל שינוי כאן ישפיע מיידית על תגובות ה-AI בצאט.
                </p>
                <button
                  onClick={saveDNA}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-10 py-4 rounded-2xl font-black text-sm flex items-center gap-3 transition-all active:scale-95 shadow-xl shadow-blue-600/20"
                >
                  {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                  עדכן מוח
                </button>
              </div>
            </div>
          </motion.div>

          {/* Sidebar / Tips */}
          <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             className="space-y-6"
          >
            <div className="bg-white/5 border border-white/5 p-6 rounded-[28px]">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-blue-400">
                <MessageSquare size={16} /> טיפים לכתיבת DNA
              </h3>
              <ul className="text-xs space-y-4 text-slate-400 leading-relaxed">
                <li>• <b>טון דיבור:</b> הגדר אם ה-AI חברי או רשמי.</li>
                <li>• <b>חוקי חישוב:</b> ציין נוסחאות מדויקות (למשל: "שטח חלקי 3").</li>
                <li>• <b>טיפול במלאי:</b> הנחה אותו להציע מוצרים משלימים (כמו ברגים לגבס).</li>
                <li>• <b>מצבי קיצון:</b> מה לעשות כשמוצר לא נמצא במלאי?</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 p-6 rounded-[28px]">
              <h3 className="text-sm font-bold mb-2 text-white">סטטוס חיבור</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Live - Supabase Connected</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
