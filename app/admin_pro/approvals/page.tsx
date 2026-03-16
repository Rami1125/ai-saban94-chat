"use client";

import React from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Clock, User, Ghost, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ApprovalsCenter() {
  // נתוני דוגמה חכמים (עד לחיבור טבלת pending_approvals)
  const pending = [
    { id: 1, customer: 'בר אורניל', project: 'סטרומה 4', issue: 'חריגת משקל', details: 'מבקש בלה 19 (13.3 טון)', time: '5 דק\'' },
    { id: 2, customer: 'אבי לוי', project: 'רעננה', issue: 'הנחה חריגה', details: 'מבקש 10% הנחה על 603', time: '12 דק\'' }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 text-rose-600 bg-rose-50 p-6 rounded-[30px] border border-rose-100 shadow-sm animate-pulse">
        <ShieldAlert size={32} />
        <div>
          <h2 className="text-xl font-black italic uppercase leading-none">נדרשת התערבות מנהל</h2>
          <p className="text-rose-700/70 text-xs font-bold mt-1 uppercase tracking-widest">2 בקשות ממתינות לאישור שלך</p>
        </div>
      </div>

      <div className="space-y-6">
        {pending.map((item, i) => (
          <motion.div 
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
            key={item.id} className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden group"
          >
            <div className="p-10 flex flex-col md:flex-row justify-between items-center gap-8">
               <div className="flex items-center gap-8 flex-1">
                  <div className="w-20 h-20 bg-slate-900 rounded-[30px] flex items-center justify-center text-white shadow-2xl relative">
                    <User size={40} />
                    <div className="absolute -top-2 -right-2 bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black italic">VIP</div>
                  </div>
                  <div className="text-right">
                    <h3 className="text-2xl font-black text-slate-900 italic leading-none">{item.customer}</h3>
                    <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{item.project}</p>
                    <div className="flex gap-4 mt-4">
                       <span className="bg-rose-100 text-rose-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase italic border border-rose-200">{item.issue}</span>
                       <span className="bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-2 uppercase tracking-tighter italic"><Clock size={12}/> {item.time}</span>
                    </div>
                  </div>
               </div>

               <div className="flex-1 bg-slate-50 p-6 rounded-3xl border border-slate-100 italic font-bold text-slate-600 text-sm">
                 "{item.details}"
               </div>

               <div className="flex gap-4">
                  <button className="p-6 bg-rose-500 text-white rounded-[30px] hover:bg-rose-600 transition-all shadow-lg active:scale-95"><XCircle size={32}/></button>
                  <button className="p-6 bg-emerald-500 text-white rounded-[30px] hover:bg-emerald-600 transition-all shadow-lg active:scale-95"><CheckCircle2 size={32}/></button>
                  <button className="p-6 bg-slate-900 text-white rounded-[30px] hover:bg-blue-600 transition-all shadow-lg active:scale-95 flex items-center gap-3 font-black uppercase text-xs italic">
                     <Ghost size={24}/> השתלט
                  </button>
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
