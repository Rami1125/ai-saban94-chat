"use client";
import React, { useEffect, useState } from 'react';
import { rtdb } from "@/lib/firebase"; 
import { supabase } from "@/lib/supabase"; 
import { ref, onValue, limitToLast, query } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  text: string;
  to: string;
  timestamp: number;
}

interface Rule {
  id: string;
  instruction: string;
  category: string;
}

export default function SabanStudio() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [newRule, setNewRule] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. האזנה לצינור ה-Pipeline (Firebase)
    const pipelineRef = query(ref(rtdb, 'saban94/pipeline'), limitToLast(6));
    const unsubFirebase = onValue(pipelineRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgList = Object.entries(data).map(([id, val]: [string, any]) => ({
          id, ...val
        })).sort((a, b) => a.timestamp - b.timestamp);
        setMessages(msgList);
      }
    });

    // 2. שליפת חוקים מ-Supabase
    fetchRules();

    return () => unsubFirebase();
  }, []);

  const fetchRules = async () => {
    const { data } = await supabase.from('system_rules').select('*').order('created_at', { ascending: false });
    if (data) setRules(data);
  };

  const saveRule = async () => {
    if (!newRule.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('system_rules').insert([{ instruction: newRule, category: 'general' }]);
    if (!error) {
      setNewRule("");
      fetchRules();
    }
    setLoading(false);
  };

  const deleteRule = async (id: string) => {
    await supabase.from('system_rules').delete().eq('id', id);
    fetchRules();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 font-sans" dir="rtl">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black italic text-yellow-500">H.SABAN STUDIO v2.0</h1>
          <p className="text-slate-400 text-sm">ניהול לוגיקה וספר חוקים בזמן אמת</p>
        </div>
        <div className="bg-blue-900/30 border border-blue-500/50 px-4 py-2 rounded-xl text-xs text-blue-400 animate-pulse">
          ● System Active: Pipeline Connected
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* צד שמאל: סימולטור iPhone */}
        <div className="lg:col-span-4 flex justify-center">
          <div className="w-[300px] h-[600px] bg-black rounded-[3rem] border-[8px] border-slate-800 relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-800 rounded-b-xl z-20"></div>
            <div className="h-full flex flex-col bg-[#0b141a]">
              <div className="bg-[#202c33] p-5 pt-8 text-white font-bold text-sm">ח. סבן - צ'אט עסקי</div>
              <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#005c4b] p-2.5 rounded-xl rounded-tr-none text-white text-xs ml-auto max-w-[85%] shadow-md"
                    >
                      <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* צד ימין: ניהול חוקים ולוגים */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-yellow-500">📚</span> הוספת הנחיה לספר החוקים (Gemini)
            </h3>
            <div className="flex gap-3">
              <input 
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder="למשל: תמיד להציע הובלת מנוף..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <button 
                onClick={saveRule}
                disabled={loading}
                className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold px-6 rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? 'שומר...' : 'עדכן ספר'}
              </button>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 h-[250px] overflow-y-auto">
            <h4 className="text-sm font-bold text-slate-400 mb-4 italic">חוקים פעילים בספר:</h4>
            <div className="space-y-2">
              {rules.map((rule) => (
                <div key={rule.id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border-r-4 border-yellow-600">
                  <span className="text-xs text-slate-200">{rule.instruction}</span>
                  <button onClick={() => deleteRule(rule.id)} className="text-red-400 hover:text-red-600 text-xs mr-4">מחק</button>
                </div>
              ))}
            </div>
          </div>

          {/* לוגים - כאן היה התיקון בשורה 149 */}
          <div className="bg-black/40 rounded-3xl p-6 border border-slate-800 h-[200px] font-mono text-[10px] overflow-y-auto">
            <h3 className="text-blue-400 font-bold mb-2 uppercase tracking-widest">System Live Stream</h3>
            {messages.slice().reverse().map((msg, i) => (
              <div key={i} className="mb-1 text-slate-500">
                <span className="text-green-500">[{new Date(msg.timestamp).toLocaleTimeString()}]</span> 
                {" PUSH_TO_JONI => "} 
                {msg.to ? msg.to.slice(0, 5) : "Unknown"}...
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
