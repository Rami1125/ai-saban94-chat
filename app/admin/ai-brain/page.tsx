"use client";

import React, { useState, useEffect } from "react";
import { 
  Brain, Save, Package, Search, Loader2, Send, 
  Database, Edit2, Smartphone, Activity, Sparkles 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/chat/ProductCard"; 
import { motion, AnimatePresence } from "framer-motion";

export default function SabanAiStudio() {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([{ role: 'bot', content: 'שלום רמי, המערכת מחוברת למלאי. נסה לשאול על מוצר.' }]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const { data: pData } = await supabase.from('saban_unified_knowledge').select('content').eq('type', 'system_prompt').maybeSingle();
      const { data: invData } = await supabase.from('inventory').select('*').limit(100);
      if (pData) setSystemPrompt(pData.content);
      setInventory(invData || []);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('saban_unified_knowledge').upsert({ type: 'system_prompt', content: systemPrompt }, { onConflict: 'type' });
    setSaving(false);
  };

  const simulateChat = () => {
    if (!userInput) return;
    const q = userInput;
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setUserInput("");
    setIsThinking(true);
    
    setTimeout(() => {
      setIsThinking(false);
      const product = inventory.find(p => q.includes(p.product_name) || (p.sku && q.includes(p.sku)));
      if (product) {
        setMessages(prev => [...prev, { role: 'bot', content: `מצאתי את ${product.product_name} במלאי:`, product } as any]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', content: "מעבד את שאלתך מול נתוני המערכת..." }]);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-8 font-sans text-right" dir="rtl">
      {/* Header סטודיו פרימיום */}
      <div className="max-w-[1600px] mx-auto flex justify-between items-center mb-8 bg-white p-6 rounded-[2.5rem] shadow-xl border border-white">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-lg text-white">
            <Brain size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">SABAN AI STUDIO</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Inventory Connection</span>
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[#0B2C63] hover:bg-blue-800 rounded-2xl h-14 px-10 text-lg font-bold shadow-lg transition-all active:scale-95">
          {saving ? <Loader2 className="animate-spin" /> : <Save size={20} className="ml-2" />}
          עדכן מוח מערכת
        </Button>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Tabs defaultValue="knowledge" className="w-full">
            <TabsList className="bg-white/50 backdrop-blur-md border p-1.5 rounded-[1.5rem] h-16 w-fit mb-6 shadow-sm">
              <TabsTrigger value="knowledge" className="rounded-xl px-10 text-base data-[state=active]:bg-white data-[state=active]:shadow-md font-bold">ניהול המוח</TabsTrigger>
              <TabsTrigger value="inventory" className="rounded-xl px-10 text-base data-[state=active]:bg-white data-[state=active]:shadow-md font-bold">מלאי אונליין</TabsTrigger>
            </TabsList>

            <TabsContent value="knowledge">
              <Card className="rounded-[3rem] border-none shadow-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
                <CardHeader className="p-10 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <Sparkles className="text-blue-500" /> הגדרות הנחיית מערכת
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-10">
                  <Textarea 
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="min-h-[450px] text-xl rounded-[2rem] border-slate-200 bg-white p-8 leading-relaxed shadow-inner focus:ring-4 focus:ring-blue-100 transition-all"
                    placeholder="הגדר כאן את 'המוח' של ח. סבן..."
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventory">
              <Card className="rounded-[3rem] border-none shadow-2xl overflow-hidden bg-white">
                <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                    <Package className="text-blue-600"/> מוצרים במלאי המקורי ({inventory.length})
                  </h3>
                </div>
                <div className="max-h-[550px] overflow-y-auto p-4">
                  <table className="w-full text-right border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-slate-400 text-xs uppercase tracking-widest">
                        <th className="p-4">מוצר</th>
                        <th className="p-4 text-center">מחיר (₪)</th>
                        <th className="p-4 text-center">סטטוס</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map(item => (
                        <tr key={item.id} className="bg-slate-50/50 hover:bg-blue-50 transition-all rounded-2xl">
                          <td className="p-4 font-bold text-slate-800 rounded-r-2xl">{item.product_name}</td>
                          <td className="p-4 text-center font-black text-blue-600">₪{item.price}</td>
                          <td className="p-4 text-center rounded-l-2xl">
                             <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">ONLINE</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-4 flex flex-col items-center">
          {/* iPhone Frame */}
          <div className="relative border-[14px] border-slate-900 bg-slate-900 rounded-[4rem] h-[820px] w-[380px] shadow-2xl overflow-hidden">
            <div className="w-36 h-8 bg-slate-900 top-0 rounded-b-3xl left-1/2 -translate-x-1/2 absolute z-30" />
            <div className="h-full bg-[#F8FAFC] flex flex-col pt-10 relative">
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                <AnimatePresence>
                  {messages.map((m: any, i) => (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`p-4 rounded-[1.5rem] text-sm shadow-sm max-w-[90%] ${m.role === 'user' ? 'bg-[#0B2C63] text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-white'}`}>
                        {m.content}
                      </div>
                      {m.product && (
                        <div className="mt-4 w-full scale-95 origin-right">
                          <ProductCard product={m.product} />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isThinking && (
                  <div className="flex gap-1.5 p-4 bg-white rounded-2xl w-16 shadow-sm animate-pulse border border-white">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"/>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"/>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"/>
                  </div>
                )}
              </div>
              <div className="p-5 bg-white border-t flex gap-3">
                <Input value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && simulateChat()} placeholder="חפש מוצר במלאי..." className="rounded-2xl bg-slate-100 border-none h-14 text-right shadow-inner" />
                <button onClick={simulateChat} className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg active:scale-90 transition-all"><Send size={22}/></button>
              </div>
              <div className="h-2 w-32 bg-slate-200 mx-auto mb-2 rounded-full" /> 
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
