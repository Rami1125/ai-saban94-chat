"use client";

import React, { useState, useEffect } from 'react';
import { 
  Save, Plus, Trash2, Brain, ShieldCheck, 
  AlertCircle, Loader2, ChevronLeft, Zap 
} from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Saban OS - Brain Rules Manager
 * ניהול חוקי המוח והנחיות ה-AI של ח.סבן
 */

export default function BrainRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_rules')
        .select('*')
        .order('priority', { ascending: false });
      
      if (error) throw error;
      setRules(data || []);
    } catch (e) {
      toast.error("שגיאה בטעינת החוקים");
    } finally {
      setLoading(false);
    }
  };

  const addRule = () => {
    const newRule = {
      id: `temp-${Date.now()}`,
      content: "",
      category: "general",
      is_active: true,
      priority: 1
    };
    setRules([newRule, ...rules]);
  };

  const saveRules = async () => {
    setSaving(true);
    try {
      // סינון חוקים זמניים ושמירה ל-Supabase
      const rulesToSave = rules.map(({ id, ...rest }) => ({
        ...rest,
        updated_at: new Date()
      })).filter(r => r.content.trim() !== "");

      const { error } = await supabase
        .from('ai_rules')
        .upsert(rulesToSave);

      if (error) throw error;
      toast.success("חוקי המוח עודכנו בהצלחה! המוח לומד...");
      fetchRules();
    } catch (e) {
      toast.error("שגיאה בשמירת החוקים");
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (id: string) => {
    if (id.startsWith('temp-')) {
      setRules(rules.filter(r => r.id !== id));
      return;
    }
    
    try {
      const { error } = await supabase.from('ai_rules').delete().eq('id', id);
      if (error) throw error;
      setRules(rules.filter(r => r.id !== id));
      toast.success("החוק הוסר");
    } catch (e) {
      toast.error("שגיאה במחיקה");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10" dir="rtl">
      <Toaster position="top-center" richColors />
      
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Brain className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 italic tracking-tighter">ניהול חוקי מוח</h1>
              <p className="text-slate-500 font-bold flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500" /> המוח הלוגיסטי Ai-ח.סבן
              </p>
            </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={addRule}
              className="flex-1 md:flex-none bg-white border-2 border-slate-200 px-6 py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={20} /> חוק חדש
            </button>
            <button 
              onClick={saveRules}
              disabled={saving}
              className="flex-1 md:flex-none bg-blue-600 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              שמור שינויים
            </button>
          </div>
        </header>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-[25px] flex gap-4 items-start">
          <AlertCircle className="text-blue-600 shrink-0 mt-1" size={24} />
          <p className="text-blue-800 font-bold leading-relaxed">
            כאן אתה מגדיר ל-AI איך להתנהג. כל חוק שתוסיף כאן מוזרק ישירות ל-"מחשבה" של המוח לפני שהוא עונה ללקוח או לנהג. השתמש בשפה ברורה ומדויקת.
          </p>
        </div>

        {/* Rules List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
          ) : (
            <AnimatePresence mode="popLayout">
              {rules.map((rule, idx) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={rule.id}
                  className="bg-white border border-slate-200 p-6 rounded-[30px] shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-slate-100 text-slate-500 text-[10px] font-black uppercase px-3 py-1 rounded-full">
                          עדיפות: {rule.priority || 1}
                        </span>
                        <select 
                          className="bg-transparent text-xs font-bold text-blue-600 outline-none cursor-pointer"
                          value={rule.category}
                          onChange={(e) => {
                            const newRules = [...rules];
                            newRules[idx].category = e.target.value;
                            setRules(newRules);
                          }}
                        >
                          <option value="general">כללי</option>
                          <option value="logistics">לוגיסטיקה</option>
                          <option value="sales">מכירות</option>
                          <option value="behavior">התנהגות</option>
                        </select>
                      </div>
                      <textarea 
                        value={rule.content}
                        onChange={(e) => {
                          const newRules = [...rules];
                          newRules[idx].content = e.target.value;
                          setRules(newRules);
                        }}
                        placeholder="כתוב את החוק כאן... (למשל: תמיד תציע משלוח מעל 10 משטחים)"
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 outline-none min-h-[100px] resize-none"
                      />
                    </div>
                    <button 
                      onClick={() => deleteRule(rule.id)}
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
