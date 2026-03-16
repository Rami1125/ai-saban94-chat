"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Users, Plus, Phone, MapPin, Scale, ChevronRight, 
  Search, Star, MessageCircle, MoreVertical, Trash2, Edit3, 
  History, UserPlus, ShieldCheck, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from "sonner";

/**
 * Saban Admin Pro - VIP Management Suite
 * -------------------------------------
 * Managing Gold-Tier clients, projects, and personal DNA rules.
 */

export default function VipManagement() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);

  // 1. שליפת לקוחות VIP מה-Supabase
  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vip_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (err: any) {
      toast.error("שגיאה בשליפת לקוחות: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  // 2. סינון לקוחות לפי חיפוש
  const filteredClients = clients.filter(c => 
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id?.includes(searchTerm) ||
    c.main_project?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 3. שמירה/עדכון לקוח
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('vip_profiles')
      .upsert(editingClient);

    if (!error) {
      toast.success("פרופיל ה-VIP עודכן בהצלחה 🦾");
      setIsModalOpen(false);
      fetchClients();
    } else {
      toast.error("שגיאה בשמירה");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 max-w-7xl mx-auto">
      
      {/* Header & Search Area */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm">
        <div className="w-full lg:max-w-xl relative group">
           <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
           <input 
              placeholder="חפש לקוח זהב, פרויקט או מזהה..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-none pr-14 pl-6 py-5 rounded-[25px] font-black shadow-inner outline-none focus:ring-4 ring-blue-500/10 transition-all text-lg" 
           />
        </div>
        <button 
          onClick={() => { setEditingClient({ id: '', full_name: '', nickname: '', main_project: '', phone: '', truck_limit_kg: 12000 }); setIsModalOpen(true); }}
          className="bg-slate-950 text-white px-10 py-5 rounded-[25px] font-black shadow-xl flex items-center gap-4 text-sm italic uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shrink-0 border-b-4 border-slate-800"
        >
           <UserPlus size={22}/> הוסף לקוח VIP
        </button>
      </div>

      {/* Clients Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[1,2,3].map(i => <div key={i} className="h-80 bg-slate-100 animate-pulse rounded-[45px]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <AnimatePresence>
            {filteredClients.map((client, i) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ delay: i * 0.05 }}
                key={client.id} 
                className="bg-white rounded-[45px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group overflow-hidden border-b-[12px] border-b-blue-600/5 hover:border-b-blue-600 relative"
              >
                <div className="p-10 space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="w-20 h-20 bg-blue-50 rounded-[30px] flex items-center justify-center text-blue-600 shadow-inner relative group-hover:scale-110 transition-transform">
                      <Users size={40} />
                      <div className="absolute -top-2 -right-2 bg-amber-400 p-2 rounded-xl border-4 border-white shadow-md animate-bounce">
                        <Star size={14} fill="white" className="text-white"/>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-sm">ID: {client.id}</span>
                       {client.truck_limit_kg > 12000 && (
                         <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg font-black text-[8px] flex items-center gap-1 uppercase italic border border-rose-100">
                           <AlertCircle size={10}/> Oversize Truck
                         </span>
                       )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <h3 className="text-2xl font-black text-slate-900 italic tracking-tight leading-none truncate">{client.full_name}</h3>
                    <p className="text-sm font-bold text-slate-400 mt-2 flex items-center justify-end gap-2 italic uppercase truncate">
                      <MapPin size={16} className="text-blue-500"/> {client.main_project}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-5 rounded-[28px] border border-slate-100 text-center shadow-inner">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-tighter italic">Truck Limit</p>
                      <p className="font-black text-slate-900 flex items-center justify-center gap-2 text-base italic leading-none">
                        <Scale size={18} className="text-blue-500"/> {client.truck_limit_kg / 1000}T
                      </p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-[28px] border border-slate-100 text-center shadow-inner">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-tighter italic">Last Interaction</p>
                      <p className="font-black text-slate-900 flex items-center justify-center gap-2 text-base italic leading-none uppercase">
                        <History size={18} className="text-blue-500"/> Live
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex divide-x divide-x-reverse divide-slate-100 border-t border-slate-100 bg-slate-50/50 group-hover:bg-blue-600 transition-colors">
                   <button 
                      onClick={() => { setEditingClient(client); setIsModalOpen(true); }}
                      className="flex-1 py-6 font-black text-[11px] uppercase tracking-widest text-slate-400 group-hover:text-white transition-all flex items-center justify-center gap-2 italic"
                   >
                      ערוך תיק <Edit3 size={16}/>
                   </button>
                   <button 
                      onClick={() => window.open(`https://wa.me/${client.phone.replace(/-/g,'')}`, '_blank')}
                      className="px-10 py-6 text-slate-400 group-hover:text-white hover:bg-emerald-500 transition-all border-r border-slate-100"
                   >
                      <MessageCircle size={22} />
                   </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Edit/Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, y: 50, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              className="bg-white rounded-[50px] w-full max-w-3xl overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-white/20"
            >
              <div className="bg-slate-900 p-10 text-white flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[80px] rounded-full" />
                <div className="text-right z-10">
                   <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">VIP DNA Editor</h2>
                   <p className="text-blue-400 text-[11px] font-bold uppercase mt-2 tracking-widest flex items-center gap-2 justify-end">
                      <ShieldCheck size={14}/> Saban OS Security Sync
                   </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all z-10 italic font-black text-sm">ביטול X</button>
              </div>

              <form onSubmit={handleSaveClient} className="p-12 space-y-8 text-right bg-slate-50/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 mr-2 italic">מזהה לקוח (ID)</label>
                    <input 
                      required
                      value={editingClient.id}
                      onChange={e => setEditingClient({...editingClient, id: e.target.value})}
                      className="w-full bg-white border border-slate-200 p-5 rounded-2xl font-black italic outline-none focus:ring-4 ring-blue-500/10 transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 mr-2 italic">שם מלא</label>
                    <input 
                      required
                      value={editingClient.full_name}
                      onChange={e => setEditingClient({...editingClient, full_name: e.target.value})}
                      className="w-full bg-white border border-slate-200 p-5 rounded-2xl font-black italic outline-none focus:ring-4 ring-blue-500/10 transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 mr-2 italic">פרויקט פעיל</label>
                    <input 
                      value={editingClient.main_project}
                      onChange={e => setEditingClient({...editingClient, main_project: e.target.value})}
                      className="w-full bg-white border border-slate-200 p-5 rounded-2xl font-black italic outline-none focus:ring-4 ring-blue-500/10 transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 mr-2 italic">מגבלת משקל (ק"ג)</label>
                    <div className="relative">
                       <input 
                         type="number"
                         value={editingClient.truck_limit_kg}
                         onChange={e => setEditingClient({...editingClient, truck_limit_kg: parseInt(e.target.value)})}
                         className="w-full bg-white border border-slate-200 p-5 rounded-2xl font-black italic outline-none focus:ring-4 ring-blue-500/10 transition-all" 
                       />
                       <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-300 italic text-xs uppercase">KG</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button type="submit" className="w-full bg-blue-600 text-white py-6 rounded-[30px] font-black text-xl flex items-center justify-center gap-4 shadow-2xl hover:bg-blue-700 active:scale-95 transition-all border-b-8 border-blue-800 uppercase tracking-widest italic">
                    <ShieldCheck size={28} /> שמור נתוני זהב
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <footer className="py-10 border-t border-slate-200 opacity-30">
         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center">Elite VIP Customer Management OS</p>
      </footer>
    </motion.div>
  );
}
