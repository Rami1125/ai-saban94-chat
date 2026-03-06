"use client";
import React, { useEffect, useState } from 'react';
import { rtdb } from "@/lib/firebase";
import { ref, onValue, limitToLast, query } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  text: string;
  to: string;
  productName?: string;
  url?: string;
  timestamp: number;
}

export default function SabanStudio() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    // חיבור לצינור ה-pipeline החדש שבנינו
    const pipelineRef = query(ref(rtdb, 'saban94/pipeline'), limitToLast(5));
    
    const unsubscribe = onValue(pipelineRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgList = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          ...val
        })).sort((a, b) => a.timestamp - b.timestamp);
        
        setMessages(msgList);
        // עדכון עץ הלוגיקה לפי ההודעה האחרונה
        setActiveStep(3); 
        setTimeout(() => setActiveStep(0), 5000);
      }
    });

    return () => unsubscribe();
  }, []);

  const steps = [
    { title: "המתנה", desc: "מערכת ח. סבן בהאזנה...", icon: "📡" },
    { title: "ברכה", desc: "הזרקת הודעת פתיחה רשמית", icon: "👋" },
    { title: "זיהוי", desc: "חיפוש מוצר ב-Inventory", icon: "🔍" },
    { title: "שליחה", desc: "הזרקה ל-Pipeline ו-JONI", icon: "🚀" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans" dir="rtl">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-black italic text-yellow-500">H.SABAN STUDIO 2026</h1>
          <p className="text-slate-400">מרכז בקרה ולוגיקה - Rami-it System</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs">
            <span className="text-green-500">●</span> RTDB Connected: saban94/pipeline
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* צד שמאל: סימולטור iPhone */}
        <div className="lg:col-span-4 flex justify-center">
          <div className="w-[320px] h-[650px] bg-black rounded-[3rem] border-[8px] border-slate-800 relative shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20"></div>
            
            {/* Screen Content */}
            <div className="h-full flex flex-col bg-[#0b141a]"> {/* צבע הרקע של וואטסאפ דארק */}
              <div className="bg-[#202c33] p-6 pt-10 text-white font-bold shadow-md">
                ח. סבן Building Materials
              </div>
              
              <div className="flex-1 p-4 space-y-4 overflow-y-auto overflow-x-hidden">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: 50, scale: 0.8 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      className="bg-[#005c4b] p-3 rounded-2xl rounded-tr-none self-end text-white text-sm shadow-sm ml-auto max-w-[85%]"
                    >
                      <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                      <div className="text-[10px] opacity-50 mt-1 text-left">
                        {new Date(msg.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Input Area (Fake) */}
              <div className="bg-[#202c33] p-4 flex gap-2">
                <div className="flex-1 bg-[#2a3942] rounded-full h-10"></div>
                <div className="w-10 h-10 bg-[#00a884] rounded-full flex items-center justify-center">
                   <span className="text-white">🎤</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* צד ימין: עץ לוגיקה ובקרה */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* עץ השלבים */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {steps.map((step, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-2xl border-2 transition-all duration-500 ${
                  activeStep === idx ? 'border-yellow-500 bg-slate-900 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'border-slate-800 bg-slate-900/50 opacity-50'
                }`}
              >
                <div className="text-2xl mb-2">{step.icon}</div>
                <div className="font-bold text-sm">{step.title}</div>
                <div className="text-[10px] text-slate-500">{step.desc}</div>
              </div>
            ))}
          </div>

          {/* לוג פעולות אחרון */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 h-[380px] overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              Live System Logs
            </h3>
            <div className="flex-1 space-y-3 font-mono text-xs overflow-y-auto">
              {messages.slice().reverse().map((msg, i) => (
                <div key={i} className="p-3 bg-black/30 rounded-lg border-r-2 border-blue-500">
                  <span className="text-blue-400">[{new Date(msg.timestamp).toLocaleTimeString()}]</span>
                  <span className="text-yellow-500"> EVENT_PUSH:</span> 
                  <span className="text-slate-300"> הזרקת הודעה ל-{msg.to} | מוצר: {msg.productName || 'כללי'}</span>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-slate-600 italic">ממתין לפעילות ב-Pipeline...</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
