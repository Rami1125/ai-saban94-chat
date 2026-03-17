"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Zap, Sparkles, ClipboardList, Database, ArrowLeftRight, 
  CheckCircle2, SearchCode, PackageSearch, Save, Loader2, 
  Trash2, Edit3, Target, ShieldCheck, RefreshCw,
  Search, Package, Image as ImageIcon, Plus, X, 
  AlertCircle, Eye, HardDrive, MousePointer2, BrainCircuit,
  Tag, ChevronRight, CheckCircle, ListPlus, Smartphone, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban OS V67.0 - DNA Neural Factory (Elite Precision)
 * ----------------------------------------------------
 * - Feature: Double Injection Matrix (Slang vs Comax).
 * - Interaction: 100% Visual Alignment Flow with click-to-train.
 * - Design: Slate-950, Executive Shadows, Stitched UI.
 */

export default function DnaNeuralStudio() {
  const [mounted, setMounted] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'lab' | 'inventory'>('lab');
  
  // Input States
  const [inputRaw, setInputRaw] = useState(""); // WhatsApp/Slang
  const [outputRaw, setOutputRaw] = useState(""); // Comax Note
  const [matrix, setMatrix] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Selector/Edit States
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
      toast.error("סנכרון מלאי נכשל");
    } finally {
      setLoading(false);
    }
  };

  // --- מנוע הניתוח המדויק: הפיכת טקסט חופשי למטריצת הצלבה ---
  const handleStartAnalysis = () => {
    if (!inputRaw) return toast.error("הזרק רשימה מהשטח לניתוח");
    setIsAnalyzing(true);

    setTimeout(() => {
      // 1. פירוק שורות הווצאפ
      const slangLines = inputRaw.split('\n')
        .map(l => l.trim().replace(/^\*?\s*/, ''))
        .filter(l => l.length > 2);
      
      // 2. זיהוי מק"טים ומוצרים מתעודת המשלוח
      const comaxLines = outputRaw.split('\n').map(line => {
        const parts = line.split('\t');
        return {
          sku: parts[2]?.trim() || line.match(/\d{5,}/)?.[0],
          name: parts[1]?.trim() || line,
          qty: parts[0]?.trim() || "1"
        };
      }).filter(s => s.sku);

      // 3. יצירת המטריצה: ניסיון הצלבה נוירולוגי
      const newMatrix = slangLines.map((line) => {
        const cleanLine = line.toLowerCase();
        
        // א. בדיקה במלאי לפי Keywords קיימים
        const autoMatch = inventory.find(inv => {
          const kws = (inv.keywords || "").toLowerCase().split(',').map((k:string) => k.trim());
          return kws.some(k => k.length > 2 && cleanLine.includes(k)) || 
                 cleanLine.includes((inv.product_name || "").toLowerCase());
        });

        // ב. בדיקה בתעודת המשלוח שהודבקה (המקור לאמת)
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
    }, 1000);
  };

  // --- אימון DNA: שמירת המילה מהשטח כמילת מפתח במלאי ---
  const handleTrainDna = async (idx: number, product: any) => {
    const item = matrix[idx];
    const cleanSlang = item.raw.replace(/[0-9*.\-]/g, '').trim();
    if (cleanSlang.length < 2) return;

    const toastId = toast.loading(`מאמן DNA למק"ט ${product.sku}...`);
    try {
      const existing = product.keywords || "";
      const updatedKeywords = Array.from(new Set([...existing.split(','), cleanSlang])).join(', ').replace(/^, /, '');

      const { error } = await supabase.from('inventory')
        .update({ keywords: updatedKeywords, search_tags: updatedKeywords, last_trained: new Date().toISOString() })
        .eq('sku', product.sku);

      if (error) throw error;

      const newMatrix = [...matrix];
      newMatrix[idx] = { ...item, product, status: 'synced' };
      setMatrix(newMatrix);
      
      toast.success(`המוח אומן! "${cleanSlang}" ➡️ ${product.product_name}`, { id: toastId });
      fetchData(); 
    } catch (e) { toast.error("סנכרון נכשל"); }
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter(i => 
      (i.product_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.sku || "").toString().includes(searchTerm)
    );
  }, [inventory, searchTerm]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors theme="dark" />

      <div className="max-w-[1700px] mx-auto space-y-10">
        
        {/* --- Header Elite --- */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 bg-white p-10 rounded-[60px] border border-slate-100 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-full bg-blue-600/5 -skew-x-12 translate-x-16 group-hover:translate-x-8 transition-transform duration-1000" />
          <div className="flex items-center gap-10 relative z-10">
             <div className="w-24 h-24 bg-slate-950 text-blue-500 rounded-[40px] flex items-center justify-center shadow-2xl ring-8 ring-slate-50">
                <BrainCircuit size={48} />
             </div>
             <div>
                <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none text-slate-900 text-right">DNA Neural Factory</h1>
                <p className="text-[11px] font-bold text-slate-400 mt-3 uppercase tracking-[0.5em] flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Precision Training v67.0
                </p>
             </div>
          </div>
          
          <div className="flex items-center gap-6 relative z-10">
             <StatCard label="סה''כ במלאי" value={inventory.length} icon={<Package size={16}/>} />
             <StatCard label="מאומן DNA" value={inventory.filter(i => i.keywords).length} color="text-emerald-500" icon={<ShieldCheck size={16}/>} />
             <StatCard label="דורש אימון" value={inventory.filter(i => !i.keywords).length} color="text-rose-500" icon={<Target size={16}/>} />
          </div>
        </div>

        {/* --- Tab Navigation --- */}
        <div className="flex gap-4 bg-white/50 p-2 rounded-[35px] w-fit border border-slate-100 shadow-sm">
           <button onClick={() => setActiveTab('lab')} className={`px-12 py-4 rounded-[28px] font-black text-sm uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'lab' ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-white'}`}>
              <Zap size={18} fill={activeTab === 'lab' ? 'currentColor' : 'none'}/> מעבדת הצלבות
           </button>
           <button onClick={() => setActiveTab('inventory')} className={`px-12 py-4 rounded-[28px] font-black text-sm uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'inventory' ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-white'}`}>
              <Layers size={18}/> ניהול מלאי ו-DNA
           </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'lab' ? (
            <motion.div key="lab" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
               
               {/* Injection Inputs */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-[45px] p-10 shadow-lg border border-slate-100 space-y-6">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner"><ClipboardList size={24}/></div>
                        <h3 className="font-black text-slate-800 uppercase italic text-xl leading-none text-right">1. הודעת שטח (בר אורניל)</h3>
                     </div>
                     <textarea value={inputRaw} onChange={(e) => setInputRaw(e.target.value)} placeholder='הדבק את ההודעה מהווצאפ...' className="w-full h-64 bg-slate-50 border-4 border-slate-100 rounded-[35px] p-8 font-bold text-slate-700 outline-none focus:border-blue-500/20 transition-all text-xl shadow-inner resize-none scrollbar-hide text-right" />
                  </div>
                  <div className="bg-slate-950 rounded-[45px] p-10 shadow-2xl space-y-6 text-white relative">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[80px] rounded-full" />
                     <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 shadow-inner"><Database size={24}/></div>
                        <h3 className="font-black uppercase italic text-xl leading-none text-right">2. תעודת משלוח (קומקס)</h3>
                     </div>
                     <textarea value={outputRaw} onChange={(e) => setOutputRaw(e.target.value)} placeholder="הדבק את שורות תעודת המשלוח..." className="w-full h-64 bg-white/5 border-4 border-white/10 rounded-[35px] p-8 font-bold text-blue-100 outline-none focus:border-emerald-500 transition-all text-xl shadow-inner resize-none scrollbar-hide relative z-10 text-right" />
                  </div>
               </div>

               <button onClick={handleStartAnalysis} disabled={isAnalyzing || !inputRaw} className="w-full bg-blue-600 text-white py-10 rounded-[45px] font-black text-3xl uppercase italic tracking-widest shadow-[0_30px_60px_rgba(37,99,235,0.3)] hover:bg-blue-500 active:scale-[0.98] transition-all flex items-center justify-center gap-8 border-b-[12px] border-blue-800">
                  {isAnalyzing ? <Loader2 className="animate-spin" size={48}/> : <ArrowLeftRight size={48} />}
                  בצע פירוק והצלבה נוירולוגית 🦾
               </button>

               {/* Matrix Result Section */}
               {matrix.length > 0 && (
                 <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[70px] p-12 shadow-2xl border-4 border-blue-50 relative">
                    <div className="flex justify-between items-center mb-12">
                       <h2 className="text-4xl font-black italic text-slate-900 uppercase pr-8 border-r-8 border-blue-600 leading-none">Neural Mapping Matrix</h2>
                       <button onClick={() => setMatrix([])} className="p-4 bg-slate-100 rounded-2xl text-slate-400 hover:text-rose-500 transition-all"><X size={32}/></button>
                    </div>
                    <div className="space-y-6 text-right">
                       {matrix.map((item, idx) => (
                         <div key={idx} className={`p-8 rounded-[55px] border-2 flex flex-col lg:flex-row items-center justify-between gap-10 transition-all ${item.status === 'synced' ? 'bg-emerald-50 border-emerald-100 scale-[0.98]' : item.status === 'matched' ? 'bg-blue-50 border-blue-100 shadow-md' : 'bg-rose-50 border-rose-100 animate-pulse'}`}>
                            <div className="flex items-center gap-8 flex-1">
                               <div className="bg-slate-900 text-white w-20 h-20 rounded-[30px] flex items-center justify-center font-black text-3xl italic shadow-2xl shrink-0">x{item.qty}</div>
                               <div className="text-right">
                                  <p className="text-[11px] font-black text-slate-400 uppercase italic mb-2 tracking-widest leading-none">קלט שטח:</p>
                                  <h4 className="text-2xl font-black text-slate-900 leading-tight">"{item.raw}"</h4>
                               </div>
                            </div>
                            <ArrowLeftRight className={item.status !== 'needs_training' ? 'text-blue-500' : 'text-slate-200'} size={44} />
                            <div className="flex-[2] flex items-center gap-8 bg-white p-6 rounded-[45px] border border-slate-100 shadow-sm w-full relative group">
                               <div className={`w-24 h-24 rounded-[30px] overflow-hidden bg-slate-50 flex items-center justify-center relative shadow-inner shrink-0 border-4 border-white ${!item.product && 'bg-rose-50'}`}>
                                  {item.product?.image_url ? (
                                    <img src={item.product.image_url} className="w-full h-full object-cover" onError={(e:any) => e.target.src = ''} />
                                  ) : <PackageSearch size={44} className="text-slate-200" />}
                               </div>
                               <div className="text-right flex-1">
                                  <p className={`font-black text-2xl ${item.product ? 'text-slate-900' : 'text-rose-500 italic underline decoration-dotted'}`}>
                                     {item.product ? item.product.product_name : 'דרושה שליפה מהמלאי'}
                                  </p>
                                  {item.product && <p className="text-[11px] font-bold text-blue-600 uppercase mt-2 tracking-widest italic">SKU: {item.product.sku} | trained asset</p>}
                               </div>
                               <div className="flex gap-4">
                                  {item.status === 'needs_training' ? (
                                    <button onClick={() => { setSelectingIdx(idx); setActiveTab('inventory'); }} className="px-10 py-5 bg-slate-950 text-white rounded-[30px] font-black text-xs uppercase shadow-xl hover:bg-blue-600 transition-all flex items-center gap-3"><MousePointer2 size={20}/> שליפה</button>
                                  ) : item.status === 'matched' ? (
                                    <button onClick={() => handleTrainDna(idx, item.product)} className="px-12 py-5 bg-emerald-500 text-white rounded-[30px] font-black text-xs uppercase shadow-xl hover:bg-emerald-600 transition-all active:scale-95 border-b-4 border-emerald-700">אמן DNA 🧠</button>
                                  ) : (
                                    <ShieldCheck className="text-emerald-500 ml-8" size={56} />
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
                        <h2 className="text-4xl font-black italic text-slate-900 uppercase tracking-tighter leading-none">Inventory & DNA Studio</h2>
                        <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-[0.5em]">Direct Database Master Access</p>
                     </div>
                  </div>
                  <div className="relative w-full md:w-[600px] group">
                    <Search className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={26} />
                    <input placeholder="חפש מק''ט, שם, מילת מפתח או תגית..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border-4 border-slate-100 pr-20 pl-10 py-6 rounded-[40px] font-black outline-none focus:border-blue-500/20 transition-all shadow-inner text-xl text-right" />
                  </div>
               </div>

               <div className="overflow-x-auto scrollbar-hide flex-1">
                  <table className="w-full text-right border-separate border-spacing-y-6 px-14 pb-14">
                     <thead>
                        <tr className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">
                           <th className="p-6">ויזואליה וזיהוי</th>
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
                                     <div className="w-28 h-28 rounded-[40px] overflow-hidden bg-white shadow-xl border-4 border-white group-hover:scale-110 transition-transform relative shrink-0">
                                        <img src={item.image_url} className="w-full h-full object-cover" onError={(e:any) => e.target.src = ''} />
                                     </div>
                                     <div>
                                        <p className="bg-blue-600 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase shadow-lg w-fit mb-4 tracking-widest italic leading-none">SKU {item.sku}</p>
                                        <p className="font-black text-xl text-slate-900 italic">₪{item.price || '--'}</p>
                                     </div>
                                  </div>
                               </td>
                               <td className="p-6">
                                  <p className="font-black text-3xl text-slate-900 italic tracking-tighter leading-none">{item.product_name || "Asset Unnamed"}</p>
                                  <p className="text-xs text-slate-400 mt-2 uppercase font-bold tracking-[0.3em] italic">{item.category || 'Standard Grade'}</p>
                               </td>
                               <td className="p-6 text-center">
                                  <div className={`inline-flex items-center gap-4 px-10 py-4 rounded-full text-[12px] font-black uppercase border-2 shadow-sm ${item.keywords ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
                                     {item.keywords ? <ShieldCheck size={20}/> : <AlertCircle size={20}/>}
                                     {item.keywords ? 'Trained' : 'Missing DNA'}
                                  </div>
                               </td>
                               <td className="p-6">
                                  <div className="flex flex-wrap gap-3 max-w-[450px]">
                                     {(item.keywords || "").split(',').slice(0, 8).map((tag: string, i: number) => (
                                       <span key={i} className="bg-white border border-slate-200 px-5 py-2 rounded-2xl text-[11px] font-black text-slate-500 uppercase shadow-sm italic">{tag.trim()}</span>
                                     ))}
                                     {!item.keywords && <span className="text-slate-300 italic font-bold uppercase tracking-widest text-[10px]">ממתין לאימון...</span>}
                                  </div>
                               </td>
                               <td className="p-6 last:rounded-l-[55px] text-left">
                                  <div className="flex gap-4 justify-end opacity-0 group-hover:opacity-100 transition-all translate-x-8 group-hover:translate-x-0">
                                     <button onClick={(e) => {e.stopPropagation(); setEditingItem(item);}} className="p-6 bg-white border-2 border-slate-100 rounded-[30px] hover:text-blue-600 hover:border-blue-500 transition-all shadow-md active:scale-90"><Edit3 size={32}/></button>
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

      {/* --- Detailed Editor Modal --- */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl">
             <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[80px] w-full max-w-6xl overflow-hidden shadow-2xl border border-white/10">
                <div className="bg-slate-900 p-16 text-white flex justify-between items-center relative overflow-hidden text-right">
                   <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[150px] rounded-full" />
                   <div className="text-right z-10 flex-1">
                      <div className="flex items-center gap-6 mb-4 justify-end">
                        <Tag className="text-blue-400" size={48} />
                        <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none">Product DNA Editor</h2>
                      </div>
                      <p className="text-blue-400 text-[12px] font-bold uppercase mt-4 tracking-[0.6em] italic flex items-center gap-2 justify-end"><Target size={16}/> Accurate Inventory Mapping Suite</p>
                   </div>
                   <button onClick={() => setEditingItem(null)} className="p-8 bg-white/5 rounded-full hover:bg-white/10 border border-white/5 transition-all active:scale-90 ml-10"><X size={44}/></button>
                </div>
                <div className="p-20 grid grid-cols-1 md:grid-cols-2 gap-16 bg-slate-50/30 overflow-y-auto max-h-[60vh] scrollbar-hide text-right">
                   <div className="space-y-10">
                      <EditField label="שם מוצר רשמי" value={editingItem.product_name} onChange={(v:any) => setEditingItem({...editingItem, product_name: v})} />
                      <EditField label="מק''ט (SKU)" value={editingItem.sku} disabled />
                      <EditField label="מחירון" value={editingItem.price} type="number" onChange={(v:any) => setEditingItem({...editingItem, price: v})} />
                      <EditField label="מילון DNA (סלנג שטח)" value={editingItem.keywords} placeholder="הפרד בפסיקים: שומשום, סומסום, שומו..." onChange={(v:any) => setEditingItem({...editingItem, keywords: v})} />
                   </div>
                   <div className="space-y-10">
                      <EditField label="לינק תמונה ראשי" value={editingItem.image_url} onChange={(v:any) => setEditingItem({...editingItem, image_url: v})} />
                      <EditField label="שיטת יישום מומלצת" value={editingItem.application_method} onChange={(v:any) => setEditingItem({...editingItem, application_method: v})} />
                      <EditField label="תיאור DNA מלא" value={editingItem.description} type="textarea" onChange={(v:any) => setEditingItem({...editingItem, description: v})} />
                   </div>
                </div>
                <div className="p-16 border-t border-slate-100 bg-white flex justify-end gap-6 shadow-inner">
                   <button onClick={() => setEditingItem(null)} className="px-14 py-6 rounded-[35px] font-black text-slate-400 hover:text-slate-900 transition-all uppercase text-sm italic tracking-widest">ביטול X</button>
                   <button onClick={async () => {
                     const { error } = await supabase.from('inventory').upsert(editingItem);
                     if (!error) { toast.success("המלאי עודכן! 🦾"); setEditingItem(null); fetchData(); }
                   }} className="px-24 py-7 bg-blue-600 text-white rounded-[40px] font-black text-xl uppercase italic tracking-[0.3em] shadow-2xl flex items-center gap-6 hover:bg-blue-700 transition-all border-b-[12px] border-blue-800"><Save size={32}/> שמור שינויים 🦾</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Selection Target Overlay */}
      <AnimatePresence>
        {selectingIdx !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[550] bg-blue-600/40 backdrop-blur-xl pointer-events-none flex items-center justify-center">
             <div className="bg-white p-16 rounded-[60px] shadow-2xl border-[12px] border-blue-600 pointer-events-auto animate-bounce flex items-center gap-10">
                <MousePointer2 size={64} className="text-blue-600" />
                <div className="text-right">
                   <p className="font-black text-blue-600 uppercase text-4xl italic tracking-tighter leading-none">בחירת יעד הצלבה DNA</p>
                   <p className="text-slate-400 font-bold text-lg mt-2 uppercase tracking-widest leading-none text-right">בחר את המוצר המתאים מהטבלה למטה 🎯</p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="py-40 border-t border-slate-100 opacity-20 text-center uppercase text-[12px] font-black tracking-[3em] italic text-slate-900 leading-none">Saban OS Neural Alignment Engine V67.0</footer>
      <style jsx global>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}

function StatCard({ label, value, icon, color = "text-slate-900" }: any) {
  return (
    <div className="bg-slate-50 border border-slate-100 px-10 py-6 rounded-[40px] shadow-inner flex flex-col items-center min-w-[180px]">
       <div className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase mb-2 tracking-[0.2em] italic">{icon} {label}</div>
       <span className={`text-4xl font-black italic tracking-tighter ${color}`}>{value}</span>
    </div>
  );
}

function EditField({ label, value, type = "text", onChange, placeholder, disabled }: any) {
  return (
    <div className="space-y-4">
       <label className="text-[12px] font-black text-slate-400 uppercase mr-3 tracking-[0.2em] italic leading-none text-right block">{label}</label>
       {type === 'textarea' ? (
         <textarea onChange={(e) => onChange(e.target.value)} className="w-full bg-white border-4 border-slate-100 p-8 rounded-[45px] font-bold text-xl outline-none focus:border-blue-500/20 h-52 text-right shadow-inner leading-relaxed" defaultValue={value} placeholder={placeholder} />
       ) : (
         <input disabled={disabled} type={type} onChange={(e) => onChange(e.target.value)} className="w-full bg-white border-4 border-slate-100 p-8 rounded-[40px] font-bold text-2xl outline-none focus:border-blue-500/20 text-right shadow-inner disabled:bg-slate-100 disabled:text-slate-300 italic" defaultValue={value} placeholder={placeholder} />
       )}
    </div>
  );
}
