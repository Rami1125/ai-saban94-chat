"use client";
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from "@/lib/supabase"; 
import { rtdb } from "@/lib/firebase";
import { ref, onValue, limitToLast, query as dbQuery } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";
import { 
  RefreshCw, Database, Cpu, MessageSquare, 
  Trash2, Plus, Zap, BrainCircuit, CheckCircle2, 
  XCircle, Edit3, Send, Smartphone
} from "lucide-react";
import { toast } from "sonner";

export default function SabanStudioLight() {
  const [rules, setRules] = useState<any[]>([]);
  const [liveMessages, setLiveMessages] = useState<any[]>([]);
  const [newRule, setNewRule] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. האזנה לשיחות בזמן אמת (Simulated Live Chat)
  useEffect(() => {
    const chatRef = dbQuery(ref(rtdb, 'chat-sidor'), limitToLast(5));
    return onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgList = Object.values(data).sort((a: any, b: any) => a.timestamp - b.timestamp);
        setLiveMessages(msgList);
        setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
      }
    });
  }, []);

  // 2. שליפת חוקים מ-Supabase
  const fetchRules = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('system_rules').select('*').order('id', { ascending: true });
    if (!error) setRules(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRules(); }, []);

  // 3. הוספת/מחיקת חוקים
  const handleAddRule = async () => {
    if (!newRule.trim()) return;
    const { error } = await supabase.from('system_rules').insert([{ instruction: newRule, agent_type: 'executor', is_active: true }]);
    if (!error) { toast.success("החוק התווסף"); setNewRule(""); fetchRules(); }
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from('system_rules').delete().eq('id', id);
    if (!error) { setRules(rules.filter(r => r.id !== id)); toast.success("החוק הוסר"); }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-10" dir="rtl">
      
      {/* Header */}
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-10 bg-white p-6 rounded-[24px] shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg">
            <BrainCircuit size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">SABAN <span className="text-blue-600">DNA STUDIO</span></h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">ניהול חוקי המוח וניטור בזמן אמת</p>
          </div>
        </div>
        <button onClick={fetchRules} className="p-2 hover:bg-slate-100 rounded-full transition-all">
          <RefreshCw size={20} className={loading ? "animate-spin text-blue-600" : "text-slate-400"} />
        </button>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* עמודת ניהול חוקים (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2 text-slate-700">
                <Database size={18} className="text-blue-500" /> טבלת חוקי מערכת
              </h2>
              <div className="flex gap-2">
                <input 
                  value={newRule} onChange={(e) => setNewRule(e.target.value)}
                  placeholder="הוסף הנחיה חדשה..."
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm w-64 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button onClick={handleAddRule} className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-all">
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="text-[11px] uppercase text-slate-400 font-black border-b border-slate-100">
                    <th className="p-4 w-16">ID</th>
                    <th className="p-4 w-24">סוג</th>
                    <th className="p-4">הנחיה (Instruction)</th>
                    <th className="p-4 w-28 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="p-4 text-xs font-mono text-slate-400">#{rule.id}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                          rule.agent_type === 'executor' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {rule.agent_type}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600 leading-relaxed font-medium">
                        {rule.instruction}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => handleDelete(rule.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* עמודת סימולטור דינאמי (4/12) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex-1 flex flex-col">
            <header className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Smartphone size={20} className="text-blue-600" />
                <h2 className="font-bold text-slate-700">סימולטור Live</h2>
              </div>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase">מחובר ל-RTDB</span>
              </div>
            </header>

            {/* צג המכשיר */}
            <div className="flex-1 bg-slate-100 rounded-[2.5rem] border-[8px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col h-[500px]">
              <div className="h-6 w-24 bg-slate-800 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-10"></div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 pt-10" ref={scrollRef}>
                {liveMessages.map((msg: any, idx) => (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    key={idx} 
                    className={`flex ${msg.user_name === 'AI' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[85%] p-3 rounded-2xl text-xs shadow-sm ${
                      msg.user_name === 'AI' 
                        ? 'bg-white text-slate-800 rounded-tr-none' 
                        : 'bg-blue-600 text-white rounded-tl-none'
                    }`}>
                      <p className="font-bold mb-1 opacity-50 text-[9px] uppercase">{msg.user_name}</p>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input מדומה */}
              <div className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center">
                <div className="flex-1 h-8 bg-slate-50 rounded-full border border-slate-100"></div>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                  <Send size={14} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
