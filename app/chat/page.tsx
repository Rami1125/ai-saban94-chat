"use client";

import React, { useState, useEffect } from "react";
import { ChatWindow } from "@/components/ChatWindow";
import { Composer } from "@/components/chat/Composer"; 
import { SafeIcon } from "@/components/SafeIcon";
import { SafeChatIcon } from "@/components/SafeChatIcon";
import { useConfig } from "@/context/BusinessConfigContext";
import { useChatActions } from "@/context/ChatActionsContext";
import { ProductCard } from "@/components/chat/ProductCard";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

type TabType = "chat" | "catalog" | "inventory";

export default function SabanEnterpriseDashboard() {
  const config = useConfig();
  const { messages } = useChatActions();
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase.from("inventory").select("*").order("product_name");
    if (data) setProducts(data);
    setLoading(false);
  }

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#F1F5F9] flex h-screen overflow-hidden font-sans select-none" dir="rtl">
      
      {/* Sidebar - מיתוג יוקרתי */}
      <aside className="hidden lg:flex flex-col w-72 bg-[#0B2C63] text-white p-8 space-y-10 shadow-2xl z-50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-tr from-blue-400 to-blue-600 rounded-2xl shadow-lg rotate-3">
            <SafeIcon name="HardHat" className="text-white" size={28} />
          </div>
          <div>
            <h2 className="font-black text-2xl tracking-tighter leading-none">ח. סבן</h2>
            <span className="text-[10px] text-blue-300 font-bold uppercase tracking-[0.2em]">Building AI</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <TabButton active={activeTab === 'chat'} icon={<SafeChatIcon size={20}/>} label="יועץ חכם" onClick={() => setActiveTab('chat')} />
          <TabButton active={activeTab === 'catalog'} icon={<SafeIcon name="Grid" size={20}/>} label="קטלוג דיגיטלי" onClick={() => setActiveTab('catalog')} />
          <TabButton active={activeTab === 'inventory'} icon={<SafeIcon name="Table" size={20}/>} label="ניהול מלאי" onClick={() => setActiveTab('inventory')} />
        </nav>

        <div className="bg-white/5 p-5 rounded-[24px] border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2 text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase">Live Connection</span>
          </div>
          <p className="text-[11px] text-blue-100 leading-relaxed font-medium">המערכת מחוברת למסד הנתונים המאוחד. כל המידע מעודכן לשנת 2026.</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="flex-1 flex flex-col bg-slate-50 relative h-full">
        
        {/* Header פרימיום */}
        <header className="h-20 bg-white/70 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-40">
          <div>
            <h1 className="text-xl font-black text-slate-900">
              {activeTab === 'chat' ? 'Saban Intelligent Assistant' : activeTab === 'catalog' ? 'Product Catalog' : 'Inventory Management'}
            </h1>
            <p className="text-[11px] text-slate-400 font-bold">ברוך הבא, מנהל מערכת</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-slate-100 px-4 py-2 rounded-2xl text-[11px] font-black text-slate-600 border border-slate-200 uppercase">
               {products.length} Products
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative flex flex-col">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' && (
              <motion.div initial={{ opacity:0, x: 20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="flex-1 flex flex-col h-full max-w-6xl w-full mx-auto p-4 lg:p-6 overflow-hidden">
                <div className="flex-1 bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden relative">
                  <ChatWindow />
                </div>
                <div className="mt-4 bg-white p-6 rounded-[40px] shadow-xl border border-slate-100">
                  <Composer />
                </div>
              </motion.div>
            )}

            {activeTab === 'catalog' && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex-1 overflow-y-auto p-8 custom-scrollbar grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                 {loading ? <div className="col-span-full text-center py-20 font-black text-slate-300">טוען נתונים...</div> : products.map(p => <ProductCard key={p.sku} product={p} />)}
              </motion.div>
            )}

            {activeTab === 'inventory' && (
              <motion.div initial={{ opacity:0, scale: 0.95 }} animate={{ opacity:1, scale: 1 }} className="flex-1 p-8 overflow-hidden flex flex-col h-full">
                <div className="bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
                  <div className="overflow-auto custom-scrollbar flex-1">
                    <table className="w-full text-right border-collapse">
                      <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
                        <tr>
                          <th className="p-5 text-[10px] font-black uppercase text-slate-400">מק"ט</th>
                          <th className="p-5 text-[10px] font-black uppercase text-slate-400">שם המוצר</th>
                          <th className="p-5 text-[10px] font-black uppercase text-slate-400 text-center">מחיר</th>
                          <th className="p-5 text-[10px] font-black uppercase text-slate-400 text-center">סטטוס</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {products.map(p => (
                          <tr key={p.sku} className="hover:bg-blue-50/50 transition-colors group">
                            <td className="p-5 font-mono font-bold text-blue-600">{p.sku}</td>
                            <td className="p-5 font-black text-slate-800">{p.product_name}</td>
                            <td className="p-5 text-center font-black">₪{p.price || '--'}</td>
                            <td className="p-5 text-center"><span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter italic">Available</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}

// רכיב עזר לכפתורי הניווט
function TabButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black text-sm transition-all duration-300 ${active ? 'bg-white text-[#0B2C63] shadow-xl translate-x-[-8px]' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
