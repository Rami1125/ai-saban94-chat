"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Zap, Users, Scale, ShieldAlert, 
  Menu, X, Bell, LogOut, Search, Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Saban Admin Pro - Shared Layout
 * ------------------------------
 * Manages the navigation and executive theme for all sub-pages.
 */

const LOGO_PATH = "/ai.png";

const NAV_ITEMS = [
  { href: '/admin_pro', label: 'לוח בקרה', icon: LayoutDashboard },
  { href: '/admin_pro/dna', label: 'ניהול DNA וחוקים', icon: Zap },
  { href: '/admin_pro/vip', label: 'לקוחות VIP', icon: Users },
  { href: '/admin_pro/inventory', label: 'משקלים ומלאי', icon: Scale },
  { href: '/admin_pro/approvals', label: 'מרכז אישורים', icon: ShieldAlert, badge: 2 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-[#F0F2F5] text-slate-900 font-sans overflow-hidden" dir="rtl">
      
      {/* Sidebar */}
      <aside className={`bg-[#0F172A] text-white transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-20'} flex flex-col z-50`}>
        <div className="p-6 flex items-center gap-4 border-b border-white/5 h-24 shrink-0">
          <div className="w-12 h-12 bg-white rounded-2xl p-2 shrink-0 shadow-lg">
            <img src={LOGO_PATH} alt="Saban" className="w-full h-full object-contain" />
          </div>
          {isSidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
              <h1 className="font-black text-xl italic tracking-tighter leading-none">SABAN OS</h1>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Admin Pro 🦾</p>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 relative group cursor-pointer ${
                  isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}>
                  <item.icon size={24} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} />
                  {isSidebarOpen && (
                    <span className="font-black text-sm uppercase tracking-tighter italic flex-1 text-right">{item.label}</span>
                  )}
                  {isSidebarOpen && item.badge && (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-lg animate-pulse">{item.badge}</span>
                  )}
                  {!isSidebarOpen && isActive && (
                    <div className="absolute left-0 w-1.5 h-8 bg-blue-500 rounded-r-full" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-4">
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center justify-center p-3 hover:bg-white/5 rounded-xl transition-colors text-slate-500">
              <Monitor size={20} className={isSidebarOpen ? "" : "rotate-180"} />
           </button>
           <button className="w-full flex items-center justify-center p-3 hover:bg-rose-500/10 rounded-xl transition-colors text-slate-500 hover:text-rose-500">
              <LogOut size={20} />
           </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">
              {NAV_ITEMS.find(i => i.href === pathname)?.label || 'ניהול מערכת'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100 font-black text-[10px] uppercase tracking-widest">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Live Brain Online
            </div>
            <button className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full" />
            </button>
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black italic shadow-md">R</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          {children}
        </main>
      </div>
    </div>
  );
}
