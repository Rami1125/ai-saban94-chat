"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, MessageSquare, ShieldAlert, Users, Settings, 
  Search, Bell, Scale, Truck, AlertTriangle, CheckCircle2, 
  ChevronRight, ArrowUpRight, Filter, Ghost, Zap, BarChart3,
  MoreHorizontal, Plus, Power, Edit3, Trash2, Smartphone, Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Saban OS V24.0 - The Executive Control Room
 * -------------------------------------------
 * This dashboard manages the Saban AI Logistics Brain.
 * - Live Monitoring of VIP Chats (Bar Orenil, etc.)
 * - DNA Rule Management
 * - Payload & Weight Enforcement Controls
 */

const LOGO_PATH = "/ai.png";

// --- Mock Data: Active VIP Conversations ---
const ACTIVE_CHATS = [
  { 
    id: 1, 
    customer: "בר אורניל", 
    project: "סטרומה 4, הרצליה", 
    status: "alert", 
    reason: "חריגת משקל (14 טון)", 
    lastMsg: "אבל אני צריך את הבלה ה-19 דחוף!", 
    time: "2 דק'"
  },
  { 
    id: 2, 
    customer: "אבי לוי", 
    project: "ההסתדרות 28, רעננה", 
    status: "success", 
    reason: "הזמנה אושרה", 
    lastMsg: "תודה אחי, שלחתי לווצאפ.", 
    time: "15 דק'"
  },
  { 
    id: 3, 
    customer: "אשר לוי", 
    project: "רעננה", 
    status: "warning", 
    reason: "כפל מוצר זוהה", 
    lastMsg: "למה המוח שואל אם הזמנתי שלשום?", 
    time: "1 שעה"
  }
];

