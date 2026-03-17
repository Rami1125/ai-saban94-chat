"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Zap, Sparkles, ClipboardList, Database, ArrowLeftRight, 
  CheckCircle2, SearchCode, PackageSearch, Save, Loader2, 
  Trash2, Edit3, Target, ShieldCheck, RefreshCw,
  Search, Package, Image as ImageIcon, Plus, X, 
  AlertCircle, Eye, HardDrive, MousePointer2, BrainCircuit,
  Tag, ChevronRight, CheckCircle, ListPlus, Smartphone, Layers,
  Layout, Monitor, Smartphone as MobileIcon, Gauge, Clock, Hammer,
  ShoppingCart, Info, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban OS V72.0 - DNA Neural Architect Studio
 * -------------------------------------------
 * - Fix: Null-safe inventory fetching to prevent 400 errors.
 * - Feature: Integrated Live VIP Simulator with real-time feedback.
 * - Precision: Word-by-word alignment for VIP orders (Bar Orenil / Tahsin).
 */

export default function DnaNeuralStudio() {
  const [mounted, setMounted] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'lab' | 'inventory'>('lab');
  
  // Matrix State
  const [inputRaw, setInputRaw] = useState(""); 
  const [outputRaw, setOutputRaw] = useState(""); 
  const [matrix, setMatrix] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Selector & Editor State
  const [selectingIdx, setSelectingIdx] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('inventory').select('*').order('product_name');
      if (error) throw error;
      setInventory(data || []);
    } catch (e: any) {
      toast.error("סנכרון מלאי נכשל - וודא SQL רץ");
    } finally {
      setLoading(false);
    }
  };

  const handleStartAnalysis = () => {
    if (!inputRaw) return toast.error("הזרק רשימה מהשטח לניתוח");
    setIsAnalyzing(true);

    setTimeout(() => {
      const slangLines = inputRaw.split('\n').map(l => l.trim().replace(/^\*?\s*/, '')).filter(l => l.length > 2);
      const comaxLines = outputRaw.split('\n').map(line => {
        const parts = line.split('\t');
        return {
          sku: parts[2]?.trim() || line.match(/\d{5,}/)?.[0],
          name: parts[1]?.trim() || line,
          qty: parts[0]?.trim() || "1"
        };
      }).filter(s => s.sku);

      const newMatrix = slangLines.map((line) => {
        const cleanLine = line.toLowerCase();
        const autoMatch = inventory.find(inv => {
          const kws = (inv.keywords || "").toLowerCase().split(',').map((k:string) => k.trim());
          return kws.some(k => k.length > 2 && cleanLine.includes(k)) || 
                 (inv.product_name && cleanLine.includes(inv.product_name.toLowerCase()));
        });
        const deliveryMatch = !autoMatch ? comaxLines.find(cl => cleanLine.includes(cl.name.toLowerCase().split(' ')[0])) : null;
        const finalProduct = autoMatch || inventory.find(inv => inv.sku === deliveryMatch?.sku);

        return {
          raw: line,
          product: finalProduct || null,
          status: finalProduct ? 'matched' : 'needs_training',
          qty: deliveryMatch?.qty || line.match(/\d+/)?.[0] || "1"
        };
      });

      setMatrix(newMatrix);
      setIsAnalyzing(false);
      toast.success("המטריצה הוקמה בהצלחה! 🦾");
    }, 800);
  };

  const handleUpdateItem = async () => {
    if (!editingItem?.sku) return;
    const toastId = toast.loading("מזריק DNA Elite...");
    try {
      const { error } = await supabase.from('inventory').upsert({
        ...editingItem,
        last_trained: new Date().toISOString()
      });
      if (error) throw error;
      toast.success("המוצר סונכרן לכל ערוצי השטח! 🦾", { id: toastId });
      setEditingItem(null);
      fetchData();
    } catch (e) { toast.error("שגיאה בעדכון"); }
  };

  const handleInjectDNA = async (idx: number, product: any) => {
    const item = matrix[idx];
    const cleanSlang = item.raw.replace(/[0-9*.\-]/g, '').trim();
    const toastId = toast.loading(`מאמן DNA...`);
    try {
      const existing = product.keywords || "";
      const updatedKeywords = Array.from(new Set([...existing.split(','), cleanSlang])).join(', ').replace(/^, /, '');
      await supabase.from('inventory').update({ keywords: updatedKeywords, search_tags: updatedKeywords }).eq('sku', product.sku);
      const newMatrix = [...matrix];
      newMatrix[idx] = { ...item, product, status: 'synced' };
      setMatrix(newMatrix);
      toast.success("אומן בהצלחה!", { id: toastId });
      fetchData();
    } catch (e) { toast.error("סנכרון נכשל"); }
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter(i => 
      (i.product_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.sku || "").toString().includes(searchTerm)
    );
  }, [inventory, searchTerm]);

  // רכיב טיפול בתמונות שבורות
  const ProductImage = ({ src, size = "md" }: { src: string, size?: "sm" | "md" | "lg" }) => {
    const [err, setErr] = useState(false);
    const s = size === "lg" ? "w-28 h-28" : size === "md" ? "w-20 h-20" : "w-12 h-12";
    if (!src || err) return (
      <div className={`${s} bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 border border-slate-200 shadow-inner`}>
        <Package size={size === "lg" ? 40 : 20} />
      </div>
    );
    return <img src={src} className={`${s} rounded-2xl object-cover shadow-md border-2 border-white`} onError={() => setErr(true)} />;
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors theme="dark" />

      <div className="max-w-[1750px] mx-auto space-y-10">
        
        {/* --- Header --- */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 bg-white p-10 rounded-[60px] border border-slate-100 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-full bg-blue-600/5 -skew-x-12 translate-x-16 group-hover:translate-x-8 transition-transform duration-1000" />
          <div className="flex items-center gap-10 relative z-10">
             <div className="w-24 h-24 bg-slate-950 text-blue-500 rounded-[40px] flex items-center justify-center shadow-2xl ring-8 ring-slate-50">
                <BrainCircuit size={48} />
             </div>
             <div>
                <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none text-slate-900">Neural DNA Matrix</h1>
                <p className="text-[11px] font-bold text-slate-400 mt-3 uppercase tracking-[0.5em] flex items-center gap-2 justify-end">
                  Precision Training v72.0 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                </p>
             </div>
          </div>
          <div className="flex items-center gap-6 relative z-10">
             <StatCard label="סה''כ במלאי" value={inventory.length} icon={<Package size={16}/>} />
             <StatCard label="מאומן DNA" value={inventory.filter(i => i.keywords).length} color="text-emerald-500" icon={<ShieldCheck size={16}/>} />
          </div>
        </div>

        {/* --- Tab Navigation --- */}
        <div className="flex gap-4 bg-white/50 p-2 rounded-[35px] w-fit border border-slate-100 shadow-sm">
           <button onClick={() => setActiveTab('lab')} className={`px-12 py-4 rounded-[28px] font-black text-sm uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'lab' ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-white'}`}>
              <Zap size={18} fill={activeTab === 'lab' ? 'currentColor' : 'none'}/> מעבדת הצלבות DNA
           </button>
           <button onClick={() => setActiveTab('inventory')} className={`px-12 py-4 rounded-[28px] font-black text-sm uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'inventory' ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-white'}`}>
              <Layers size={18}/> ניהול מלאי
           </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'lab' ? (
            <motion.div key="lab" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
               
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-[45px] p-10 shadow-lg border border-slate-100 space-y-6 text-right">
                     <div className="flex items-center gap-4 justify-end">
                        <h3 className="font-black text-slate-800 uppercase italic text-xl leading-none">1. הזרקת רשימה מהשטח</h3>
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner"><ClipboardList size={24}/></div>
                     </div>
                     <textarea value={inputRaw} onChange={(e) => setInputRaw(e.target.value)} placeholder='הדבק כאן הודעה מבר או מתחסין...' className="w-full h-64 bg-slate-50 border-4 border-slate-100 rounded-[35px] p-8 font-bold text-slate-700 outline-none focus:border-blue-500/20 transition-all text-xl shadow-inner resize-none scrollbar-hide text-right" />
                  </div>
                  <div className="bg-slate-950 rounded-[45px] p-10 shadow-2xl space-y-6 text-white relative">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[80px] rounded-full" />
                     <div className="flex items-center gap-4 relative z-10 justify-end">
                        <h3 className="font-black uppercase italic text-xl leading-none">2. הצלבת תעודת משלוח</h3>
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 shadow-inner"><Database size={24}/></div>
                     </div>
                     <textarea value={outputRaw} onChange={(e) => setOutputRaw(e.target.value)} placeholder="הדבק שורות מהקומקס לסנכרון אוטומטי..." className="w-full h-64 bg-white/5 border-4 border-white/10 rounded-[35px] p-8 font-bold text-blue-100 outline-none focus:border-emerald-500 transition-all text-xl shadow-inner resize-none scrollbar-hide relative z-10 text-right" />
                  </div>
               </div>

               <button onClick={handleStartAnalysis} disabled={isAnalyzing || !inputRaw} className="w-full bg-blue-600 text-white py-10 rounded-[45px] font-black text-3xl uppercase italic tracking-widest shadow-[0_30px_60px_rgba(37,99,235,0.3)] hover:bg-blue-500 active:scale-[0.98] transition-all flex items-center justify-center gap-8 border-b-[12px] border-blue-800">
                  {isAnalyzing ? <Loader2 className="animate-spin" size={48}/> : <ArrowLeftRight size={48} />}
                  בצע פירוק והצלבה נוירולוגית 🦾
               </button>

               {/* Matrix Results */}
               {matrix.length > 0 && (
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[70px] p-12 shadow-2xl border-4 border-blue-50 relative">
                    <h2 className="text-4xl font-black italic text-slate-900 uppercase pr-8 border-r-8 border-blue-600 mb-12">Neural Mapping Matrix</h2>
                    <div className="space-y-6 text-right">
                       {matrix.map((item, idx) => (
                         <div key={idx} className={`p-8 rounded-[55px] border-2 flex flex-col lg:flex-row items-center justify-between gap-10 transition-all ${item.status === 'synced' ? 'bg-emerald-50 border-emerald-100 scale-[0.98]' : item.status === 'matched' ? 'bg-blue-50 border-blue-100 shadow-md' : 'bg-rose-50 border-rose-100 animate-pulse'}`}>
                            <div className="flex items-center gap-8 flex-1">
                               <div className="bg-slate-900 text-white w-20 h-20 rounded-[30px] flex items-center justify-center font-black text-3xl italic shadow-2xl shrink-0">x{item.qty}</div>
                               <div className="text-right">
                                  <p className="text-[11px] font-black text-slate-400 uppercase italic mb-2 tracking-widest leading-none text-right">קלט שטח:</p>
                                  <h4 className="text-2xl font-black text-slate-900 leading-tight text-right">"{item.raw}"</h4>
                               </div>
                            </div>
                            <ArrowLeftRight className={item.status !== 'needs_training' ? 'text-blue-500' : 'text-slate-200'} size={44} />
                            <div className="flex-[4] flex items-center gap-8 bg-white p-6 rounded-[45px] border border-slate-100 shadow-sm w-full relative group">
                               <ProductImage src={item.product?.image_url} size="md" />
                               <div className="text-right flex-1">
                                  <p className={`font-black text-2xl ${item.product ? 'text-slate-900' : 'text-rose-500 italic underline decoration-dotted'}`}>{item.product ? item.product.product_name : 'דרושה שליפה מהמלאי'}</p>
                                  {item.product && <div className="flex items-center gap-3 mt-2 justify-end">
                                     <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-tighter italic">trained asset</span>
                                     <span className="h-4 w-[1px] bg-slate-200" />
                                     <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest italic leading-none">SKU: {item.product.sku}</span>
                                  </div>}
                               </div>
                               <div className="flex gap-4">
                                  {item.status === 'needs_training' ? (
                                    <button onClick={() => { setSelectingIdx(idx); setActiveTab('inventory'); }} className="px-10 py-5 bg-slate-950 text-white rounded-[30px] font-black text-xs uppercase shadow-xl hover:bg-blue-600 transition-all flex items-center gap-3"><MousePointer2 size={20}/> שליפה מהמלאי</button>
                                  ) : (
                                    <div className="flex items-center gap-3">
                                       <button onClick={() => setEditingItem(item.product)} className="flex items-center gap-4 px-10 py-5 bg-blue-600 text-white rounded-[30px] hover:bg-blue-700 transition-all shadow-xl active:scale-90 font-black text-[11px] uppercase italic tracking-widest border-b-8 border-blue-800">
                                          עריכה וסימולציה <Edit3 size={20}/>
                                       </button>
                                       {item.status === 'matched' && <button onClick={() => handleTrainDna(idx, item.product)} className="px-10 py-5 bg-emerald-500 text-white rounded-[30px] font-black text-xs uppercase shadow-xl border-b-4 border-emerald-700">אמן DNA</button>}
                                       {item.status === 'synced' && <ShieldCheck className="text-emerald-500 mr-4" size={64} />}
                                    </div>
                                  )}
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </motion.div>
               )}
            </motion.div>
          ) : (
            /* --- Master Inventory View --- */
            <motion.div key="inventory" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-white rounded-[80px] border border-slate-200 shadow-2xl overflow-hidden min-h-[900px] flex flex-col relative">
               <div className="p-14 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-8 text-right">
                  <div className="flex items-center gap-6">
                     <HardDrive size={56} className="text-blue-600" />
                     <div>
                        <h2 className="text-4xl font-black italic text-slate-900 uppercase tracking-tighter leading-none text-right">Inventory Master Access</h2>
                        <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-[0.5em] text-right">Direct Database Master Control</p>
                     </div>
                  </div>
                  <div className="relative w-full md:w-[600px] group">
                    <Search className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={26} />
                    <input placeholder="חפש מק''ט, שם או מילת מפתח..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border-4 border-slate-100 pr-20 pl-10 py-6 rounded-[40px] font-black outline-none focus:border-blue-500/20 transition-all shadow-inner text-xl text-right" />
                  </div>
               </div>

               <div className="overflow-x-auto scrollbar-hide flex-1">
                  <table className="w-full text-right border-separate border-spacing-y-6 px-14 pb-14">
                     <thead>
                        <tr className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none text-right">
                           <th className="p-6">ויזואליה</th>
                           <th className="p-6">שם בקומקס</th>
                           <th className="p-6 text-center">מצב DNA</th>
                           <th className="p-6">מילון שטח (Keywords)</th>
                           <th className="p-6 text-left">ניהול</th>
                        </tr>
                     </thead>
                     <tbody>
                        {filteredInventory.map((item) => {
                          const isSelecting = selectingIdx !== null;
                          return (
                            <motion.tr key={item.sku} whileHover={isSelecting ? { scale: 1.015, x: -8 } : {}} onClick={() => {
                                 if (isSelecting) {
                                    handleTrainDna(selectingIdx!, item);
                                    setSelectingIdx(null);
                                    setActiveTab('lab');
                                 }
                              }} className={`bg-slate-50 hover:bg-blue-50/50 transition-all group rounded-[50px] ${isSelecting ? 'cursor-pointer ring-[15px] ring-blue-500/20 border-blue-500 shadow-2xl' : ''}`}>
                               <td className="p-6 first:rounded-r-[55px]">
                                  <div className="flex items-center gap-10">
                                     <ProductImage src={item.image_url} size="lg" />
                                     <div className="text-right">
                                        <p className="bg-blue-600 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase shadow-lg w-fit mb-4 tracking-widest italic leading-none">SKU {item.sku}</p>
                                        <p className="font-black text-xl text-slate-900 italic">₪{item.price || '--'}</p>
                                     </div>
                                  </div>
                               </td>
                               <td className="p-6 text-right">
                                  <p className="font-black text-3xl text-slate-900 italic tracking-tighter leading-none">{item.product_name}</p>
                                  <p className="text-xs text-slate-400 mt-2 uppercase font-bold tracking-[0.3em] italic">{item.category || 'Elite Asset'}</p>
                               </td>
                               <td className="p-6 text-center">
                                  <div className={`inline-flex items-center gap-4 px-10 py-4 rounded-full text-[12px] font-black uppercase border-2 shadow-sm ${item.keywords ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
                                     {item.keywords ? <ShieldCheck size={20}/> : <AlertCircle size={20}/>}
                                     {item.keywords ? 'Trained' : 'Needs DNA'}
                                  </div>
                               </td>
                               <td className="p-6">
                                  <div className="flex flex-wrap gap-3 max-w-[450px] justify-end">
                                     {(item.keywords || "").split(',').slice(0, 8).map((tag: string, i: number) => (
                                       <span key={i} className="bg-white border border-slate-200 px-5 py-2 rounded-2xl text-[11px] font-black text-slate-500 uppercase shadow-sm italic">{tag.trim()}</span>
                                     ))}
                                  </div>
                               </td>
                               <td className="p-6 last:rounded-l-[55px] text-left">
                                  <div className="flex gap-4 justify-end opacity-0 group-hover:opacity-100 transition-all translate-x-8 group-hover:translate-x-0">
                                     <button onClick={(e) => {e.stopPropagation(); setEditingItem(item);}} className="p-6 bg-white border-2 border-slate-100 rounded-[30px] hover:text-blue-600 transition-all shadow-md active:scale-90"><Edit3 size={32}/></button>
                                     <button onClick={(e) => {e.stopPropagation(); if(confirm("למחוק?")) supabase.from('inventory').delete().eq('sku', item.sku).then(()=>fetchData());}} className="p-6 bg-white border-2 border-slate-100 rounded-[30px] hover:text-rose-600 hover:border-rose-500 transition-all shadow-md active:scale-90"><Trash2 size={32}/></button>
                                  </div>
                               </td>
                            </motion.tr>
                          );
                        })}
                     </tbody>
                  </table>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- Detailed Editor Modal with Live Simulator --- */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl overflow-y-auto">
             <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[80px] w-full max-w-[1550px] overflow-hidden shadow-2xl border border-white/10 my-10">
                <div className="bg-slate-900 p-16 text-white flex justify-between items-center relative overflow-hidden text-right">
                   <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[150px] rounded-full" />
                   <div className="text-right z-10 flex-1">
                      <div className="flex items-center gap-6 mb-4 justify-end">
                        <Tag className="text-blue-400" size={48} />
                        <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none">Product DNA Studio</h2>
                      </div>
                      <p className="text-blue-400 text-[12px] font-bold uppercase mt-4 tracking-[0.6em] italic flex items-center gap-2 justify-end text-right">
                         Matrix Inventory Refactoring & Live Simulation <Smartphone size={16} className="ml-2"/>
                      </p>
                   </div>
                   <button onClick={() => setEditingItem(null)} className="p-8 bg-white/5 rounded-full hover:bg-white/10 border border-white/5 transition-all active:scale-90 ml-10"><X size={44}/></button>
                </div>

                <div className="p-16 grid grid-cols-1 xl:grid-cols-12 gap-16 bg-slate-50/30 overflow-y-auto max-h-[75vh] scrollbar-hide text-right">
                   
                   {/* Form Side */}
                   <div className="xl:col-span-8 space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         <div className="space-y-10" dir="rtl">
                            <EditField label="שם מוצר רשמי" value={editingItem.product_name} onChange={(v:any) => setEditingItem({...editingItem, product_name: v})} />
                            <EditField label="מק''ט זיהוי (SKU)" value={editingItem.sku} disabled />
                            <EditField label="מחירון יחידה" value={editingItem.price} type="number" onChange={(v:any) => setEditingItem({...editingItem, price: v})} />
                            <EditField label="מילון DNA (סלנג שטח)" value={editingItem.keywords} placeholder="הפרד בפסיקים: בורג גבס, ברגים, ורו..." onChange={(v:any) => setEditingItem({...editingItem, keywords: v})} />
                         </div>
                         <div className="space-y-10" dir="rtl">
                            <EditField label="לינק תמונה ראשי" value={editingItem.image_url} onChange={(v:any) => setEditingItem({...editingItem, image_url: v})} />
                            <div className="grid grid-cols-2 gap-4">
                               <EditField label="תמונה 2" value={editingItem.image_url_2} onChange={(v:any) => setEditingItem({...editingItem, image_url_2: v})} />
                               <EditField label="תמונה 3" value={editingItem.image_url_3} onChange={(v:any) => setEditingItem({...editingItem, image_url_3: v})} />
                            </div>
                            <EditField label="שיטת יישום (Advisor)" value={editingItem.application_method} onChange={(v:any) => setEditingItem({...editingItem, application_method: v})} />
                         </div>
                      </div>
                      
                      <div className="space-y-4 text-right">
                         <label className="text-[12px] font-black text-slate-400 uppercase mr-3 tracking-[0.2em] italic leading-none block">מפרט טכני מורחב</label>
                         <textarea onChange={(e) => setEditingItem({...editingItem, description: e.target.value})} className="w-full bg-white border-4 border-slate-100 p-8 rounded-[45px] font-bold text-xl outline-none focus:border-blue-500/20 h-40 text-right shadow-inner leading-relaxed" value={editingItem.description} />
                      </div>

                      <div className="pt-10 flex justify-end gap-6">
                        <button onClick={() => setEditingItem(null)} className="px-14 py-6 rounded-[35px] font-black text-slate-400 hover:text-slate-900 transition-all uppercase text-sm italic tracking-widest">ביטול X</button>
                        <button onClick={handleUpdateItem} className="px-24 py-7 bg-blue-600 text-white rounded-[40px] font-black text-xl uppercase italic tracking-[0.3em] shadow-2xl flex items-center gap-6 hover:bg-blue-700 transition-all border-b-[12px] border-blue-800"><Save size={32}/> שמור שינויים וסנכרן 🦾</button>
                      </div>
                   </div>

                   {/* Simulator Side */}
                   <div className="xl:col-span-4 flex flex-col items-center gap-8 border-r border-slate-200 pr-10">
                      <div className="flex items-center gap-4 bg-white px-8 py-4 rounded-full border border-slate-200 shadow-md">
                         <Monitor size={24} className="text-blue-500" />
                         <span className="h-6 w-[2px] bg-slate-100" />
                         <MobileIcon size={24} className="text-slate-400" />
                         <span className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 italic mr-2">Online Simulator</span>
                      </div>

                      <div className="bg-[#020617] rounded-[70px] border-[12px] border-slate-800 shadow-[0_50px_100px_rgba(0,0,0,0.6)] w-full max-w-[380px] overflow-hidden flex flex-col relative aspect-[9/18.5]">
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20" />
                         <div className="p-8 pb-4 flex justify-between items-center mt-4 text-white">
                            <ChevronRight size={18}/>
                            <img src="/ai.png" className="h-6 opacity-80" alt="" />
                         </div>

                         <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-6 text-right text-white" dir="rtl">
                            <div className="grid grid-cols-12 gap-2 h-48">
                               <div className="col-span-8 bg-slate-900 rounded-[25px] overflow-hidden border border-white/10 flex items-center justify-center shadow-lg">
                                  <ProductImage src={editingItem.image_url} size="lg" />
                               </div>
                               <div className="col-span-4 flex flex-col gap-2">
                                  <div className="flex-1 bg-slate-900 rounded-2xl overflow-hidden border border-white/10">
                                     <ProductImage src={editingItem.image_url_2} size="sm" />
                                  </div>
                                  <div className="flex-1 bg-slate-900 rounded-2xl overflow-hidden border border-white/10">
                                     <ProductImage src={editingItem.image_url_3} size="sm" />
                                  </div>
                               </div>
                            </div>

                            <div className="space-y-4">
                               <div className="flex items-center gap-2 justify-end">
                                  <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-blue-500/20">Elite Asset</span>
                                  <ShieldCheck className="text-emerald-500" size={14} />
                               </div>
                               <h3 className="text-2xl font-black text-white italic leading-tight uppercase tracking-tighter text-right">{editingItem.product_name || "Product Title"}</h3>
                               <div className="flex gap-2 justify-end">
                                  <span className="bg-white/5 text-slate-400 px-3 py-1 rounded-lg text-[8px] font-bold">SKU: {editingItem.sku}</span>
                               </div>
                               
                               <div className="grid grid-cols-2 gap-3 pt-2">
                                  <div className="bg-white/[0.03] p-4 rounded-2xl text-center border border-white/5">
                                     <Clock size={12} className="text-blue-500 mx-auto mb-1 opacity-50" />
                                     <p className="text-[7px] text-slate-500 uppercase font-black tracking-widest mb-1">Drying</p>
                                     <p className="text-xs text-white font-black italic">{editingItem.drying_time || "--"}</p>
                                  </div>
                                  <div className="bg-white/[0.03] p-4 rounded-2xl text-center border border-white/5">
                                     <Gauge size={12} className="text-blue-500 mx-auto mb-1 opacity-50" />
                                     <p className="text-[7px] text-slate-500 uppercase font-black tracking-widest mb-1">Coverage</p>
                                     <p className="text-xs text-white font-black italic">{editingItem.coverage_info || "--"}</p>
                                  </div>
                               </div>

                               <div className="bg-blue-600/10 p-5 rounded-[25px] border border-blue-500/10 mt-4 shadow-inner">
                                  <p className="text-white/60 text-[11px] font-bold leading-relaxed italic text-right">
                                     "{editingItem.application_method || 'נא להגדיר שיטת יישום...'}"
                                  </p>
                               </div>
                            </div>
                         </div>

                         <div className="p-8 bg-[#020617] border-t border-white/5">
                            <div className="w-full bg-white text-slate-900 py-5 rounded-[25px] font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 italic">
                               ADD TO COMMAND <ShoppingCart size={18} className="text-blue-600" />
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Selection Target Overlay */}
      <AnimatePresence>
        {selectingIdx !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[550] bg-blue-600/40 backdrop-blur-xl pointer-events-none flex items-center justify-center">
             <div className="bg-white p-16 rounded-[60px] shadow-2xl border-[12px] border-blue-600 pointer-events-auto animate-bounce flex items-center gap-10 text-right" dir="rtl">
                <MousePointer2 size={64} className="text-blue-600" />
                <div className="text-right">
                   <p className="font-black text-blue-600 uppercase text-4xl italic tracking-tighter leading-none">בחירת יעד הצלבה DNA</p>
                   <p className="text-slate-400 font-bold text-lg mt-2 uppercase tracking-widest leading-none text-right text-right">בחר את המוצר המתאים מהטבלה למטה 🎯</p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="py-40 border-t border-slate-100 opacity-20 text-center uppercase text-[12px] font-black tracking-[3em] italic text-slate-900 leading-none">Saban OS Neural Alignment Engine V72.0</footer>
      <style jsx global>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}

function StatCard({ label, value, icon, color = "text-slate-900" }: any) {
  return (
    <div className="bg-slate-50 border border-slate-100 px-10 py-6 rounded-[40px] shadow-inner flex flex-col items-center min-w-[180px] text-center">
       <div className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase mb-2 tracking-[0.2em] italic leading-none justify-center">{icon} {label}</div>
       <span className={`text-4xl font-black italic tracking-tighter leading-none mt-1 ${color}`}>{value}</span>
    </div>
  );
}

function EditField({ label, value, type = "text", onChange, placeholder, disabled }: any) {
  return (
    <div className="space-y-4 text-right" dir="rtl">
       <label className="text-[12px] font-black text-slate-400 uppercase mr-3 tracking-[0.2em] italic leading-none block text-right">{label}</label>
       <input 
          disabled={disabled} 
          type={type} 
          onChange={(e) => onChange(e.target.value)} 
          className="w-full bg-white border-4 border-slate-100 p-8 rounded-[40px] font-bold text-2xl outline-none focus:border-blue-500/20 text-right shadow-inner disabled:bg-slate-100 disabled:text-slate-300 italic" 
          defaultValue={value} 
          placeholder={placeholder} 
       />
    </div>
  );
}
