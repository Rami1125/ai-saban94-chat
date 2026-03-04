"use client";

import React, { useState, useEffect } from "react";
import { 
  Brain, Save, Settings, MessageSquare, Trash2, Edit3, 
  Plus, Package, Search, Sparkles, Smile, Layout, 
  Loader2, CheckCircle2, AlertCircle, ShoppingCart, Send
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SafeIcon } from "@/components/SafeIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "@/components/chat/productcard"; // ייבוא כרטיס המוצר הקיים

export default function AiBrainStudio() {
  // State לניהול תוכן
  const [systemPrompt, setSystemPrompt] = useState("");
  const [inventory, setInventory] = useState<any[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // State לסימולטור
  const [simMessages, setSimMessages] = useState<any[]>([
    { role: 'bot', content: 'היי! אני מוכן לבדוק את ה"מוח" החדש שלי. נסה לשאול אותי על מוצר מהמלאי.' }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [userInput, setUserInput] = useState("");

  // טעינת נתונים ראשונית
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const { data: prompt } = await supabase.from('saban_unified_knowledge').select('content').eq('type', 'system_prompt').single();
      const { data: inv } = await supabase.from('inventory').select('*').limit(5);
      const { data: kb } = await supabase.from('ai_knowledge_base').select('*');
      
      if (prompt) setSystemPrompt(prompt.content);
      setInventory(inv || []);
      setKnowledgeBase(kb || []);
      setLoading(false);
    };
    loadData();
  }, []);

  // פונקציית שמירה לטבלת המוח
  const handleSavePrompt = async () => {
    setSaving(true);
    await supabase.from('saban_unified_knowledge').upsert({ type: 'system_prompt', content: systemPrompt });
    setSaving(false);
    alert("ההנחיות נשמרו בהצלחה!");
  };

  // סימולציית צ'אט עם אפקט "חושב" וכרטיס מוצר
  const handleSimSend = async () => {
    if (!userInput) return;
    const msg = userInput;
    setUserInput("");
    setSimMessages(prev => [...prev, { role: 'user', content: msg }]);
    
    setIsThinking(true);
    // מדמה עיבוד AI
    setTimeout(async () => {
      setIsThinking(false);
      
      // בדיקה אם המשתמש שאל על מוצר קיים
      const foundProduct = inventory.find(p => msg.includes(p.product_name) || msg.includes(p.sku));
      
      if (foundProduct) {
        setSimMessages(prev => [...prev, { 
          role: 'bot', 
          content: `מצאתי את ${foundProduct.product_name} במלאי:`, 
          product: foundProduct 
        }]);
      } else {
        setSimMessages(prev => [...prev, { role: 'bot', content: "אני בודק את זה בבסיס הידע שלי..." }]);
      }
    }, 1500);
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen text-right" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-[#0B2C63] flex items-center gap-3">
            <SafeIcon icon={Brain} className="text-blue-600" /> סטודיו ניהול מוח AI
          </h1>
          <p className="text-slate-500">ח. סבן - מכירות ומלאי חכם</p>
        </div>
        <Button onClick={handleSavePrompt} disabled={saving} className="bg-[#0B2C63] hover:bg-blue-800 h-12 px-8 rounded-2xl gap-2">
          {saving ? <Loader2 className="animate-spin" /> : <SafeIcon icon={Save} size={18} />}
          שמור הגדרות מוח
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* צד שמאל: ניהול דאטה (8 עמודות) */}
        <div className="xl:col-span-8 space-y-8">
          <Tabs defaultValue="prompt" className="w-full">
            <TabsList className="bg-white border p-1 rounded-2xl h-14 mb-6">
              <TabsTrigger value="prompt" className="rounded-xl px-6">הנחיות מערכת</TabsTrigger>
              <TabsTrigger value="inventory" className="rounded-xl px-6">ניהול מלאי</TabsTrigger>
              <TabsTrigger value="qa" className="rounded-xl px-6">שאלות ותשובות</TabsTrigger>
            </TabsList>

            <TabsContent value="prompt">
              <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-slate-900 text-white p-8">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="text-blue-400" /> הנחיית המערכת היסודית (System Prompt)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <Textarea 
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="min-h-[300px] border-slate-200 text-lg leading-relaxed rounded-2xl focus:ring-[#0B2C63]"
                    placeholder="הגדר כאן איך ה-AI צריך להתנהג..."
                  />
                  <div className="mt-4 flex gap-2">
                    {['😊', '🏗️', '📦', '💰', '🚚'].map(e => (
                      <button key={e} onClick={() => setSystemPrompt(p => p + e)} className="p-2 bg-slate-100 rounded-lg hover:bg-white border transition-all">{e}</button>
                    ))}
                    <span className="text-xs text-slate-400 mr-auto mt-2">מאגר אימוג'י מהיר</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventory">
              <Card className="rounded-[2.5rem] border-none shadow-xl">
                <div className="p-8 border-b flex justify-between items-center">
                  <h3 className="font-bold text-xl flex items-center gap-2"><Package className="text-blue-600"/> מה קיים במלאי</h3>
                  <div className="relative w-64">
                    <Search className="absolute right-3 top-3 text-slate-400" size={18} />
                    <Input className="pr-10 rounded-xl" placeholder="חיפוש מהיר..." />
                  </div>
                </div>
                <div className="p-0 overflow-hidden">
                  <table className="w-full text-right">
                    <thead className="bg-slate-50 text-slate-500 text-sm">
                      <tr>
                        <th className="p-4">מוצר</th>
                        <th className="p-4">SKU</th>
                        <th className="p-4">מחיר</th>
                        <th className="p-4">פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map(p => (
                        <tr key={p.id} className="border-t hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold">{p.product_name}</td>
                          <td className="p-4 text-slate-500 font-mono text-xs">{p.sku}</td>
                          <td className="p-4 text-blue-600 font-black">₪{p.price}</td>
                          <td className="p-4 flex gap-2">
                            <button className="p-2 text-slate-400 hover:text-blue-600"><Edit3 size={16}/></button>
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

        {/* צד ימין: סימולטור ועיצוב (4 עמודות) */}
        <div className="xl:col-span-4 space-y-8">
          {/* אייפון סימולטור משופר */}
          <div className="relative mx-auto border-gray-900 bg-gray-900 border-[12px] rounded-[3rem] h-[720px] w-[340px] shadow-2xl overflow-hidden flex flex-col">
             <div className="w-[120px] h-[20px] bg-gray-900 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute z-20"></div>
             
             {/* תוכן הצ'אט */}
             <div className="flex-1 bg-slate-100 p-4 pt-10 overflow-y-auto space-y-4" dir="rtl">
                {simMessages.map((m, idx) => (
                  <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-3 rounded-2xl text-sm shadow-sm max-w-[90%] ${m.role === 'user' ? 'bg-[#0B2C63] text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none'}`}>
                      {m.content}
                    </div>
                    {/* הצגת כרטיס מוצר אם קיים */}
                    {m.product && (
                      <div className="mt-2 w-full scale-90 origin-right">
                        <ProductCard product={m.product} />
                      </div>
                    )}
                  </div>
                ))}

                {/* אפקט מחשבה (Thinking Dots) */}
                <AnimatePresence>
                  {isThinking && (
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="bg-white p-3 rounded-2xl w-16 shadow-sm flex gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             {/* Input המדמה הקלדה */}
             <div className="h-20 bg-white border-t p-3 flex items-center gap-2">
                <Input 
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSimSend()}
                  placeholder="כתוב הודעה..."
                  className="rounded-full bg-slate-100 border-none"
                />
                <button onClick={handleSimSend} className="bg-blue-600 text-white p-2.5 rounded-full hover:scale-105 transition-transform">
                  <Send size={18} />
                </button>
             </div>
          </div>

          {/* כלי עיצוב כרטיס מוצר */}
          <Card className="rounded-[2rem] border-slate-200 shadow-lg p-6">
            <h4 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-slate-400">
              <Layout size={16}/> כלי עיצוב כרטיס
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="text-xs rounded-xl">שנה צבע בורדר</Button>
              <Button variant="outline" className="text-xs rounded-xl">הסתר וידאו</Button>
              <Button variant="outline" className="text-xs rounded-xl">אפקט Shadow</Button>
              <Button variant="outline" className="text-xs rounded-xl">פונט פרימיום</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
