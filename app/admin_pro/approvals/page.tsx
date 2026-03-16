"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  ShieldAlert, CheckCircle2, XCircle, Clock, User, 
  Ghost, AlertCircle, RefreshCw, ArrowUpRight,
  ShieldCheck, MessageCircle, Scale, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from "sonner";

/**
 * Saban Admin Pro - Approvals Center (Executive Bridge)
 * ----------------------------------------------------
 * - Live Sync: Real-time listening to pending_approvals table.
 * - Decision Logic: Approval/Rejection triggers AI state updates.
 * - Ghost Mode: Direct link to client chat for intervention.
 */

export default function ApprovalsCenter() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. שליפת נתונים וסנכרון Real-time
  const fetchApprovals = async () => {
    setLoading(true);
    try {
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
    } catch (err: any) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
    
    // הרשמה לשינויים חיים בטבלה
    const channel = supabase
      .channel('approvals_realtime')
      .on('postgres_changes', { event: '*', table: 'pending_approvals' }, () => {
        fetchApprovals();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 2. לוגיקת החלטת מנהל
  const handleDecision = async (id: string, decision: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('pending_approvals')
        .update({ status: decision })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(decision === 'approved' ? "אושר ב-DNA המערכת" : "הבקשה נדחתה", {
        icon: decision === 'approved' ? <ShieldCheck className="text-emerald-500"/> : <XCircle className="text-rose-500"/>
      });
      
      fetchApprovals();
    } catch (err: any) {
      toast.error("שגיאה בביצוע הפעולה");
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'weight': return <Scale size={20} />;
      case 'price': return <Tag size={20} />;
      default: return <AlertCircle size={20} />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8 max-w-6xl mx-auto"
    >
      
      {/* Header Stat & Sync */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${
            pending.length > 0 ? 'bg-rose-500 text-white shadow-xl shadow-rose-200 animate-pulse' : 'bg-slate-100 text-slate-400'
          }`}>
             <ShieldAlert size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black italic uppercase leading-none tracking-tighter">מרכז החלטות מנהל</h2>
            <p className="text-xs font-bold mt-2 uppercase tracking-[0.2em] text-slate-400">
              {pending.length} בקשות קריטיות ממתינות לאישור שלך
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
           <button 
             onClick={fetchApprovals}
             className="p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all group"
           >
             <RefreshCw className={`text-slate-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} size={22} />
           </button>
           <div className="h-14 w-[1px] bg-slate-100 mx-2 hidden md:block" />
           <div className="bg-blue-50 text-blue-700 px-6 py-4 rounded-2xl border border-blue-100 font-black text-xs flex items-center gap-3 uppercase italic">
              <ShieldCheck size={18} /> System Secure
           </div>
        </div>
      </div>

      {/* Feed Area */}
      <div className="space-y-6 min-h-[500px]">
        <AnimatePresence mode="popLayout">
          {pending.length === 0 && !loading ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="py-32 text-center space-y-6"
            >
               <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-100">
                  <CheckCircle2 size={48} className="text-emerald-500" />
               </div>
               <div>
                  <p className="text-slate-400 font-black italic uppercase tracking-widest text-lg">אין חריגות בשטח</p>
                  <p className="text-slate-300 text-xs font-bold mt-2">המוח הלוגיסטי שולט בביצוע ב-100%</p>
               </div>
            </motion.div>
          ) : (
            pending.map((item, i) => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ delay: i * 0.1 }}
                key={item.id} 
                className="bg-white rounded-[45px] border border-slate-200 shadow-xl overflow-hidden group hover:border-blue-400 transition-all border-r-[12px] border-r-rose-500"
              >
                <div className="p-10 flex flex-col lg:flex-row justify-between items-center gap-10">
                   
                   {/* Profile Column */}
                   <div className="flex items-center gap-8 flex-1 text-right">
                      <div className="w-24 h-24 bg-slate-900 rounded-[35px] flex items-center justify-center text-white shadow-2xl relative shrink-0 border-4 border-white ring-8 ring-slate-50 group-hover:ring-blue-50 transition-all">
                        <User size={40} />
                        <div className="absolute -top-3 -right-3 bg-blue-600 w-10 h-10 rounded-2xl flex items-center justify-center text-[10px] font-black italic border-4 border-white shadow-lg">VIP</div>
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-2xl font-black text-slate-900 italic leading-none truncate tracking-tight">
                          {item.vip_profiles?.full_name || 'לקוח VIP'}
                        </h3>
                        <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest truncate italic">
                          <span className="text-blue-500">פרויקט:</span> {item.vip_profiles?.main_project || 'כללי'}
                        </p>
                        <div className="flex gap-3 mt-6">
                           <span className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase italic border border-rose-100 shadow-sm flex items-center gap-2">
                             {getIssueIcon(item.issue_type)} {item.issue_type === 'weight' ? 'חריגת משקל' : 'אישור מיוחד'}
                           </span>
                           <span className="bg-slate-50 text-slate-500 px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 uppercase tracking-tighter italic border border-slate-100">
                             <Clock size={12}/> {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </span>
                        </div>
                      </div>
                   </div>

                   {/* Event Details Bubble */}
                   <div className="flex-[1.5] w-full bg-slate-900 text-white p-8 rounded-[35px] relative group-hover:bg-blue-950 transition-colors shadow-2xl border-b-8 border-slate-800">
                      <div className="absolute -top-3 -right-3 bg-white p-2 rounded-xl border shadow-md text-blue-600"><MessageCircle size={18}/></div>
                      <p className="italic font-bold text-lg leading-relaxed text-right opacity-90">
                        "{item.details}"
                      </p>
                   </div>

                   {/* Decision Matrix */}
                   <div className="flex gap-4 shrink-0">
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => handleDecision(item.id, 'approved')}
                          className="w-16 h-16 bg-emerald-500 text-white rounded-3xl hover:bg-emerald-600 transition-all shadow-xl active:scale-90 flex items-center justify-center border-b-4 border-emerald-700"
                        >
                          <CheckCircle2 size={32}/>
                        </button>
                        <button 
                          onClick={() => handleDecision(item.id, 'rejected')}
                          className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl hover:bg-rose-500 hover:text-white transition-all shadow-lg active:scale-90 flex items-center justify-center border border-rose-100"
                        >
                          <XCircle size={32}/>
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => window.open(`/vip/${item.customer_id}`, '_blank')}
                        className="px-10 h-[136px] bg-slate-100 text-slate-400 rounded-[35px] hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95 flex flex-col items-center justify-center gap-3 font-black uppercase text-[10px] italic tracking-widest border-b-8 border-slate-200 hover:border-blue-800"
                      >
                         <Ghost size={32}/>
                         <span>השתלטות</span>
                      </button>
                   </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <footer className="py-16 border-t border-slate-200 opacity-20 flex justify-between items-center px-10">
         <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">Saban OS Decision Bridge V25.0</p>
         <div className="flex gap-2 text-blue-500">
            {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />)}
         </div>
      </footer>
    </motion.div>
  );
}
