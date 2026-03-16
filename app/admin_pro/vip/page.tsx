"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Zap, Plus, Edit3, Trash2, CheckCircle2, X, Save, 
  ShieldAlert, Sparkles, Filter, Search, Power, 
  ChevronLeft, MessageSquareCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from "sonner";

/**
 * Saban Admin Pro - DNA & Rule Engine Studio
 * -----------------------------------------
 * Controlling the Saban OS Brain. Full CRUD for AI rules and DNA injection.
 */

export default function DnaStudio() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingRule, setEditingRule] = useState<any>(null);

  // 1. שליפת חוקי DNA מה-DB
  const fetchRules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (err: any) {
      toast.error("שגיאה בגישה למוח: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRules(); }, []);

  // 2. עדכון סטטוס חוק (פעיל/כבוי)
  const toggleRule = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('ai_rules')
      .update({ is_active: !current })
      .eq('id', id);

    if (!error) {
      toast.success(current ? "פרוטוקול הופסק" : "פרוטוקול הופעל בהצלחה");
      fetchRules();
    }
  };

  // 3. שמירה או עדכון חוק
  const saveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule.rule_name || !editingRule.instruction) {
      toast.error("חובה למלא שם והנחיה");
      return;
    }

    const { error } = await supabase
      .from('ai_rules')
      .upsert({
        ...editingRule,
        updated_at: new Date().toISOString()
      });

    if (!error) {
      toast.success("ה-DNA עודכן והוזרק למוח 🦾");
      setEditingRule(null);
      fetchRules();
    } else {
      toast.error("שגיאה בהזרקת חוק");
    }
  };

  // 4. מחיקת חוק
  const deleteRule = async (id: string) => {
    if (!confirm("אח יקר, בטוח שאתה רוצה למחוק את חוק ה-DNA הזה? זה ישפיע על המוח מיידית.")) return;
    const { error } = await supabase.from('ai_rules').delete().eq('id', id);
    if (!error) {
      toast.success("חוק הוסר מהמערכת");
      fetchRules();
    }
  };

  const filteredRules = rules.filter(r => 
    r.rule_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.instruction?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-7xl mx-auto">
      
      {/* Hero Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 rounded-[35px] p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full" />
          <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-2 italic">Brain Capacity</p>
          <h3 className="text-4xl font-black italic tracking-tighter">{rules.length} <span className="text-sm font-bold opacity-50 uppercase">Active Rules</span></h3>
          <div className="mt-4 flex gap-1">
             {[1,2,3,4,5].map(i => <div key={i} className="w-6 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />)}
          </div>
        </div>
        <div className="md:col-span-2 bg-white rounded-[35px] border border-slate-100 p-8 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-50 rounded-[25px] flex items-center justify-center text-blue-600 shadow-inner">
                <Sparkles size={32} />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-xl italic uppercase tracking-tighter">Rule Engine Studio</h4>
                <p className="text-sm font-bold text-slate-400 mt-1">ניהול חוקי המערכת וה-DNA הלוגיסטי של ח. סבן</p>
              </div>
           </div>
           <button 
              onClick={() => setEditingRule({ rule_name: '', instruction: '', is_active: true })}
              className="bg-blue-600 text-white px-10 py-5 rounded-[22px] font-black shadow-xl hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-3 uppercase text-xs italic tracking-widest"
           >
              <Plus size={20}/> הוסף חוק מומחה
           </button>
        </div>
      </div>

      {/* Main Rules Interface */}
      <div className="bg-white rounded-[45px] border border-slate-200 shadow-xl overflow-hidden min-h-[600px]">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="relative w-full md:w-[450px] group">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                placeholder="חפש חוק, הנחיה או מילת מפתח..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 pr-14 pl-6 py-4 rounded-2xl font-bold shadow-sm outline-none focus:ring-4 ring-blue-500/10 transition-all italic" 
              />
           </div>
           <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Sorted by Recency</span>
              <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400"><Filter size={18}/></div>
           </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-right border-separate border-spacing-y-4 px-8 py-4">
             <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                   <th className="pb-4 px-8">שם הפרוטוקול</th>
                   <th className="pb-4 px-8 text-center">סטטוס מוח</th>
                   <th className="pb-4 px-8 text-left">ניהול DNA</th>
                </tr>
             </thead>
             <tbody>
                <AnimatePresence mode="popLayout">
                  {filteredRules.map((rule, i) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.03 }}
                      key={rule.id} 
                      className="bg-slate-50 hover:bg-blue-50/40 transition-all rounded-[30px] overflow-hidden shadow-sm group border border-transparent hover:border-blue-100"
                    >
                       <td className="py-6 px-8 first:rounded-r-[30px]">
                          <div className="flex items-center gap-6">
                             <div className={`w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center text-blue-600 font-black italic border border-slate-100 transition-all group-hover:scale-110 ${rule.is_active ? 'bg-white' : 'bg-slate-200 opacity-50'}`}>
                                <Zap size={22} fill={rule.is_active ? "currentColor" : "none"} />
                             </div>
                             <div className="max-w-xl">
                                <p className={`font-black text-xl italic tracking-tight leading-none ${rule.is_active ? 'text-slate-900' : 'text-slate-400 line-through decoration-2'}`}>{rule.rule_name}</p>
                                <p className="text-xs font-bold text-slate-400 italic line-clamp-1 mt-2 leading-relaxed">{rule.instruction}</p>
                             </div>
                          </div>
                       </td>
                       <td className="py-6 px-8 text-center">
                          <button 
                            onClick={() => toggleRule(rule.id, rule.is_active)}
                            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all shadow-sm active:scale-95 border-b-4 ${
                              rule.is_active 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 border-b-emerald-600 hover:bg-emerald-100' 
                              : 'bg-slate-200 text-slate-500 border-slate-300 border-b-slate-400'
                            }`}
                          >
                             <Power size={14}/> {rule.is_active ? 'Online' : 'Disabled'}
                          </button>
                       </td>
                       <td className="py-6 px-8 last:rounded-l-[30px] text-left">
                          <div className="flex gap-3 justify-end opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                             <button 
                                onClick={() => setEditingRule(rule)}
                                className="p-3.5 bg-white border border-slate-200 rounded-2xl hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-90"
                             >
                                <Edit3 size={20}/>
                             </button>
                             <button 
                                onClick={() => deleteRule(rule.id)}
                                className="p-3.5 bg-white border border-slate-200 rounded-2xl hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm active:scale-90"
                             >
                                <Trash2 size={20}/>
                             </button>
                          </div>
                       </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
             </tbody>
          </table>
          {filteredRules.length === 0 && !loading && (
            <div className="py-32 text-center space-y-4">
               <ShieldAlert size={64} className="mx-auto text-slate-200" />
               <p className="text-slate-400 font-black italic uppercase tracking-widest text-sm">לא נמצאו חוקי DNA תואמים</p>
            </div>
          )}
        </div>
      </div>

      {/* DNA Editor Modal */}
      <AnimatePresence>
        {editingRule && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, y: 50, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              className="bg-white rounded-[50px] w-full max-w-4xl overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.6)] border border-white/10"
            >
              <div className="bg-slate-900 p-10 text-white flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full" />
                <div className="text-right z-10">
                   <div className="flex items-center gap-3 mb-2">
                      <MessageSquareCode className="text-blue-400" size={32} />
                      <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">DNA Rule Editor</h2>
                   </div>
                   <p className="text-blue-400 text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 justify-end">
                      <ShieldAlert size={14}/> Critical System Modification
                   </p>
                </div>
                <button onClick={() => setEditingRule(null)} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all z-10 italic font-black text-sm border border-white/10">ביטול X</button>
              </div>

              <form onSubmit={saveRule} className="p-12 space-y-10 text-right bg-slate-50/20">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase text-slate-400 mr-2 italic tracking-widest">שם הפרוטוקול / מזהה זיהוי</label>
                  <input 
                    required
                    placeholder="למשל: SIKA-107-MASTER"
                    value={editingRule.rule_name}
                    onChange={e => setEditingRule({...editingRule, rule_name: e.target.value})}
                    className="w-full bg-white border border-slate-200 p-6 rounded-3xl font-black italic outline-none focus:ring-8 ring-blue-500/5 transition-all text-xl shadow-inner" 
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center mr-2">
                    <span className="text-[9px] font-bold text-blue-500 uppercase">Markdown Supported</span>
                    <label className="text-[11px] font-black uppercase text-slate-400 italic tracking-widest">הנחיות ביצוע (The Brain Instruction)</label>
                  </div>
                  <textarea 
                    required
                    rows={12}
                    placeholder="הזרק כאן את הלוגיקה המלאה: תמונות, חישובים, חוקי ברזל..."
                    value={editingRule.instruction}
                    onChange={e => setEditingRule({...editingRule, instruction: e.target.value})}
                    className="w-full bg-white border border-slate-200 p-8 rounded-[40px] font-bold text-base outline-none focus:ring-8 ring-blue-500/5 transition-all leading-relaxed shadow-inner scrollbar-hide" 
                  />
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full bg-blue-600 text-white py-8 rounded-[35px] font-black text-2xl flex items-center justify-center gap-6 shadow-2xl hover:bg-blue-700 active:scale-95 transition-all border-b-8 border-blue-800 uppercase tracking-widest italic">
                    <Save size={32} /> הזרק חוק למערכת
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-12 border-t border-slate-200 opacity-20">
         <p className="text-[10px] font-black uppercase tracking-[0.6em] text-center italic">Saban OS Neural Network Rule Studio V24.0</p>
      </footer>
    </motion.div>
  );
}
