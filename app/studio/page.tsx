"use client";
import React, { useEffect, useState } from 'react';
import { rtdb } from "@/lib/firebase"; 
import { supabase } from "@/lib/supabase"; // וודא שהקובץ הזה מייצא את ה-Client עם מפתח ה-SERVICE_ROLE
import { ref, onValue, limitToLast, query } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";

// מאגר אימוג'י מקצועי לבנייה ולוגיסטיקה של ח. סבן
const SABAN_EMOJIS = [
  { char: "🏗️", name: "מנוף" }, { char: "🚚", name: "משאית עלי" },
  { char: "🧱", name: "בלוקים" }, { char: "🪜", name: "גבס/סולם" },
  { char: "💰", name: "מחיר" }, { char: "📋", name: "סידור/חוק" },
  { char: "✅", name: "אושר" }, { char: "⚠️", name: "אזהרה" },
  { char: "📞", name: "צור קשר" }, { char: "👷", name: "עובד" }
];

interface Message {
  id: string; text: string; to: string; timestamp: number;
}

interface Rule {
  id: string; instruction: string; category: string;
}

export default function SabanStudio() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [newRule, setNewRule] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    // 1. האזנה לצינור ה-Pipeline (Firebase)
    try {
      const pipelineRef = query(ref(rtdb, 'saban94/pipeline'), limitToLast(6));
      onValue(pipelineRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const msgList = Object.entries(data).map(([id, val]: [string, any]) => ({
            id, ...val
          })).sort((a, b) => a.timestamp - b.timestamp);
          setMessages(msgList);
        }
      });
    } catch (e) { console.error("Firebase Connection Error", e); }

    // 2. שליפת חוקים מ-Supabase
    fetchRules();
  }, []);

  const fetchRules = async () => {
    // שליפה בסיסית - עובדת עם מפתח Anon
    const { data, error } = await supabase.from('system_rules').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error("Supabase Fetch Error (401?)", error);
      setErrorStatus("שגיאת אבטחה (401) ב-Supabase. וודא שהגדרת RLS או השתמש במפתח Service Role.");
    } else if (data) {
      setRules(data);
      setErrorStatus(null);
    }
  };

  const saveRule = async () => {
    if (!newRule.trim()) return;
    setLoading(true);
    // **תיקון האבטחה:** הפעולה הזו דורשת מפתח Service Role אם RLS מופעל
    const { error } = await supabase.from('system_rules').insert([{ instruction: newRule, category: 'general' }]);
    if (error) {
      console.error("Supabase Insert Error", error);
      alert("שגיאה בהוספת החוק. וודא שהגדרת הרשאות כתיבה (RLS) ב-Supabase.");
    } else {
      setNewRule("");
      fetchRules();
    }
    setLoading(false);
  };

  const deleteRule = async (id: string) => {
    // **תיקון האבטחה:** הפעולה הזו דורשת מפתח Service Role אם RLS מופעל
    const { error } = await supabase.from('system_rules').delete().eq('id', id);
    if (error) {
      console.error("Supabase Delete Error", error);
      alert("שגיאה במחיקת החוק. וודא שיש הרשאות מחיקה (RLS).");
    } else {
      fetchRules();
    }
  };

  const addEmojiToRule = (emoji: string) => {
    setNewRule(prev => prev + " " + emoji + " ");
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-200 p-6 font-sans" dir="rtl">
      {/* Header מעוצב ומקצועי */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-8 border-b-2 border-yellow-500/50 pb-4 shadow-[0_4px_10px_rgba(234,179,8,0.1)]">
        <div>
          <h1 className="text-4xl font-black italic text-yellow-500 tracking-tighter">H.SABAN STUDIO v2.5</h1>
          <p className="text-slate-400 text-sm">מרכז לוגיקה ואפקטים ויזואליים בשיחה</p>
        </div>
        <div className="flex gap-4 items-center">
          {errorStatus && <div className="text-red-400 text-xs bg-red-950 p-2 rounded-lg border border-red-800">{errorStatus}</div>}
          <div className="bg-emerald-900/30 border border-emerald-500/50 px-4 py-2 rounded-xl text-xs text-emerald-400 animate-pulse">
            ● Firebase RTDB: Connected
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* צד שמאל: סימולטור iPhone */}
        <div className="lg:col-span-4 flex justify-center">
          <div className="w-[290px] h-[580px] bg-black rounded-[3rem] border-[10px] border-slate-800 relative shadow-[0_0_60px_rgba(0,0,0,0.6)] overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-800 rounded-b-xl z-20"></div>
            <div className="h-full flex flex-col bg-[#0b141a]">
              <div className="bg-[#202c33] p-5 pt-8 text-white font-bold text-sm shadow-lg border-b border-slate-700">ח. סבן Building Materials</div>
              <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-[#005c4b] p-3 rounded-2xl rounded-tr-none text-white text-[11px] ml-auto max-w-[85%] shadow-md leading-relaxed"
                    >
                      <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* צד ימין: ניהול חוקים ואימוג'י */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* פאנל הוספת חוק ואימוג'י - מעוצב */}
          <div className="bg-[#111827] p-6 rounded-3xl border-2 border-slate-800 shadow-2xl relative">
            <h3 className="text-xl font-bold mb-5 flex items-center gap-2 text-slate-100">
              <span className="text-yellow-500">📚</span> עורך ספר החוקים ואפקטים
            </h3>
            
            {/* מאגר אימוג'י משולב */}
            <div className="bg-[#1f2937] p-4 rounded-2xl border border-slate-700 mb-5 flex gap-2.5 flex-wrap">
              <span className="text-xs text-slate-400 font-bold block w-full mb-1">אפקטים לשיחה:</span>
              {SABAN_EMOJIS.map(e => (
                <button 
                  key={e.char} 
                  onClick={() => addEmojiToRule(e.char)}
                  title={e.name}
                  className="text-2xl p-2 bg-slate-800 hover:bg-yellow-600/20 rounded-lg transition-all transform hover:scale-110 active:scale-95"
                >
                  {e.char}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <input 
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder="למשל: תמיד להוסיף 🏗️ מנוף אם..."
                className="flex-1 bg-[#1f2937] border border-slate-700 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-white placeholder:text-slate-500"
              />
              <button 
                onClick={saveRule}
                disabled={loading}
                className="bg-yellow-600 hover:bg-yellow-500 text-black font-extrabold px-8 rounded-xl transition-all disabled:opacity-50 transform active:scale-95 shadow-lg"
              >
                {loading ? 'מעדכן...' : 'עדכן ספר 📋'}
              </button>
            </div>
          </div>

          {/* רשימת חוקים פעילים */}
          <div className="bg-[#111827] p-6 rounded-3xl border-2 border-slate-800 h-[280px] overflow-y-auto shadow-inner">
            <h4 className="text-xs font-bold text-slate-500 mb-4 italic tracking-wider">ספר החוקים הנוכחי של Gemini:</h4>
            <div className="space-y-2.5">
              <AnimatePresence>
                {rules.map((rule) => (
                  <motion.div 
                    key={rule.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex justify-between items-center bg-[#1f2937]/70 p-4 rounded-xl border-r-4 border-yellow-600 shadow-md hover:bg-[#1f2937]"
                  >
                    <span className="text-[13px] text-slate-100 font-medium leading-snug">{rule.instruction}</span>
                    <button onClick={() => deleteRule(rule.id)} className="text-red-400 hover:text-red-600 text-xs mr-5 font-bold p-1 bg-red-950/50 rounded-md">מחק</button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {rules.length === 0 && !errorStatus && (
                <div className="text-slate-600 italic text-sm text-center pt-10">ספר החוקים ריק. הוסף חוק חדש למעלה.</div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
