"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Users, Plus, Phone, MapPin, Scale, ChevronRight, 
  Search, Star, MessageCircle, MoreVertical, Trash2, Edit3, 
  History, UserPlus, ShieldCheck, AlertCircle, Printer,
  Share2, BarChart3, Package, X, Menu, ExternalLink,
  ChevronDown, Filter, Zap, User, Sparkles // ייבוא קריטי למניעת ReferenceError
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban Admin Pro - VIP Management Elite V52.2
 * -------------------------------------------
 * - Fix: Robust icon imports (User, Sparkles) to solve build errors.
 * - UI: Stitched Elite Design with Hamburger-style expansion.
 * - Features: Purchase Analytics (DNA), Magic Link Sharing, PDF/Order History.
 */

export default function VipManagement() {
  const [clients, setClients] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ id: '', full_name: '', nickname: '', main_project: '', phone: '', truck_limit_kg: 12000 });

  // 1. סנכרון DNA - שליפת פרופילים והיסטוריית רכישות
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [profilesRes, historyRes] = await Promise.all([
        supabase.from('vip_profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('vip_customer_history').select('*')
      ]);

      if (profilesRes.error) throw profilesRes.error;
      setClients(profilesRes.data || []);
      setHistory(historyRes.data || []);
    } catch (err: any) {
      toast.error("שגיאה בסנכרון DNA: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, []);

  // 2. מנוע אנליטיקה - דירוג מוצרים פופולריים לכל לקוח
  const getCustomerStats = (customerId: string) => {
    const clientItems = history.filter(h => h.customer_id === customerId);
    const counts: any = {};
    clientItems.forEach(item => {
      const name = item.product_name || "מוצר כללי";
      counts[name] = (counts[name] || 0) + Number(item.quantity || 1);
    });
    return Object.entries(counts)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5);
  };

  // 3. הזרקת לקוח חדש
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.id || !newClient.full_name) return toast.error("חובה למלא מזהה ושם");
    
    const { error } = await supabase.from('vip_profiles').upsert(newClient);
    if (!error) {
      toast.success(`פרופיל ${newClient.nickname || newClient.full_name} הוזרק למוח! 🦾`);
      setIsModalOpen(false);
      setNewClient({ id: '', full_name: '', nickname: '', main_project: '', phone: '', truck_limit_kg: 12000 });
      fetchAllData();
    } else {
      toast.error("שגיאה בהזרקת נתונים");
    }
  };

  // 4. שיתוף לינק קסם
  const shareTrackingLink = (clientId: string, name: string) => {
    const link = `https://ai-saban94-chat.vercel.app/chat-vip/${clientId}`;
    const text = encodeURIComponent(`אהלן ${name} אחי, זה הלינק האישי שלך לביצוע הזמנות ומעקב משלוחים ב-Saban OS 🦾:\n${link}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const filteredClients = clients.filter(c => 
    (c.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.id || "").includes(searchTerm) ||
    (c.nickname || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors theme="dark" />

      {/* Header - Stitched Pro Style */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[45px] border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-full bg-blue-600/5 -skew-x-12 translate-x-10 group-hover:translate-x-5 transition-transform duration-1000" />
        <div className="flex items-center gap-6 relative z-10">
           <div className="w-16 h-16 bg-slate-950 text-blue-500 rounded-[28px] flex items-center justify-center shadow-2xl ring-4 ring-slate-50">
              <Users size={32} />
           </div>
           <div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">ניהול לקוחות VIP</h1>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.3em] flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> DNA Neural Database
              </p>
           </div>
        </div>
        
        <div className="flex gap-4 w-full lg:w-auto relative z-10">
           <div className="relative flex-1 lg:w-96 group">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                placeholder="חפש קבלן, פרויקט או מזהה..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border-none pr-14 pl-6 py-5 rounded-[25px] font-black outline-none focus:ring-4 ring-blue-500/10 transition-all shadow-inner text-slate-700" 
              />
           </div>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="bg-blue-600 text-white px-10 py-5 rounded-[25px] font-black shadow-xl flex items-center gap-3 hover:bg-blue-700 active:scale-95 transition-all border-b-4 border-blue-800 uppercase italic text-xs tracking-widest shrink-0"
           >
              <UserPlus size={20}/> לקוח חדש
           </button>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredClients.map((client) => {
            const isExpanded = expandedId === client.id;
            const topProducts = getCustomerStats(client.id);

            return (
              <motion.div 
                layout
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-[50px] border border-slate-100 shadow-sm overflow-hidden transition-all duration-500 ${isExpanded ? 'ring-[12px] ring-blue-50 shadow-2xl' : 'hover:shadow-lg'}`}
              >
                {/* Main Card View */}
                <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10">
                   <div className="flex items-center gap-10 flex-1">
                      <div className="relative shrink-0">
                         <div className="w-28 h-28 bg-slate-900 rounded-[40px] flex items-center justify-center text-white shadow-2xl border-4 border-white ring-8 ring-slate-50 transition-transform group-hover:scale-110">
                            <User size={48} />
                         </div>
                         <div className="absolute -top-3 -right-3 bg-amber-400 text-white p-2.5 rounded-2xl shadow-lg border-4 border-white animate-bounce">
                            <Star size={16} fill="white"/>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="flex items-center gap-3 mb-3">
                            <span className="bg-blue-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">ID: {client.id}</span>
                            <span className="bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1 border border-emerald-100"><ShieldCheck size={12}/> DNA Verified</span>
                         </div>
                         <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none mb-4">{client.full_name}</h3>
                         <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 italic border border-slate-100">
                               <MapPin size={16} className="text-blue-500" /> {client.main_project}
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 italic border border-slate-100">
                               <Phone size={16} className="text-blue-500" /> {client.phone}
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="flex items-center gap-4 shrink-0">
                      <button 
                        onClick={() => shareTrackingLink(client.id, client.nickname || client.full_name)}
                        className="w-16 h-16 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100 shadow-sm"
                        title="שתף לינק קסם"
                      >
                         <Share2 size={28} />
                      </button>
                      <button 
                        onClick={() => setExpandedId(isExpanded ? null : client.id)}
                        className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all shadow-xl active:scale-90 ${isExpanded ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-950 text-white hover:bg-blue-600'}`}
                      >
                         {isExpanded ? <X size={32}/> : <Menu size={32} />}
                      </button>
                   </div>
                </div>

                {/* Expanded Content (The Hamburger Menu Drawer) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t-4 border-slate-50 bg-[#FBFCFD] overflow-hidden"
                    >
                       <div className="p-10 md:p-14 grid grid-cols-1 lg:grid-cols-2 gap-12">
                          
                          {/* Analytics Module */}
                          <div className="bg-white rounded-[45px] p-10 shadow-sm border border-slate-100">
                             <div className="flex justify-between items-center mb-10">
                                <h4 className="font-black text-slate-900 flex items-center gap-4 italic uppercase text-lg">
                                   <BarChart3 size={24} className="text-blue-600" /> דירוג צריכת DNA
                                </h4>
                                <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic">Live Analytics</div>
                             </div>
                             <div className="space-y-5">
                                {topProducts.length > 0 ? topProducts.map(([name, qty]: any, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 rounded-[28px] border border-transparent hover:border-blue-100 transition-all group">
                                     <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center font-black text-blue-600 text-xl italic border border-slate-100">#{idx+1}</div>
                                        <p className="font-black text-slate-800 text-lg">{name}</p>
                                     </div>
                                     <div className="bg-slate-900 text-white px-5 py-2 rounded-2xl font-black text-sm italic shadow-lg border-b-4 border-slate-700">
                                        {qty} <span className="text-[10px] opacity-50 uppercase mr-1">יח'</span>
                                     </div>
                                  </div>
                                )) : <div className="py-20 text-center opacity-30 italic font-bold">טרם נצברו נתוני רכישה</div>}
                             </div>
                          </div>

                          {/* History Module */}
                          <div className="bg-white rounded-[45px] p-10 shadow-sm border border-slate-100 flex flex-col">
                             <div className="flex justify-between items-center mb-10">
                                <h4 className="font-black text-slate-900 flex items-center gap-4 italic uppercase text
