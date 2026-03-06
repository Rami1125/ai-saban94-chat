"use client";
import React, { useEffect, useState, useRef } from 'react';
import { rtdb } from "@/lib/firebase"; 
import { supabase } from "@/lib/supabase"; 
import { ref, onValue, limitToLast, query } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";
import { 
  RefreshCw, Database, Cpu, MessageSquare, 
  Trash2, Plus, Layout, Zap, BrainCircuit 
} from "lucide-react";

// אימוג'ים ואפקטים לפי מצב השיחה
const STATUS_EFFECTS = {
  thinking: { icon: "🧠", text: "חשיבה לוגיסטית...", color: "text-blue-400" },
  typing: { icon: "✍️", text: "מנסח הצעה...", color: "text-emerald-400" },
  searching: { icon: "🏗️", text: "בודק מלאי במחסן...", color: "text-yellow-500" },
  calculating: { icon: "🔢", text: "מחשב כמויות גבס...", color: "text-purple-400" }
};

export default function SabanStudioV3() {
  const [messages, setMessages] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [newRule, setNewRule] = useState("");
  const [aiStatus, setAiStatus] = useState<keyof typeof STATUS_EFFECTS | null>(null);
  const [chatState, setChatState] = useState<'start' | 'product' | 'quantity' | 'logistics' | 'complete'>('start');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. האזנה ל-Pipeline (Firebase)
    const pipelineRef = query(ref(rtdb, 'saban94/pipeline'), limitToLast(8));
    onValue(pipelineRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgList = Object.entries(data).map(([id, val]: [string, any]) => ({
          id, ...val
        })).sort((a, b) => a.timestamp - b.timestamp);
        setMessages(msgList);
        updateFlowState(msgList);
      }
    });

    fetchRules();
  }, []);

  // ניתוח מצב השיחה (פינג-פונג)
  const updateFlowState = (msgs: any[]) => {
    const text = msgs.map(m => m.text).join(" ").toLowerCase();
    if (text.includes("הועברה למחלקה")) setChatState('complete');
    else if (text.includes("תאריך") || text.includes("שעת אספקה")) setChatState('logistics');
    else if (text.includes("כמה יחידות") || text.includes("כמות")) setChatState('quantity');
    else if (msgs.length > 0) setChatState('product');
  };

  const fetchRules = async () => {
    const { data } = await supabase.from('system_rules').select('*').order('created_at', { ascending: false });
    if (data) setRules(data);
  };

  const saveRule = async () => {
    if (!newRule.trim()) return;
    await supabase.from('system_rules').insert([{ instruction: newRule, category: 'general' }]);
    setNewRule("");
    fetchRules();
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 lg:p-8 font-sans" dir="rtl">
      
      {/* Header - מרכז הבקרה */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black italic text-yellow-500 tracking-tighter flex items-center gap-3">
            SABAN AI STUDIO <Zap className="fill-yellow-500" />
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
              <Database size={10} /> הזיכרון הארגוני פעיל
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20">
              <BrainCircuit size={10} /> Gemini 3.1 Pro Connection
            </span>
          </div>
        </div>
        
        {/* עץ הפינג-פונג הדינמי */}
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex gap-6 items-center shadow-xl">
           <StepNode active={chatState === 'product'} label="מוצר" icon="🏗️" />
           <div className="h-px w-4 bg-slate-700" />
           <StepNode active={chatState === 'quantity'} label="כמות" icon="🔢" />
           <div className="h-px w-4 bg-slate-700" />
           <StepNode active={chatState === 'logistics'} label="הובלה" icon="🚚" />
           <div className="h-px w-4 bg-slate-700" />
           <StepNode active={chatState === 'complete'} label="סגור" icon="✅" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* צד שמאל: הסימולטור עם אפקטים של הקלדה */}
        <div className="lg:col-span-4 flex justify-center sticky top-8 h-fit">
          <div className="w-[300px] h-[600px] bg-black rounded-[3rem] border-[8px] border-slate-800 relative shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-800 rounded-b-2xl z-20"></div>
            <div className="h-full flex flex-col bg-[#0b141a]">
              <div className="bg-[#202c33] p-6 pt-10 text-white font-bold text-sm border-b border-slate-700">ח. סבן - צ'אט לוגיסטי</div>
              
              <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-hide">
                <AnimatePresence>
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: msg.role === 'user' ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex flex-col ${msg.role === 'assistant' ? 'items-start' : 'items-end'}`}
                    >
                      <div className={`p-2.5 rounded-2xl max-w-[85%] text-[11px] shadow-md ${
                        msg.role === 'assistant' ? 'bg-[#202c33] text-slate-100 rounded-tr-none' : 'bg-[#005c4b] text-white rounded-tl-none'
                      }`}>
                        <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* אפקט חושב/מקליד דינמי */}
                  {aiStatus && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-center p-2">
                       <span className="text-lg animate-bounce">{STATUS_EFFECTS[aiStatus].icon}</span>
                       <span className={`text-[10px] font-bold ${STATUS_EFFECTS[aiStatus].color} italic`}>{STATUS_EFFECTS[aiStatus].text}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={scrollRef} />
              </div>
            </div>
          </div>
        </div>

        {/* צד ימין: ניהול חוקים וזיכרון */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* הוספת חוק חדש */}
          <section className="bg-slate-900/80 p-6 rounded-[2rem] border border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="text-yellow-500" size={18} /> הזרקת הנחיה חכמה לספר החוקים
            </h3>
            <div className="flex gap-3">
              <textarea 
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder="למשל: אם הלקוח מבקש גבס, תמיד תשאל בסוף על ברגים 🔩..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-yellow-500 min-h-[80px] transition-all"
              />
              <button 
                onClick={saveRule}
                className="bg-yellow-600 hover:bg-yellow-500 text-black font-black px-6 rounded-2xl transition-all h-[80px] shadow-lg shadow-yellow-600/20 active:scale-95"
              >
                עדכן מוח
              </button>
            </div>
          </section>

          {/* לוג הזיכרון הארגוני (סיכום נתונים) */}
          <section className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800 h-[320px] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <BrainCircuit size={14} className="text-blue-500" /> זיכרון שיחות פעיל
              </h4>
              <button className="text-[10px] text-red-400 bg-red-400/10 px-3 py-1 rounded-lg">נקה זיכרון זמני</button>
            </div>
            
            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="group bg-slate-950 p-4 rounded-2xl border-r-4 border-yellow-600 flex justify-between items-start hover:bg-slate-900 transition-all shadow-sm">
                  <p className="text-[13px] text-slate-300 leading-relaxed pl-4">{rule.instruction}</p>
                  <button onClick={() => {/* Delete logic */}} className="opacity-0 group-hover:opacity-100 text-red-500 p-1"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </section>

          {/* מחוון חיסכון בטוקנים */}
          <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg"><Cpu size={16} className="text-white" /></div>
              <span className="text-xs font-bold">ניצול מפתחות API אופטימלי:</span>
            </div>
            <span className="text-blue-400 font-black text-lg">94% חסכון</span>
          </div>

        </div>

      </main>
    </div>
  );
}

// קומפוננטת שלב בעץ
const StepNode = ({ active, label, icon }: any) => (
  <div className={`flex flex-col items-center gap-1 transition-all duration-700 ${active ? 'scale-110' : 'opacity-30'}`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg ${active ? 'bg-yellow-600 animate-pulse text-black' : 'bg-slate-800'}`}>
      {icon}
    </div>
    <span className={`text-[9px] font-black ${active ? 'text-yellow-500' : 'text-slate-600'}`}>{label}</span>
  </div>
);
