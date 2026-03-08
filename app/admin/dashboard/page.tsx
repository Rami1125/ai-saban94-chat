"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export function AdminDashboard() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
    const sub = supabase.channel('admin-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'fast_checkout_orders' }, fetchOrders).subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from('fast_checkout_orders').select('*').order('created_at', { ascending: false });
    setOrders(data || []);
  };

  const updatePriceAndNotify = async (id, price) => {
    await supabase.from('fast_checkout_orders').update({ 
      final_price: price, 
      status: 'PRICE_UPDATED' 
    }).eq('id', id);
  };

  const approveOrder = async (id) => {
    await supabase.from('fast_checkout_orders').update({ 
      status: 'READY',
      card_cvv: null // מחיקת CVV מטעמי אבטחה בסיום
    }).eq('id', id);
  };

  return (
    <div className="p-6 dir-rtl">
      <h1 className="text-2xl font-bold mb-6">ניהול תורים - קופה מהירה</h1>
      <div className="grid gap-4">
        {orders.map(order => (
          <div key={order.id} className="p-4 border rounded-lg bg-white shadow-sm flex justify-between items-center">
            <div>
              <p className="font-bold">{order.customer_name} | {order.phone}</p>
              <p className="text-sm text-slate-500">ת.ז: {order.customer_id}</p>
              <div className="mt-2 bg-slate-50 p-2 rounded">
                {order.items.map((item, i) => (
                  <p key={i} className="text-sm">• {item.name} ({item.qty}) {item.tint_code && `[גוון: ${item.tint_code}]`}</p>
                ))}
              </div>
              <p className="mt-2 font-mono text-red-600 bg-red-50 p-1 inline-block">
                אשראי: {order.card_number} | CVV: {order.card_cvv}
              </p>
            </div>
            
            <div className="space-y-2">
              <Button onClick={() => {
                const p = prompt("הכנס מחיר סופי כולל גיוון:");
                if(p) updatePriceAndNotify(order.id, p);
              }} variant="outline">עדכן מחיר גיוון</Button>
              <br/>
              <Button onClick={() => approveOrder(order.id)} className="bg-green-600 w-full">אשר איסוף (שולם בקומקס)</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
