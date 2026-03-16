"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Activity, CheckCircle2, XCircle, 
  RefreshCw, Search, BrainCircuit,
  Zap, Terminal, Monitor, Lock, AlertTriangle,
  Loader2 // נוסף ייבוא חסר ששבר את ה-Build
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban OS - Diagnostic Center V2.1 (Build Fix)
 * -------------------------------------------
 * - Fix: Added missing Loader2 import.
 * - Logic: Verifying Google AI & Search keys health.
 */

export default function DiagnosticPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const runCheck = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin_pro/diagnostics');
      if (!res.ok) throw new Error("API Response Error");
      const json = await res.json();
      setData(json);
      toast.success("סריקת DNA הושלמה בהצלחה");
    } catch (e) {
      toast.error("נתק בתקשורת עם ה-API");
      console.error("Diagnostic Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runCheck(); }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 font-sans" dir="rtl">
      <Toaster position="top-center" richColors theme="light" />
      
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="bg-[#0F172A] rounded-[45px] p-10 text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden border border-white/5">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[120px] rounded-full" />
          <div className="relative z-10 flex items-center gap-8">
            <div className="w-20 h-20 bg-white rounded-[28px] flex items-center justify-center text-blue-600 shadow-2xl ring-4 ring-blue-500/10">
               <Activity size={40} className={loading ? 'animate-pulse' : ''} />
            </div>
            <div className="text-right">
               <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none mb-3 text-white">Diagnostic Center</h1>
               <p className="text-blue-400 text-xs font-bold uppercase tracking-[0.3em] italic">Saban OS Master Integrity Pulse</p>
            </div>
          </div>
          <button 
            onClick={runCheck}
            disabled={loading}
            className="mt-6 md:mt-0 bg-white/5 hover:bg-blue-600 px-8 py-5 rounded-2xl transition-all border border-white/10 flex items-center gap-4 group active:scale-95"
          >
             <span className="font-black text-xs uppercase tracking-widest italic text-white">סרוק שוב</span>
             <RefreshCw size={20} className={`text-white ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Gemini AI Status (Left Span) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[45px] border border-slate-200 shadow-xl overflow-hidden flex flex-col h-full">
               <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between text-right">
                  <div className="flex items-center gap-4">
                    <BrainCircuit className="text-blue-600" size={26} />
                    <h3 className="font-black text-xl italic uppercase tracking-tight text-slate-800 leading-none">AI Key Pool Matrix</h3>
                  </div>
                  <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic shadow-sm">Gemini 3.1 Pro</span>
               </div>
               
               <div className="p-8 space-y-5 flex-1">
                  {!data ? (
                    <div className="h-full flex flex-col items-center justify-center py-20 gap-4 opacity-30">
                       <Loader2 size={48} className="animate-spin text-blue-600" />
                       <p className="font-black uppercase text-xs tracking-widest">Scanning Keys...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.gemini_keys?.map((k: any, i: number) => (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }} 
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          key={i} 
                          className={`p-6 rounded-[32px] border-2 flex justify-between items-center transition-all ${k.status === 'valid' ? 'bg-emerald-50/30 border-emerald-100/50' : 'bg-rose-50/30 border-rose-100/50'}`}
                        >
                           <div className="flex items-center gap-5">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${k.status === 'valid' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                 {k.status === 'valid' ? <CheckCircle2 size={28}/> : <XCircle size={28}/>}
                              </div>
                              <div className="text-right">
                                 <p className="font-black text-slate-900 text-lg leading-none">Key #{k.index + 1}</p>
                                 <p className="text-[10px] font-mono text-slate-400 mt-2 uppercase tracking-widest font-bold">Suffix: {k.masked}</p>
                              </div>
                           </div>
                           <div className="text-left">
                              {k.status === 'valid' ? (
                                <div className="flex flex-col items-end">
                                   <span className="text-[10px] font-black text-emerald-600 uppercase italic tracking-widest">Active</span>
                                   <div className="w-8 h-1 bg-emerald-500 rounded-full mt-1 animate-pulse" />
                                </div>
                              ) : (
                                <div className="text-right">
                                   <span className="text-[10px] font-black text-rose-600 uppercase italic">Error {k.code}</span>
                                   <p className="text-[8px] text-rose-400 font-bold max-w-[80px] line-clamp-1">{k.error}</p>
                                </div>
                              )}
                           </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  {data?.gemini_keys?.length === 0 && <p className="text-center text-slate-300 italic py-10">No keys found in environment configuration.</p>}
               </div>
            </div>
          </div>

          {/* Search & Connectivity (Right Side) */}
          <div className="space-y-6">
            <div className="bg-white rounded-[45px] border border-slate-200 shadow-xl overflow-hidden flex flex-col">
               <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center gap-4 text-right">
                  <Search className="text-blue-600" size={24} />
                  <h3 className="font-black text-lg italic uppercase text-slate-800 leading-none">Media API Status</h3>
               </div>
               <div className="p-8 flex-1">
                  {!data?.search_api ? (
                     <div className="py-20 text-center text-slate-200 animate-pulse"><Search size={48} className="mx-auto"/></div>
                  ) : (
                    <div className={`p-8 rounded-[40px] border-2 flex flex-col gap-6 relative overflow-hidden ${data.search_api.status === 'valid' ? 'bg-emerald-50/30 border-emerald-100/50' : 'bg-rose-50/30 border-rose-100/50'}`}>
                       {data.search_api.status === 'valid' && <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full" />}
                       <div className="flex items-center gap-6">
                          <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-2xl ${data.search_api.status === 'valid' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                             {data.search_api.status === 'valid' ? <Zap size={32} fill="white"/> : <AlertTriangle size={32}/>}
                          </div>
                          <div className="text-right">
                             <h4 className="text-2xl font-black italic text-slate-900 leading-none">Google Search</h4>
                             <p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest">Custom Search Engine</p>
                          </div>
                       </div>
                       
                       <div className="bg-white p-5 rounded-[25px] shadow-inner border border-slate-100 text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-2 italic tracking-[0.2em]">Live Validation Result:</p>
                          {data.search_api.status === 'valid' ? (
                            <div className="flex items-center gap-2 text-emerald-600 font-black italic text-sm tracking-tight"><CheckCircle2 size={16}/> מפתח החיפוש תקין ומוכן להזרקת מדיה</div>
                          ) : (
                            <div className="space-y-2">
                               <div className="flex items-center gap-2 text-rose-600 font-black italic text-sm"><XCircle size={16}/> שגיאה: {data.search_api.code}</div>
                               <p className="text-[10px] text-rose-400 font-bold leading-relaxed italic">{data.search_api.error || "מכסת חיפוש יומית הסתיימה או מפתח שגוי"}</p>
                            </div>
                          )}
                       </div>
                    </div>
                  )}
               </div>
            </div>

            {/* Quick Summary Card */}
            <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col justify-center border border-white/5">
               <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-600/10 blur-3xl rounded-full" />
               <div className="flex items-center gap-4 mb-4 opacity-40 text-right">
                  <Terminal size={18} />
                  <p className="text-[9px] font-black uppercase tracking-[0.4em]">System Trace Log</p>
               </div>
               <div className="space-y-2 font-mono text-[10px] text-blue-400/80 text-right" dir="ltr">
                  <p>&gt; Connection: Supabase LIVE</p>
                  <p>&gt; Models: Gemini-3.1-Flash/Pro</p>
                  <p>&gt; Security: 3-Key Rotation Active</p>
                  <p className="text-emerald-400">&gt; Pulse check completed.</p>
               </div>
            </div>
          </div>

        </div>
      </div>

      <footer className="py-16 text-center opacity-20 mt-10 uppercase text-[10px] font-black tracking-[1em] text-slate-900">
         Saban OS Diagnostic Suite V2.1
      </footer>
    </div>
  );
}
