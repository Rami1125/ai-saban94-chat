"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Users, Plus, Phone, MapPin, Scale, ChevronRight, 
  Search, Star, MessageCircle, MoreVertical, Trash2, Edit3, 
  History, UserPlus, ShieldCheck, AlertCircle, Printer,
  Share2, BarChart3, Package, X, Menu, ExternalLink,
  ChevronDown, Filter, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban Admin Pro - VIP Management Elite V52.0
 * -------------------------------------------
 * - Feature: Hamburger-style expansion for deep customer DNA.
 * - Components: Top Products Ranking, Order History, Magic Link Sharing.
 * - Design: Stitched Elite (Slate-950 / Emerald-500).
 */

export default function VipManagement() {
  const [clients, setClients] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ id: '', full_name: '', nickname: '', main_project: '', phone: '', truck_limit_kg: 12000 });

  // 1. טעינת נתונים (פרופילים + היסטוריה מלאה להצלבות)
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [profilesRes, historyRes] = await Promise.all([
        supabase.from('vip_profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('vip_customer_history').select('*')
      ]);

      setClients(profilesRes.data || []);
      setHistory(historyRes.data || []);
    } catch (err) {
      toast.error("שגיאה בסנכרון DNA");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, []);

  // 2. חישוב דירוג מוצרים (Top Products) לכל לקוח
  const getCustomerStats = (customerId: string) => {
    const clientItems = history.filter(h => h.customer_id === customerId);
    const counts: any = {};
    clientItems.forEach(item => {
      counts[item.product_name] = (counts[item.product_name] || 0) + Number(item.quantity);
    });
    return Object.entries(counts)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5); // 5 המוצרים המובילים
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('vip_profiles').upsert(newClient);
    if (!error) {
      toast.success(`פרופיל ${newClient.nickname} הוזרק למערכת! 🦾`);
      setIsModalOpen(false);
      fetchAllData();
    }
  };

  const shareTrackingLink = (clientId: string, name: string) => {
    const link = `https://ai-saban94-chat.vercel.app/chat-vip/${clientId}`;
    const text = encodeURIComponent(`אהלן ${name} אחי, זה הלינק האישי שלך לביצוע הזמנות ומעקב משלוחים ב-Saban OS 🦾:\n${link}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const filteredClients = clients.filter(c => 
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.id?.includes(searchTerm)
  );

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors theme="dark" />

      {/* Header & Global Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[45px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-slate-950 text-blue-500 rounded-[28px] flex items-center justify-center shadow-2xl">
              <Users size={32} />
           </div>
           <div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">ניהול לקוחות VIP</h1>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.3em]">Master Database & DNA Engine</p>
           </div>
        </div>
        
        <div className="flex gap-4 w-full lg:w-auto">
           <div className="relative flex-1 lg:w-96 group">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                placeholder="חפש לקוח או פרויקט..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border-none pr-14 pl-6 py-5 rounded-[25px] font-black outline-none focus:ring-4 ring-blue-500/10 transition-all shadow-inner" 
              />
           </div>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="bg-blue-600 text-white px-10 py-5 rounded-[25px] font-black shadow-xl flex items-center gap-3 hover:bg-blue-700 active:scale-95 transition-all border-b-4 border-blue-800 uppercase italic text-xs tracking-widest"
           >
              <UserPlus size={20}/> לקוח חדש
           </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-8">
        <AnimatePresence>
          {filteredClients.map((client) => {
            const isExpanded = expandedId === client.id;
            const topProducts = getCustomerStats(client.id);

            return (
              <motion.div 
                layout
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-[50px] border border-slate-100 shadow-sm overflow-hidden transition-all duration-500 ${isExpanded ? 'ring-4 ring-blue-500/10 shadow-2xl' : 'hover:shadow-lg'}`}
              >
                {/* Visible Part (The Card) */}
                <div className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                   <div className="flex items-center gap-8 flex-1">
                      <div className="relative">
                         <div className="w-24 h-24 bg-slate-900 rounded-[35px] flex items-center justify-center text-white shadow-2xl border-4 border-white ring-8 ring-slate-50 transition-transform group-hover:scale-110">
                            <User size={40} />
                         </div>
                         <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-2 rounded-xl shadow-lg border-2 border-white animate-bounce">
                            <Star size={14} fill="white"/>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="flex items-center gap-3 mb-2">
                            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">ID: {client.id}</span>
                            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1"><ShieldCheck size={10}/> DNA Verified</span>
                         </div>
                         <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none">{client.full_name}</h3>
                         <p className="text-sm font-bold text-slate-400 mt-2 flex items-center gap-2 italic uppercase">
                            <MapPin size={16} className="text-blue-500" /> {client.main_project}
                         </p>
                      </div>
                   </div>

                   <div className="flex items-center gap-4">
                      <button 
                        onClick={() => window.open(`tel:${client.phone}`)}
                        className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100"
                      >
                         <Phone size={24} />
                      </button>
                      <button 
                        onClick={() => shareTrackingLink(client.id, client.nickname || client.full_name)}
                        className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100"
                      >
                         <Share2 size={24} />
                      </button>
                      <button 
                        onClick={() => setExpandedId(isExpanded ? null : client.id)}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl ${isExpanded ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-950 text-white'}`}
                      >
                         {isExpanded ? <X size={24}/> : <Menu size={24} />}
                      </button>
                   </div>
                </div>

                {/* Expanded DNA Part (The Hamburger Menu Content) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-50 bg-[#FBFCFD] overflow-hidden"
                    >
                       <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
                          
                          {/* Top Products Module */}
                          <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
                             <div className="flex justify-between items-center mb-8">
                                <h4 className="font-black text-slate-800 flex items-center gap-3 italic uppercase text-sm">
                                   <BarChart3 size={20} className="text-blue-600" /> דירוג רכישות DNA
                                </h4>
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Analytics Mode</span>
                             </div>
                             <div className="space-y-4">
                                {topProducts.length > 0 ? topProducts.map(([name, qty]: any, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all group">
                                     <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center font-black text-blue-600 italic">#{idx+1}</div>
                                        <p className="font-black text-slate-800 text-sm">{name}</p>
                                     </div>
                                     <div className="bg-blue-600 text-white px-3 py-1 rounded-lg font-black text-xs shadow-md">
                                        {qty} יח'
                                     </div>
                                  </div>
                                )) : <p className="text-center py-10 italic text-slate-300">טרם נצברו נתוני רכישה</p>}
                             </div>
                          </div>

                          {/* Order History Module */}
                          <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 flex flex-col">
                             <div className="flex justify-between items-center mb-8">
                                <h4 className="font-black text-slate-800 flex items-center gap-3 italic uppercase text-sm">
                                   <History size={20} className="text-blue-600" /> היסטוריית פקודות ביצוע
                                </h4>
                                <button className="p-2 text-slate-300 hover:text-blue-600"><Filter size={18}/></button>
                             </div>
                             <div className="flex-1 space-y-3 max-h-[350px] overflow-y-auto scrollbar-hide">
                                {history.filter(h => h.customer_id === client.id).map((order, i) => (
                                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-blue-50 transition-all">
                                     <div className="text-right">
                                        <p className="font-black text-slate-800 text-xs">{order.product_name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase italic">{new Date(order.order_date).toLocaleDateString('he-IL')}</p>
                                     </div>
                                     <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button className="p-2 bg-white rounded-lg shadow-sm text-slate-400 hover:text-blue-600"><Printer size={14}/></button>
                                        <button onClick={() => window.open(`/chat-vip/${client.id}`, '_blank')} className="p-2 bg-white rounded-lg shadow-sm text-slate-400 hover:text-blue-600"><ExternalLink size={14}/></button>
                                     </div>
                                  </div>
                                ))}
                             </div>
                             <button className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-blue-600 transition-all">
                                <Plus size={16}/> הזרק פקודה ידנית
                             </button>
                          </div>

                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Create Client Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[55px] w-full max-w-3xl overflow-hidden shadow-2xl">
               <div className="bg-slate-900 p-10 text-white flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full" />
                  <div className="text-right z-10">
                     <h2 className="text-3xl font-black italic uppercase tracking-tighter">VIP Profile Creator</h2>
                     <p className="text-blue-400 text-[10px] font-bold uppercase mt-2 tracking-widest">Saban OS DNA Injection</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-4 bg-white/10 rounded-2xl z-10"><X /></button>
               </div>
               <form onSubmit={handleCreateClient} className="p-12 space-y-8 text-right bg-slate-50/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <input placeholder="מזהה לקוח (ID)" value={newClient.id} onChange={e => setNewClient({...newClient, id: e.target.value})} className="w-full bg-white border border-slate-200 p-5 rounded-2xl font-black italic outline-none focus:ring-4 ring-blue-500/10" />
                     <input placeholder="שם מלא" value={newClient.full_name} onChange={e => setNewClient({...newClient, full_name: e.target.value})} className="w-full bg-white border border-slate-200 p-5 rounded-2xl font-black italic outline-none focus:ring-4 ring-blue-500/10" />
                     <input placeholder="פרויקט פעיל" value={newClient.main_project} onChange={e => setNewClient({...newClient, main_project: e.target.value})} className="w-full bg-white border border-slate-200 p-5 rounded-2xl font-black italic outline-none focus:ring-4 ring-blue-500/10" />
                     <input placeholder="טלפון" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} className="w-full bg-white border border-slate-200 p-5 rounded-2xl font-black italic outline-none focus:ring-4 ring-blue-500/10" />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-8 rounded-[35px] font-black text-2xl flex items-center justify-center gap-6 shadow-2xl border-b-8 border-blue-800 uppercase italic">
                     <ShieldCheck size={32}/> צור פרופיל והזרק DNA
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-20 border-t border-slate-100 opacity-20 text-center uppercase text-[12px] font-black tracking-[1.5em]">Saban VIP Logic Center V52.0</footer>
      <style jsx global>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
