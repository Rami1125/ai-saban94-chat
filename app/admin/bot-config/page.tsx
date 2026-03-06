"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Save, ShieldCheck, MessageSquare, Database, Sparkles, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BotConfigPage() {
  const [config, setConfig] = useState({ system_prompt: "", business_rules: "" });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // 1. טעינת חוקים קיימים מ-Supabase
  useEffect(() => {
    async function loadConfig() {
      const { data } = await supabase
        .from('saban_unified_knowledge')
        .select('type, content');
      
      if (data) {
        const prompt = data.find(i => i.type === 'system_prompt')?.content || "";
        const rules = data.find(i => i.type === 'business_rules')?.content || "";
        setConfig({ system_prompt: prompt, business_rules: rules });
      }
    }
    loadConfig();
  }, []);

  // 2. שמירת ספר החוקים החדש
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = [
        { type: 'system_prompt', content: config.system_prompt, updated_at: new Date() },
        { type: 'business_rules', content: config.business_rules, updated_at: new Date() }
      ];

      const { error } = await supabase.from('saban_unified_knowledge').upsert(updates, { onConflict: 'type' });

      if (error) throw error;
      toast({ title: "החוקים עודכנו!", description: "Gemini עכשיו פועל לפי ספר החוקים החדש.", variant: "default" });
    } catch (err: any) {
      toast({ title: "שגיאה בשמירה", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 p-4 md:p-8 font-sans" dir="rtl">
      <header className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Sparkles className="text-blue-600" />
            אימון סבן AI
          </h1>
          <p className="text-slate-500 text-sm mt-1">הגדרת אישיות הבוט, ספר החוקים ומדיניות המכירות.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
        >
          {isSaving ? "שומר..." : "שמור חוקים"}
          <Save size={18} />
        </button>
      </header>

      <div className="max-w-4xl mx-auto grid gap-6">
        
        {/* הגדרת אישיות ו-System Prompt */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-slate-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-blue-600">
            <MessageSquare size={20} />
            <h2 className="font-black text-lg">הנחיות מערכת (אישיות הבוט)</h2>
          </div>
          <textarea 
            className="w-full h-48 p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="לדוגמה: אתה נציג מכירות מקצועי של ח. סבן. ענה תמיד בעברית, היה מנומס אך מכירתי..."
            value={config.system_prompt}
            onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
          />
        </motion.div>

        {/* ספר חוקים עסקיים */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-slate-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-emerald-600">
            <ShieldCheck size={20} />
            <h2 className="font-black text-lg">ספר חוקים (Knowledge Base)</h2>
          </div>
          <textarea 
            className="w-full h-64 p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            placeholder="הכנס כאן חוקים: מחיר הובלה הוא 250 שח, אין הנחות על ברזל, זמן אספקה עד 3 ימי עסקים..."
            value={config.business_rules}
            onChange={(e) => setConfig({ ...config, business_rules: e.target.value })}
          />
          <div className="mt-4 flex items-start gap-2 text-[11px] text-slate-400 bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-xl">
            <AlertCircle size={14} className="shrink-0" />
            <span>החוקים שתוסיף כאן יוזרקו לכל שיחה של Gemini. זה המקום לציין מדיניות החזרות, מחירי מינימום ונהלי עבודה.</span>
          </div>
        </motion.div>

        {/* סטטוס סנכרון */}
        <div className="flex justify-center gap-8 py-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <Database size={14} />
            Supabase Connected
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Gemini 3.1 Live Training
          </div>
        </div>
      </div>
    </div>
  );
}
