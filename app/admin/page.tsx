"use client";
import React, { useState, useEffect } from 'react';
import DispatchStudio from "@/components/DispatchStudio";
import OrderForm from "@/components/OrderForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Truck, 
  MessageSquare, 
  Settings, 
  Activity, 
  Eye, 
  History
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("monitor");

  return (
    <div className="min-h-screen bg-[#f8fafc] text-right font-sans pb-20" dir="rtl">
      {/* Header - מגדל פיקוח */}
      <nav className="bg-[#0f172a] text-white p-4 shadow-2xl sticky top-0 z-50 border-b border-blue-500/30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20 animate-pulse">
              <Truck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter italic">SABAN-OS <span className="text-blue-500">ADMIN</span></h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">מערכת ניהול לוגיסטית חכמה</p>
            </div>
          </div>
          
          <div className="hidden md:flex gap-6 items-center">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 uppercase font-bold">סטטוס מערכת</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                <span className="text-sm font-bold text-green-400">מחובר לאיתורן</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-4 md:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* תפריט ניווט תחתון/עליון */}
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white border-2 border-slate-100 h-16 p-1 rounded-2xl shadow-sm">
            <TabsTrigger value="monitor" className="rounded-xl gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold transition-all">
              <LayoutDashboard size={18} /> סידור חי
            </TabsTrigger>
            <TabsTrigger value="new-order" className="rounded-xl gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold transition-all">
              <PlusCircle size={18} /> הזמנה חדשה
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-xl gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white font-bold transition-all">
              <Eye size={18} /> המלשינון
            </TabsTrigger>
            <TabsTrigger value="automation" className="rounded-xl gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white font-bold transition-all">
              <Settings size={18} /> הגדרות
            </TabsTrigger>
          </TabsList>

          {/* טאב 1: סידור עבודה חי */}
          <TabsContent value="monitor" className="focus-visible:outline-none space-y-6">
            <header className="flex justify-between items-end mb-2">
              <div>
                <h2 className="text-2xl font-black text-slate-800">ניטור משאיות בזמן אמת</h2>
                <p className="text-slate-500 text-sm italic">מבוסס נתוני GPS ו-PTO מחברת איתורן</p>
              </div>
            </header>
            <DispatchStudio />
          </TabsContent>

          {/* טאב 2: יצירת הזמנה חדשה */}
          <TabsContent value="new-order" className="focus-visible:outline-none">
            <div className="max-w-2xl mx-auto">
              <OrderForm onOrderCreated={() => setActiveTab("monitor")} />
            </div>
          </TabsContent>

          {/* טאב 3: המלשינון - משקיף הודעות לקוח */}
          <TabsContent value="reports" className="focus-visible:outline-none space-y-4">
            <Card className="border-none shadow-xl overflow-hidden">
              <CardHeader className="bg-orange-500 text-white">
                <CardTitle className="flex items-center gap-2 font-black">
                  <Eye size={20} /> "המלשינון" - מעקב ווטסאפ לקוחות
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {/* דוגמה להודעה במלשינון */}
                  {[
                    { name: "בר אורן", time: "10:32", msg: "הנהג הגיע, התחלנו פריקה", status: "נשלח" },
                    { name: "אבי לוי", time: "09:15", msg: "משאית בדרך אליך (חכמת)", status: "נקרא" },
                    { name: "יוסי בנייה", time: "08:00", msg: "סידור עבודה למחר אושר", status: "נשלח" }
                  ].map((log, i) => (
                    <div key={i} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">
                          {log.name[0]}
                        </div>
                        <div>
                          <div className="font-black text-slate-800">{log.name}</div>
                          <div className="text-xs text-slate-500 line-clamp-1 italic">{log.msg}</div>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] font-bold text-slate-400">{log.time}</div>
                        <Badge variant="outline" className="text-[10px] border-orange-200 text-orange-600">{log.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-slate-50 text-center">
                  <button className="text-xs font-bold text-blue-600 hover:underline">טען היסטוריית הודעות מלאה</button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* טאב 4: הגדרות ואוטומציה */}
          <TabsContent value="automation" className="focus-visible:outline-none">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-none shadow-md">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-black text-lg flex items-center gap-2">
                    <Activity size={18} className="text-purple-600" /> מצב מוח AI
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">דיוק חיזוי זמני פריקה:</span>
                      <span className="font-bold text-green-600">92%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">למידת כתובות פעילה:</span>
                      <span className="font-bold">סטרומה 4, הרצליה</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-md bg-slate-900 text-white">
                <CardContent className="p-6">
                  <h3 className="font-black text-lg mb-2">חיבור JONI ווטסאפ</h3>
                  <p className="text-xs text-slate-400 mb-4">המערכת מחוברת לצינור ה-Firebase RTDB ושולחת הודעות אוטומטיות.</p>
                  <Badge className="bg-green-500/20 text-green-400 border-none">STATUS: ACTIVE</Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating Footer Status */}
      <footer className="fixed bottom-4 left-4 right-4 md:left-auto md:w-64 bg-white/80 backdrop-blur-md border border-slate-200 p-3 rounded-2xl shadow-2xl z-40">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
            מעקב PTO פעיל: חכמת | עלי
          </span>
        </div>
      </footer>
    </div>
  );
}
