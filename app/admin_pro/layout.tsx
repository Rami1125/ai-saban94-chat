"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Zap, Users, Scale, ShieldAlert, 
  Monitor, ShieldCheck, ShoppingBag, PlusCircle, Smartphone
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Toaster } from "sonner";

/**
 * Saban Admin Pro - Shared Layout V29.5
 * ------------------------------------
 * הוספת קישור "ממשק שטח" (Mobile Ops) לתפריט הניווט.
 */

const LOGO_PATH = "/ai.png";

const NAV_ITEMS = [
  { href: '/admin_pro', label: 'לוח בקרה', icon: LayoutDashboard },
  { href: '/admin_pro/orders', label: 'ניהול הזמנות', icon: ShoppingBag },
  { href: '/admin_pro/orders/create', label: 'יצירת הזמנה', icon: PlusCircle, highlight: true },
  { href: '/admin_pro/logistics/mobile', label: 'ממשק שטח (נהג/מחסן)', icon: Smartphone }, // הקישור החדש
  { href: '/admin_pro/dna', label: 'ניהול DNA וחוקים', icon: Zap },
  { href: '/admin_pro/vip', label: 'לקוחות VIP', icon: Users },
  { href: '/admin_pro/inventory', label: 'משקלים ומלאי', icon: Scale },
  { href: '/admin_pro/approvals', label: 'מרכז אישורים', icon: ShieldAlert, badge: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden" dir="rtl">
      <Toaster position="top-center" richColors />
      
      <aside className={`bg-[#0F172A] text-white transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-24'} flex flex-col z-50 shadow-2xl shrink-0`}>
        <div className="p-6 flex items-center gap-4 border-b border-white/5 h-24 shrink-0">
          <div className="w-12 h-12 bg-white rounded-2xl p-2 shrink-0 shadow-lg ring-4 ring-blue-500/10">
            <img src={LOGO_PATH} alt="Saban" className="w-full h-full object-contain" />
          </div>
          {isSidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
              <h1 className="font-black text-xl italic tracking-tighter leading-none text-white">SABAN OS</h1>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Admin Executive</p>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 relative group cursor-pointer ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' 
                    : item.highlight 
                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}>
                  <item.icon size={24} className={isActive ? 'text-white' : item.highlight ? 'text-emerald-400' : 'text-slate-500 group-hover:text-blue-400'} />
                  {isSidebarOpen && (
                    <span className="font-black text-sm uppercase tracking-tighter italic flex-1 text-right">{item.label}</span>
                  )}
                  {isSidebarOpen && item.badge && (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-lg animate-pulse">Live</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center justify-center p-3 hover:bg-white/5 rounded-xl transition-colors text-slate-500">
              <Monitor size={20} className={isSidebarOpen ? "" : "rotate-180"} />
           </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-8 flex items-center justify-between shrink-0 z-40">
          <div className="flex items-center gap-4 text-right">
             <ShieldCheck className="text-emerald-500" size={32} />
             <div>
               <h2 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase leading-none">
                 {NAV_ITEMS.find(i => i.href === pathname)?.label || 'ניהול מערכת'}
               </h2>
               <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Live Secured System</p>
             </div>
          </div>
          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black italic shadow-xl border-2 border-white">R</div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 scrollbar-hide bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
}
