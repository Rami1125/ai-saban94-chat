"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Paintbucket, Phone, User, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // שליפת הזמנות כולל הפריטים שלהן (Join)
  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("שגיאה בטעינת הזמנות");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
    
    // בונוס: האזנה לשינויים בזמן אמת (Realtime)
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (!error) {
      toast.success(`הסטטוס עודכן ל-${newStatus}`);
      fetchOrders();
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">טוען הזמנות מהקופה...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 dir-rtl" dir="rtl">
      <header className="max-w-5xl mx-auto mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">ניהול הזמנות</h1>
          <p className="text-slate-500">ח. סבן - מרכז לוגיסטי</p>
        </div>
        <Badge className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-lg">
          {orders.length} ממתינות
        </Badge>
      </header>

      <div className="max-w-5xl mx-auto grid gap-6">
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 text-xl font-medium">אין הזמנות חדשות כרגע</p>
          </div>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
              <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{order.customer_name}</h3>
                    <p className="text-slate-400 text-xs flex items-center gap-1">
                      <Phone size={10} /> {order.phone}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">זמן הזמנה</p>
                  <p className="text-sm font-mono">{new Date(order.created_at).toLocaleTimeString('he-IL')}</p>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">פירוט סל הקניות:</h4>
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-4">
                        {item.hex_color ? (
                          <div className="w-12 h-12 rounded-xl border-2 border-white shadow-sm" style={{ backgroundColor: item.hex_color }} />
                        ) : (
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 border border-slate-100">
                            <Package size={24} />
                          </div>
                        )}
                        <div>
                          <p className="font-black text-slate-800">{item.item_name}</p>
                          <p className="text-xs text-slate-500 font-medium">
                            {item.sku ? `מק"ט: ${item.sku}` : "גוון בהתאמה"} 
                            {item.container_size && ` | אריזה: ${item.container_size}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-center bg-white px-4 py-2 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">כמות</p>
                        <p className="text-xl font-black text-blue-600">{item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateStatus(order.id, 'completed')}
                      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl font-bold transition-all active:scale-95"
                    >
                      <CheckCircle2 size={18} /> סמן כבוצע
                    </button>
                    <button className="text-slate-400 hover:text-slate-600 px-4 font-medium text-sm">הדפס מדבקה</button>
                  </div>
                  <Badge className={`${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'} px-4 py-1 rounded-lg font-bold`}>
                    {order.status === 'completed' ? 'הושלם' : 'ממתין להכנה'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
