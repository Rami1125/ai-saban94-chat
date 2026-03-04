"use client";

import React, { useState, useEffect } from "react";
import { 
  Brain, Save, Package, Activity, Search, Loader2, 
  Send, Database, Edit2, Trash2, CheckCircle, Smartphone
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SafeIcon } from "@/components/SafeIcon";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/chat/ProductCard"; // שימוש בקומפוננטה המקורית
import { motion, AnimatePresence } from "framer-motion";

export default function SabanAiStudio() {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Simulator states
  const [isThinking, setIsThinking] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([{ role: 'bot', content: 'מערכת SABAN AI מחוברת למלאי. במה אוכל לעזור?' }]);

  useEffect(() => {
    loadStudioData();
  }, []);

  async function loadStudioData() {
    setLoading(true);
    try {
      // שליפת המוח - שימוש ב-maybeSingle למניעת שגיאות HTTP
      const { data: pData } = await supabase.from('saban_unified_knowledge').select('content').eq('type', 'system_prompt').maybeSingle();
      // שליפת מלאי אמיתי מהטבלה הקיימת
      const { data: invData } = await supabase.from('inventory').select('*').limit(100);
      
      if (pData) setSystemPrompt(pData.content);
      setInventory(invData || []);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('saban_unified_knowledge').upsert({ type: 'system_prompt', content: systemPrompt });
    setSaving(false);
    alert("המוח עודכן בהצלחה!");
  };

  const simulateChat = async () => {
    if (!userInput) return;
    const q = userInput;
    setUserInput("");
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    
    setIsThinking(true);
    setTimeout(() => {
      setIsThinking(false);
      // חיפוש מוצר אמיתי מהמלאי שנטען
      const product = inventory.find(p => q.includes(p.product_name) || q.includes(p.sku));
      if (product) {
        setMessages(prev => [...prev, { role: 'bot', content: `מצאתי את ${product.product_name}:`, product }]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', content: "מעבד את שאלתך מול נתוני המערכת..." }]);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-right" dir="rtl">
      {/* Header מקצועי */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-8 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 text-white">
            <Brain size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">AI BRAIN STUDIO</h1>
            <p className="text-xs text-green-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> מערכת אונליין
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[#0B2C63] rounded-2xl h-12 px-8">
          {saving ? <Loader2 className="animate-spin" /> : <Save size={18} className="ml-2" />}
          שמור הגדרות מוח
        </Button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* צד שמאל: ניהול תוכן */}
        <div className="lg:col-span-8 space-y-6">
          <Tabs defaultValue="knowledge">
            <TabsList className="bg-white border p-1 rounded-2xl h-14">
              <TabsTrigger value="knowledge" className="rounded-xl px-8">הנחיות מערכת</TabsTrigger>
              <TabsTrigger value="inventory" className="rounded-xl px-8">מלאי אונליין</TabsTrigger>
            </TabsList>

            <TabsContent value="knowledge" className="mt-4">
              <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="mb-4 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-500">System Prompt</span>
                    <div className="flex gap-2">
                       {['🏗️', '📦', '🚚', '😊'].map(e => (
                         <button key={e} onClick={() => setSystemPrompt(p => p + e)} className="p-1 hover:bg-slate-100 rounded">{e}</button>
                       ))}
                    </div>
                  </div>
                  <Textarea 
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="min-h-[400px] text-lg rounded-2xl border-slate-100 bg-slate-50/50 p-6 leading-relaxed focus:bg-white transition-all"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventory" className="mt-4">
              <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
                <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
                  <h3 className="font-bold flex items-center gap-2"><Database size={18}/> נתוני טבלת Inventory</h3>
                  <div className="relative">
                    <Search className="absolute right-3 top-2.5 text-slate-400" size={16} />
                    <Input className="pr-10 rounded-xl h-10 w-64 bg-white" placeholder="חיפוש מהיר..." />
                  </div>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-right">
                    <thead className="bg-slate-100 text-slate-500 text-[10px] uppercase">
                      <tr>
                        <th className="p-4">שם מוצר</th>
                        <th className="p-4 text-center">מחיר</th>
                        <th className="p-4 text-center">פעולות</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {inventory.map(item => (
                        <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                          <td className="p-4 font-bold text-slate-800">{item.product_name}</td>
                          <td className="p-4 text-center font-mono text-blue-600 font-black">₪{item.price}</td>
                          <td className="p-4 text-center flex justify-center gap-2">
                            <button className="p-2 text-slate-400 hover:text-blue-600"><Edit2 size={16}/></button>
                            <button className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
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

        {/* צד ימין: סימולטור iPhone */}
        <div className="lg:col-span-4 space-y-4">
          <div className="relative mx-auto border-[12px] border-slate-900 bg-slate-900 rounded-[3.5rem] h-[750px] w-[340px] shadow-2xl overflow-hidden">
            <div className="w-32 h-7 bg-slate-900 top-2 rounded-2xl left-1/2 -translate-x-1/2 absolute z-20 flex items-center justify-center">
               <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
            </div>
            
            <div className="h-full bg-slate-100 flex flex-col pt-12 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-3 rounded-2xl text-xs shadow-sm max-w-[85%] ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none'}`}>
                      {m.content}
                    </div>
                    {/* הצגת כרטיס מוצר אמיתי */}
                    {(m as any).product && (
                      <div className="mt-2 w-full scale-90 origin-right">
                        <ProductCard product={(m as any).product} />
                      </div>
                    )}
                  </div>
                ))}
                
                {isThinking && (
                  <div className="flex gap-1 p-3 bg-white rounded-xl w-14 shadow-sm animate-pulse">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"/>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"/>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"/>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white border-t flex gap-2">
                <Input 
                  value={userInput} 
                  onChange={e => setUserInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && simulateChat()}
                  placeholder="כתוב משהו..." 
                  className="rounded-full bg-slate-50 border-none h-11" 
                />
                <button onClick={simulateChat} className="bg-blue-600 text-white p-3 rounded-full hover:scale-105 transition-all">
                  <Send size={18}/>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
