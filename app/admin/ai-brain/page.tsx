"use client";

import React, { useState, useEffect } from "react";
import { Brain, Save, Package, Search, Loader2, Send, Database, Smartphone, Sparkles, Layout } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/chat/ProductCard"; 
import { motion, AnimatePresence } from "framer-motion";

export default function SabanAIStudio() {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'שלום! המערכת מחוברת למלאי ח. סבן. נסה לשאול על מוצר ספציפי.' }
  ]);

  // שליפת נתונים מכל טבלאות המלאי הרלוונטיות
  useEffect(() => {
    async function loadRealData() {
      setLoading(true);
      // שליפת ההנחיות
      const { data: promptData } = await supabase
        .from('saban_unified_knowledge')
        .select('content')
        .eq('type', 'system_prompt')
        .maybeSingle();

      // שליפת המלאי המלא (עד 1000 מוצרים)
      const { data: invData, error } = await supabase
        .from('inventory')
        .select('*')
        .order('product_name', { ascending: true });

      if (promptData) setSystemPrompt(promptData.content);
      if (invData) setInventory(invData);
      setLoading(false);
    }
    loadRealData();
  }, []);

  const handleSavePrompt = async () => {
    setSaving(true);
    await supabase.from('saban_unified_knowledge').upsert({ 
      type: 'system_prompt', 
      content: systemPrompt 
    }, { onConflict: 'type' });
    setSaving(false);
  };

  const simulateChat = () => {
    if (!userInput.trim()) return;
    const q = userInput.trim();
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setUserInput("");
    setIsThinking(true);

    setTimeout(() => {
      setIsThinking(false);
      // לוגיקת שליפה: מחפש אם שם המוצר מהמלאי מופיע בשאלה של המשתמש
      const foundProduct = inventory.find(p => 
        q.toLowerCase().includes(p.product_name.toLowerCase()) || 
        (p.sku && q.includes(p.sku))
      );

      if (foundProduct) {
        setMessages(prev => [...prev, { 
          role: 'bot', 
          content: `מצאתי את ${foundProduct.product_name} במלאי שלנו:`, 
          product: foundProduct 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'bot', 
          content: "המוצר לא זוהה במלאי המיידי. אני יכול להציע לך חומרים דומים או לבדוק זמינות מול הסניף." 
        }]);
      }
    }, 1200);
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-10 font-sans" dir="rtl">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-4 rounded-[2rem] text-white shadow-xl shadow-blue-200">
            <Brain size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">SABAN AI STUDIO</h1>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Live Inventory Connection</p>
            </div>
          </div>
        </div>
        <Button onClick={handleSavePrompt} disabled={saving} className="bg-slate-900 hover:bg-black text-white px-8 h-14 rounded-2xl shadow-lg transition-all active:scale-95 text-lg font-bold">
          {saving ? <Loader2 className="animate-spin ml-2" /> : <Save className="ml-2" size={20} />}
          עדכן מוח מערכת
        </Button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Side: Desktop Admin Control */}
        <div className="lg:col-span-7 space-y-8">
          <Tabs defaultValue="knowledge" className="w-full">
            <TabsList className="bg-white border p-1 rounded-2xl h-16 shadow-sm mb-6">
              <TabsTrigger value="knowledge" className="rounded-xl px-10 text-base data-[state=active]:bg-slate-100 font-bold">הנחיות מערכת</TabsTrigger>
              <TabsTrigger value="inventory" className="rounded-xl px-10 text-base data-[state=active]:bg-slate-100 font-bold">צפייה במלאי חי</TabsTrigger>
            </TabsList>

            <TabsContent value="knowledge">
              <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white/70 backdrop-blur-xl">
                <CardHeader className="p-8 border-b bg-slate-50/50">
                  <CardTitle className="text-xl font-black flex items-center gap-3"><Sparkles className="text-blue-500"/> הגדרת אישיות ה-AI</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <Textarea 
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="min-h-[400px] rounded-3xl border-slate-200 text-lg leading-relaxed p-6 shadow-inner focus:ring-4 focus:ring-blue-100 transition-all"
                    placeholder="הזן את ההנחיות כאן..."
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventory">
              <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
                <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold flex items-center gap-2"><Database size={18}/> מוצרים מסונכרנים ({inventory.length})</h3>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-right border-separate border-spacing-y-2 px-4">
                    <thead>
                      <tr className="text-slate-400 text-xs">
                        <th className="p-4">שם מוצר</th>
                        <th className="p-4 text-center">מחיר (₪)</th>
                        <th className="p-4 text-center">SKU</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((p) => (
                        <tr key={p.id} className="bg-slate-50 hover:bg-blue-50 transition-colors rounded-xl">
                          <td className="p-4 font-bold rounded-r-xl">{p.product_name}</td>
                          <td className="p-4 text-center font-black text-blue-600">₪{p.price}</td>
                          <td className="p-4 text-center text-slate-400 rounded-l-xl font-mono">{p.sku || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Side: PWA Application Simulation */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="mb-4 flex items-center gap-2 px-5 py-2 bg-slate-200 rounded-full text-[10px] font-black uppercase text-slate-600">
            <Smartphone size={14}/> PWA Mobile Simulator
          </div>
          
          <div className="w-[380px] h-[780px] bg-slate-900 rounded-[4rem] border-[14px] border-slate-900 shadow-[0_50px_100px_rgba(0,0,0,0.3)] relative overflow-hidden flex flex-col">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-slate-900 rounded-b-3xl z-40" />
            
            <div className="flex-1 bg-slate-100 mt-10 rounded-t-[2.5rem] flex flex-col overflow-hidden">
              <div className="h-16 bg-white/80 backdrop-blur-md border-b flex items-center justify-center font-black text-slate-400 text-[10px] tracking-widest uppercase">
                SABAN PWA INTERFACE
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                <AnimatePresence mode="popLayout">
                  {messages.map((m, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`p-4 rounded-[1.5rem] text-sm leading-relaxed max-w-[85%] shadow-sm ${
                        m.role === 'user' ? 'bg-[#0B2C63] text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-white'
                      }`}>
                        {m.content}
                      </div>
                      {/* תצוגת כרטיס מוצר מקצועי */}
                      {(m as any).product && (
                        <div className="mt-4 w-full scale-95 origin-right">
                          <ProductCard product={(m as any).product} />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isThinking && <div className="flex gap-1.5 p-4 bg-white rounded-2xl w-16 animate-pulse"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"/><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"/><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"/></div>}
              </div>

              <div className="p-5 bg-white border-t flex gap-3">
                <Input 
                  value={userInput} 
                  onChange={e => setUserInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && simulateChat()}
                  placeholder="חפש מוצר במלאי..." 
                  className="rounded-2xl bg-slate-100 border-none h-14 text-right text-sm shadow-inner" 
                />
                <button onClick={simulateChat} className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-100 active:scale-90 transition-all">
                  <Send size={20}/>
                </button>
              </div>
            </div>
            <div className="h-2 w-32 bg-slate-800 mx-auto
