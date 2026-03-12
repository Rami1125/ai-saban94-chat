"use client";
import React, { useEffect, useState } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Save, Search, MessageSquare, AlertTriangle, CheckCircle, PlayCircle, Image as ImageIcon } from "lucide-react";

export default function InventoryStudioV2() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [simMessage, setSimMessage] = useState("");
  const [simResponse, setSimResponse] = useState("");
  const supabase = getSupabase();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('inventory').select('*').order('product_name', { ascending: true });
    if (data) setItems(data);
    setLoading(false);
  };

  const handleUpdate = async (sku: string, updates: any) => {
    await supabase.from('inventory').update(updates).eq('sku', sku);
    fetchData(); // רענון מדדים
  };

  // --- לוגיקה של מדדים ובקרה ---
  const totalProducts = items.length;
  const incompleteProducts = items.filter(item => 
    !item.image_url || !item.description?.includes('youtu') || !item.features || item.features.length === 0
  ).length;
  
  const healthScore = totalProducts > 0 ? Math.round(((totalProducts - incompleteProducts) / totalProducts) * 100) : 0;

  // --- סימולטור צ'אט בזמן אמת ---
  const runSimulation = async () => {
    setSimResponse("בודק במלאי ומייצר תשובה...");
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [{ content: simMessage }], phone: 'admin-sim' })
      });
      const data = await res.json();
      setSimResponse(data.text);
    } catch (e) {
      setSimResponse("שגיאה בחיבור ל-API");
    }
  };

  return (
    <div className="p-6 bg-slate-100 min-h-screen font-sans space-y-6" dir="rtl">
      
      {/* Dashboard Header - מדדי בריאות נתונים */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-slate-500">סה"כ מוצרים</div>
            <div className="text-3xl font-black">{totalProducts}</div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-red-500">מוצרים חסרי נתונים</div>
            <div className="text-3xl font-black text-red-600">{incompleteProducts}</div>
          </CardContent>
        </Card>
        <Card className="col-span-2 bg-white">
          <CardContent className="pt-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">מדד מוכנות ל-AI (דירוג 1-5)</span>
              <span className="font-bold">{Math.ceil(healthScore / 20)}/5</span>
            </div>
            <Progress value={healthScore} className="h-3" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* טבלת ניהול - 2/3 מסך */}
        <Card className="lg:col-span-2 shadow-xl border-none overflow-hidden">
          <CardHeader className="bg-white border-b flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Search size={20} /> ניהול מלאי ומדיה
            </CardTitle>
            <Input 
              placeholder="חיפוש מהיר..." 
              className="max-w-xs" 
              onChange={(e) => setSearch(e.target.value)}
            />
          </CardHeader>
          <div className="overflow-x-auto h-[600px] overflow-y-auto bg-white">
            <Table>
              <TableHeader className="sticky top-0 bg-slate-50 z-10">
                <TableRow>
                  <TableHead className="text-right">מוצר</TableHead>
                  <TableHead className="text-right">תמונה (URL)</TableHead>
                  <TableHead className="text-right">וידאו יוטיוב</TableHead>
                  <TableHead className="text-right">סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.filter(i => i.product_name.includes(search)).map((item) => {
                  const isMissing = !item.image_url || !item.description?.includes('youtu');
                  return (
                    <TableRow key={item.sku} className={isMissing ? "bg-orange-50/50" : ""}>
                      <TableCell className="font-medium">
                        <div className="text-sm font-bold">{item.product_name}</div>
                        <div className="text-xs text-slate-400">{item.sku}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ImageIcon size={16} className={item.image_url ? "text-green-500" : "text-slate-300"} />
                          <Input 
                            defaultValue={item.image_url} 
                            placeholder="קישור לתמונה..."
                            className="text-xs h-8 w-40"
                            onBlur={(e) => handleUpdate(item.sku, { image_url: e.target.value })}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PlayCircle size={16} className={item.description?.includes('youtu') ? "text-red-500" : "text-slate-300"} />
                          <Input 
                            defaultValue={item.description?.match(/https:\/\/youtu\S+/)?.[0] || ""} 
                            placeholder="לינק ליוטיוב..."
                            className="text-xs h-8 w-40"
                            onBlur={(e) => {
                              const newDesc = `${item.description || ''} ${e.target.value}`.trim();
                              handleUpdate(item.sku, { description: newDesc });
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {isMissing ? 
                          <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">חסר מידע</Badge> : 
                          <CheckCircle className="text-green-500" size={18} />
                        }
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* סימולטור צ'אט AI - 1/3 מסך */}
        <Card className="shadow-xl border-none bg-slate-900 text-white flex flex-col h-[700px]">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="text-blue-400" /> סימולטור Saban-AI
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-slate-800 p-3 rounded-lg text-sm self-start max-w-[90%]">
              היי רמי, שאל אותי שאלה על מוצר כדי לבדוק איך אני שולף מהטבלה.
            </div>
            {simResponse && (
              <div className="bg-blue-600 p-3 rounded-lg text-sm self-end max-w-[90%] whitespace-pre-wrap">
                {simResponse}
              </div>
            )}
          </CardContent>
          <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-900">
            <Input 
              placeholder="כתוב הודעה (למשל: יש לכם סיקה 255?)" 
              className="bg-slate-800 border-slate-700 text-white"
              value={simMessage}
              onChange={(e) => setSimMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSimulation()}
            />
            <Button className="w-full bg-blue-500 hover:bg-blue-600" onClick={runSimulation}>
              שלח בדיקה
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
