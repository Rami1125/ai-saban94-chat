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

type TabType = "chat" | "products" | "inventory";

export default function SabanMainPage() {
  const config = useConfig();
  const { messages } = useChatActions();
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [mounted, setMounted] = useState(false);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchProducts();
  }, []);

  // שליפת כל המוצרים מהטבלה ב-Supabase
  const fetchProducts = async () => {
    setIsLoadingDb(true);
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order("product_name", { ascending: true });
      
      if (data) setDbProducts(data);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setIsLoadingDb(false);
    }
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#F1F5F9] flex flex-col md:flex-row h-screen overflow-hidden font-sans" dir="rtl">
      
      {/* Sidebar - תפריט ניווט טאבים */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0B2C63] text-white p-6 space-y-8 shadow-2xl z-30">
        <div className="flex items-center gap-3 border-b border-white/10 pb-6">
          <div className="p-2 bg-white rounded-xl shadow-lg">
            <SafeIcon name="Zap" className="text-[#0B2C63]" size={24} fill="currentColor" />
          </div>
          <span className="font-black text-xl tracking-tighter">{config.businessName}</span>
        </div>

        <nav className="flex-1 space-y-4">
          <button 
            onClick={() => setActiveTab("chat")}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'chat' ? 'bg-white/20 text-white shadow-inner' : 'text-white/60 hover:text-white'}`}
          >
            <SafeChatIcon size={20} />
            <span>צ'אט ייעוץ</span>
          </button>

          <button 
            onClick={() => setActiveTab("products")}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'products' ? 'bg-white/20 text-white shadow-inner' : 'text-white/60 hover:text-white'}`}
          >
            <SafeIcon name="LayoutGrid" size={20} />
            <span>מוצרים</span>
          </button>

          <button 
            onClick={() => setActiveTab("inventory")}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'inventory' ? 'bg-white/20 text-white shadow-inner' : 'text-white/60 hover:text-white'}`}
          >
            <SafeIcon name="Database" size={20} />
            <span>מלאי</span>
          </button>
        </nav>
      </aside>

      {/* אזור התוכן המשתנה */}
      <section className="flex-1 flex flex-col relative overflow-hidden h-full">
        
        {/* Header סטטי */}
        <header className="flex items-center justify-between p-4 bg-white border-b border-slate-200 z-10 shadow-sm">
          <h1 className="text-lg font-black text-slate-900">
            {activeTab === "chat" && "צ'אט מומחה AI"}
            {activeTab === "products" && "קטלוג מוצרים דיגיטלי"}
            {activeTab === "inventory" && "מצב מלאי מעודכן"}
          </h1>
          <div className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black border border-blue-100 uppercase tracking-tighter">
            {activeTab === "chat" ? `${messages.length} הודעות` : `${dbProducts.length} פריטים`}
          </div>
        </header>

        {/* תצוגה מותנית לפי הטאב הנבחר */}
        <div className="flex-1 overflow-hidden relative p-4 flex flex-col">
          
          {/* טאב 1: צ'אט */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto overflow-hidden">
              <div className="flex-1 bg-white rounded-t-[40px] shadow-xl border border-slate-100 overflow-hidden">
                <ChatWindow />
              </div>
              <div className="bg-white border-t border-slate-100 px-6 py-8 z-20 shadow-lg rounded-b-[40px] mb-4">
                <Composer />
              </div>
            </div>
          )}

          {/* טאב 2: מוצרים (שליפה מהטבלה) */}
          {activeTab === "products" && (
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoadingDb ? (
                  <div className="col-span-full text-center py-20 animate-pulse font-bold text-slate-400 uppercase">טוען קטלוג סבן...</div>
                ) : (
                  dbProducts.map((p) => <ProductCard key={p.sku} product={p} />)
                )}
              </div>
            </div>
          )}

          {/* טאב 3: מלאי (תצוגת טבלה נקייה) */}
          {activeTab === "inventory" && (
            <div className="flex-1 bg-white rounded-[30px] shadow-xl border border-slate-100 overflow-hidden m-2">
              <div className="overflow-x-auto h-full">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-widest">
                    <tr>
                      <th className="p-4">מק"ט</th>
                      <th className="p-4">שם המוצר</th>
                      <th className="p-4 text-center">מחיר</th>
                      <th className="p-4 text-center">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dbProducts.map((p) => (
                      <tr key={p.sku} className="hover:bg-blue-50/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-blue-600">{p.sku}</td>
                        <td className="p-4 font-bold text-slate-800">{p.product_name}</td>
                        <td className="p-4 text-center font-black">₪{p.price || '--'}</td>
                        <td className="p-4 text-center">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-bold italic">במלאי שוטף</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <footer className="px-8 pb-4 text-[9px] text-slate-400 font-black uppercase tracking-widest">
          SABAN BUILDING MATERIALS • PROD V2.5
        </footer>
      </section>
    </main>
  );
}
