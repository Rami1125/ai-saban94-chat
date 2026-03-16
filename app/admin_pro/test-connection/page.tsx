"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { Database, CheckCircle2, XCircle, Loader2, Table } from 'lucide-react';

/**
 * Saban OS - Connection Diagnostics
 * קומפוננטה לבדיקת תקינות החיבור לטבלת המשקלים
 */
export default function TestConnectionPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [data, setData] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function verify() {
      try {
        const { data: weights, error } = await supabase
          .from('product_weights')
          .select('*');

        if (error) throw error;

        setData(weights || []);
        setStatus('success');
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message);
        setStatus('error');
      }
    }
    verify();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-10 font-sans" dir="rtl">
      <div className="max-w-2xl mx-auto bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black italic uppercase leading-none">Diagnostic Tool</h1>
            <p className="text-blue-400 text-[10px] font-bold uppercase mt-2 tracking-widest text-right">Saban OS DB Link Check</p>
          </div>
          <Database size={32} className="text-blue-500" />
        </div>

        <div className="p-10 space-y-8">
          {/* Status Indicator */}
          <div className="flex items-center gap-4 p-6 rounded-3xl border border-slate-100 bg-slate-50">
            {status === 'loading' && <Loader2 size={32} className="animate-spin text-blue-500" />}
            {status === 'success' && <CheckCircle2 size={32} className="text-emerald-500" />}
            {status === 'error' && <XCircle size={32} className="text-rose-500" />}
            
            <div className="text-right">
              <p className="font-black text-slate-900 text-lg italic">
                {status === 'loading' && "מתחבר ל-Supabase..."}
                {status === 'success' && "חיבור לטבלת המשקלים תקין 🦾"}
                {status === 'error' && "שגיאת חיבור לנתונים"}
              </p>
              <p className="text-xs font-bold text-slate-400 uppercase">Table: product_weights</p>
            </div>
          </div>

          {/* Results Area */}
          <div className="space-y-4">
            <h3 className="font-black text-slate-800 flex items-center gap-2 italic uppercase text-sm">
              <Table size={18} /> נתונים שנסרקו מהמוח:
            </h3>
            
            {status === 'success' && data.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {data.map((item) => (
                  <div key={item.sku} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center shadow-sm">
                    <span className="font-black text-blue-600">#{item.sku}</span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">{item.weight_kg} ק"ג</p>
                      <p className="text-[10px] text-slate-400 uppercase font-black">{item.is_big_bag ? 'Big Bag' : 'Standard Bag'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : status === 'success' && data.length === 0 ? (
              <p className="p-10 text-center bg-amber-50 text-amber-600 rounded-3xl font-bold border border-amber-100 italic">
                החיבור עובד אבל הטבלה ריקה. הרץ פקודת INSERT.
              </p>
            ) : status === 'error' ? (
              <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600">
                <p className="font-black text-xs uppercase mb-2">Supabase Error Trace:</p>
                <code className="text-[10px] font-mono break-all">{errorMsg}</code>
              </div>
            ) : null}
          </div>
        </div>

        <div className="p-8 border-t border-slate-50 bg-slate-50/50 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Saban OS Internal Audit</p>
        </div>
      </div>
    </div>
  );
}
