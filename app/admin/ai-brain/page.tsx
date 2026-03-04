"use client";

import React, { useState, useEffect } from "react";
import { 
  Brain, Save, Package, Search, Loader2, Send, 
  Database, Smartphone, Sparkles, Layout, Activity
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/chat/ProductCard"; 
import { motion, AnimatePresence } from "framer-motion";

export default function SabanStudioV2() {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'ברוך הבא ל-SABAN STUDIO. המערכת מחוברת למלאי בזמן אמת.' }
  ]);

  // שליפת נתונים מכל הטבלאות הקיימות
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: promptData } = await supabase.from('saban_unified_knowledge').select('content').eq('type', 'system_prompt').maybeSingle();
      const { data: invData } = await supabase.from('inventory').select('*').order('product_name');
      
      if (promptData) setSystemPrompt(promptData.content);
      if (invData) setInventory(invData);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('saban_unified_knowledge').upsert({ type: 'system_prompt', content: systemPrompt }, { onConflict: 'type' });
    setSaving(false);
  };

  const onSendMessage = () => {
    if (!userInput.trim()) return;
    const q = userInput.trim();
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setUserInput("");
    setIsThinking(true);

    setTimeout(() => {
      setIsThinking(false);
      // לוגיקת שליפה דטרמיניסטית מהמלאי
      const foundProduct = inventory.find(p => 
        q.toLowerCase().includes(p.product_name.toLowerCase()) || (p.sku && q.includes(p.sku))
      );

      if (foundProduct) {
        setMessages(prev => [...prev, { 
          role: 'bot', 
          content: `נמצא מוצר תואם במלאי:`, 
          product: foundProduct 
        } as any]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', content: "הפריט לא נמצא במאגר המלאי הנוכחי." }]);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans text-right" dir="rtl">
      {/* Header סטודיו פרימיום */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-8 bg-white p-6 rounded-[2.5rem] shadow-sm border">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-4 rounded-3xl text-white shadow-lg"><Brain size={28} /></div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase italic">Saban AI Studio</h1>
            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> LIVE DATABASE CONNECTED
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[#0B2C63] rounded-2xl h-12 px-8 shadow-lg">
          {saving ? <Loader2 className="animate-spin" /> : <Save size={18} className="ml-2" />}
          שמור הגדרות מוח
        </Button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ניהול תוכן ומלאי (Desktop View) */}
        <div className="lg:col-span-7 space-y-6">
          <Tabs defaultValue="knowledge">
            <TabsList className="bg-white border rounded-2xl p-1 h-14 mb-4 shadow-sm">
              <TabsTrigger value="knowledge" className="rounded-xl px-8 font-bold">ניהול המוח</TabsTrigger>
              <TabsTrigger value="inventory" className="rounded-xl px-8 font-bold">מלאי אונליין</TabsTrigger>
            </TabsList>

            <TabsContent value="knowledge">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
                <div className="p-6 bg-slate-900 text-white font-bold flex items-center gap-2">
                  <Sparkles size={18} className="text-blue-400" /> הגדרות תסריט שיחה
                </div>
                <CardContent className="p-6">
                  <Textarea 
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="min-h-[400px] rounded-2xl border-slate-200 text-lg p-6 shadow-inner focus:ring-blue-100"
                    placeholder="הגדר כאן את 'המוח' וכללי השליפה..."
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventory">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold flex items-center gap-2"><Database size={18}/> מוצרים מסונכרנים ({inventory.length})</h3>
                </div>
                <div className="max-h-[500px] overflow-y-auto p-4">
                  <table className="w-full text-right">
                    <thead className="text-slate-400 text-xs">
                      <tr><th className="p-4">מוצר</th><th className="p-4 text-center">מחיר (₪)</th></tr>
                    </thead>
                    <tbody>
                      {inventory.map(p => (
                        <tr key={p.id} className="hover:bg-blue-50 transition-colors border-b border-slate-50">
                          <td className="p-4 font-bold text-slate-800">{p.product_name}</td>
                          <td className="p-4 text-center font-black text-blue-600">₪{p.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* סימולטור PWA Mobile */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-[360px] h-[760px] border-[12px] border-slate-900 rounded-[3.5rem] bg-slate-900 shadow-2xl relative overflow-hidden flex flex-col">
            <div className="w-28 h-7 bg-slate-900 top-2 rounded-2xl left-1/2 -translate-x-1/2 absolute z-20" />
            <div className="flex-1 bg-slate-100 mt-10 rounded-t-[2.5rem] overflow-hidden flex flex-col">
              <div className="h-14 bg-white/80 backdrop-blur-md border-b flex items-center justify-center text-[10px] font-black text-slate-400 tracking-widest">SABAN CHAT PWA</div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-3 rounded-2xl text-xs max-w-[85%] shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-white'}`}>
                      {m.content}
                    </div>
                    {(m as any).product && <div className="mt-2 w-full scale-90 origin-right"><ProductCard product={(m as any).product} /></div>}
                  </div>
                ))}
                {isThinking && <div className="flex gap-1 p-3 bg-white rounded-xl w-14 animate-pulse"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"/><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"/><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"/></div>}
              </div>

              <div className="p-4 bg-white border-t flex gap-2">
                <Input value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSendMessage()} placeholder="חפש במלאי..." className="rounded-full bg-slate-50 border-none h-11 text-right" />
                <button onClick={onSendMessage} className="bg-blue-600 text-white p-2.5 rounded-full shadow-lg"><Send size={18}/></button>
              </div>
            </div>
            <div className="h-1.5 w-32 bg-slate-800/20 mx-auto my-3 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
