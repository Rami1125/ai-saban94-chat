"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { ShieldAlert, CheckCircle2, XCircle, Clock, User, Ghost, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from "sonner";

/**
 * Saban Admin Pro - Approvals Center (Live Edition)
 * -----------------------------------------------
 * This page monitors active interventions where the AI stopped a customer
 * based on the DNA rules (Weight limits, duplicates, price).
 */

export default function ApprovalsCenter() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. שליפת נתונים חיים מה-DB
  const fetchApprovals = async () => {
    setLoading(true);
    try {
      // הנחה שקיימת טבלת approvals המקושרת ל-vip_profiles
      const { data, error } = await supabase
        .from('pending_approvals')
        .select(`
          id,
          customer_id,
          issue_type,
          details,
          created_at,
          status,
          vip_profiles (full_name, main_project)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPending(data || []);
    } catch (err) {
      console.error("Error fetching approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. האזנה לשינויים בזמן אמת (Real-time sync)
  useEffect(() => {
    fetchApprovals();
    
    const channel = supabase
      .channel('approvals_changes')
      .on('postgres_changes', { event: '*', table: 'pending_approvals' }, () => {
        fetchApprovals();
        toast.info("בקשת אישור חדשה התקבלה מהשטח 🚛");
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 3. פעולת אישור/דחייה
  const handleDecision = async (id: string, decision: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('pending_approvals')
      .update({ status: decision })
      .eq('id', id);

    if (!error) {
      toast.success(decision === 'approved' ? "הבקשה אושרה ב-DNA" : "הבקשה נדחתה");
      fetchApprovals();
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      
      {/* Header Alert Area */}
      <div className={`flex items-center justify-between p-6 rounded-[30px] border transition-all ${
        pending.length > 0 ? 'bg-rose-50 border-rose-100 text-rose-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-400'
      }`}>
        <div className="flex items-center gap-4">
          <ShieldAlert size={32} />
          <div>
            <h2 className="text-xl font-black italic uppercase leading-none">מרכז החלטות מנהל</h2>
            <p className="text-xs font-bold mt-1 uppercase tracking-widest opacity-70">
              {pending.length} בקשות חריגות ממתינות לאישור שלך
            </p>
          </div>
        </div>
        <button onClick={fetchApprovals} className="p-3 hover:bg-black/5 rounded-full transition-all">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Requests Feed */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {pending.length === 0 && !loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center space-y-4">
               <CheckCircle2 size={48} className="mx-auto text-emerald-500 opacity-20" />
               <p className="text-slate-400 font-black italic uppercase tracking-widest text-sm">אין חריגות בשטח - המוח בשליטה 🦾</p>
            </motion.div>
          ) : (
            pending.map((item) => (
              <motion.div 
                layout
                initial={{ x: -20, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }} 
                exit={{ x: 50, opacity: 0 }}
                key={item.id} className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden group hover:border-blue-200 transition-all"
              >
                <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                  
                   {/* Client Info */}
                   <div className="flex items-center gap-6 flex-1 text-right">
                      <div className="w-20 h-20 bg-slate-900 rounded-[30px] flex items-center justify-center text-white shadow-2xl relative shrink-0">
                        <User size={36} />
                        <div className="absolute -top-2 -right-2 bg-blue-600 w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black italic border-2 border-white">VIP</div>
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-xl font-black text-slate-900 italic leading-none truncate">
                          {item.vip_profiles?.full_name || 'לקוח לא מזוהה'}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest truncate">
                          פרויקט: {item.vip_profiles?.main_project || 'כללי'}
                        </p>
                        <div className="flex gap-2 mt-4">
                           <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase italic border border-rose-200">
                             {item.issue_type === 'weight' ? 'חריגת משקל' : 'אישור מחיר'}
                           </span>
                           <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black flex items-center gap-1.5 uppercase tracking-tighter italic">
                             <Clock size={10}/> {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </span>
                        </div>
                      </div>
                   </div>

                   {/* Details Bubble */}
                   <div className="flex-[1.5] w-full bg-slate-50 p-6 rounded-3xl border border-slate-100 relative group-hover:bg-blue-50/50 transition-colors">
                      <div className="absolute -top-2 -right-2 bg-white p-1 rounded-lg border shadow-sm"><AlertCircle size={14} className="text-blue-500"/></div>
                      <p className="italic font-bold text-slate-600 text-sm leading-relaxed">
                        "{item.details}"
                      </p>
                   </div>

                   {/* Decision Actions */}
                   <div className="flex gap-3 shrink-0">
                      <button 
                        onClick={() => handleDecision(item.id, 'rejected')}
                        className="w-14 h-14 bg-rose-50 text-rose-500 border border-rose-100 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90 flex items-center justify-center"
                      >
                        <XCircle size={28}/>
                      </button>
                      <button 
                        onClick={() => handleDecision(item.id, 'approved')}
                        className="w-14 h-14 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-90 flex items-center justify-center"
                      >
                        <CheckCircle2 size={28}/>
                      </button>
                      <button 
                        onClick={() => window.open(`/vip/${item.customer_id}`, '_blank')}
                        className="px-6 h-14 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl active:scale-95 flex items-center gap-3 font-black uppercase text-[10px] italic tracking-widest"
                      >
                         <Ghost size={20}/> השתלט על שיחה
                      </button>
                   </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Bottom context for Rami */}
      <footer className="pt-10 border-t border-slate-200 opacity-40">
         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center">Saban OS Intelligence Enforcement Unit</p>
      </footer>
    </div>
  );
}