// --- Mock Data: System DNA Rules ---
const DNA_RULES = [
  { id: "R1", name: "חוק ה-12 טון", category: "לוגיסטיקה", status: true, desc: "חוסם הזמנה מעל 18 בלות" },
  { id: "R2", name: "מניעת כפילויות", category: "שירות", status: true, desc: "סורק היסטוריה של 48 שעות" },
  { id: "R3", name: "מומחה סיקה 107", category: "מקצועי", status: true, desc: "הזרקת מחשבון איטום וסרט" }
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('monitor');
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-[#F0F2F5] text-slate-900 font-sans overflow-hidden" dir="rtl">
      
      {/* Sidebar - Desktop */}
      <aside className={`bg-[#0F172A] text-white transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-20'} flex flex-col hidden lg:flex`}>
        <div className="p-8 flex items-center gap-4 border-b border-white/5">
          <div className="w-12 h-12 bg-white rounded-2xl p-2 shrink-0 shadow-lg">
            <img src={LOGO_PATH} alt="Saban" className="w-full h-full object-contain" />
          </div>
          {isSidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="font-black text-xl italic tracking-tighter leading-none">SABAN OS</h1>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Admin V24.0</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          <NavItem icon={<LayoutDashboard />} label="לוח בקרה" active={activeTab === 'monitor'} onClick={() => setActiveTab('monitor')} collapsed={!isSidebarOpen} />
          <NavItem icon={<Zap />} label="ניהול DNA וחוקים" active={activeTab === 'dna'} onClick={() => setActiveTab('dna')} collapsed={!isSidebarOpen} />
          <NavItem icon={<Users />} label="לקוחות VIP" active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} collapsed={!isSidebarOpen} />
          <NavItem icon={<Scale />} label="משקלים ומלאי" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} collapsed={!isSidebarOpen} />
          <NavItem icon={<ShieldAlert />} label="מרכז אישורים" active={activeTab === 'approvals'} onClick={() => setActiveTab('approvals')} collapsed={!isSidebarOpen} badge={2} />
        </nav>

        <div className="p-4 border-t border-white/5 space-y-4">
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="w-full flex items-center justify-center p-3 hover:bg-white/5 rounded-xl transition-colors">
              <Monitor size={20} className={isSidebarOpen ? "" : "rotate-180"} />
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">
              {activeTab === 'monitor' && 'מרכז ניטור חי'}
              {activeTab === 'dna' && 'Rule Engine Studio'}
              {activeTab === 'clients' && 'ניהול VIP 360'}
            </h2>
            <div className="hidden md:flex bg-slate-100 rounded-2xl px-4 py-2 items-center gap-3 border border-slate-200 focus-within:ring-2 ring-blue-500/20 transition-all">
              <Search size={18} className="text-slate-400" />
              <input type="text" placeholder="חפש לקוח, מוצר או חוק..." className="bg-transparent outline-none text-sm font-bold w-64" />
            </div>
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

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
          
          <AnimatePresence mode="wait">
            {activeTab === 'monitor' && (
              <motion.div key="monitor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard icon={<MessageSquare className="text-blue-600"/>} label="שיחות פעילות" value="24" trend="+12%" />
                  <StatCard icon={<Scale className="text-rose-600"/>} label="חריגות משקל" value="3" trend="התראה!" color="bg-rose-50 border-rose-100 text-rose-700" />
                  <StatCard icon={<CheckCircle2 className="text-emerald-600"/>} label="הזמנות מאושרות" value="142" trend="+8%" />
                  <StatCard icon={<Truck className="text-amber-600"/>} label="משלוחים בדרך" value="18" trend="Live" />
                </div>

                {/* Main Monitor Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Feed */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-black text-slate-800 flex items-center gap-3 italic"><Monitor size={20}/> פיד אירועים חי</h3>
                        <div className="flex gap-2">
                           <button className="text-[10px] font-black uppercase bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">הכל</button>
                           <button className="text-[10px] font-black uppercase bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg border border-rose-100">חריגות</button>
                        </div>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {ACTIVE_CHATS.map(chat => (
                          <div key={chat.id} className="p-6 hover:bg-slate-50 transition-all group flex items-center justify-between">
                            <div className="flex items-center gap-5">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                                chat.status === 'alert' ? 'bg-rose-100 text-rose-600' : 
                                chat.status === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                              }`}>
                                {chat.status === 'alert' ? <ShieldAlert size={24}/> : <MessageSquare size={24}/>}
                              </div>
                              <div>
                                <h4 className="font-black text-slate-900 leading-none">{chat.customer}</h4>
                                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase italic">{chat.project}</p>
                              </div>
                            </div>
                            <div className="flex-1 px-8">
                              <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200 inline-block max-w-md">
                                <p className="text-xs font-bold text-slate-600 line-clamp-1 italic">"{chat.lastMsg}"</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className={`text-[10px] font-black uppercase ${
                                  chat.status === 'alert' ? 'text-rose-600' : 'text-slate-400'
                                }`}>{chat.reason}</p>
                                <span className="text-[10px] text-slate-300 font-bold">{chat.time}</span>
                              </div>
                              <button className="p-3 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all shadow-md group-hover:scale-105 active:scale-95 flex items-center gap-2 font-black text-[10px] uppercase">
                                 <Ghost size={16}/> השתלט
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: DNA Status & Actions */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8">
                      <h3 className="font-black text-slate-800 mb-6 italic uppercase tracking-tighter flex items-center gap-3"><Zap size={20} className="text-blue-500"/> מצב ה-DNA המבצעי</h3>
                      <div className="space-y-4">
                        {DNA_RULES.map(rule => (
                          <div key={rule.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                             <div className="text-right">
                               <p className="font-black text-sm text-slate-800">{rule.name}</p>
                               <p className="text-[10px] text-slate-400 uppercase font-bold">{rule.category}</p>
                             </div>
                             <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${rule.status ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                <button className="text-slate-400 hover:text-blue-600 transition-colors"><Edit3 size={16}/></button>
                             </div>
                          </div>
                        ))}
                      </div>
                      <button className="w-full mt-6 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black text-xs hover:border-blue-300 hover:text-blue-500 transition-all flex items-center justify-center gap-2 uppercase italic">
                         <Plus size={16}/> הזרק חוק חדש למוח
                      </button>
                    </div>

                    <div className="bg-slate-900 rounded-[32px] shadow-xl p-8 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full" />
                      <h3 className="font-black text-xl italic mb-4">סיכום ביצוע יומי</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold opacity-60 uppercase"><span>ס"כ משקל שיצא</span><span>142 טון</span></div>
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                           <motion.div initial={{ width: 0 }} animate={{ width: '75%' }} className="bg-blue-500 h-full shadow-[0_0_10px_#3b82f6]" />
                        </div>
                        <p className="text-[10px] font-bold text-blue-400">75% מקיבולת משאיות 'חכמת'</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'dna' && (
              <motion.div key="dna" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
                 <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                    <div className="text-right">
                       <h2 className="text-3xl font-black italic uppercase tracking-tighter">Rule Engine Studio</h2>
                       <p className="text-slate-400 font-bold uppercase text-xs mt-1">נהל את ה-DNA של המוח הלוגיסטי</p>
                    </div>
                    <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95 uppercase tracking-widest text-xs italic">
                       <Plus size={20}/> הוסף חוק מומחה
                    </button>
                 </div>
                 <div className="p-10">
                    <table className="w-full text-right border-separate border-spacing-y-4">
                       <thead>
                          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                             <th className="pb-4 px-6">שם ההנחיה</th>
                             <th className="pb-4 px-6">קטגוריה</th>
                             <th className="pb-4 px-6">סטטוס</th>
                             <th className="pb-4 px-6">פעולות</th>
                          </tr>
                       </thead>
                       <tbody>
                          {DNA_RULES.map(rule => (
                            <tr key={rule.id} className="bg-slate-50 hover:bg-blue-50/30 transition-all rounded-3xl overflow-hidden shadow-sm group">
                               <td className="py-6 px-6 first:rounded-r-3xl">
                                  <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 font-black italic">{rule.id}</div>
                                     <div>
                                        <p className="font-black text-slate-800">{rule.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold italic line-clamp-1">{rule.desc}</p>
                                     </div>
                                  </div>
                               </td>
                               <td className="py-6 px-6 font-bold text-xs uppercase tracking-widest text-slate-500">{rule.category}</td>
                               <td className="py-6 px-6">
                                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 w-fit text-[10px] font-black uppercase">
                                     <CheckCircle2 size={12}/> פעיל
                                  </div>
                               </td>
                               <td className="py-6 px-6 last:rounded-l-3xl">
                                  <div className="flex gap-3">
                                     <button className="p-2.5 bg-white border border-slate-200 rounded-xl hover:text-blue-600 hover:border-blue-200 transition-all"><Edit3 size={18}/></button>
                                     <button className="p-2.5 bg-white border border-slate-200 rounded-xl hover:text-rose-600 hover:border-rose-200 transition-all"><Trash2 size={18}/></button>
                                  </div>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      {/* Floating Action Button - Mobile intervention */}
      <button className="fixed bottom-10 left-10 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all lg:hidden z-50">
         <Plus size={32} />
      </button>

    </div>
  );
}

// --- Helper Components ---

function NavItem({ icon, label, active, onClick, collapsed, badge }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 relative group ${
        active ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <div className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} transition-colors shrink-0`}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
      {!collapsed && (
        <span className="font-black text-sm uppercase tracking-tighter italic flex-1 text-right">{label}</span>
      )}
      {!collapsed && badge && (
        <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg animate-pulse">{badge}</span>
      )}
      {collapsed && active && (
        <div className="absolute left-0 w-1.5 h-8 bg-blue-500 rounded-r-full" />
      )}
    </button>
  );
}

function StatCard({ icon, label, value, trend, color }: any) {
  return (
    <div className={`p-6 bg-white rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-all group ${color || ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl bg-slate-50 group-hover:scale-110 transition-transform ${color ? 'bg-white/20 text-white' : ''}`}>
          {icon}
        </div>
        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${color ? 'bg-white/20' : 'bg-emerald-50 text-emerald-600'}`}>{trend}</span>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-3xl font-black italic">{value}</h4>
    </div>
  );
}
