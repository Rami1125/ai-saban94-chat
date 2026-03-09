"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Package, Clock, CheckCircle2, Truck, Timer } from "lucide-react";
import { toast } from "sonner";

export default function WarehouseAdmin() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchOrders();

    // האזנה לשינויים בזמן אמת (Realtime)
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);
    
    if (!error) {
      toast.success(`הסטטוס עודכן ל-${newStatus}`);
      fetchOrders();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-20" dir="rtl">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900">ניהול הזמנות מחסן</h1>
          <p className="text-slate-500 font-bold">מעקב ליקוט ואספקה בזמן אמת</p>
        </div>
        <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl font-black text-sm shadow-lg shadow-blue-200">
          {orders.filter(o => o.status === 'pending').length} הזמנות חדשות
        </div>
      </header>

      <div className="grid gap-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-[2rem] border shadow-sm overflow-hidden border-slate-200">
            {/* Header של ההזמנה */}
            <div className="p-5 flex justify-between items-center bg-slate-50/50 border-b">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-tighter">לקוח</p>
                <h3 className="font-black text-lg">{order.customer_name}</h3>
                <p className="text-xs text-slate-500 font-mono">{order.phone}</p>
              </div>
              <div className="text-left">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${
                  order.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                }`}>
                  {order.status === 'pending' ? 'ממתין לליקוט' : 'הושלם'}
                </span>
                <p className="text-[10px] text-slate-400 mt-1 font-bold">
                  {new Date(order.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* רשימת פריטים */}
            <div className="p-5 space-y-3">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl">
                  <div className="w-10 h-10 bg-white rounded-xl border flex items-center justify-center font-black text-blue-600 text-xs shadow-sm">
                    {item.quantity}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm leading-tight">{item.item_name}</p>
                    <p className="text-[10px] text-slate-400 font-mono uppercase">{item.sku}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* כפתורי פעולה */}
            <div className="p-4 bg-white flex gap-2">
              <button 
                onClick={() => updateStatus(order.id, 'completed')}
                className="flex-1 h-12 bg-slate-900 text-white rounded-2xl font-black hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} /> סיום ליקוט
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
