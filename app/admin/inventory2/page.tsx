"use client";
import React, { useEffect, useState } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Save, Search, RefreshCw } from "lucide-react";

export default function InventoryStudio() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const supabase = getSupabase();

  // שליפת נתונים
  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .order('product_name', { ascending: true });
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // עדכון שורה בודדת
  const handleUpdate = async (sku: string, updates: any) => {
    const { error } = await supabase
      .from('inventory')
      .update(updates)
      .eq('sku', sku);
    
    if (!error) alert(`עודכן בהצלחה: ${sku}`);
    else console.error(error);
  };

  // סינון מקומי בטבלה
  const filteredItems = items.filter(item => 
    item.product_name?.includes(search) || item.sku?.includes(search)
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans" dir="rtl">
      <Card className="max-w-7xl mx-auto shadow-lg border-none">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-6">
          <CardTitle className="text-2xl font-black text-slate-800 flex gap-2">
            <RefreshCw className={loading ? "animate-spin" : ""} />
            Inventory Studio 2.0
          </CardTitle>
          <div className="flex gap-4 w-1/2">
            <div className="relative w-full">
              <Search className="absolute right-3 top-2.5 text-slate-400" size={18} />
              <Input 
                placeholder="חיפוש מהיר במלאי..." 
                className="pr-10 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={fetchData} variant="outline">רענן</Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100">
              <TableRow>
                <TableHead className="w-[100px] text-right">מק"ט</TableHead>
                <TableHead className="text-right">שם המוצר</TableHead>
                <TableHead className="text-right">מילות מפתח (Search Text)</TableHead>
                <TableHead className="text-right w-[100px]">מלאי</TableHead>
                <TableHead className="text-center w-[80px]">פעולה</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.sku} className="hover:bg-blue-50/30 transition-colors">
                  <TableCell className="font-mono font-bold text-blue-600">{item.sku}</TableCell>
                  <TableCell>
                    <Input 
                      defaultValue={item.product_name} 
                      className="border-transparent bg-transparent hover:border-slate-200 focus:bg-white"
                      onBlur={(e) => handleUpdate(item.sku, { product_name: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      defaultValue={Array.isArray(item.search_text) ? item.search_text.join(", ") : item.search_text} 
                      placeholder="מילים מופרדות בפסיקים..."
                      className="border-transparent bg-transparent hover:border-slate-200 focus:bg-white"
                      onBlur={(e) => {
                        const words = e.target.value.split(',').map(w => w.trim());
                        handleUpdate(item.sku, { search_text: words });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number"
                      defaultValue={item.stock_quantity} 
                      className="w-20 text-center font-bold"
                      onBlur={(e) => handleUpdate(item.sku, { stock_quantity: parseInt(e.target.value) })}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Button size="sm" variant="ghost" className="text-blue-500 hover:bg-blue-100">
                      <Save size={18} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
