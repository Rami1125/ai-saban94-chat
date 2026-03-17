'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Save, Trash2, Plus } from 'lucide-react';

export default function InventoryStudio() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('product_name', { ascending: true });

      if (error) throw error;
      setInventory(data || []);
    } catch (error: any) {
      toast({
        title: "שגיאה בטעינה",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateField = (index: number, field: string, value: any) => {
    const updated = [...inventory];
    updated[index] = { ...updated[index], [field]: value };
    setInventory(updated);
  };

  const saveItem = async (item: any) => {
    try {
      setSaving(true);
      
      // הכנת הנתונים למניעת שגיאות 400:
      // 1. הסרת עמודת המחיר כפי שביקשת
      // 2. ניקוי ערכי null בשדות חובה
      // 3. הבטחה ששדות מספריים הם אכן Number
      const { price, ...cleanItem } = item; // מחיקת המחיר מהאובייקט שנשלח
      
      const payload = {
        ...cleanItem,
        product_name: cleanItem.product_name || 'מוצר ללא שם',
        stock_quantity: Number(cleanItem.stock_quantity) || 0,
        sku: String(cleanItem.sku || ''),
        category: cleanItem.category || 'כללי'
      };

      const { error } = await supabase
        .from('inventory')
        .upsert(payload)
        .eq('sku', payload.sku);

      if (error) throw error;

      toast({
        title: "נשמר בהצלחה",
        description: `המוצר ${payload.product_name} עודכן.`,
      });
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "שגיאת שמירה",
        description: "ודא שכל שדות החובה מלאים ושאין כפילות ב-SKU",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen" dir="rtl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold text-slate-800">ניהול מלאי סבן - סטודיו</CardTitle>
          <Button onClick={() => setInventory([{ sku: '', product_name: '', stock_quantity: 0 }, ...inventory])}>
            <Plus className="ml-2 h-4 w-4" /> מוצר חדש
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">מק"ט (SKU)</TableHead>
                <TableHead className="text-right">שם מוצר</TableHead>
                <TableHead className="text-right">קטגוריה</TableHead>
                <TableHead className="text-right">מלאי</TableHead>
                <TableHead className="text-left">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item, index) => (
                <TableRow key={item.sku || index}>
                  <TableCell>
                    <Input 
                      value={item.sku} 
                      onChange={(e) => handleUpdateField(index, 'sku', e.target.value)}
                      className="max-w-[120px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={item.product_name} 
                      onChange={(e) => handleUpdateField(index, 'product_name', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={item.category} 
                      onChange={(e) => handleUpdateField(index, 'category', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number"
                      value={item.stock_quantity} 
                      onChange={(e) => handleUpdateField(index, 'stock_quantity', e.target.value)}
                      className="max-w-[80px]"
                    />
                  </TableCell>
                  <TableCell className="text-left space-x-2 space-x-reverse">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => saveItem(item)}
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
