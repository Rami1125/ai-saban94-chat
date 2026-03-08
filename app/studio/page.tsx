"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase"; 
import { motion, AnimatePresence } from "framer-motion";
import { 
  RefreshCw, Database, Cpu, MessageSquare, 
  Trash2, Plus, Zap, BrainCircuit, CheckCircle2, XCircle
} from "lucide-react";
import { toast } from "sonner";

export default function SabanStudioV3() {
  const [rules, setRules] = useState<any[]>([]);
  const [newRule, setNewRule] = useState("");
  const [loading, setLoading] = useState(true);

  // 1. שליפת החוקים מ-Supabase
  const fetchRules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('system_rules')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error("שגיאה בטעינת החוקים");
    } else {
      setRules(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // 2. הוספת חוק חדש (כברירת מחדל כ-executor)
  const handleAddRule = async () => {
    if (!newRule.trim()) return;

    const { error } = await supabase
      .from('system_rules')
      .insert([
        { 
          instruction: newRule, 
          agent_type: 'executor', 
          is_active: true 
        }
      ]);

    if (error) {
      toast.error("שגיאה בהוספת החוק");
    } else {
      toast.success("החוק נוסף למוח של סבן");
      setNewRule("");
      fetchRules();
    }
  };

  // 3. מחיקת חוק
  const handleDeleteRule = async (id: number) => {
    const { error } = await supabase
      .from('system_rules')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("שגיאה במחיקה");
    } else {
      setRules(rules.filter(r => r.id !== id));
      toast.success("החוק הוסר בהצלחה");
    }
  };

  // 4. שינוי סטטוס פעיל/לא פעיל
  const toggleRuleStatus = async (id: number, currentStatus: boolean) => {
    const { error } = await supabase
      .from('system_rules')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (!error) {
      fetchRules();
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans p-6 md:p-12" dir="rtl">
      
      {/* Header */}
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
            <BrainCircuit size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter italic">SABAN <span className="text-blue-500">STUDIO</span></h1>
            <p className="text-slate-500 text-sm font-bold">ניהול ה-DNA והחוקים של Gemini</p>
          </div>
        </div>
        <button 
          onClick={fetchRules}
          className="p-3 hover:bg-slate-800 rounded-full transition-all text-slate-400"
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* עמודה ימנית: הוספת חוקים חדשים */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-slate-900/50 border border-slate-800 p-6 rounded-[32px] backdrop-blur-xl">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="text-blue-500" size={18} /> הוספת הנחיה חדשה
            </h2>
            <textarea 
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              placeholder="כתוב כאן פקודה חדשה ל-AI... (למשל: ענה תמיד בקיצור)"
              className="w-full h-40 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
            />
            <button 
              onClick={handleAddRule}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              הזרק למוח ה-AI
            </button>
          </section>

          {/* מחוון סטטוס מפתחות (סטטי כרגע) */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-[24px] flex items-center gap-4">
            <Zap className="text-emerald-500" />
            <div>
              <p className="text-xs font-bold text-emerald-500 uppercase">מצב מערכת</p>
              <p className="text-sm font-medium">החוקים מסונכרנים בזמן אמת</p>
            </div>
          </div>
        </div>

        {/* עמודה מרכזית+שמאלית: רשימת החוקים הקיימת */}
        <div className="lg:col-span-2 space-y-4">
          <section className="bg-slate-900/50 border border-slate-800 p-2 rounded-[32px] overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Database className="text-blue-500" size={18} /> רשימת חוקים פעילה
              </h2>
              <span className="bg-slate-800 px-3 py-1 rounded-full text-xs font-mono">{rules.length} RULES</span>
            </div>

            <div className="max-h-[600px] overflow-y-auto p-4 space-y-3">
              {rules.map((rule) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  key={rule.id}
                  className="group bg-slate-950 border border-slate-800 p-4 rounded-2xl flex justify-between items-start hover:border-blue-500/50 transition-all"
                >
                  <div className="flex gap-4 items-start">
                    <button 
                      onClick={() => toggleRuleStatus(rule.id, rule.is_active)}
                      className={`mt-1 transition-colors ${rule.is_active ? 'text-emerald-500' : 'text-slate-600'}`}
                    >
                      {rule.is_active ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    </button>
                    <div>
                      <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md mb-2 inline-block">
                        {rule.agent_type}
                      </span>
                      <p className={`text-sm leading-relaxed ${rule.is_active ? 'text-slate-300' : 'text-slate-600 line-through'}`}>
                        {rule.instruction}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDeleteRule(rule.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 p-2 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          </section>

          {/* סיכום ניצול משאבים */}
          <div className="bg-blue-600/5 border border-blue-500/10 p-4 rounded-2xl flex justify-between items-center">
             <div className="flex items-center gap-3">
               <Cpu className="text-blue-500" size={18} />
               <span className="text-xs text-slate-400">החוקים נטענים ל-Gemini בכל קריאת API</span>
             </div>
             <span className="text-[10px] font-bold text-blue-500 uppercase">Sync Active</span>
          </div>
        </div>

      </main>
    </div>
  );
}
