"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { Users, Plus, Phone, MapPin, Scale, ChevronRight, Search } from 'lucide-react';
import { toast } from "sonner";

export default function VipClients() {
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => { fetchClients(); }, []);

  async function fetchClients() {
    const { data } = await supabase.from('vip_profiles').select('*').order('created_at', { ascending: false });
    setClients(data || []);
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-md relative">
           <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
           <input placeholder="חפש לקוח זהב..." className="w-full bg-white border border-slate-200 pr-12 pl-4 py-4 rounded-2xl font-bold shadow-sm" />
        </div>
        <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-lg flex items-center gap-3 text-xs italic uppercase">
           <Plus size={20}/> הוסף לקוח VIP
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map(client => (
          <div key={client.id} className="bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden border-b-8 border-b-blue-600/10 hover:border-b-blue-600">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="w-16 h-16 bg-blue-50 rounded-[25px] flex items-center justify-center text-blue-600 shadow-inner">
                  <Users size={32} />
                </div>
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-xl font-black text-[9px] uppercase tracking-widest">Client ID: {client.id}</div>
              </div>
              
              <div>
                <h3 className="text-xl font-black text-slate-900 italic">{client.full_name}</h3>
                <p className="text-sm font-bold text-slate-400 mt-1 flex items-center gap-2"><MapPin size={14}/> {client.main_project}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">מגבלת משקל</p>
                  <p className="font-black text-slate-800 flex items-center gap-2 text-sm italic"><Scale size={14}/> {client.truck_limit_kg / 1000} טון</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">טלפון</p>
                  <p className="font-black text-slate-800 flex items-center gap-2 text-sm italic"><Phone size={14}/> {client.phone}</p>
                </div>
              </div>
            </div>
            
            <button className="w-full bg-slate-50 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center gap-2">
               צפה בהיסטוריה וניהול <ChevronRight size={14}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
