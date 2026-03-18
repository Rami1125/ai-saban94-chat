"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Dna, Plus, Save, Trash2, Power, 
  ChevronLeft, Sparkles, BrainCircuit, 
  MessageSquare, ShieldCheck, Zap, Loader2, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

interface AIRule {
  id: string;
  instruction: string;
  is_active: boolean;
  category: string;
  created_at: string;
}

export default function EliteDNAStudio() {
  const [rules, setRules] = useState<AIRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newRule, setNewRule] = useState({ instruction: '', category: 'General' });

  useEffect(() => {
    fetchRules();
  }, []);

  async function fetchRules() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error: any) {
      toast.error("שגיאה בטעינת ספר החוקים");
    } finally {
      setLoading(false);
    }
  }

  const toggleRuleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_rules')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(currentStatus ? "החוק הושבת" : "החוק הופעל בהצלחה");
      fetchRules();
    } catch (error: any) {
      toast.error("עדכון הסטטוס נכשל");
    }
  };

  const handleAddRule = async () => {
    if (!newRule.instruction) return;
    try {
      const { error } = await supabase
        .from('ai_rules')
        .insert([{ 
          instruction: newRule.instruction, 
          category: newRule.category,
          is_active: true 
        }]);

      if (error) throw error;
      toast.success("חוק DNA חדש נצרב במערכת");
      setNewRule({ instruction: '', category: 'General' });
      setIsAdding(false);
      fetchRules();
    } catch (error: any) {
      toast.error("שגיאה בהוספת החוק");
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm("למחוק את החוק מה-DNA?")) return;
    try {
      const { error } = await supabase.from('ai_rules').delete().eq('id', id);
      if (error) throw error;
      toast.success("החוק הוסר לצמיתות");
      fetchRules();
    } catch (error: any) {
      toast.error("מחיקה נכשלה");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-8 font-sans pb-32" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-10 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-600/20 p-2 rounded-lg">
              <Dna className="text-blue-500" size={24} />
            </div>
            <span className="text-xs font-black tracking-widest text-blue-500 uppercase">Saban OS Training</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter">ספר החוקים <span className="text-blue-500">(DNA)</span></h1>
        </div>
        
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-[22px] shadow-lg shadow-blue-500/20 transition-all"
        >
          {isAdding ? <ChevronLeft size={24} /> : <Plus size={24} />}
        </button>
      </div>

      <main className="max-w-4xl mx-auto space-y-6">
        {/* Form להוספת חוק */}
        <AnimatePresence>
          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-900/50 backdrop-blur-xl border border-white/5 p-6 rounded-[32px] space-y-4"
            >
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="text-yellow-500" size={18} /> הזרקת הנחיה חדשה
              </h2>
              <textarea 
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-blue-500 transition-all min-h-[120px]"
                placeholder="כתוב כאן איך המוח צריך להתנהג... (למשל: תמיד תציע מוצרים משלימים)"
                value={newRule.instruction}
                onChange={(e) => setNewRule({...newRule, instruction: e.target.value})}
              />
              <div className="flex gap-4">
                <select 
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs"
                  value={newRule.category}
                  onChange={(e) => setNewRule({...newRule, category: e.target.value})}
                >
                  <option value="General">כללי</option>
                  <option value="Sales">מכירות</option>
                  <option value="Support">שירות</option>
                  <option value="Logistic">לוגיסטיקה</option>
                </select>
                <button 
                  onClick={handleAddRule}
                  className="flex-1 bg-emerald-500 text-slate-950 font-black rounded-xl py-2 flex items-center justify-center gap-2"
                >
                  <Save size={18} /> שמור ב-DNA
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* רשימת חוקים */}
        <div className="grid gap-4">
          {loading ? (
            <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : rules.map((rule) => (
            <motion.div 
              key={rule.id}
              layout
              className={`p-5 rounded-[30px] border transition-all ${
                rule.is_active ? 'bg-slate-900/40 border-white/5' : 'bg-slate-950 border-white/5 opacity-50'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${rule.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="text-[10px] font-bold uppercase opacity-40 tracking-tighter">
                    {rule.category} • {new Date(rule.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleRuleStatus(rule.id, rule.is_active)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <Power size={16} className={rule.is_active ? "text-emerald-400" : "text-slate-500"} />
                  </button>
                  <button onClick={() => deleteRule(rule.id)} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-200">{rule.instruction}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Floating Stats - Bottom Mobile Navigation */}
      <div className="fixed bottom-6 left-4 right-4 bg-blue-600 p-4 rounded-[28px] shadow-2xl flex justify-around items-center backdrop-blur-lg">
        <div className="text-center">
          <p className="text-[10px] font-bold opacity-70 uppercase leading-none">חוקים פעילים</p>
          <p className="text-xl font-black">{rules.filter(r => r.is_active).length}</p>
        </div>
        <div className="h-8 w-px bg-white/20" />
        <div className="flex flex-col items-center">
           <BrainCircuit size={20} className="mb-1" />
           <span className="text-[8px] font-black uppercase">Connected to V42.3</span>
        </div>
      </div>
    </div>
  );
}
