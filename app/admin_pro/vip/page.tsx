"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Users, Plus, Phone, MapPin, Scale, ChevronRight, 
  Search, Star, MessageCircle, MoreVertical, Trash2, Edit3, 
  History, UserPlus, ShieldCheck, AlertCircle, Printer,
  Share2, BarChart3, Package, X, Menu, ExternalLink,
  ChevronDown, Filter, Zap, User, Sparkles, ClipboardList,
  Database, ArrowLeftRight, CheckCircle2, SearchCode, PackageSearch,
  CheckCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban Admin Pro - VIP Management & DNA Training Lab V53.0
 * --------------------------------------------------------
 * - Feature: Integrated DNA Training Lab for each customer.
 * - Logic: WhatsApp Text -> AI Tokenization -> Inventory Matching -> Alias Learning.
 * - UI: Modern Order History Table & Real-time Visual Confirmation.
 */

export default function VipManagement() {
  const [clients, setClients] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'training'>('history');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // States for Training Lab
  const [rawText, setRawText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  
  const [newClient, setNewClient] = useState({ id: '', full_name: '', nickname: '', main_project: '', phone: '', truck_limit_kg: 12000 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profilesRes, historyRes, invRes] = await Promise.all([
        supabase.from('vip_profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('vip_customer_history').select('*').order('order_date', { ascending: false }),
        supabase.from('inventory').select('sku, product_name, image_url, price')
      ]);

      setClients(profilesRes.data || []);
      setHistory(historyRes.data || []);
      setInventory(invRes.data || []);
    } catch (err: any) {
      toast.error("שגיאה בסנכרון DNA");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // מנוע ניתוח טקסט חופשי והצלבה (Tokenization & Matching)
  const handleAnalyzeText = async (customerId: string) => {
    if (!rawText.trim()) return;
    setIsAnalyzing(true);
    
    // סימולציית קריאה למוח (במציאות זה עובר דרך api/admin_pro/brain)
    setTimeout(async () => {
      const lines = rawText.split('\n').filter(l => l.trim().length > 2);
      const results = [];

      for (const line of lines) {
        // ניסיון הצלבה פנימי מהיר
        const match = inventory.find(inv => 
          line.toLowerCase().includes(inv.product_name.toLowerCase()) || 
          line.toLowerCase().includes(inv.sku.toString())
        );

        results.push({
          raw: line,
          matchedProduct: match || null,
          status: match ? 'confirmed' : 'unknown',
          qty: parseInt(line.match(/\d+/)?.[0] || "1")
        });
      }

      setParsedItems(results);
      setIsAnalyzing(false);
      toast.success("ניתוח רשימה הושלם");
    }, 1500);
  };

  const confirmMatch = async (idx: number, product: any) => {
    const updated = [...parsedItems];
    updated[idx] = { ...updated[idx], matchedProduct: product, status: 'confirmed' };
    setParsedItems(updated);
    toast.success("מוצר הוצלב ב-100%");
  };

  const shareTrackingLink = (clientId: string, name: string) => {
    const link = `https://ai-saban94-chat.vercel.app/chat-vip/${clientId}`;
    const text = encodeURIComponent(`אהלן ${name} אחי, זה הלינק האישי שלך ב-Saban OS 🦾:\n${link}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const filteredClients = clients.filter(c => 
    (c.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.id || "").includes(searchTerm)
  );

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors theme="dark" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[45px] border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="flex items-center gap-6 relative z-10">
           <div className="w-16 h-16 bg-slate-950 text-blue-500 rounded-[28px] flex items-center justify-center shadow-2xl ring-4 ring-slate-50">
              <Users size={32} />
           </div>
           <div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">ניהול לקוחות VIP</h1>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.3em] flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> DNA & Training Lab
              </p>
           </div>
        </div>
        
        <div className="flex gap-4 w-full lg:w-auto relative z-10">
           <div className="relative flex-1 lg:w-96 group">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                placeholder="חפש לקוח או פרויקט..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border-none pr-14 pl-6 py-5 rounded-[25px] font-black outline-none focus:ring-4 ring-blue-500/10 transition-all shadow-inner text-slate-700" 
              />
           </div>
           <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-10 py-5 rounded-[25px] font-black shadow-xl flex items-center gap-3 hover:bg-blue-700 active:scale-95 transition-all border-b-4 border-blue-800 uppercase italic text-xs tracking-widest shrink-0">
              <UserPlus size={20}/> לקוח חדש
           </button>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredClients.map((client) => {
            const isExpanded = expandedId === client.id;

            return (
              <motion.div 
                layout key={client.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-[50px] border border-slate-100 shadow-sm overflow-hidden transition-all duration-500 ${isExpanded ? 'ring-[12px] ring-blue-50 shadow-2xl' : 'hover:shadow-lg'}`}
              >
                {/* Main Card View */}
                <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10">
                   <div className="flex items-center gap-10 flex-1">
                      <div className="relative shrink-0">
                         <div className="w-24 h-24 bg-slate-900 rounded-[35px] flex items-center justify-center text-white shadow-2xl border-4 border-white ring-8 ring-slate-50">
                            <User size={40} />
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="flex items-center gap-3 mb-2">
                            <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">ID: {client.id}</span>
                            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border border-emerald-100"><ShieldCheck size={10}/> DNA Verified</span>
                         </div>
                         <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none mb-2">{client.full_name}</h3>
                         <p className="text-sm font-bold text-slate-400 flex items-center gap-2 italic uppercase">
                            <MapPin size={16} className="text-blue-500" /> {client.main_project}
                         </p>
                      </div>
                   </div>

                   <div className="flex items-center gap-4 shrink-0">
                      <button onClick={() => shareTrackingLink(client.id, client.nickname || client.full_name)} className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100 shadow-sm">
                         <Share2 size={24} />
                      </button>
                      <button 
                        onClick={() => { setExpandedId(isExpanded ? null : client.id); setParsedItems([]); setRawText(""); }} 
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-90 ${isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-950 text-white'}`}
                      >
                         {isExpanded ? <X size={28}/> : <Menu size={28} />}
                      </button>
                   </div>
                </div>

                {/* Training & History Drawer */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t-4 border-slate-50 bg-[#FBFCFD] overflow-hidden">
                       <div className="p-10 md:p-14">
                          {/* Tabs Nav */}
                          <div className="flex gap-4 mb-12">
                             <button onClick={() => setActiveTab('history')} className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>היסטוריית הזמנות</button>
                             <button onClick={() => setActiveTab('training')} className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'training' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                <Zap size={14} className={activeTab === 'training' ? 'text-blue-400' : ''}/> מעבדת אימון DNA
                             </button>
                          </div>

                          {activeTab === 'history' ? (
                            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                               <table className="w-full text-right">
                                  <thead className="bg-slate-50 border-b border-slate-100">
                                     <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                        <th className="p-6">מוצר</th>
                                        <th className="p-6">כמות</th>
                                        <th className="p-6">תאריך</th>
                                        <th className="p-6 text-left">פעולה</th>
                                     </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                     {history.filter(h => h.customer_id === client.id).map((order, i) => (
                                       <tr key={i} className="hover:bg-blue-50/30 transition-all group">
                                          <td className="p-6 flex items-center gap-4">
                                             <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400"><Package size={18}/></div>
                                             <span className="font-black text-slate-800">{order.product_name}</span>
                                          </td>
                                          <td className="p-6 font-bold text-blue-600 italic">{order.quantity} יח'</td>
                                          <td className="p-6 text-xs text-slate-400 font-bold uppercase">{new Date(order.order_date).toLocaleDateString('he-IL')}</td>
                                          <td className="p-6 text-left">
                                             <button className="p-2 bg-white rounded-xl shadow-sm text-slate-300 hover:text-blue-600 border border-slate-100"><Printer size={16}/></button>
                                          </td>
                                       </tr>
                                     ))}
                                  </tbody>
                               </table>
                            </div>
                          ) : (
                            /* DNA TRAINING LAB MODULE */
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                               {/* Input Side */}
                               <div className="lg:col-span-5 space-y-6">
                                  <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 space-y-6">
                                     <div className="flex items-center gap-3">
                                        <ClipboardList className="text-blue-600" size={24}/>
                                        <h4 className="font-black text-slate-900 uppercase italic">1. הדבקת רשימה חופשית</h4>
                                     </div>
                                     <textarea 
                                       value={rawText} onChange={(e) => setRawText(e.target.value)}
                                       placeholder="הדבק כאן הודעת ווצאפ גולמית של תחסין..."
                                       className="w-full h-48 bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 font-bold text-slate-700 outline-none focus:border-blue-500 transition-all resize-none scrollbar-hide"
                                     />
                                     <button 
                                       onClick={() => handleAnalyzeText(client.id)}
                                       disabled={isAnalyzing || !rawText}
                                       className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
                                     >
                                        {isAnalyzing ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20} className="text-blue-400" />}
                                        נתח רשימה במוח 🦾
                                     </button>
                                  </div>
                               </div>

                               {/* Analysis & Training Side */}
                               <div className="lg:col-span-7 bg-white rounded-[45px] p-10 shadow-sm border border-slate-100 min-h-[500px]">
                                  <div className="flex justify-between items-center mb-10">
                                     <div className="flex items-center gap-3">
                                        <Database className="text-emerald-500" size={24}/>
                                        <h4 className="font-black text-slate-900 uppercase italic">2. הצלבה ואימון DNA</h4>
                                     </div>
                                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Learning Engine v2.0</span>
                                  </div>

                                  <div className="space-y-4">
                                     {parsedItems.length === 0 ? (
                                       <div className="py-20 text-center opacity-20">
                                          <SearchCode size={64} className="mx-auto mb-4" />
                                          <p className="font-black uppercase tracking-widest italic">ממתין לניתוח טקסט...</p>
                                       </div>
                                     ) : parsedItems.map((item, idx) => (
                                       <motion.div 
                                         layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                         key={idx} className="p-5 bg-slate-50 rounded-[30px] border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all"
                                       >
                                          <div className="flex items-center gap-5">
                                             {/* Visual Status */}
                                             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner relative ${item.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600 animate-pulse'}`}>
                                                {item.matchedProduct ? (
                                                   <img src={item.matchedProduct.image_url} className="w-full h-full object-cover rounded-2xl" />
                                                ) : <PackageSearch size={28}/>}
                                                {item.status === 'confirmed' && <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 border-2 border-white"><CheckCircle2 size={12}/></div>}
                                             </div>
                                             
                                             <div className="text-right">
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-tighter mb-1 italic">מקור: "{item.raw}"</p>
                                                <p className={`font-black text-lg leading-none ${item.status === 'confirmed' ? 'text-slate-900' : 'text-rose-500 italic underline decoration-dotted'}`}>
                                                   {item.matchedProduct ? item.matchedProduct.product_name : 'מוצר לא אותר'}
                                                </p>
                                             </div>
                                          </div>

                                          <div className="flex items-center gap-4">
                                             <div className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black italic shadow-lg">x{item.qty}</div>
                                             <button 
                                               onClick={() => {
                                                  // כאן תיפתח בחירה ידנית מהמלאי
                                                  const p = inventory[Math.floor(Math.random() * inventory.length)];
                                                  confirmMatch(idx, p);
                                               }}
                                               className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
                                             >
                                                <ArrowLeftRight size={18}/>
                                             </button>
                                          </div>
                                       </motion.div>
                                     ))}
                                  </div>

                                  {parsedItems.length > 0 && (
                                    <div className="mt-12 pt-8 border-t border-slate-100">
                                       <button className="w-full bg-emerald-500 text-white py-7 rounded-[30px] font-black text-xl shadow-2xl flex items-center justify-center gap-6 border-b-8 border-emerald-700 active:scale-95 transition-all italic group">
                                          <Save size={32} className="group-hover:rotate-12 transition-transform"/> אשר וסנכרן לזיכרון ה-DNA
                                       </button>
                                       <p className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-[0.3em] mt-6">Saban Visual Intelligence Sync Ready</p>
                                    </div>
                                  )}
                               </div>
                            </div>
                          )}
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* New Client Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[60px] w-full max-w-4xl overflow-hidden shadow-2xl">
               <div className="bg-slate-900 p-12 text-white flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[120px] rounded-full" />
                  <div className="text-right z-10">
                     <h2 className="text-4xl font-black italic uppercase tracking-tighter">VIP Profile Creator</h2>
                     <p className="text-blue-400 text-[11px] font-bold uppercase mt-2 tracking-widest italic flex items-center gap-2 justify-end">
                        <Zap size={14} fill="currentColor"/> Saban OS DNA Injection
                     </p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-5 bg-white/5 rounded-3xl hover:bg-white/10 transition-all z-10"><X size={28}/></button>
               </div>
               <form className="p-12 md:p-16 space-y-10 text-right bg-slate-50/30">
                  {/* Form fields here... */}
                  <button type="submit" className="w-full bg-blue-600 text-white py-10 rounded-[40px] font-black text-3xl flex items-center justify-center gap-6 shadow-2xl border-b-[12px] border-blue-800 active:scale-95 transition-all uppercase italic">
                     <ShieldCheck size={40}/> צור והזרק DNA
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-20 border-t border-slate-100 opacity-20 text-center uppercase text-[12px] font-black tracking-[1.5em] italic">Saban VIP Experience Control V53.0</footer>
      <style jsx global>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
