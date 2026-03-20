"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, CheckCircle2, XCircle, Play, 
  Key, RefreshCw, AlertTriangle, Terminal 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban OS - AI Key Diagnostics
 * ממשק לבדיקת תקינות מפתחות ה-AI ב-Pool
 */

export default function AIKeyDiagnostics() {
  const [keys, setKeys] = useState<{key: string, status: 'pending' | 'valid' | 'invalid', error?: string}[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    // טעינת המפתחות מהמשתנה הסביבתי
    const pool = process.env.NEXT_PUBLIC_GOOGLE_AI_KEY_POOL || "";
    const keyArray = pool.split(',').map(k => k.trim()).filter(k => k !== "");
    setKeys(keyArray.map(k => ({ key: k, status: 'pending' })));
  }, []);

  const testSingleKey = async (apiKey: string, index: number) => {
    try {
      // שליחת בדיקה למסלול ה-API לבדיקת המפתח הספציפי
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
      });

      const data = await res.json();

      if (res.ok) {
        updateKeyStatus(index, 'valid');
      } else {
        updateKeyStatus(index, 'invalid', data.error?.message || "Invalid Key");
      }
    } catch (err) {
      updateKeyStatus(index, 'invalid', "Network Error");
    }
  };

  const updateKeyStatus = (index: number, status: 'valid' | 'invalid', error?: string) => {
    setKeys(prev => {
      const newKeys = [...prev];
      newKeys[index] = { ...newKeys[index], status, error };
      return newKeys;
    });
  };

  const runFullDiagnostics = async () => {
    if (keys.length === 0) {
      toast.error("לא נמצאו מפתחות ב-Pool להרצה");
      return;
    }
    setIsTesting(true);
    toast.info("מתחיל בדיקת סינפסות לכל המפתחות...");

    for (let i = 0; i < keys.length; i++) {
      await testSingleKey(keys[i].key, i);
    }

    setIsTesting(false);
    toast.success("אבחון המערכת הושלם");
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 md:p-12 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-blue-600/20 rounded-[22px] flex items-center justify-center border border-blue-500/30 shadow-lg shadow-blue-500/10">
              <ShieldAlert className="text-blue-400" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase">AI Key <span className="text-blue-500">Diagnostics</span></h1>
              <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest flex items-center gap-2">
                <Terminal size={14}/> Saban OS Security Core
              </p>
            </div>
          </div>
          
          <button 
            onClick={runFullDiagnostics}
            disabled={isTesting}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-900/20 flex items-center gap-3 transition-all active:scale-95"
          >
            {isTesting ? <RefreshCw className="animate-spin" size={20} /> : <Play size={20} fill="currentColor" />}
            הרץ אבחון מלא
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 p-5 rounded-3xl text-center">
            <div className="text-2xl font-black">{keys.length}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">מפתחות ב-Pool</div>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-3xl text-center">
            <div className="text-2xl font-black text-emerald-400">{keys.filter(k => k.status === 'valid').length}</div>
            <div className="text-[10px] font-bold text-emerald-600 uppercase">תקינים</div>
          </div>
          <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-3xl text-center">
            <div className="text-2xl font-black text-red-400">{keys.filter(k => k.status === 'invalid').length}</div>
            <div className="text-[10px] font-bold text-red-600 uppercase">לא מתקשרים</div>
          </div>
        </div>

        {/* Keys List */}
        <div className="space-y-4">
          <AnimatePresence>
            {keys.map((k, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={idx}
                className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between ${
                  k.status === 'valid' ? 'bg-emerald-500/5 border-emerald-500/20' : 
                  k.status === 'invalid' ? 'bg-red-500/5 border-red-500/20' : 
                  'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    k.status === 'valid' ? 'bg-emerald-500/20 text-emerald-400' : 
                    k.status === 'invalid' ? 'bg-red-500/20 text-red-400' : 
                    'bg-white/10 text-slate-400'
                  }`}>
                    <Key size={24} />
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold tracking-wider">
                      {k.key.substring(0, 8)}••••••••{k.key.substring(k.key.length - 4)}
                    </div>
                    {k.error && (
                      <div className="text-[10px] font-bold text-red-400 mt-1 uppercase flex items-center gap-1">
                        <AlertTriangle size={12} /> {k.error}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {k.status === 'valid' && (
                    <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase bg-emerald-400/10 px-4 py-2 rounded-full">
                      <CheckCircle2 size={16} /> Online
                    </div>
                  )}
                  {k.status === 'invalid' && (
                    <div className="flex items-center gap-2 text-red-400 font-black text-xs uppercase bg-red-400/10 px-4 py-2 rounded-full">
                      <XCircle size={16} /> Error
                    </div>
                  )}
                  {k.status === 'pending' && (
                    <div className="text-slate-500 font-black text-xs uppercase px-4 py-2">
                      Ready
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Warning Footer */}
        {keys.some(k => k.status === 'invalid') && (
          <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-[2rem] flex gap-4 items-start">
            <AlertTriangle className="text-orange-500 shrink-0" size={24} />
            <div>
              <p className="text-orange-200 font-bold">זוהו מפתחות פגומים!</p>
              <p className="text-orange-200/60 text-sm font-medium mt-1">עליך להסיר את המפתחות המסומנים באדום ממשתנה הסביבה ב-Vercel כדי למנוע קריסות של המוח הלוגיסטי.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
