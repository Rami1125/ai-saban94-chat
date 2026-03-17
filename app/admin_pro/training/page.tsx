"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Zap, Sparkles, ClipboardList, Database, ArrowLeftRight, 
  CheckCircle2, SearchCode, PackageSearch, Save, Loader2, 
  Trash2, Edit3, Target, ShieldCheck, RefreshCw,
  Search, Package, Image as ImageIcon, Plus, X, 
  AlertCircle, Eye, HardDrive, MousePointer2, BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban OS V60.0 - DNA Neural Factory
 * -------------------------------------------
 * - Feature: Slang Word Selection & Inventory Matching.
 * - Logic: Direct Update to 'inventory' keywords/tags.
 * - Visual: Real-time Color-Coded Status (Trained/Manual/Pending).
 */

export default function DnaNeuralStudio() {
  const [mounted, setMounted] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Matrix State
  const [inputRaw, setInputRaw] = useState(""); 
  const [outputRaw, setOutputRaw] = useState(""); 
  const [matrix, setMatrix] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Interaction State
  const [selectingIdx, setSelectingIdx] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('inventory').select('*').order('product_name');
    setInventory(data || []);
    setLoading(false);
  };

  // --- מנוע הניתוח: פירוק מילים והצלבה אוטומטית ---
  const handleAnalyze = () => {
    if (!inputRaw) return toast.error("הדבק רשימה מהשטח");
    setIsAnalyzing(true);

    setTimeout(() => {
      const slangLines = inputRaw.split('\n').map(l => l.trim()).filter(l => l.length > 2);
      
      const newMatrix = slangLines.map((line) => {
        const cleanLine = line.toLowerCase();
        
        // 1. חיפוש אוטומטי לפי מילות מפתח קיימות
        const match = inventory.find(inv => {
          const keywords = (inv.keywords || "").toLowerCase().split(',').map((k:string) => k.trim());
          const pName = (inv.product_name || "").toLowerCase();
          return keywords.some(k => k.length > 2 && cleanLine.includes(k)) || 
                 cleanLine.includes(pName) ||
                 cleanLine.includes(String(inv.sku));
        });

        return {
          raw: line,
          product: match || null,
          status: match ? 'matched' : 'needs_manual',
          qty: line.match(/\d+/)?.[0] || "1"
        };
      });

      setMatrix(newMatrix);
      setIsAnalyzing(false);
      toast.success("ניתוח DNA הושלם 🦾");
    }, 800);
  };

  // --- הזרקת DNA: הפיכת ה"סלנג" למילת מפתח רשמית ---
  const injectDnaSync = async (idx: number, product: any) => {
    const item = matrix[idx];
    const cleanSlang = item.raw.replace(/[0-9*.\-]/g, '').trim();
    
    const toastId = toast.loading(`מזריק DNA למק"ט ${product.sku}...`);
    
    try {
      const existingKeywords = product.keywords || "";
      const newKeywords = Array.from(new Set([...existingKeywords.split(','), cleanSlang]))
        .join(', ')
        .replace(/^, /, '');

      const { error } = await supabase
        .from('inventory')
        .update({ 
          keywords: newKeywords, 
          search_tags: newKeywords,
          last_trained: new Date().toISOString() 
        })
        .eq('sku', product.sku);

      if (error) throw error;

      const updated = [...matrix];
      updated[idx] = { ...item, product, status: 'synced' };
      setMatrix(updated);
      
      toast.success(`המוח אומן! "${cleanSlang}" ➡️ ${product.product_name}`, { id: toastId });
      fetchData();
    } catch (e) {
      toast.error("שגיאה בסנכרון");
    }
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

      <div className="max-w-[1650px] mx-auto space-y-10">
        
        {/* --- Studio Header --- */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 bg-white p-10 rounded-[55px] border border-slate-100 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-full bg-blue-600/5 -skew-x-12 translate-x-12 group-hover:translate-x-6 transition-transform duration-1000" />
          <div className="flex items-center gap-8 relative z-10">
             <div className="w-20 h-20 bg-slate-950 text-blue-500 rounded-[35px] flex items-center justify-center shadow-2xl ring-8 ring-slate-50">
                <BrainCircuit size={42} />
             </div>
             <div>
                <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-slate-900">Neural DNA Factory</h1>
                <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-[0.4em] flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Precision Training v60.0
                </p>
             </div>
          </div>
          
          <div className="flex items-center gap-6 relative z-10">
             <StatBox label="מלאי רשום" value={inventory.length} icon={<Package size={14}/>} />
             <StatBox label="מוצלב 100%" value={inventory.filter(i => i.keywords).length} color="text-emerald-500" icon={<ShieldCheck size={14}/>} />
             <StatBox label="דורש אימון" value={inventory.filter(i => !i.keywords).length} color="text-rose-500" icon={<Target size={14}/>} />
          </div>
        </div>

        {/* --- Training Input Arena --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white rounded-[45px] p-8 shadow-lg border border-slate-100 space-y-6">
              <div className="flex items-center gap-3">
                 <ClipboardList className="text-blue-600" size={24}/>
                 <h3 className="font-black text-slate-800 uppercase italic">1. הדבקת רשימת שטח (WhatsApp Slang)</h3>
              </div>
              <textarea 
                value={inputRaw} onChange={(e) => setInputRaw(e.target.value)}
                placeholder='* 100 שקים בטון מוכן...'
                className="w-full h-48 bg-slate-50 border-2 border-slate-100 rounded-[30px] p-6 font-bold text-slate-700 outline-none focus:border-blue-500 transition-all text-lg shadow-inner"
              />
           </div>
           <div className="bg-slate-950 rounded-[45px] p-8 shadow-2xl space-y-6 text-white">
              <div className="flex items-center gap-3 text-emerald-400">
                 <Database size={24}/>
                 <h3 className="font-black uppercase italic">2. הצלבת ביצוע (Comax Document)</h3>
              </div>
              <textarea 
                value={outputRaw} onChange={(e) => setOutputRaw(e.target.value)}
                placeholder="הדבק כאן שורות מתעודת המשלוח להצלבה אוטומטית..."
                className="w-full h-48 bg-white/5 border-2 border-white/10 rounded-[30px] p-6 font-bold text-blue-100 outline-none focus:border-emerald-500 transition-all text-lg shadow-inner"
              />
           </div>
        </div>

        <button 
          onClick={handleAnalyze}
          disabled={isAnalyzing || !inputRaw}
          className="w-full bg-blue-600 text-white py-8 rounded-[40px] font-black text-2xl uppercase italic tracking-widest shadow-2xl hover:bg-blue-500 active:scale-95 transition-all flex items-center justify-center gap-6 border-b-[12px] border-blue-800"
        >
           {isAnalyzing ? <Loader2 className="animate-spin" size={32}/> : <ArrowLeftRight size={32} />}
           נתח הצלבות ואמן את המוח 🦾
        </button>

        {/* --- Mapping Results Matrix --- */}
        <AnimatePresence>
          {matrix.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[60px] p-10 shadow-2xl border-4 border-blue-50 relative">
               <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-black italic text-slate-900 uppercase pr-6 border-r-8 border-blue-600">Matrix Mapping Studio</h2>
                  <button onClick={() => setMatrix([])} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-rose-500 transition-all"><X/></button>
               </div>

               <div className="space-y-4">
                  {matrix.map((item, idx) => (
                    <div key={idx} className={`p-6 rounded-[35px] border-2 flex flex-col lg:flex-row items-center justify-between gap-8 transition-all ${item.status === 'synced' ? 'bg-emerald-50 border-emerald-100' : item.status === 'matched' ? 'bg-blue-50 border-blue-100' : 'bg-rose-50 border-rose-100'}`}>
                       
                       <div className="flex items-center gap-6 flex-1">
                          <div className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black italic shadow-lg shrink-0">x{item.qty}</div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-slate-400 uppercase italic mb-1">שפת הלקוח:</p>
                             <h4 className="text-xl font-black text-slate-900 leading-tight">"{item.raw}"</h4>
                          </div>
                       </div>

                       <ArrowLeftRight className={item.status !== 'needs_manual' ? 'text-blue-500' : 'text-slate-200'} size={28} />

                       <div className="flex-[1.5] flex items-center gap-6 bg-white p-4 rounded-[30px] border border-slate-100 shadow-sm w-full relative group">
                          <div className={`w-20 h-20 rounded-[22px] overflow-hidden bg-slate-50 flex items-center justify-center relative shadow-inner shrink-0 border-2 ${!item.product && 'animate-pulse border-rose-200'}`}>
                             {item.product?.image_url ? <img src={item.product.image_url} className="w-full h-full object-cover" /> : <Package size={24} className="text-slate-200" />}
                          </div>
                          <div className="text-right flex-1">
                             <p className={`font-black text-lg ${item.product ? 'text-slate-900' : 'text-rose-500 italic'}`}>
                                {item.product ? item.product.product_name : 'לא אותר - בצע שליפה מהמלאי'}
                             </p>
                             {item.product && <p className="text-[10px] font-bold text-blue-500 uppercase mt-1">SKU: {item.product.sku} | trained</p>}
                          </div>
                          
                          <div className="flex gap-3">
                             {item.status === 'needs_manual' ? (
                               <button 
                                 onClick={() => setSelectingIdx(idx)}
                                 className="px-6 py-3 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-600 transition-all flex items-center gap-2"
                               >
                                  <MousePointer2 size={14}/> שליפה מהמלאי
                               </button>
                             ) : item.status === 'matched' ? (
                               <button 
                                 onClick={() => injectDnaSync(idx, item.product)}
                                 className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-emerald-600 transition-all"
                               >
                                  אמן DNA
                               </button>
                             ) : (
                               <ShieldCheck className="text-emerald-500 ml-4" size={36} />
                             )}
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- High-End Visual Inventory Management --- */}
        <div className="bg-white rounded-[60px] border border-slate-200 shadow-2xl overflow-hidden min-h-[700px] flex flex-col relative">
           <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-5">
                 <HardDrive size={36} className="text-blue-600" />
                 <h2 className="text-3xl font-black italic text-slate-900 uppercase tracking-tighter leading-none">ניהול מלאי ודיוק הצלבות</h2>
              </div>
              <div className="relative w-full md:w-[450px] group">
                <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input 
                  placeholder="חיפוש מק''ט, שם או מילת מפתח..." 
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border-2 border-slate-100 pr-14 pl-6 py-4 rounded-[22px] font-bold outline-none focus:border-blue-500 transition-all shadow-inner text-sm"
                />
              </div>
           </div>

           <div className="overflow-x-auto scrollbar-hide flex-1">
              <table className="w-full text-right border-separate border-spacing-y-4 px-10 pb-10">
                 <thead>
                    <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">
                       <th className="p-6">מוצר וזיהוי</th>
                       <th className="p-6">שם רשמי (Comax)</th>
                       <th className="p-6 text-center">מצב DNA</th>
                       <th className="p-6">מילון מילים (Slang)</th>
                       <th className="p-6 text-left">ניהול</th>
                    </tr>
                 </thead>
                 <tbody>
                    {filteredInventory.map((item) => {
                      const isBeingSelected = selectingIdx !== null;
                      return (
                        <motion.tr 
                          key={item.sku} 
                          whileHover={isBeingSelected ? { scale: 1.01 } : {}}
                          onClick={() => {
                             if (isBeingSelected) {
                                injectDnaSync(selectingIdx!, item);
                                setSelectingIdx(null);
                             }
                          }}
                          className={`bg-slate-50 hover:bg-blue-50/50 transition-all group rounded-3xl ${isBeingSelected ? 'cursor-pointer ring-4 ring-blue-500/20' : ''}`}
                        >
                           <td className="p-6 first:rounded-r-[35px]">
                              <div className="flex items-center gap-6">
                                 <div className="w-20 h-20 rounded-[28px] overflow-hidden bg-white shadow-lg border-4 border-white group-hover:scale-110 transition-transform relative shrink-0">
                                    {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <ImageIcon size={24} className="m-auto text-slate-100 mt-6" />}
                                 </div>
                                 <div>
                                    <p className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase w-fit mb-2 shadow-sm">SKU {item.sku}</p>
                                    <p className="font-bold text-xs text-slate-400 italic">₪{item.price || '--'}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="p-6">
                              <p className="font-black text-xl text-slate-900 italic tracking-tight">{item.product_name || "ללא שם"}</p>
                              <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{item.category || 'כללי'}</p>
                           </td>
                           <td className="p-6 text-center">
                              <div className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase border-2 ${item.keywords ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
                                 {item.keywords ? <ShieldCheck size={14}/> : <AlertCircle size={14}/>}
                                 {item.keywords ? 'Trained' : 'Missing DNA'}
                              </div>
                           </td>
                           <td className="p-6">
                              <div className="flex flex-wrap gap-2 max-w-[350px]">
                                 {(item.keywords || "").split(',').slice(0, 5).map((tag: string, i: number) => (
                                   <span key={i} className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-[9px] font-bold text-slate-500 uppercase shadow-sm">{tag.trim()}</span>
                                 ))}
                                 {!item.keywords && <span className="text-slate-300 italic text-[10px]">ממתין לאימון...</span>}
                              </div>
                           </td>
                           <td className="p-6 last:rounded-l-[35px] text-left">
                              <div className="flex gap-3 justify-end opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                 <button onClick={(e) => {e.stopPropagation(); setEditingItem(item);}} className="p-4 bg-white border border-slate-200 rounded-2xl hover:text-blue-600 transition-all shadow-sm active:scale-90"><Edit3 size={20}/></button>
                                 <button onClick={async (e) => {e.stopPropagation(); if(confirm("למחוק?")) await supabase.from('inventory').delete().eq('sku', item.sku); fetchData(); }} className="p-4 bg-white border border-slate-200 rounded-2xl hover:text-rose-600 transition-all shadow-sm active:scale-90"><Trash2 size={20}/></button>
                              </div>
                           </td>
                        </motion.tr>
                      );
                    })}
                 </tbody>
              </table>
           </div>
        </div>
      </div>

      {/* --- Detailed Editor Modal --- */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl">
             <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[65px] w-full max-w-5xl overflow-hidden shadow-2xl border border-white/10">
                <div className="bg-slate-900 p-12 text-white flex justify-between items-center relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[120px] rounded-full" />
                   <div className="text-right z-10">
                      <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Product DNA Studio</h2>
                      <p className="text-blue-400 text-[10px] font-bold uppercase mt-3 tracking-[0.5em] italic flex items-center gap-2 justify-end">
                         <Target size={14}/> Accurate Inventory Mapping
                      </p>
                   </div>
                   <button onClick={() => setEditingItem(null)} className="p-6 bg-white/5 rounded-3xl hover:bg-white/10 border border-white/5"><X size={32}/></button>
                </div>

                <div className="p-16 grid grid-cols-1 md:grid-cols-2 gap-10 bg-slate-50/30 overflow-y-auto max-h-[60vh] scrollbar-hide text-right">
                   <div className="space-y-6">
                      <EditField label="שם מוצר רשמי" value={editingItem.product_name} onChange={(v:any) => setEditingItem({...editingItem, product_name: v})} />
                      <EditField label="מק''ט (SKU)" value={editingItem.sku} onChange={(v:any) => setEditingItem({...editingItem, sku: v})} />
                      <EditField label="מחירון" value={editingItem.price} type="number" onChange={(v:any) => setEditingItem({...editingItem, price: v})} />
                      <EditField label="מילון שטח (Keywords)" value={editingItem.keywords} placeholder="הפרד בפסיקים: שומשום, סומסום, שומו" onChange={(v:any) => setEditingItem({...editingItem, keywords: v})} />
                   </div>
                   <div className="space-y-6">
                      <EditField label="לינק תמונה 1" value={editingItem.image_url} onChange={(v:any) => setEditingItem({...editingItem, image_url: v})} />
                      <EditField label="לינק תמונה 2" value={editingItem.image_url_2} onChange={(v:any) => setEditingItem({...editingItem, image_url_2: v})} />
                      <EditField label="שיטת יישום (Advisor)" value={editingItem.application_method} onChange={(v:any) => setEditingItem({...editingItem, application_method: v})} />
                      <EditField label="תיאור DNA מלא" value={editingItem.description} type="textarea" onChange={(v:any) => setEditingItem({...editingItem, description: v})} />
                   </div>
                </div>

                <div className="p-12 border-t border-slate-100 bg-white flex justify-end gap-4">
                   <button onClick={() => setEditingItem(null)} className="px-10 py-5 rounded-2xl font-black text-slate-400 hover:text-slate-900 transition-all uppercase text-xs italic">ביטול X</button>
                   <button onClick={async () => {
                     const { error } = await supabase.from('inventory').upsert(editingItem);
                     if (!error) { toast.success("המלאי עודכן! 🦾"); setEditingItem(null); fetchData(); }
                   }} className="px-16 py-5 bg-blue-600 text-white rounded-[30px] font-black text-sm uppercase italic shadow-2xl flex items-center gap-4 hover:bg-blue-700 transition-all border-b-8 border-blue-800">
                      <Save size={20}/> שמור שינויים 🦾
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Selection Overlay */}
      <AnimatePresence>
        {selectingIdx !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[450] bg-blue-600/20 backdrop-blur-sm pointer-events-none flex items-center justify-center">
             <div className="bg-white p-10 rounded-full shadow-2xl border-4 border-blue-600 pointer-events-auto animate-bounce flex items-center gap-6">
                <MousePointer2 size={32} className="text-blue-600" />
                <p className="font-black text-blue-600 uppercase text-2xl italic">בחר מוצר מהמלאי למטה להצלבת DNA 🎯</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="py-24 border-t border-slate-100 opacity-20 text-center uppercase text-[12px] font-black tracking-[1.5em] italic text-slate-900">Saban OS Neural Engine V60.0</footer>
      <style jsx global>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}

function StatBox({ label, value, icon, color = "text-slate-900" }: any) {
  return (
    <div className="bg-slate-50 border border-slate-100 px-8 py-5 rounded-[30px] shadow-inner flex flex-col items-center min-w-[150px]">
       <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">
          {icon} {label}
       </div>
       <span className={`text-3xl font-black italic tracking-tighter ${color}`}>{value}</span>
    </div>
  );
}

function EditField({ label, value, type = "text", onChange, placeholder }: any) {
  return (
    <div className="space-y-2">
       <label className="text-[10px] font-black text-slate-400 uppercase mr-1 tracking-widest italic">{label}</label>
       {type === 'textarea' ? (
         <textarea onChange={(e) => onChange(e.target.value)} className="w-full bg-white border border-slate-200 p-5 rounded-[30px] font-bold text-sm outline-none focus:ring-8 ring-blue-500/5 h-32 text-right shadow-inner" defaultValue={value} placeholder={placeholder} />
       ) : (
         <input type={type} onChange={(e) => onChange(e.target.value)} className="w-full bg-white border border-slate-200 p-5 rounded-[25px] font-bold text-sm outline-none focus:ring-8 ring-blue-500/5 text-right shadow-inner" defaultValue={value} placeholder={placeholder} />
       )}
    </div>
  );
}
