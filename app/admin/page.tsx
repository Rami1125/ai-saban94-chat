"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// שימוש ב-export default חובה ב-Next.js App Router
export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('fast_checkout_orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    // האזנה לשינויים בזמן אמת
    const sub = supabase
      .channel('admin-orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fast_checkout_orders' }, fetchOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const updatePriceAndNotify = async (id: string) => {
    const price = prompt("הכנס מחיר סופי כולל גיוון (₪):");
    if (!price) return;

    await supabase.from('fast_checkout_orders').update({ 
      final_price: parseFloat(price), 
      status: 'PRICE_UPDATED' 
    }).eq('id', id);
    
    fetchOrders();
  };

  const approveOrder = async (id: string) => {
    const confirmed = confirm("האם החיוב בוצע בהצלחה בקומקס?");
    if (!confirmed) return;

    await supabase.from('fast_checkout_orders').update({ 
      status: 'READY',
      card_cvv: null // מחיקת CVV מטעמי אבטחה בסיום
    }).eq('id', id);

    fetchOrders();
  };

  if (loading) return <div className="p-10 text-center">טוען הזמנות...</div>;

  return (
    <div className="p-6 bg-slate-100 min-h-screen" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-slate-800">ניהול קופה מהירה - ח. סבן</h1>
          <Badge variant="outline" className="bg-white">{orders.length} הזמנות במערכת</Badge>
        </header>

        <div className="grid gap-6">
          {orders.map((order) => (
            <Card key={order.id} className={`border-r-8 ${order.status === 'READY' ? 'border-r-green-500' : 'border-r-blue-500'}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{order.customer_name}</CardTitle>
                    <p className="text-sm text-slate-500 font-mono">ID: {order.customer_id} | טל: {order.phone}</p>
                  </div>
                  <Badge className={order.status === 'READY' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 p-3 rounded-md mb-4 border">
                  <h4 className="font-bold text-sm mb-2 border-b pb-1">רשימת מוצרים להכנה:</h4>
                  {order.items && Array.isArray(order.items) ? (
                    order.items.map((item: any, i: number) => (
                      <p key={i} className="text-sm text-slate-700">
                        • <span className="font-semibold">{item.sku}</span> | {item.name} | 
                        <span className="bg-yellow-100 px-1 rounded mx-1">כמות: {item.qty}</span>
                        {item.tint_code && <span className="text-red-600 font-bold"> [גוון: {item.tint_code}]</span>}
                      </p>
                    ))
                  ) : <p className="text-sm italic">אין מוצרים ברשימה</p>}
                </div>

                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="bg-red-50 p-3 rounded border border-red-100">
                    <p className="text-xs text-red-400 font-bold mb-1">פרטי אשראי לחיוב בקומקס:</p>
                    <p className="font-mono text-lg font-bold text-red-700">
                      {order.card_number} <span className="mx-2 text-slate-300">|</span> 
                      CVV: <span className="underline">{order.card_cvv || 'נמחק'}</span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => updatePriceAndNotify(order.id)}
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      עדכן מחיר גיוון
                    </Button>
                    <Button 
                      onClick={() => approveOrder(order.id)}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold"
                      disabled={order.status === 'READY'}
                    >
                      {order.status === 'READY' ? 'הזמנה הושלמה' : 'חייבתי - אשר איסוף'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {orders.length === 0 && (
            <div className="text-center py-20 bg-white rounded-lg border-2 border-dashed">
              <p className="text-slate-400 font-medium">אין הזמנות חדשות כרגע</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
