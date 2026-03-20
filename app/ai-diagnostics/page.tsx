"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, CheckCircle2, XCircle, Play, 
  Key, RefreshCw, AlertTriangle, Terminal,
  Activity, Zap, Info, Clock, Cpu, Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban OS - AI Diagnostics Pro v5.1 (Fixed)
 * ----------------------------------
 * ממשק אבחון מתקדם לבדיקת Pool המפתחות מול מודלים עדכניים.
 */

// הגדרת קומפוננטות עזר פנימיות למניעת שגיאות רינדור
const LocalCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white/5 border border-white/10 rounded-[2.5rem] ${className}`}>
    {children}
  </div>
);

const AVAILABLE_MODELS = [
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Latest)', quota: '2 RPM / 32K TPD', desc: 'המודל החזק ביותר בסדרה 3' },
  { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash-Lite', quota: '15 RPM / 1M TPD', desc: 'מהיר וחסכוני במיוחד' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', quota: '5 RPM / 1.5M TPD', desc: 'יציבות וביצועים גבוהים' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', quota: '15 RPM / 1M TPD', desc: 'הסטנדרט המהיר של סדרה 2.5' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', quota: '15 RPM / 1M TPD', desc: 'מודל הדור הקודם היציב' },
  { id: 'gemini-1.5-flash-002', name: 'Gemini 1.5 Flash (V2)', quota: '15 RPM / 1M TPD', desc: 'הגרסה המעודכנת של 1.5' }
];

export default function AIKeyDiagnostics() {
  const [keys, setKeys] = useState<{key: string, status: 'pending' | 'valid' | 'invalid', error?: string, latency?: number}[]>([]);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const pool = process.env.NEXT_PUBLIC_GOOGLE_AI_KEY_POOL || "";
    const keyArray = pool.split(',').map(k => k.trim()).filter(k => k !== "");
    setKeys(keyArray.map(k => ({ key: k, status: 'pending' })));
  }, []);

  const testSingleKey = async (apiKey: string, index: number) => {
    const startTime = Date.now();
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
      });

      const data = await res.json();
      const latency = Date.now() - startTime;

      if (res.ok) {
        updateKeyStatus(index, 'valid', undefined, latency);
      } else {
        const errorMsg = data.error?.message || `Error ${res.status}`;
        updateKeyStatus(index, 'invalid', errorMsg, latency);
      }
    } catch (err) {
      updateKeyStatus(index, 'invalid', "Network Timeout", Date.now() - startTime);
    }
  };

  const updateKeyStatus = (index: number, status: 'valid' | 'invalid', error?: string, latency?: number) => {
    setKeys(prev => {
      const newKeys = [...prev];
      newKeys[index] = { ...newKeys[index], status, error, latency };
      return newKeys;
    });
  };

  const runFullDiagnostics = async () => {
    setIsTesting(true);
    toast.info(`מתחיל בדיקה מול ${selectedModel}...`);
    setKeys(prev => prev.map(k => ({ ...k, status: 'pending', error: undefined, latency: undefined })));
    
    for (let i = 0; i < keys.length; i++) {
      await testSingleKey(keys[i].key, i);
    }
    setIsTesting(false);
  };

  const currentModelData = AVAILABLE_MODELS.find(m => m.id === selectedModel);

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 md:p-12 font-sans overflow-x-hidden" dir="rtl">
      <Toaster position="top-center" richColors theme="dark" />
      
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-blue-600/10 rounded-[22px] flex items-center justify-center border border-blue-500/20 shadow-2xl">
              <Zap className="text-blue-400" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase">AI <span className="text-blue-500">Diagnostics</span></h1>
              <p className="text-slate-500 font-bold text-xs mt-1 tracking-widest flex items-center gap-2">
                <Terminal size={14}/> SABAN OS SECURITY ENGINE
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
             <div className="flex flex-col gap-1.5 flex-1 md:w-72">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2">בחר מודל לאימות</label>
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 font-bold text-sm outline-none focus:ring-2 ring-blue-500/50 appearance-none cursor-pointer"
                >
                  {AVAILABLE_MODELS.map(m => (
                    <option key={m.id} value={m.id} className="bg-[#020617]">{m.name}</option>
                  ))}
                </select>
             </div>
             <button 
                onClick={runFullDiagnostics}
                disabled={isTesting}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 h-[54px] mt-auto px-10 rounded-xl font-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-blue-900/20 shrink-0"
              >
                {isTesting ? <RefreshCw className="animate-spin" size={20} /> : <Play size={20} fill="currentColor" />}
                הרץ בדיקה
              </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LocalCard className="p-6 flex items-center gap-5">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20"><Activity size={24}/></div>
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">מכסות (RPM/TPD)</div>
              <div className="text-lg font-black italic">{currentModelData?.quota}</div>
            </div>
          </LocalCard>
          <LocalCard className="p-6 flex items-center gap-5">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20"><CheckCircle2 size={24}/></div>
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">מפתחות תקינים</div>
              <div className="text-2xl font-black text-emerald-400 leading-none">{keys.filter(k => k.status === 'valid').length} <span className="text-slate-600 text-sm">/ {keys.length}</span></div>
            </div>
          </LocalCard>
          <LocalCard className="p-6 flex items-center gap-5">
            <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-400 border border-orange-500/20"><Cpu size={24}/></div>
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">תיאור מודל</div>
              <div className="text-xs font-bold text-slate-300 leading-tight">{currentModelData?.desc}</div>
            </div>
          </LocalCard>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {keys.map((k, idx) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={idx}
                className={`p-7 rounded-[3rem] border transition-all flex flex-col md:flex-row items-center justify-between gap-6 ${
                  k.status === 'valid' ? 'bg-emerald-500/[0.03] border-emerald-500/20' : 
                  k.status === 'invalid' ? 'bg-red-500/[0.03] border-red-500/20' : 
                  'bg-white/[0.02] border-white/5'
                }`}
              >
                <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner ${
                    k.status === 'valid' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 
                    k.status === 'invalid' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 
                    'bg-white/5 border-white/10 text-slate-500'
                  }`}>
                    <Key size={28} />
                  </div>
                  <div className="flex-1">
                    <div className="font-mono text-sm font-bold tracking-[0.2em] text-slate-200">
                      {k.key.substring(0, 10)}••••••••{k.key.substring(k.key.length - 4)}
                    </div>
                    {k.latency && (
                      <div className="text-[10px] font-black text-blue-400 mt-1.5 uppercase flex items-center gap-1.5">
                        <Clock size={12} /> מהירות תגובה: {k.latency}ms
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                  {k.status === 'invalid' && (
                    <div className="text-right">
                      <div className="text-red-400 text-[10px] font-black uppercase mb-1 flex items-center gap-1.5 justify-end">
                        <AlertTriangle size={12}/> Diagnostic Failure
                      </div>
                      <div className="text-slate-500 text-[10px] font-bold max-w-[250px] leading-relaxed truncate">{k.error}</div>
                    </div>
                  )}
                  <div className={`px-6 py-2.5 rounded-full font-black text-[11px] uppercase tracking-[0.15em] shadow-lg ${
                    k.status === 'valid' ? 'bg-emerald-500 text-white shadow-emerald-900/20' : 
                    k.status === 'invalid' ? 'bg-red-500 text-white shadow-red-900/20' : 
                    'bg-slate-800 text-slate-500'
                  }`}>
                    {k.status === 'valid' ? 'Synced' : k.status === 'invalid' ? 'Failed' : 'Waiting'}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
