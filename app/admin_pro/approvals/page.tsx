"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { ShieldAlert, CheckCircle2, XCircle, Clock, User, Ghost, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from "sonner";

export default function ApprovalsCenter() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('pending_approvals')
      .select(`id, customer_id, issue_type, details, created_at, status, vip_profiles (full_name, main_project)`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setPending(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchApprovals();
    const channel = supabase.channel('approvals_sync').on('postgres_changes', { event: '*', table: 'pending_approvals' }, () => {
        fetchApprovals();
        toast.info("בקשת אישור חדשה התקבלה מהשטח 🚛");
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleDecision = async (id: string, decision: 'approved' | 'rejected') => {
    const { error } = await supabase.from('pending_approvals').update({ status: decision }).eq('id', id);
    if (!error) {
      toast.success(decision === 'approved' ? "הבקשה אושרה ב-DNA" : "הבקשה נדחתה");
      fetchApprovals();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-5xl mx-auto">
      
      <div className={`flex items-center justify-between p-8 rounded-[40px] border transition-all shadow-sm ${
        pending.length > 0 ? 'bg-rose-50 border-rose-100 text-rose-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-400'
      }`}>
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${pending.length > 0 ? 'bg-rose-500 text-white shadow-xl' : 'bg-slate-200 text-slate-400'}`}>
             <ShieldAlert size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black italic uppercase leading-none tracking-tighter">מרכז החלטות מנהל</h2>
            <p className="text-xs font-bold mt-2 uppercase tracking-[0.2em] opacity-70">
              {pending.length} בקשות חריגות ממתינות לאישור שלך
            </p>
          </div>
        </div>
        <button onClick={fetchApprovals} className="p-4 hover:bg-black/5 rounded-2xl transition-all border border-transparent hover:border-slate-200">
          <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {pending.length === 0 && !loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 text-center space-y-4">
               <CheckCircle2 size={64} className="mx-auto text-emerald-500 opacity-10" />
               <p className="text-slate-300 font-black italic uppercase tracking-widest text-sm">אין חריגות בשטח - המוח בשליטה 🦾</p>
            </motion.div>
          ) : (
            pending.map((item) => (
              <motion.div 
                layout initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                key={item.id} className="bg-white rounded-[45px] border border-slate-200 shadow-xl overflow-hidden group hover:border-blue-300 transition-all"
              >
                <div className="p-10 flex flex-col lg:flex-row justify-between items-center gap-10">
                   <div className="flex items-center gap-8 flex-1 text-right">
                      <div className="w-24 h-24 bg-slate-900 rounded-[35px] flex items-center justify-center text-white shadow-2xl relative shrink-0 border-4 border-white ring-8 ring-slate-50">
                        <User size={44} />
                        <div className="absolute -top-3 -right-3 bg-blue-600 w-10 h-10 rounded-2xl flex items-center justify-center text-[11px] font-black italic border-4 border-white shadow-lg">VIP</div>
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-2xl font-black text-slate-900 italic leading-none truncate tracking-tight">
                          {item.vip_profiles?.full_name || 'לקוח לא מזוהה'}
                        </h3>
                        <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest truncate italic">
                          {item.vip_profiles?.main_project || 'כללי'}
                        </p>
                        <div className="flex gap-3 mt-5">
                           <span className="bg-rose-100 text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase italic border border-rose-200 shadow-sm">
                             {item.issue_type === 'weight' ? 'חריגת משקל' : 'אישור מחיר'}
                           </span>
                           <span className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 uppercase tracking-tighter italic">
                             <Clock size={12}/> {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </span>
                        </div>
                      </div>
                   </div>

                   <div className="flex-[1.5] w-full bg-slate-50 p-8 rounded-[35px] border border-slate-100 relative group-hover:bg-blue-50/50 transition-colors shadow-inner">
                      <div className="absolute -top-3 -right-3 bg-white p-2 rounded-xl border shadow-md"><AlertCircle size={18} className="text-blue-500"/></div>
                      <p className="italic font-bold text-slate-600 text-lg leading-relaxed">
                        "{item.details}"
                      </p>
                   </div>

                   <div className="flex gap-4 shrink-0">
                      <button onClick={() => handleDecision(item.id, 'rejected')} className="w-16 h-16 bg-rose-50 text-rose-500 border-2 border-rose-100 rounded-3xl hover:bg-rose-500 hover:text-white transition-all shadow-lg active:scale-90 flex items-center justify-center"><XCircle size={32}/></button>
                      <button onClick={() => handleDecision(item.id, 'approved')} className="w-16 h-16 bg-emerald-50 text-emerald-500 border-2 border-emerald-100 rounded-3xl hover:bg-emerald-500 hover:text-white transition-all shadow-lg active:scale-90 flex items-center justify-center"><CheckCircle2 size={32}/></button>
                      <button onClick={() => window.open(`/vip/${item.customer_id}`, '_blank')} className="px-8 h-16 bg-slate-900 text-white rounded-3xl hover:bg-blue-600 transition-all shadow-2xl active:scale-95 flex items-center gap-3 font-black uppercase text-[10px] italic tracking-[0.2em] border-b-4 border-slate-700">
                         <Ghost size={24}/> השתלטות
                      </button>
                   </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
