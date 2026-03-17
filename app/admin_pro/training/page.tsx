"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Zap, Sparkles, ClipboardList, Database, ArrowLeftRight, 
  CheckCircle2, SearchCode, PackageSearch, Save, Loader2, 
  Trash2, Edit3, Target, Layout, ShieldCheck, RefreshCw,
  Search, Package, Image as ImageIcon, Plus, X, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban OS V55.0 - DNA Training Studio
 * -------------------------------------------
 * - Feature: Double Injection (WhatsApp vs Comax).
 * - Core: Neural cross-referencing & direct Inventory updates.
 * - UX: Extreme Rounded (Stitched Elite), Slate-950.
 */

export default function DnaTrainingStudio() {
  const [mounted, setMounted] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States for Injection
  const [inputRaw, setInputRaw] = useState(""); // הטקסט מהשטח
  const [outputRaw, setOutputRaw] = useState(""); // הטקסט מהקומקס
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mappedItems, setMappedItems] = useState<any[]>([]);

  // Editing state
  const [editingProduct, setEditingProduct] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    const { data } = await supabase.from('inventory').select('*').order('product_name');
    setInventory(data || []);
    setLoading(false);
  };

  // --- מנוע הפירוק וההצלבה (The Brain) ---
  const handleTrainAI = () => {
    if (!inputRaw || !outputRaw) return toast.error("חובה להדביק גם צורך וגם ביצוע");
    setIsAnalyzing(true);

    setTimeout(() => {
      // 1. פירוק הודעת שטח
      const inputLines = inputRaw.split('\n').map(l => l.trim()).filter(l => l.length > 2);
      
      // 2. פירוק תעודת משלוח (זיהוי מק"טים)
      const outputLines = outputRaw.split('\n').map(l => l.trim()).filter(l => l.length > 2);
      const deliverySkus = outputLines.map(line => {
        const parts = line.split('\t'); // מותאם לפורמט קומקס
        return {
          sku: parts[2] || line.match(/\d{5,}/)?.[0],
          name: parts[1] || line,
          full: line
        };
      }).filter(s => s.sku);

      // 3. הצלבה ראשונית
      const results = inputLines.map((line) => {
        const cleanLine = line.toLowerCase().replace(/[*\-]/g, '').trim();
        
        // ניסיון הצלבה מול המק"טים שבתעודת המשלוח
        const matchedInDelivery = deliverySkus.find(ds => 
           cleanLine.includes(ds.sku || "") || 
           ds.name.toLowerCase().includes(cleanLine.split(' ')[1] || "___")
        );

        // שליפה מהמלאי לפי המק"ט שנמצא
        const dbProduct = inventory.find(inv => inv.sku === matchedInDelivery?.sku);

        return {
          rawInput: line,
          detectedSku: dbProduct?.sku || null,
          product: dbProduct || null,
          status: dbProduct ? 'confirmed' : 'pending',
          qty: line.match(/\d+/)?.[0] || "1"
        };
      });

      setMappedItems(results);
      setIsAnalyzing(false);
      toast.success("הצלבה הושלמה - המוח מוכן לאישור");
    }, 1200);
  };

  // --- הזרקת DNA: עדכון מילות מפתח ותגיות למוצר ---
  const injectDNA = async (idx: number) => {
    const item = mappedItems[idx];
    if (!item.product || !item.detectedSku) return;

    const toastId = toast.loading(`מעדכן DNA למק"ט ${item.detectedSku}...`);
    
    try {
      // יצירת מילת מפתח מהקלט הגולמי (למשל "שומשום" או "בלק 4")
      const currentKeywords = item.product.keywords || "";
      const cleanInput = item.rawInput.replace(/[*0-9\-]/g, '').trim();
      const updatedKeywords = Array.from(new Set([...currentKeywords.split(','), cleanInput])).join(',').replace(/^,/, '');

      const { error } = await supabase
        .from('inventory')
        .update({ 
          keywords: updatedKeywords,
          search_tags: updatedKeywords,
          last_trained: new Date().toISOString()
        })
        .eq('sku', item.detectedSku);

      if (error) throw error;

      const newMapped = [...mappedItems];
      newMapped[idx].status = 'synced';
      setMappedItems(newMapped);
      
      toast.success(`ה-DNA הזרק! המוח יזהה "${cleanInput}" בפעם הבאה. 🦾`, { id: toastId });
    } catch (e) {
      toast.error("שגיאה בסנכרון DNA", { id: toastId });
    }
  };

  // --- חישוב סטטיסטיקות סטודיו ---
  const stats = useMemo(() => ({
    total: inventory.length,
    trained: inventory.filter(i => i.keywords).length,
    pending: inventory.filter(i => !i.keywords).length
  }), [inventory]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors theme="dark" />

      {/* --- Executive Header --- */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 bg-white p-10 rounded-[55px] border border-slate-100 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-40 h-full bg-blue-600/5 -skew-x-12 translate-x-10 group-hover:translate-x-5 transition-transform duration-1000" />
          <div className="flex items-center gap-8 relative z-10">
             <div className="w-20 h-20 bg-slate-900 text-blue-500 rounded-[35px] flex items-center justify-center shadow-2xl ring-8 ring-slate-50">
                <Zap size={40} fill="currentColor" />
             </div>
             <div>
                <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-slate-900">DNA Training Studio</h1>
                <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-[0.4em] flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Neural Mapping v55.0
                </p>
             </div>
          </div>

          <div className="flex items-center gap-6 relative z-10">
             <StatMini label="במלאי" value={stats.total} icon={<Package size={14}/>} />
             <StatMini label="מאומנים" value={stats.trained} icon={<ShieldCheck size={14} className="text-emerald-500"/>} color="text-emerald-600" />
             <StatMini label="ממתינים" value={stats.pending} icon={<Target size={14}/>} color="text-rose-500" />
          </div>
        </div>

        {/* --- The Double Injection Console --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white rounded-[45px] p-10 shadow-lg border border-slate-100 space-y-6">
              <div className="flex items-center gap-3">
                 <ClipboardList className="text-blue-600" size={24}/>
                 <h3 className="font-black text-slate-800 uppercase italic">1. הדבקת הצורך (שטח/WhatsApp)</h3>
              </div>
              <textarea 
                value={inputRaw} onChange={(e) => setInputRaw(e.target.value)}
                placeholder="הדבק כאן: 20 בלות שומשום, 10 מלט..."
                className="w-full h-64 bg-slate-50 border-2 border-slate-100 rounded-[30px] p-8 font-bold text-slate-700 outline-none focus:border-blue-500 transition-all text-lg shadow-inner"
              />
           </div>

           <div className="bg-slate-950 rounded-[45px] p-10 shadow-2xl space-y-6 text-white">
              <div className="flex items-center gap-3">
                 <Database className="text-emerald-400" size={24}/>
                 <h3 className="font-black uppercase italic">2. הדבקת הביצוע (מחסן/Comax)</h3>
              </div>
              <textarea 
                value={outputRaw} onChange={(e) => setOutputRaw(e.target.value)}
                placeholder="הדבק את שורות תעודת המשלוח..."
                className="w-full h-64 bg-white/5 border-2 border-white/10 rounded-[30px] p-8 font-bold text-blue-100 outline-none focus:border-emerald-500 transition-all text-lg shadow-inner"
              />
           </div>
        </div>

        <button 
          onClick={handleTrainAI}
          disabled={isAnalyzing || !inputRaw || !outputRaw}
          className="w-full bg-blue-600 text-white py-8 rounded-[35px] font-black text-2xl uppercase italic tracking-widest shadow-2xl hover:bg-blue-500 active:scale-[0.98] transition-all flex items-center justify-center gap-6 border-b-[12px] border-blue-800"
        >
           {isAnalyzing ? <Loader2 className="animate-spin" size={32}/> : <ArrowLeftRight size={32} />}
           בצע הצלבה ואימון DNA 🦾
        </button>

        {/* --- The Mapping Matrix --- */}
        <div className="bg-white rounded-[60px] p-10 md:p-16 shadow-2xl border border-slate-100 min-h-[600px]">
           <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-4">
                 <SearchCode size={32} className="text-blue-600" />
                 <h2 className="text-3xl font-black italic text-slate-900 uppercase tracking-tighter">Neural Mapping Matrix</h2>
              </div>
              <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-6 py-2 rounded-full border border-blue-100 uppercase tracking-widest">Real-time Synchronization</span>
           </div>

           {mappedItems.length === 0 ? (
             <div className="h-[400px] flex flex-col items-center justify-center opacity-10">
                <PackageSearch size={120} strokeWidth={1} />
                <p className="text-3xl font-black uppercase tracking-[0.5em] mt-10">ממתין להזרקה כפולה</p>
             </div>
           ) : (
             <div className="space-y-6">
                {mappedItems.map((item, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                    key={idx} 
                    className={`p-6 rounded-[40px] border-2 flex flex-col lg:flex-row items-center justify-between gap-8 transition-all ${
                      item.status === 'synced' ? 'bg-emerald-50 border-emerald-200' : 
                      item.status === 'confirmed' ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-slate-100 shadow-sm'
                    }`}
                  >
                     {/* Raw Request Info */}
                     <div className="flex items-center gap-8 flex-1">
                        <div className="bg-slate-900 text-white w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl italic shadow-lg shrink-0">
                           x{item.qty}
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">קלט שטח:</p>
                           <h4 className="text-xl font-black text-slate-900 leading-tight">"{item.rawInput}"</h4>
                        </div>
                     </div>

                     {/* The Mapping Link */}
                     <div className="flex items-center gap-4 text-slate-200">
                        <ArrowLeftRight size={32} className={item.status !== 'pending' ? 'text-blue-500' : ''} />
                     </div>

                     {/* DB Matched Product */}
                     <div className="flex-[1.5] flex items-center gap-6 bg-white p-4 rounded-[30px] border border-slate-100 shadow-inner group">
                        <div className={`w-20 h-20 rounded-[22px] overflow-hidden bg-slate-50 flex items-center justify-center relative border-4 border-white shadow-md ${!item.product && 'animate-pulse bg-rose-50'}`}>
                           {item.product?.image_url ? (
                             <img src={item.product.image_url} className="w-full h-full object-cover" />
                           ) : <ImageIcon className="text-slate-200" size={32}/>}
                           {item.status === 'synced' && <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center text-white"><ShieldCheck size={40}/></div>}
                        </div>
                        <div className="text-right flex-1">
                           <div className="flex items-center gap-3">
                              <p className={`font-black text-lg ${item.product ? 'text-slate-900' : 'text-rose-500 italic'}`}>
                                 {item.product ? item.product.product_name : 'דרושה הצלבה ידנית'}
                              </p>
                              {item.product && <button onClick={() => setEditingProduct(item.product)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-300 transition-all"><Edit3 size={14}/></button>}
                           </div>
                           {item.product && <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mt-1">SKU: {item.product.sku} | Keywords: {item.product.keywords || "None"}</p>}
                        </div>
                     </div>

                     {/* Actions */}
                     <div className="flex gap-3 shrink-0">
                        {item.status === 'pending' ? (
                          <button 
                             onClick={() => {
                               // פתיחת חיפוש מהיר במלאי
                               toast.info("חפש מוצר תואם מהמלאי להצלבה");
                             }}
                             className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95"
                          >
                             בחר מהמלאי
                          </button>
                        ) : item.status === 'confirmed' ? (
                          <button 
                             onClick={() => injectDNA(idx)}
                             className="px-10 py-5 bg-emerald-500 text-white rounded-[25px] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center gap-3 active:scale-95 transition-all border-b-4 border-emerald-700"
                          >
                             <Sparkles size={18}/> הזרק לזיכרון
                          </button>
                        ) : (
                          <div className="px-10 py-5 bg-slate-100 text-emerald-600 rounded-[25px] font-black text-xs uppercase flex items-center gap-3 border-2 border-emerald-100">
                             <CheckCircle2 size={18}/> סונכרן ב-DNA
                          </div>
                        )}
                     </div>
                  </motion.div>
                ))}
             </div>
           )}
        </div>
      </div>

      {/* --- Product Editor Modal --- */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl">
             <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[65px] w-full max-w-5xl overflow-hidden shadow-2xl border border-white/10">
                <div className="bg-slate-900 p-12 text-white flex justify-between items-center relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[120px] rounded-full" />
                   <div className="text-right z-10">
                      <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">DNA Product Editor</h2>
                      <p className="text-blue-400 text-[10px] font-bold uppercase mt-3 tracking-[0.5em] italic flex items-center gap-2 justify-end">
                         <Layout size={14}/> Direct Row Modification
                      </p>
                   </div>
                   <button onClick={() => setEditingProduct(null)} className="p-6 bg-white/5 rounded-3xl hover:bg-white/10 transition-all border border-white/5"><X size={32}/></button>
                </div>

                <div className="p-16 grid grid-cols-1 md:grid-cols-2 gap-10 bg-slate-50/30 overflow-y-auto max-h-[60vh] scrollbar-hide text-right">
                   <div className="space-y-6">
                      <h4 className="font-black text-slate-400 uppercase text-[10px] tracking-widest mr-2">Core Identity</h4>
                      <EditField label="שם מוצר" value={editingProduct.product_name} />
                      <EditField label="מק''ט (SKU)" value={editingProduct.sku} disabled />
                      <EditField label="קטגוריה" value={editingProduct.category} />
                      <EditField label="מחירון" value={editingProduct.price} type="number" />
                   </div>
                   <div className="space-y-6">
                      <h4 className="font-black text-slate-400 uppercase text-[10px] tracking-widest mr-2">Media & Knowledge</h4>
                      <EditField label="לינק תמונה" value={editingProduct.image_url} />
                      <EditField label="מילות מפתח (DNA)" value={editingProduct.keywords} />
                      <EditField label="שיטת יישום" value={editingProduct.application_method} />
                      <EditField label="תיאור DNA" value={editingProduct.description} type="textarea" />
                   </div>
                </div>

                <div className="p-12 border-t border-slate-100 bg-white flex justify-end gap-4">
                   <button onClick={() => setEditingProduct(null)} className="px-10 py-5 rounded-2xl font-black text-slate-400 hover:text-slate-900 transition-all uppercase text-xs italic">ביטול X</button>
                   <button className="px-16 py-5 bg-slate-900 text-white rounded-[30px] font-black text-sm uppercase italic tracking-[0.2em] shadow-2xl flex items-center gap-4 hover:bg-blue-600 transition-all">
                      <Save size={20}/> שמור שינויים במלאי 🦾
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-24 border-t border-slate-100 opacity-20 text-center uppercase text-[12px] font-black tracking-[1.5em] italic">Saban OS Learning Engine V55.0</footer>
      <style jsx global>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}

// --- Helper UI Components ---

function StatMini({ label, value, icon, color = "text-slate-900" }: any) {
  return (
    <div className="bg-slate-50 border border-slate-100 px-6 py-3 rounded-2xl shadow-inner flex flex-col items-center min-w-[120px]">
       <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase mb-1">
          {icon} {label}
       </div>
       <span className={`text-2xl font-black italic tracking-tighter ${color}`}>{value}</span>
    </div>
  );
}

function EditField({ label, value, type = "text", disabled = false }: any) {
  return (
    <div className="space-y-2">
       <label className="text-[10px] font-black text-slate-400 uppercase mr-1">{label}</label>
       {type === 'textarea' ? (
         <textarea className="w-full bg-white border border-slate-200 p-4 rounded-2xl font-bold text-sm outline-none focus:ring-4 ring-blue-500/5 h-32" defaultValue={value} />
       ) : (
         <input disabled={disabled} type={type} className="w-full bg-white border border-slate-200 p-4 rounded-2xl font-bold text-sm outline-none focus:ring-4 ring-blue-500/5 disabled:bg-slate-50 disabled:text-slate-300" defaultValue={value} />
       )}
    </div>
  );
}
