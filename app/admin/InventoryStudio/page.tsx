"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Save, Search, MessageSquare, CheckCircle, PlayCircle, Image as ImageIcon, AlertCircle } from "lucide-react";

export default function InventoryStudio() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [simMessage, setSimMessage] = useState("");
  const [simResponse, setSimResponse] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  
  const supabase = getSupabase();

  // שליפת נתונים ראשונית
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('product_name', { ascending: true });
      
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // עדכון נתונים בזמן אמת
  const handleUpdate = async (sku: string, updates: any) => {
    try {
      const { error } = await supabase.from('inventory').update(updates).eq('sku', sku);
      if (error) throw error;
      // עדכון מקומי מהיר ללא צורך בריפרש מלא
      setItems(prev => prev.map(item => item.sku === sku ? { ...item, ...updates } : item));
    } catch (err) {
      alert("שגיאה בעדכון הנתונים");
    }
  };

  // --- לוגיקה של מדדים ובקרה ---
  const stats = useMemo(() => {
    const total = items.length;
    const incomplete = items.filter(item => 
      !item.image_url || 
      !(item.description?.includes('youtu')) || 
      !item.features || 
      (Array.isArray(item.features) && item.features.length === 0)
    ).length;
    
    const score = total > 0 ? Math.round(((total - incomplete) / total) * 100) : 0;
    const stars = Math.ceil(score / 20); // מדד 1-5

    return { total, incomplete, score, stars };
  }, [items]);

  // --- סינון בטוח (מונע קריסות על null) ---
  const filteredItems = useMemo(() => {
    const term = search.toLowerCase();
    return items.filter(item => {
      const name = (item.product_name || "").toLowerCase();
      const sku = (item.sku || "").toLowerCase();
      return name.includes(term) || sku.includes(term);
    });
  }, [items, search]);

  // --- סימולטור צ'אט ---
  const runSimulation = async () => {
    if (!simMessage) return;
    setIsSimulating(true);
    setSimResponse("Gemini חושב על תשובה...");
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ content: simMessage }], phone: 'admin-sim' })
      });
      const data = await res.json();
      setSimResponse(data.text);
    } catch (e) {
      setSimResponse("שגיאה בתקשורת עם ה-API");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans space-y-6 text-right" dir="rtl">
      
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border-slate-200">
          <CardContent className="pt-6">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">סה"כ מוצרים</div>
            <div className="text-3xl font-black text-slate-800">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-slate-200">
          <CardContent className="pt-6">
            <div className="text-xs font-bold text-orange-400 uppercase tracking-wider">דורש עדכון נתונים</div>
            <div className="text-3xl font-black text-orange-600">{stats.incomplete}</div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2 bg-white shadow-sm border-slate-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-end mb-2">
              <div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">מדד איכות שליפה (AI Score)</div>
                <div className="text-2xl font-black text-blue-700">{stats.stars}/5 כוכבים</div>
              </div>
              <div className="text-xs font-bold text-slate-400">{stats.score}% מוכנות</div>
            </div>
            <Progress value={stats.score} className="h-2 bg-slate-100" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* טבלת ניהול מרכזית */}
        <Card className="xl:col-span-3 shadow-xl border-none">
          <CardHeader className="bg-white border-b flex flex-row items-center justify-between p-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
              ניהול תוכן ומדיה למלאי
            </CardTitle>
          <div className="relative w-72">
          <Search className="absolute right-3 top-2.5 text-slate-400" size={16} />
           <Input 
            placeholder="חיפוש לפי שם או מק'ט..." 
              className="pr-9 h-9" 
                value={search}
               onChange={(e) => setSearch(e.target.value)}
               />
         </div>
          </CardHeader>
          <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-slate-50 z-20 shadow-sm">
                <TableRow>
                  <TableHead className="text-right w-1/4">מוצר</TableHead>
                  <TableHead className="text-right">תמונה (URL)</TableHead>
                  <TableHead className="text-right">סרטון יוטיוב</TableHead>
                  <TableHead className="text-center w-24">סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const hasVideo = item.description?.includes('youtu');
                  const hasImage = !!item.image_url;
                  const isMissing = !hasVideo || !hasImage;

                  return (
                    <TableRow key={item.sku} className={`hover:bg-slate-50 transition-colors ${isMissing ? "bg-orange-50/30" : ""}`}>
                      <TableCell>
                        <div className="font-bold text-slate-800 text-sm">{item.product_name || "ללא שם"}</div>
                        <div className="text-xs font-mono text-blue-500">{item.sku}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ImageIcon size={14} className={hasImage ? "text-green-500" : "text-slate-300"} />
                          <Input 
                            defaultValue={item.image_url} 
                            placeholder="קישור לתמונה..."
                            className="h-8 text-xs bg-transparent focus:bg-white"
                            onBlur={(e) => handleUpdate(item.sku, { image_url: e.target.value.trim() })}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PlayCircle size={14} className={hasVideo ? "text-red-500" : "text-slate-300"} />
                          <Input 
                            defaultValue={item.description?.match(/https:\/\/youtu\S+/)?.[0] || ""} 
                            placeholder="לינק ליוטיוב..."
                            className="h-8 text-xs bg-transparent focus:bg-white"
                            onBlur={(e) => {
                              const url = e.target.value.trim();
                              const baseDesc = (item.description || "").replace(/https:\/\/youtu\S+/g, "").trim();
                              handleUpdate(item.sku, { description: `${baseDesc} ${url}`.trim() });
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {isMissing ? (
                          <div className="flex justify-center"><AlertCircle className="text-orange-400" size={18} /></div>
                        ) : (
                          <div className="flex justify-center"><CheckCircle className="text-green-500" size={18} /></div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* סימולטור צ'אט הדרכה */}
        <Card className="shadow-2xl border-none bg-slate-900 text-slate-100 flex flex-col h-[750px]">
          <CardHeader className="border-b border-slate-800 p-4">
            <CardTitle className="text-md font-bold flex items-center gap-2">
              <MessageSquare className="text-blue-400" size={18} /> סימולטור Saban-AI
            </CardTitle>
            <p className="text-[10px] text-slate-400">בדוק איך ה-AI שולף את הנתונים המעודכנים</p>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
            <div className="bg-slate-800 p-3 rounded-2xl rounded-tr-none text-slate-300 ml-4">
              רמי, תעדכן מוצר משמאל ואז תשאל אותי עליו כאן. אני אגיד לך אם חסר לי נתון כדי לענות מקצועי.
            </div>
            {simResponse && (
              <div className="bg-blue-600 p-3 rounded-2xl rounded-tl-none mr-4 animate-in fade-in slide-in-from-bottom-2">
                {simResponse}
              </div>
            )}
          </CardContent>

          <div className="p-4 bg-slate-800/50 border-t border-slate-800 space-y-2">
            <Input 
              placeholder="שאל את ה-AI..." 
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              value={simMessage}
              onChange={(e) => setSimMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSimulation()}
              disabled={isSimulating}
            />
            <Button 
              className="w-full bg-blue-500 hover:bg-blue-600 font-bold transition-all" 
              onClick={runSimulation}
              disabled={isSimulating}
            >
              {isSimulating ? "מעבד נתונים..." : "שלח בדיקה"}
            </Button>
          </div>
        </Card>

      </div>
    </div>
  );
}
