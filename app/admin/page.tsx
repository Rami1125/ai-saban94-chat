"use client";
import React, { useState, useEffect } from 'react';
import { getSupabase } from "@/lib/supabase";
import OrderForm from "@/components/OrderForm"; // הטופס שיצרנו קודם
import DispatchStudio from "@/components/DispatchStudio"; // דף הסידור החי
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, PlusCircle, Truck, Settings } from "lucide-react";

export default function AdminControlCenter() {
  const [activeTab, setActiveTab] = useState("monitor");

  return (
    <div className="min-h-screen bg-slate-50 text-right" dir="rtl">
      {/* Navigation Bar */}
      <nav className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Truck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black">Saban-OS Admin</h1>
              <span className="text-[10px] text-blue-400 font-mono uppercase tracking-widest">Autonomous Logistics</span>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="flex flex-col items-end">
                <span className="text-xs text-slate-400">מנהל מערכת</span>
                <span className="text-sm font-bold">ראמי מסארווה</span>
             </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <Tabs defaultValue="monitor" className="w-full" onValueChange={setActiveTab}>
          
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white border shadow-sm h-14 rounded-xl p-1">
            <TabsTrigger value="monitor" className="rounded-lg gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <LayoutDashboard size={18} />
              ניטור סידור חי
            </TabsTrigger>
            <TabsTrigger value="new-order" className="rounded-lg gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <PlusCircle size={18} />
              הזמנה חדשה
            </TabsTrigger>
            <TabsTrigger value="automation" className="rounded-lg gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Settings size={18} />
              הגדרות ומוח AI
            </TabsTrigger>
          </TabsList>

          {/* טאב 1: ניטור סידור חי */}
          <TabsContent value="monitor" className="space-y-4">
            <DispatchStudio />
          </TabsContent>

          {/* טאב 2: יצירת הזמנה חדשה */}
          <TabsContent value="new-order">
            <div className="max-w-2xl mx-auto">
              <OrderForm onOrderCreated={() => setActiveTab("monitor")} />
            </div>
          </TabsContent>

          {/* טאב 3: הגדרות ואוטומציה */}
          <TabsContent value="automation">
            <div className="grid md:grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded-2xl border shadow-sm">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                     מצב מאזין איתורן (PTO)
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">המערכת מאזינה ל-hsaban2025@gmail.com ומעדכנת סטטוסים אוטומטית.</p>
                  <div className="bg-slate-50 p-3 rounded-lg font-mono text-xs text-slate-600">
                     LAST_SYNC: {new Date().toLocaleTimeString()} <br/>
                     STATUS: ACTIVE
                  </div>
               </div>

               <div className="bg-white p-6 rounded-2xl border shadow-sm">
                  <h3 className="font-bold text-lg mb-4">חיבור WhatsApp (JONI)</h3>
                  <p className="text-sm text-slate-500 mb-4">כל עדכון סטטוס נשלח ל-Firebase RTDB ומשם לווטסאפ.</p>
                  <div className="flex gap-2">
                     <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold">CONNECTED</span>
                     <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-[10px] font-bold">AUTO-REPLY: ON</span>
                  </div>
               </div>
            </div>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
