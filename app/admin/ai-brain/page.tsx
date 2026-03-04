"use client";

import React, { useState, useEffect } from "react";
import { 
  Brain, Save, Trash2, Edit3, Package, Search, Sparkles, 
  Smile, Layout, Loader2, Send, ShoppingCart, MessageSquare
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SafeIcon } from "@/components/SafeIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "@/components/chat/productcard"; 

export default function AiBrainStudio() {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [simMessages, setSimMessages] = useState<any[]>([
    { role: 'bot', content: 'שלום רמי! המוח מחובר. נסה לשאול על מוצר (למשל: "מלט") כדי לראות את הכרטיס.' }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    // שליפת ה-Prompt והמלאי מה-DB
    const { data: p } = await supabase.from('saban_unified_knowledge').select('content').eq('type', 'system_prompt').single();
    const { data: inv } = await supabase.from('inventory').select('*').order('product_name');
    
    if (p) setSystemPrompt(p.content);
    setInventory(inv || []);
    setLoading(false);
  }

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('saban_unified_knowledge').upsert(
      { type: 'system_prompt', content: systemPrompt },
      { onConflict: 'type' }
    );
    setSaving(false);
    if (!error) alert("הנתונים נשמרו בטבלה בהצלחה!");
  };

  const handleSimSend = async () => {
    if (!userInput) return;
    const text = userInput;
    setUserInput("");
    setSimMessages(prev => [...prev, { role: 'user', content: text }]);
    
    setIsThinking(true); // אפקט הקלדה/מחשבה
    setTimeout(() => {
      setIsThinking(false);
      // חיפוש דינמי במלאי ושליפת כרטיס מוצר
      const product = inventory.find(p => text.includes(p.product_name) || text.includes(p.sku));
      
      if (product) {
        setSimMessages(prev => [...prev, { 
          role: 'bot', 
          content: `מצאתי את ${product.product_name} במלאי:`,
          product: product 
        }]);
      } else {
        setSimMessages(prev => [...prev, { role: 'bot', content: "מעבד את המידע מהמוח..." }]);
      }
    }, 1200);
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-right" dir="rtl">
      {/* Header עם כפתור שמירה */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-black text-[#0B2C63] flex items-center gap-3">
          <SafeIcon icon={Brain} className="text-blue-600" /> סטודיו ניהול מוח AI
        </h1>
        <Button onClick={handleSave} disabled={saving} className="bg-[#0B2C63] rounded-2xl gap-2 hover:bg-blue-800 transition-all">
          {saving ? <Loader2 className="animate-spin" size={18}/> : <SafeIcon icon={Save} size={18}/>}
          שמור שינויים בטבלה
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* ניהול מלאי והנחיות (8 עמודות) */}
        <div className="xl:col-span-8 space-y-6">
          <Tabs defaultValue="prompt">
            <TabsList className="bg-white border rounded-2xl p-1 h-14 mb-4">
              <TabsTrigger value="prompt" className="rounded-xl px-8">הנחיות מערכת</TabsTrigger>
              <TabsTrigger value="inventory" className="rounded-xl px-8">מלאי קיים (Inventory)</TabsTrigger>
            </TabsList>

            <TabsContent value="prompt">
              <Card className="rounded-[2.5rem] border-none shadow-xl">
                <CardContent className="p-8">
                  <Textarea 
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="min-h-[300px] text-lg rounded-2xl mb-4 leading-relaxed"
                    placeholder="הגדר כאן את האישיות והידע של המוח..."
                  />
                  <div className="flex gap-2">
                    {['😊', '🏗️', '📦', '🚚', '💰', '✨'].map(emoji => (
                      <button key={emoji} onClick={() => setSystemPrompt(s => s + emoji)} className="p-2 bg-slate-100 rounded-lg hover:bg-white border transition-all">{emoji}</button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventory">
              <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
                <div className="p-4 bg-slate-50 border-b">
                   <h3 className="font-bold flex items-center gap-2 text-slate-700">נתונים מתוך טבלת מלאי</h3>
                </div>
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="p-4">שם מוצר</th>
                      <th className="p-4">מחיר</th>
                      <th className="p-4">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map(item => (
                      <tr key={item.id} className="border-b hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold">{item.product_name}</td>
                        <td className="p-4 text-blue-600 font-black">₪{item.price}</td>
                        <td className="p-4 flex gap-2">
                          <button className="p-2 text-slate-400 hover:text-blue-600"><Edit3 size={18}/></button>
                          <button className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={18}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* סימולטור ועיצוב (4 עמודות) */}
        <div className="xl:col-span-4 space-y-6">
          <div className="h-[750px] border-[12px] border-gray-900 rounded-[3rem] bg-slate-100 relative overflow-hidden flex flex-col shadow-2xl">
            {/* Notch */}
            <div className="w-[100px] h-[18px] bg-gray-900 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute z-20"></div>
            
            {/* גוף הצ'אט */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 pt-10">
              {simMessages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-2xl text-xs max-w-[85%] ${m.role === 'user' ? 'bg-[#0B2C63] text-white rounded-br-none' : 'bg-white text-slate-800 shadow-sm rounded-bl-none border border-white/10'}`}>
                    {m.content}
                  </div>
                  {/* הצגת כרטיס מוצר דינמי בסימולטור */}
                  {m.product && <div className="mt-2 scale-90 origin-right"><ProductCard product={m.product} /></div>}
                </div>
              ))}
              
              {/* אפקט מחשבה */}
              {isThinking && (
                <div className="flex gap-1 p-2 bg-white rounded-xl w-14 shadow-sm animate-pulse border">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"/>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"/>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"/>
                </div>
              )}
            </div>

            {/* Input פרימיום */}
            <div className="p-4 bg-white border-t flex gap-2">
              <Input 
                value={userInput} 
                onChange={e => setUserInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSimSend()} 
                placeholder="נסה את המוח..." 
                className="rounded-full bg-slate-50 border-none h-11" 
              />
              <button onClick={handleSimSend} className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg">
                <Send size={18}/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
