"use client";

import React, { useState, useEffect } from "react";
import { 
  Brain, Save, Package, MessageSquare, Activity, 
  Search, ExternalLink, Loader2, Send, Database, BarChart3
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SafeIcon } from "@/components/SafeIcon";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/chat/productcard"; 

export default function ProfessionalAiStudio() {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [inventory, setInventory] = useState<any[]>([]);
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [simMessages, setSimMessages] = useState<any[]>([
    { role: 'bot', content: 'מערכת ה-AI מחוברת למסדי הנתונים של ח. סבן. כיצד אוכל לעזור?' }
  ]);

  useEffect(() => {
    loadRealTimeData();
  }, []);

  async function loadRealTimeData() {
    setLoading(true);
    try {
      // 1. שליפת המוח (שימוש ב-maybeSingle למניעת שגיאת 406/404)
      const { data: promptData } = await supabase
        .from('saban_unified_knowledge')
        .select('content')
        .eq('type', 'system_prompt')
        .maybeSingle();

      // 2. שליפת מלאי אמיתי מהטבלה הקיימת
      const { data: invData } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // 3. שליפת פעילות אחרונה של לקוחות (Online Monitor)
      const { data: chats } = await supabase
        .from('chat_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (promptData) setSystemPrompt(promptData.content);
      setInventory(invData || []);
      setRecentChats(chats || []);
    } catch (err) {
      console.error("Connection error:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSavePrompt = async () => {
    setSaving(true);
    const { error } = await supabase.from('saban_unified_knowledge').upsert(
      { type: 'system_prompt', content: systemPrompt },
      { onConflict: 'type' }
    );
    setSaving(false);
    if (!error) alert("הגדרות המוח עודכנו בהצלחה!");
  };

  const handleSimSend = async () => {
    if (!userInput) return;
    const text = userInput;
    setUserInput("");
    setSimMessages(prev => [...prev, { role: 'user', content: text }]);
    
    setIsThinking(true);
    setTimeout(() => {
      setIsThinking(false);
      // חיפוש חכם במלאי האמיתי
      const product = inventory.find(p => 
        text.toLowerCase().includes(p.product_name?.toLowerCase())
      );
      
      if (product) {
        setSimMessages(prev => [...prev, { 
          role: 'bot', 
          content: `מצאתי את המוצר במלאי שלנו:`,
          product: product 
        }]);
      } else {
        setSimMessages(prev => [...prev, { role: 'bot', content: "מעבד את בקשתך מול נתוני המחסן..." }]);
      }
    }, 1000);
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen text-right font-sans" dir="rtl">
      {/* Top Professional Header */}
      <header className="flex justify-between items-center mb-6 bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
            <Brain className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 leading-none">AI Business Core</h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> מחובר ל-Supabase Realtime
            </p>
          </div>
        </div>
        <Button onClick={handleSavePrompt} disabled={saving} className="bg-[#0B2C63] hover:bg-blue-800 rounded-2xl px-6 py-6 transition-all shadow-md">
          {saving ? <Loader2 className="animate-spin" /> : <Save size={18} className="ml-2"/>}
          עדכן מוח מערכת
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Section: Intelligence & Data */}
        <div className="lg:col-span-8 space-y-6">
          <Tabs defaultValue="knowledge">
            <TabsList className="bg-slate-200/50 p-1 rounded-2xl h-14 w-full justify-start gap-2">
              <TabsTrigger value="knowledge" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Database size={16} className="ml-2" /> בסיס ידע (Prompt)
              </TabsTrigger>
              <TabsTrigger value="inventory" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Package size={16} className="ml-2" /> ניהול מלאי חי
              </TabsTrigger>
              <TabsTrigger value="activity" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Activity size={16} className="ml-2" /> ניטור אונליין
              </TabsTrigger>
            </TabsList>

            <TabsContent value="knowledge" className="mt-4">
              <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50">
                <CardContent className="p-6">
                  <Textarea 
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="min-h-[400px] text-lg rounded-2xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all leading-relaxed p-6"
                    placeholder="הגדר את חוקי העסק וה-AI כאן..."
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventory" className="mt-4">
              <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2"><BarChart3 size={18}/> מוצרים במערכת ({inventory.length})</h3>
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={loadRealTimeData}><Search size={14} className="ml-2"/> רענן נתונים</Button>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-right">
                    <thead className="bg-slate-50 sticky top-0 border-b">
                      <tr className="text-slate-500 text-xs">
                        <th className="p-4">שם מוצר</th>
                        <th className="p-4">מחיר (₪)</th>
                        <th className="p-4">סטטוס</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {inventory.map(item => (
                        <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="p-4 font-semibold text-slate-800">{item.product_name}</td>
                          <td className="p-4 font-mono text-blue-600 font-bold">{item.price}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-[10px] font-bold">זמין במחסן</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <div className="space-y-4">
                {recentChats.map(chat => (
                  <div key={chat.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"><MessageSquare size={16} className="text-slate-400"/></div>
                      <div>
                        <p className="text-sm font-bold">{chat.query}</p>
                        <p className="text-[10px] text-slate-400">{new Date(chat.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <ExternalLink size={14} className="text-slate-300"/>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Section: iPhone Simulator */}
        <div className="lg:col-span-4 h-[750px] border-[10px] border-[#1E293B] rounded-[3.5rem] bg-slate-200 relative overflow-hidden flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
          {/* Dynamic Island */}
          <div className="w-28 h-7 bg-[#1E293B] top-2 rounded-2xl left-1/2 -translate-x-1/2 absolute z-20"></div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-4 pt-12">
            {simMessages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-3 rounded-2xl text-sm max-w-[90%] shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none'}`}>
                  {m.content}
                </div>
                {m.product && (
                  <div className="mt-2 w-full scale-90 origin-right">
                    <ProductCard product={m.product} />
                  </div>
                )}
              </div>
            ))}
            {isThinking && (
              <div className="flex gap-1 p-3 bg-white rounded-2xl w-14 shadow-sm animate-pulse">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"/>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"/>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"/>
              </div>
            )}
          </div>

          <div className="p-4 bg-white/80 backdrop-blur-md border-t flex gap-2">
            <Input 
              value={userInput} 
              onChange={e => setUserInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSimSend()}
              placeholder="שאל את המוח משהו..." 
              className="rounded-full bg-slate-100 border-none h-12 text-right" 
            />
            <button onClick={handleSimSend} className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-transform active:scale-90 shadow-lg">
              <Send size={20}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
