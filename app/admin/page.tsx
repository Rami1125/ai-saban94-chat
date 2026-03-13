"use client";
import React, { useState } from 'react';
import DispatchStudio from "@/components/DispatchStudio";
import OrderForm from "@/components/OrderForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, PlusCircle, Truck } from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("monitor");

  return (
    <div className="min-h-screen bg-slate-50 text-right font-sans" dir="rtl">
      <nav className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg"><Truck size={20} /></div>
            <h1 className="text-xl font-black italic">SABAN-OS</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-4 md:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white border h-14 p-1 rounded-xl shadow-sm">
            <TabsTrigger value="monitor" className="rounded-lg gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold">
              <LayoutDashboard size={18} /> סידור חי
            </TabsTrigger>
            <TabsTrigger value="new-order" className="rounded-lg gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold">
              <PlusCircle size={18} /> הזמנה חדשה
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monitor" className="focus-visible:outline-none">
            <DispatchStudio />
          </TabsContent>

          <TabsContent value="new-order" className="focus-visible:outline-none">
            <OrderForm onOrderCreated={() => setActiveTab("monitor")} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
