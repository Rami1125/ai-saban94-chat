"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, CheckCircle2, XCircle, Play, 
  Key, RefreshCw, AlertTriangle, Terminal,
  Cpu, Activity, Zap, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban OS - Advanced AI Diagnostics v4.5
 * ממשק בדיקת מפתחות עם בחירת מודל ומכסות
 */

const AVAILABLE_MODELS = [
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (New)', quota: '2 RPM / 32,000 TPD' },
  { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash-Lite', quota: '15 RPM / 1M TPD' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Stable)', quota: '5 RPM / 1.5M TPD' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Stable)', quota: '15 RPM / 1M TPD' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Old)', quota: '15 RPM / 1M TPD' },
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
        updateKeyStatus(index, 'invalid', data.error?.message || "Error", latency);
      }
    } catch (err) {
      updateKeyStatus(index, 'invalid', "Connection Timeout");
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
    setKeys(prev => prev.map(k => ({ ...k, status: 'pending', error: undefined, latency: undefined })));
    
    for (let i = 0; i < keys.length; i++) {
      await testSingleKey(keys[i].key, i);
    }
    setIsTesting(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 md:p-12 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-2xl">
              <Brain className="text-blue-400" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase">Brain <span className="text-blue-500">Analyzer</span></h1>
              <p className="text-slate-500 font-bold text-xs mt-1 tracking-widest flex items-center gap-2">
                <Terminal size={14}/> SABAN OS LOGISTICS CORE
              </p>
            </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
             <div className="flex flex-col gap-1 flex-1 md:w-64">
                <label className="text-[10px] font-black text-slate-500 uppercase px-2">בחר מודל לבדיקה</label>
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 ring-blue-500/50"
                >
                  {AVAILABLE_MODELS.map(m => (
                    <option key={m.id} value={m.id} className="bg-[#020617]">{m.name}</option>
                  ))}
                </select>
             </div>
             <button 
                onClick={runFullDiagnostics}
                disabled={isTesting}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 h-[52px] mt-auto px-8 rounded-xl font-black flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-900/20"
              >
                {isTesting ? <RefreshCw className="animate-spin" /> : <Zap size={20} fill="currentColor" />}
                בדוק Pool
              </button>
          </div>
        </div>

        {/* Info Card - Quotas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/5 border-white/10 p-6 rounded-[2rem] flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400"><Activity size={24}/></div>
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase">מכסה נוכחית ({selectedModel.split('-')[1]})</div>
              <div className="text-lg font-black">{AVAILABLE_MODELS.find(m => m.id === selectedModel)?.quota}</div>
            </div>
          </Card>
          <Card className="bg-white/5 border-white/10 p-6 rounded-[2rem] flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400"><CheckCircle2 size={24}/></div>
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase">מפתחות תקינים</div>
              <div className="text-2xl font-black text-emerald-400">{keys.filter(k => k.status === 'valid').length} / {keys.length}</div>
            </div>
          </Card>
          <Card className="bg-white/5 border-white/10 p-6 rounded-[2rem] flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-400"><Info size={24}/></div>
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase">סטטוס מודל</div>
              <div className="text-lg font-black text-orange-400">Experimental / Beta</div>
            </div>
          </Card>
        </div>

        {/* Keys List */}
        <div className="space-y-4">
          <AnimatePresence>
            {keys.map((k, idx) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={idx}
                className={`p-6 rounded-[2.5rem] border transition-all flex items-center justify-between ${
                  k.status === 'valid' ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 
                  k.status === 'invalid' ? 'bg-red-500/5 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]' : 
                  'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                    k.status === 'valid' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 
                    k.status === 'invalid' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 
                    'bg-white/5 border-white/10 text-slate-500'
                  }`}>
                    <Key size={28} />
                  </div>
                  <div>
                    <div className="font-mono text-base font-bold tracking-widest text-slate-200">
                      {k.key.substring(0, 10)}••••••••{k.key.substring(k.key.length - 4)}
                    </div>
                    {k.latency && (
                      <div className="text-[10px] font-black text-blue-400 mt-1 uppercase flex items-center gap-1">
                        <Clock size={12} /> Latency: {k.latency}ms
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {k.status === 'invalid' && (
                    <div className="text-right">
                      <div className="text-red-400 text-[10px] font-black uppercase mb-1 flex items-center gap-1 justify-end"><AlertTriangle size={12}/> Diagnostic Error</div>
                      <div className="text-slate-500 text-[10px] font-medium max-w-[200px] leading-tight">{k.error}</div>
                    </div>
                  )}
                  <div className={`px-6 py-2 rounded-full font-black text-[11px] uppercase tracking-widest ${
                    k.status === 'valid' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' : 
                    k.status === 'invalid' ? 'bg-red-500 text-white' : 
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

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={className}>{children}</div>
);

const Brain = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.54Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.54Z"/>
  </svg>
);
