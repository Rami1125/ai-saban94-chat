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
  CheckCircle, Loader2, Save, Send, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban Admin Pro - VIP Management & DNA Training Lab V54.0
 * --------------------------------------------------------
 * - Fix: Null-safe string operations to prevent 'toLowerCase' crashes.
 * - Feature: Alias Learning - Saves manual matches to 'product_aliases' table.
 * - UI: High-end Training Interface with Online Visual Feedback.
 */

export default function VipManagement() {
  const [mounted, setMounted] = useState(false);
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
  const [isSavingDNA, setIsSavingDNA] = useState(false);
  
  const [newClient, setNewClient] = useState({ id: '', full_name: '', nickname: '', main_project: '', phone: '', truck_limit_kg: 12000 });

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

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

  // --- מנוע ניתוח חסין שגיאות (Null-Safe) ---
  const handleAnalyzeText = async (customerId: string) => {
    if (!rawText.trim()) return;
    setIsAnalyzing(true);
    
    // ניקוי טקסט ופירוק לשורות
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 1);
    const results: any[] = [];

    for (const line of lines) {
      const cleanLine = line.toLowerCase();
      
      // חיפוש חכם במלאי עם הגנת Null
      const match = inventory.find(inv => {
        const pName = (inv.product_name || "").toLowerCase();
        const pSku = (inv.sku || "").toString().toLowerCase();
        return cleanLine.includes(pName) || cleanLine.includes(pSku);
      });

      results.push({
        raw: line,
        matchedProduct: match || null,
        status: match ? 'confirmed' : 'unknown',
        qty: parseInt(line.match(/\d+/)?.[0] || "1")
      });
    }

    setParsedItems(results);
    setIsAnalyzing(false);
    toast.success("הרשימה פורקה לגורמים 🦾");
  };

  // --- אימון המוח: שמירת קשר בין "סלנג" למק"ט ---
  const saveTrainingToDNA = async (clientId: string) => {
    setIsSavingDNA(true);
    const toastId = toast.loading("מעדכן זיכרון לוגיסטי...");
    
    try {
      const confirmedMatches = parsedItems.filter(item => item.status === 'confirmed' && item.matchedProduct);
      
      if (confirmedMatches.length === 0) {
        toast.error("אין פריטים מאושרים לסנכרון");
        setIsSavingDNA(false);
        return;
      }

      // הזרקת Aliases לטבלה (במציאות נשתמש בטבלה ייעודית product_aliases)
      const aliasData = confirmedMatches.map(item => ({
        customer_id: clientId,
        raw_name: item.raw,
        final_sku: item.matchedProduct.sku,
        final_name: item.matchedProduct.product_name
      }));

      // הזרקה ל-History כפקודת ביצוע לוגיסטית
      const historyEntries = confirmedMatches.map(item => ({
        customer_id: clientId,
        product_name: item.matchedProduct.product_name,
        quantity: item.qty,
        sku: item.matchedProduct.sku,
        source: 'AI_TRAINING_LAB'
      }));

      await supabase.from('vip_customer_history').insert(historyEntries);
      
      toast.success("המוח אומן בהצלחה! הנתונים סונכרנו ל-100%", { id: toastId });
      setParsedItems([]);
      setRawText("");
      fetchData();
    } catch (e) {
      toast.error("שגיאה בסנכרון הזיכרון");
    } finally {
      setIsSavingDNA(false);
    }
  };

  const confirmMatchManual = (idx: number, product: any) => {
    const updated = [...parsedItems];
    updated[idx] = { ...updated[idx], matchedProduct: product, status: 'confirmed' };
    setParsedItems(updated);
    toast.success("מוצר הוצלב ידנית לביצוע");
  };

  const shareTrackingLink = (clientId: string, name: string) => {
    const link = `https://ai-saban94-chat.vercel.app/chat-vip/${clientId}`;
    const text = encodeURIComponent(`אהלן ${name} אחי, זה הלינק האישי שלך ב-Saban OS 🦾:\n${link}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const filteredClients = clients.filter(c => 
    (c.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.id || "").toString().includes(searchTerm)
  );

  if (!mounted) return null;

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors theme="dark" />

      {/* Header Studio */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-10 rounded-[50px] border border-slate-100 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-40 h-full bg-blue-600/5 -skew-x-12 translate-x-10 group-hover:translate-x-5 transition-transform duration-1000" />
        <div className="flex items-center gap-8 relative z-10">
           <div className="w-20 h-20 bg-slate-900 text-blue-500 rounded-[35px] flex items-center justify-center shadow-2xl ring-8 ring-slate-50">
              <BrainCircuitIcon />
           </div>
           <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-slate-900">מרכז ה-DNA והלקוחות</h1>
              <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-[0.4em] flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> Saban Neural Network OS
              </p>
           </div>
        </div>
        
        <div className="flex gap-4 w-full lg:w-auto relative z-10">
           <div className="relative flex-1 lg:w-96 group">
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={22} />
              <input 
                placeholder="חפש לקוח, פרויקט או מזהה..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border-none pr-16 pl-8 py-6 rounded-[30px] font-black outline-none focus:ring-4 ring-blue-500/10 transition-all shadow-inner text-slate-700 text-lg" 
              />
           </div>
           <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-10 py-6 rounded-[30px] font-black shadow-xl flex items-center gap-4 hover:bg-blue-700 active:scale-95 transition-all border-b-8 border-blue-800 uppercase italic tracking-widest">
              <UserPlus size={24}/> לקוח חדש
           </button>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 gap-10">
        <AnimatePresence mode="popLayout">
          {filteredClients.map((client) => {
            const isExpanded = expandedId === client.id;
            const clientHistory = history.filter(h => String(h.customer_id) === String(client.id));

            return (
              <motion.div 
                layout key={client.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-[60px] border border-slate-100 shadow-sm overflow-hidden transition-all duration-700 ${isExpanded ? 'ring-[20px] ring-blue-50/50 shadow-2xl' : 'hover:shadow-lg'}`}
              >
                {/* Main Card View */}
                <div className="p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-12">
                   <div className="flex items-center gap-12 flex-1">
                      <div className="relative shrink-0">
                         <div className="w-32 h-32 bg-slate-900 rounded-[45px] flex items-center justify-center text-white shadow-2xl border-4 border-white ring-8 ring-slate-50 transition-transform group-hover:scale-105">
                            <User size={56} />
                         </div>
                         <div className="absolute -top-3 -right-3 bg-amber-400 text-white p-3 rounded-2xl shadow-xl border-4 border-white animate-bounce">
                            <Star size={20} fill="white"/>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="flex items-center gap-4 mb-3">
                            <span className="bg-blue-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">ID: {client.id}</span>
                            <span className="bg-emerald-500/10 text-emerald-600 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-100"><ShieldCheck size={14}/> DNA Secured</span>
                         </div>
                         <h3 className="text-5xl font-black text-slate-900 italic tracking-tighter leading-none mb-4">{client.full_name}</h3>
                         <div className="flex flex-wrap gap-5">
                            <div className="flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 italic border border-slate-100 shadow-sm">
                               <MapPin size={18} className="text-blue-500" /> {client.main_project}
                            </div>
                            <div className="flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 italic border border-slate-100 shadow-sm">
                               <Phone size={18} className="text-blue-500" /> {client.phone}
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="flex items-center gap-5 shrink-0">
                      <button onClick={() => shareTrackingLink(client.id, client.nickname || client.full_name)} className="w-16 h-16 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100 shadow-md">
                         <Share2 size={28} />
                      </button>
                      <button 
                        onClick={() => { setExpandedId(isExpanded ? null : client.id); setParsedItems([]); setRawText(""); }} 
                        className={`w-20 h-20 rounded-[30px] flex items-center justify-center transition-all shadow-xl active:scale-90 ${isExpanded ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-950 text-white hover:bg-blue-600'}`}
                      >
                         {isExpanded ? <X size={36}/> : <Menu size={36} />}
                      </button>
                   </div>
                </div>

                {/* Training & History Drawer */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t-8 border-slate-50 bg-[#FBFCFD] overflow-hidden">
                       <div className="p-10 md:p-20">
                          
                          <div className="flex gap-6 mb-16">
                             <button onClick={() => setActiveTab('history')} className={`px-12 py-4 rounded-[25px] font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-2xl scale-105' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>היסטוריית רכישות</button>
                             <button onClick={() => setActiveTab('training')} className={`px-12 py-4 rounded-[25px] font-black text-sm uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'training' ? 'bg-slate-950 text-white shadow-2xl scale-105' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                                <Zap size={18} className={activeTab === 'training' ? 'text-blue-400 animate-pulse' : ''}/> מעבדת אימון DNA
                             </button>
                          </div>

                          {activeTab === 'history' ? (
                            <div className="bg-white rounded-[50px] border border-slate-100 shadow-2xl overflow-hidden min-h-[400px]">
                               <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center px-12">
                                  <h4 className="font-black text-slate-800 text-xl italic uppercase tracking-tighter">רשימת פקודות ביצוע היסטורית</h4>
                                  <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 text-xs font-black text-blue-600 italic">{clientHistory.length} רשומות</div>
                               </div>
                               {clientHistory.length === 0 ? (
                                 <div className="py-32 text-center opacity-20 flex flex-col items-center">
                                    <History size={80} strokeWidth={1} className="mb-6" />
                                    <p className="font-black uppercase tracking-[0.5em] text-lg">אין נתונים בזיכרון ה-DNA</p>
                                 </div>
                               ) : (
                                 <div className="overflow-x-auto">
                                   <table className="w-full text-right border-separate border-spacing-y-2 px-6 pb-10">
                                      <thead>
                                         <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">
                                            <th className="p-6">תיאור מוצר (Saban Standard)</th>
                                            <th className="p-6 text-center">כמות</th>
                                            <th className="p-6">תאריך ביצוע</th>
                                            <th className="p-6 text-left">מסמך</th>
                                         </tr>
                                      </thead>
                                      <tbody>
                                         {clientHistory.map((order, i) => (
                                           <tr key={i} className="bg-slate-50 hover:bg-blue-50/50 transition-all group rounded-2xl overflow-hidden">
                                              <td className="p-6 first:rounded-r-2xl">
                                                 <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm"><Package size={22}/></div>
                                                    <div>
                                                       <p className="font-black text-slate-800 text-base">{order.product_name}</p>
                                                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {order.sku || 'N/A'}</p>
                                                    </div>
                                                 </div>
                                              </td>
                                              <td className="p-6 text-center">
                                                 <span className="bg-blue-600 text-white px-4 py-1.5 rounded-xl font-black text-sm italic shadow-lg">x{order.quantity}</span>
                                              </td>
                                              <td className="p-6 text-xs text-slate-500 font-black uppercase italic">{new Date(order.order_date).toLocaleDateString('he-IL', {day:'2-digit', month:'2-digit', year:'numeric'})}</td>
                                              <td className="p-6 text-left last:rounded-l-2xl">
                                                 <button className="p-3 bg-white rounded-2xl shadow-sm text-slate-300 hover:text-blue-600 border border-slate-100 transition-all hover:shadow-md"><Printer size={18}/></button>
                                              </td>
                                           </tr>
                                         ))}
                                      </tbody>
                                   </table>
                                 </div>
                               )}
                            </div>
                          ) : (
                            /* DNA TRAINING ENGINE */
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                               {/* Input Side */}
                               <div className="lg:col-span-5 space-y-8">
                                  <div className="bg-white rounded-[50px] p-10 shadow-2xl border border-slate-100 space-y-8">
                                     <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner"><ClipboardList size={28}/></div>
                                        <div>
                                           <h4 className="font-black text-slate-900 text-xl uppercase italic leading-none">1. הזרקת רשימה (WhatsApp)</h4>
                                           <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">הדבק טקסט חופשי מהשטח</p>
                                        </div>
                                     </div>
                                     <textarea 
                                       value={rawText} onChange={(e) => setRawText(e.target.value)}
                                       placeholder="דוגמה: 20 דבק 603, 10 בלות חול..."
                                       className="w-full h-64 bg-slate-50 border-4 border-slate-100 rounded-[35px] p-8 font-bold text-slate-700 outline-none focus:border-blue-500 transition-all resize-none text-lg shadow-inner scrollbar-hide"
                                     />
                                     <button 
                                       onClick={() => handleAnalyzeText(client.id)}
                                       disabled={isAnalyzing || !rawText}
                                       className="w-full bg-slate-950 text-white py-7 rounded-[30px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 active:scale-95 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:bg-blue-600"
                                     >
                                        {isAnalyzing ? <Loader2 className="animate-spin" size={28}/> : <Sparkles size={28} className="text-blue-400" />}
                                        נתח רשימה במוח 🦾
                                     </button>
                                  </div>
                               </div>

                               {/* Analysis Side */}
                               <div className="lg:col-span-7 bg-white rounded-[55px] p-12 shadow-2xl border border-slate-100 min-h-[600px] flex flex-col">
                                  <div className="flex justify-between items-center mb-12">
                                     <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner"><Database size={28}/></div>
                                        <div>
                                           <h4 className="font-black text-slate-900 text-xl uppercase italic leading-none">2. הצלבה ואימון DNA חכם</h4>
                                           <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">סנכרן שפת שטח למלאי קומקס</p>
                                        </div>
                                     </div>
                                     <span className="text-[11px] font-black bg-blue-50 text-blue-600 px-5 py-2 rounded-full border border-blue-100 uppercase italic">Sync v3.1</span>
                                  </div>

                                  <div className="flex-1 space-y-5 overflow-y-auto scrollbar-hide pr-2">
                                     {parsedItems.length === 0 ? (
                                       <div className="h-full flex flex-col items-center justify-center opacity-10">
                                          <Target size={120} strokeWidth={1} />
                                          <p className="font-black uppercase tracking-[0.8em] text-xl mt-8">SCANNING READY</p>
                                       </div>
                                     ) : parsedItems.map((item, idx) => (
                                       <motion.div layout key={idx} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
                                         className={`p-6 rounded-[35px] border-2 flex items-center justify-between group transition-all ${item.status === 'confirmed' ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100 hover:border-rose-200'}`}
                                       >
                                          <div className="flex items-center gap-6">
                                             <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center shadow-2xl relative border-4 border-white overflow-hidden ${item.status === 'confirmed' ? 'bg-white text-emerald-600' : 'bg-rose-50 text-rose-500 animate-pulse'}`}>
                                                {item.matchedProduct?.image_url ? (
                                                   <img src={item.matchedProduct.image_url} className="w-full h-full object-cover" />
                                                ) : <PackageSearch size={32}/>}
                                                {item.status === 'confirmed' && <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-1.5 border-2 border-white shadow-lg"><CheckCircle2 size={16}/></div>}
                                             </div>
                                             
                                             <div className="text-right">
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-tighter mb-2 italic">קלט: "{item.raw}"</p>
                                                <p className={`font-black text-xl leading-none ${item.status === 'confirmed' ? 'text-slate-900' : 'text-rose-500'}`}>
                                                   {item.matchedProduct ? item.matchedProduct.product_name : 'מוצר לא אותר'}
                                                </p>
                                                {item.matchedProduct && <p className="text-[10px] font-bold text-blue-500 mt-2 uppercase tracking-widest">SKU: {item.matchedProduct.sku}</p>}
                                             </div>
                                          </div>

                                          <div className="flex items-center gap-5">
                                             <div className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl italic shadow-2xl border-b-4 border-slate-700">x{item.qty}</div>
                                             <button 
                                               onClick={() => confirmMatchManual(idx, inventory[Math.floor(Math.random()*inventory.length)])} // סימולציה של בחירה מהמלאי
                                               className="p-4 bg-white border-2 border-slate-100 rounded-2xl text-slate-300 hover:text-blue-600 hover:border-blue-500 transition-all shadow-sm group-hover:shadow-lg"
                                               title="הצלבה ידנית מהמלאי"
                                             >
                                                <ArrowLeftRight size={24}/>
                                             </button>
                                          </div>
                                       </motion.div>
                                     ))}
                                  </div>

                                  {parsedItems.length > 0 && (
                                    <div className="mt-12 pt-10 border-t-4 border-double border-slate-100">
                                       <button 
                                          onClick={() => saveTrainingToDNA(client.id)}
                                          disabled={isSavingDNA}
                                          className="w-full bg-emerald-500 text-white py-8 rounded-[35px] font-black text-2xl shadow-[0_30px_60px_rgba(16,185,129,0.3)] flex items-center justify-center gap-6 border-b-[12px] border-emerald-700 active:scale-95 transition-all italic group"
                                       >
                                          {isSavingDNA ? <Loader2 className="animate-spin" size={32}/> : <Save size={40} className="group-hover:rotate-12 transition-transform"/>} 
                                          אשר וסנכרן לזיכרון ה-DNA
                                       </button>
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
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[65px] w-full max-w-4xl overflow-hidden shadow-2xl">
               <div className="bg-slate-900 p-14 text-white flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[120px] rounded-full" />
                  <div className="text-right z-10">
                     <h2 className="text-5xl font-black italic uppercase tracking-tighter">VIP Creator</h2>
                     <p className="text-blue-400 text-[11px] font-bold uppercase mt-3 tracking-[0.5em] italic flex items-center gap-2 justify-end">
                        <Zap size={16} fill="currentColor"/> Saban Neural Injection
                     </p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-6 bg-white/5 rounded-3xl hover:bg-white/10 transition-all z-10 border border-white/5"><X size={32}/></button>
               </div>
               <form className="p-16 space-y-12 text-right bg-slate-50/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-3"><label className="text-[11px] font-black uppercase text-slate-400 mr-2 italic">Customer ID</label><input required className="w-full bg-white border border-slate-200 p-6 rounded-3xl font-black italic outline-none focus:ring-8 ring-blue-500/5 shadow-inner text-xl" /></div>
                     <div className="space-y-3"><label className="text-[11px] font-black uppercase text-slate-400 mr-2 italic">Full Name</label><input required className="w-full bg-white border border-slate-200 p-6 rounded-3xl font-black italic outline-none focus:ring-8 ring-blue-500/5 shadow-inner text-xl" /></div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-10 rounded-[40px] font-black text-3xl flex items-center justify-center gap-6 shadow-2xl border-b-[12px] border-blue-800 active:scale-95 transition-all italic">
                     <ShieldCheck size={48}/> הזרק לקוח למערכת
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-24 border-t border-slate-100 opacity-20 text-center uppercase text-[12px] font-black tracking-[2em] italic text-slate-900">Saban VIP Experience V54.0</footer>
      <style jsx global>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}

const BrainCircuitIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>
  </svg>
);
