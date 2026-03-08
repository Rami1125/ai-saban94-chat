"use client";
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from "@/lib/supabase"; 
import { rtdb } from "@/lib/firebase";
import { ref, onValue, limitToLast, query as dbQuery } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";
import { 
  RefreshCw, Database, Trash2, Plus, BrainCircuit, 
  Edit3, Send, Smartphone, Save, X, CheckCircle2, XCircle
} from "lucide-react";
import { toast } from "sonner";

export default function SabanStudioFull() {
  const [rules, setRules] = useState<any[]>([]);
  const [liveMessages, setLiveMessages] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newRule, setNewRule] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // האזנה לסימולטור בזמן אמת
  useEffect(() => {
    const chatRef = dbQuery(ref(rtdb, 'chat-sidor'), limitToLast(6));
    return onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLiveMessages(Object.values(data).sort((a: any, b: any) => a.timestamp - b.timestamp));
        setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
      }
    });
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('system_rules').select('*').order('id', { ascending: true });
    if (!error) setRules(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRules(); }, []);

  const handleAddRule = async () => {
    if (!newRule.trim()) return;
    const { error } = await supabase.from('system_rules').insert([{ 
      instruction: newRule, 
      agent_type: 'executor', 
      is_active: true 
    }]);
    if (!error) {
      toast.success("הנחיה חדשה הוזרקה למוח");
      setNewRule("");
      fetchRules();
    }
  };

  const handleUpdate = async (id: number) => {
    const { error } = await supabase.from('system_rules').update({ instruction: editValue }).eq('id', id);
    if (!error) {
      toast.success("החוק עודכן");
      setEditingId(null);
      fetchRules();
    }
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from('system_rules').delete().eq('id', id);
    if (!error) {
      toast.success("החוק נמחק");
      fetchRules();
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    await supabase.from('system_rules').update({ is_active: !currentStatus }).eq('id', id);
    fetchRules();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 p-4 md:p-8 font-sans" dir="rtl">
      
      {/* Header & New Rule Bar */}
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[32px] shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
              <BrainCircuit size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black italic tracking-tight">SABAN <span className="text-blue-600">DNA STUDIO</span></h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">ממשק ניהול חוקי בינה מלאכותית v4.0</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-[500px]">
              <input 
                value={newRule} 
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                placeholder="הוסף הנחיה חדשה ל-DNA של המערכת..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all shadow-inner"
              />
            </div>
            <button 
              onClick={handleAddRule}
              className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2 font-bold"
            >
              <Plus size={20} /> <span className="hidden md:inline">הוסף חוק</span>
            </button>
            <button onClick={fetchRules} className="p-4 text-slate-400 hover:bg-white hover:shadow-sm rounded-2xl transition-all border border-transparent hover:border-slate-200">
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* Main Table Area (8/12) */}
          <div className="xl:col-span-8 space-y-6">
            <section className="bg-white rounded-[35px] shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <h2 className="font-bold text-slate-700 flex items-center gap-2 uppercase text-xs tracking-widest">
                  <Database size={16} className="text-blue-600" /> מאגר החוקים הפעיל
                </h2>
                <div className="flex gap-2">
                   <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black">{rules.length} חוקים מוגדרים</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-50">
                      <th className="p-5 w-20">סטטוס</th>
                      <th className="p-5 w-24">מזהה</th>
                      <th className="p-5">הנחיה טכנית (DNA Instruction)</th>
                      <th className="p-5 w-32 text-center">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <AnimatePresence>
                      {rules.map((rule) => (
                        <motion.tr 
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          key={rule.id} 
                          className={`group transition-colors ${rule.is_active ? 'hover:bg-blue-50/30' : 'bg-slate-50/50 opacity-60'}`}
                        >
                          <td className="p-5">
                            <button onClick={() => toggleStatus(rule.id, rule.is_active)} className="transition-transform active:scale-90">
                              {rule.is_active ? <CheckCircle2 className="text-emerald-500" size={20} /> : <XCircle className="text-slate-300" size={20} />}
                            </button>
                          </td>
                          <td className="p-5 text-xs font-mono text-slate-400">ID-{rule.id}</td>
                          <td className="p-5">
                            {editingId === rule.id ? (
                              <textarea 
                                value={editValue} 
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full p-4 border-2 border-blue-500 rounded-2xl text-sm h-28 outline-none bg-white shadow-xl relative z-10"
                              />
                            ) : (
                              <div className="space-y-1">
                                <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded uppercase">{rule.agent_type}</span>
                                <p className="text-sm font-medium text-slate-600 leading-relaxed">{rule.instruction}</p>
                              </div>
                            )}
                          </td>
                          <td className="p-5">
                            <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {editingId === rule.id ? (
                                <button onClick={() => handleUpdate(rule.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Save size={18} /></button>
                              ) : (
                                <button onClick={() => { setEditingId(rule.id); setEditValue(rule.instruction); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit3 size={18} /></button>
                              )}
                              <button onClick={() => handleDelete(rule.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Sidebar Area: Simulator (4/12) */}
          <div className="xl:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm sticky top-8">
              <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-900 p-2 rounded-xl text-white"><Smartphone size={20} /></div>
                  <h2 className="font-bold text-slate-800">סימולטור בדיקה</h2>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 rounded-full">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-600 uppercase">Live Sync</span>
                </div>
              </header>

              {/* iPhone Mockup */}
              <div className="mx-auto w-full max-w-[300px] h-[550px] bg-slate-900 rounded-[3rem] border-[10px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col group">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20" />
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 pt-10 scrollbar-hide bg-slate-50" ref={scrollRef}>
                  {liveMessages.map((msg: any, idx) => (
                    <motion.div 
                      initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                      key={idx} className={`flex ${msg.user_name === 'AI' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[85%] p-4 rounded-2xl text-[12px] shadow-sm leading-snug ${
                        msg.user_name === 'AI' ? 'bg-white text-slate-800 rounded-tr-none' : 'bg-blue-600 text-white rounded-tl-none'
                      }`}>
                        <p className="text-[9px] font-black opacity-30 mb-1 uppercase tracking-tighter">{msg.user_name}</p>
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
                  <div className="flex-1 h-10 bg-slate-50 rounded-full border border-slate-200" />
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-100"><Send size={16} /></div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-[11px] text-blue-600 font-bold leading-relaxed">
                  💡 טיפ: כשאתה מעדכן את חוק ה"מנוף" בטבלה, שלח הודעה בוואטסאפ או בדוק כאן בסימולטור כדי לראות אם Gemini הטמיע את השינוי.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
