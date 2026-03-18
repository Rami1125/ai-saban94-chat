"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Dna, Plus, Save, Trash2, Power, 
  Sparkles, BrainCircuit, PlayCircle,
  Loader2, RefreshCw, AlertCircle, CheckCircle2,
  Terminal, Edit3, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

interface AIRule {
  id: string;
  instruction: string;
  is_active: boolean;
  category: string;
}

export default function DNATrainingStudio() {
  const [rules, setRules] = useState<AIRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // States לסימולטור
  const [simQuery, setSimQuery] = useState("");
  const [simResponse, setSimResponse] = useState("");
  const [simRule, setSimRule] = useState("");

  useEffect(() => {
    fetchRules();
  }, []);

  async function fetchRules() {
    setLoading(true);
    const { data } = await supabase.from('ai_rules').select('*').order('created_at', { ascending: false });
    setRules(data || []);
    setLoading(false);
  }

  // פונקציית סימולציה חיה מול ה-Brain
  const runSimulation = async () => {
    if (!simQuery) return toast.error("כתוב שאלה לבדיקה");
    setIsSimulating(true);
    try {
      const response = await fetch("/api/admin_pro/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: simQuery,
          // הזרקת החוק הזמני ישירות לסימולציה
          history: [{ role: 'system', content: `חוק זמני לבדיקה: ${simRule}` }] 
        }),
      });
      const data = await response.json();
      setSimResponse(data.reply);
    } catch (err) {
      toast.error("סימולציה נכשלה");
    } finally {
      setIsSimulating(false);
    }
  };

  const saveRule = async (id?: string) => {
    const payload = { instruction: simRule, category: 'General', is_active: true };
    try {
      if (id) {
        await supabase.from('ai_rules').update(payload).eq('id', id);
        toast.success("החוק עודכן ב-DNA");
      } else {
        await supabase.from('ai_rules').insert([payload]);
        toast.success("חוק חדש נצרב בהצלחה");
      }
      setSimRule("");
      setEditingId(null);
      fetchRules();
    } catch (err) {
      toast.error("שגיאה בשמירה");
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm("למחוק חוק זה?")) return;
    await supabase.from('ai_rules').delete().eq('id', id);
    fetchRules();
    toast.success("נמחק");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-600 p-2 rounded-xl ring-4 ring-blue-600/20">
            <BrainCircuit size={28} />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter">SABAN DNA STUDIO</h1>
        </div>
        <p className="text-slate-400 text-sm italic">אימון וסימולציה בזמן אמת של חוקי המערכת</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* צד שמאל: סימולטור אימון חצי שקוף */}
        <section className="space-y-6">
          <div className="bg-slate-900/50 border border-blue-500/30 rounded-[35px] p-6 backdrop-blur-md shadow-2xl">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
              <Sparkles className="text-blue-400" size={20} />
              {editingId ? "עריכת חוק קיים" : "כתיבת חוק חדש"}
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-blue-500 mr-2 tracking-widest">תוכן החוק (DNA)</label>
                <textarea 
                  value={simRule}
                  onChange={(e) => setSimRule(e.target.value)}
                  className="w-full bg-black/50 border border-slate-800 rounded-2xl p-4 text-sm focus:border-blue-500 outline-none min-h-[120px] transition-all"
                  placeholder="לדוגמה: בכל פעם שלקוח שואל על חצץ, תציע לו הנחה של 5% על הובלה."
                />
              </div>

              <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                <h3 className="text-xs font-bold mb-3 flex items-center gap-2 text-blue-400 uppercase">
                  <Terminal size={14} /> סימולטור מענה חי
                </h3>
                <div className="flex gap-2">
                  <input 
                    value={simQuery}
                    onChange={(e) => setSimQuery(e.target.value)}
                    className="flex-1 bg-black/40 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none focus:border-emerald-500"
                    placeholder="מה הלקוח שואל?"
                  />
                  <button 
                    onClick={runSimulation}
                    disabled={isSimulating}
                    className="bg-emerald-600 hover:bg-emerald-500 p-2 rounded-xl transition-all"
                  >
                    {isSimulating ? <Loader2 size={18} className="animate-spin" /> : <PlayCircle size={18} />}
                  </button>
                </div>
                
                <AnimatePresence>
                  {simResponse && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 bg-black/60 rounded-xl border-r-2 border-emerald-500 text-xs leading-relaxed text-slate-300"
                    >
                      <MessageCircle size={12} className="mb-1 text-emerald-500" />
                      {simResponse}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={() => saveRule(editingId || undefined)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Save size={20} />
                {editingId ? "עדכן חוק ב-DNA" : "צרוב חוק חדש"}
              </button>
              {editingId && (
                <button onClick={() => {setEditingId(null); setSimRule("");}} className="w-full text-xs text-slate-500 hover:text-white underline">ביטול עריכה</button>
              )}
            </div>
          </div>
        </section>

        {/* צד ימין: טבלת חוקים Elite */}
        <section className="bg-slate-900/30 border border-slate-800 rounded-[35px] overflow-hidden flex flex-col shadow-inner">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <h2 className="text-lg font-black italic">ספר החוקים הפעיל</h2>
            <RefreshCw size={16} className={`text-slate-500 cursor-pointer ${loading && 'animate-spin'}`} onClick={fetchRules} />
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[600px] p-4 space-y-3 custom-scrollbar">
            {rules.map((rule) => (
              <motion.div 
                key={rule.id}
                layout
                className={`p-4 rounded-2xl border transition-all ${editingId === rule.id ? 'bg-blue-600/10 border-blue-500' : 'bg-slate-900/40 border-slate-800'}`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${rule.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">ID: {rule.id.slice(0, 5)}</span>
                    </div>
                    <p className="text-sm text-slate-200 leading-snug">{rule.instruction}</p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => {setEditingId(rule.id); setSimRule(rule.instruction);}}
                      className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => deleteRule(rule.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {rules.length === 0 && !loading && (
              <div className="text-center py-20 text-slate-600">
                <AlertCircle className="mx-auto mb-2 opacity-20" size={48} />
                <p className="font-bold italic uppercase text-xs tracking-widest">DNA Empty</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer Status */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-blue-600/90 backdrop-blur-md px-8 py-3 rounded-full shadow-2xl flex items-center gap-6 border border-white/10">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-300" />
            <span className="text-[10px] font-black uppercase tracking-tighter">System Live</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2">
            <Dna size={14} className="text-white animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-tighter">{rules.length} Active Rules</span>
          </div>
      </div>
    </div>
  );
}
