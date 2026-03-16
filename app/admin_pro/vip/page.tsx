"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { Users, Plus, Phone, MapPin, Scale, ChevronRight, Search, Star, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VipManagement() {
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => { fetchClients(); }, []);

  async function fetchClients() {
    const { data } = await supabase.from('vip_profiles').select('*').order('created_at', { ascending: false });
    setClients(data || []);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="w-full max-w-xl relative group">
           <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
           <input placeholder="חפש לקוח VIP, פרויקט או טלפון..." className="w-full bg-white border border-slate-200 pr-14 pl-6 py-5 rounded-3xl font-bold shadow-sm outline-none focus:ring-4 ring-blue-500/10 transition-all text-lg" />
        </div>
        <button className="bg-slate-900 text-white px-10 py-5 rounded-[22px] font-black shadow-xl flex items-center gap-4 text-xs italic uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shrink-0 border-b-4 border-slate-700">
           <Plus size={22}/> הוסף לקוח זהב
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {clients.map((client, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            key={client.id} className="bg-white rounded-[45px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group overflow-hidden border-b-[10px] border-b-blue-600/5 hover:border-b-blue-600"
          >
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-start">
                <div className="w-20 h-20 bg-blue-50 rounded-[30px] flex items-center justify-center text-blue-600 shadow-inner relative group-hover:scale-110 transition-transform">
                  <Users size={40} />
                  <div className="absolute -top-2 -right-2 bg-amber-400 p-1.5 rounded-xl border-4 border-white shadow-sm animate-bounce"><Star size={14} fill="white" className="text-white"/></div>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-sm">ID: {client.id}</div>
              </div>
              
              <div className="text-right">
                <h3 className="text-2xl font-black text-slate-900 italic tracking-tight">{client.full_name}</h3>
                <p className="text-sm font-bold text-slate-400 mt-2 flex items-center justify-end gap-2"><MapPin size={16}/> {client.main_project}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-[25px] border border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-tighter italic">Truck Limit</p>
                  <p className="font-black text-slate-800 flex items-center justify-center gap-2 text-base italic"><Scale size={16} className="text-blue-500"/> {client.truck_limit_kg / 1000} TON</p>
                </div>
                <div className="bg-slate-50 p-5 rounded-[25px] border border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-tighter italic">Phone</p>
                  <p className="font-black text-slate-800 flex items-center justify-center gap-2 text-base italic"><Phone size={16} className="text-blue-500"/> {client.phone.slice(-4)}</p>
                </div>
              </div>
            </div>
            
            <div className="flex divide-x divide-x-reverse divide-slate-100 border-t border-slate-100 bg-slate-50/50">
               <button className="flex-1 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 italic">
                  תיק לקוח <ChevronRight size={14}/>
               </button>
               <button onClick={() => window.open(`https://wa.me/${client.phone.replace(/-/g,'')}`, '_blank')} className="px-8 py-5 hover:bg-emerald-500 hover:text-white transition-all text-slate-400">
                  <MessageCircle size={20} />
               </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
