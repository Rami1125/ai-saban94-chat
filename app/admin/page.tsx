"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Phone, User, Printer, RefreshCw, Hash, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // שליפת נתונים
  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items (*)`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("שגיאה בטעינת נתונים");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('admin_sync_final')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // הדפסה מבודדת
  const handlePrint = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error("נא לאפשר פופ-אפים");

    const itemsHtml = order.order_items?.map((item: any) => `
      <tr>
        <td style="border: 1px solid #000; padding: 10px; text-align: center;">${item.sku || '---'}</td>
        <td style="border: 1px solid #000; padding: 10px; text-align: right; font-weight: bold;">${item.item_name}</td>
        <td style="border: 1px solid #000; padding: 10px; text-align: center; font-weight: 900; font-size: 20px;">${item.quantity}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl">
        <head><title>ליקוט - ${order.customer_name}</title></head>
        <body style="font-family: Arial; padding: 20px;">
          <h1 style="border-bottom: 3px solid #000;">ח. סבן חומרי בניין 1994</h1>
          <p><strong>לקוח:</strong> ${order.customer_name} | <strong>טלפון:</strong> ${order.phone}</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead><tr style="background: #eee;">
              <th style="border: 1px solid #000; padding: 10px;">מק"ט</th>
              <th style="border: 1px solid #000; padding: 10px;">שם פריט</th>
              <th style="border: 1px solid #000; padding: 10px;">כמות</th>
            </tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <script>window.onload = () => { window.print(); window.close(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // פונקציית עדכון סטטוס - מתוקנת
  const handleToggleStatus = async (e: React.MouseEvent, order: any) => {
    e.preventDefault();
    e.stopPropagation(); // מניעת התנגשויות אירועים
    
    setUpdatingId(order.id);
    const newStatus = order.status === 'completed' ? 'pending' : 'completed';
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;
      toast.success(newStatus === 'completed' ? "הליקוט בוצע" : "הוחזר לרשימה");
      await fetchOrders(); // רענון נתונים
    } catch (err) {
      toast.error("שגיאה בעדכון");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans" dir="rtl">
      <header className="max-w-5xl mx-auto mb-10 flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border">
        <h1 className="text-2xl font-black text-slate-900">ניהול ליקוט - ח. סבן</h1>
        <button onClick={fetchOrders} className="p-3 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-colors">
          <RefreshCw size={24} className="text-blue-600" />
        </button>
      </header>

      <div className="max-w-5xl mx-auto space-y-6">
        {orders.map((order) => (
          <Card key={order.id} className="border-none shadow-lg rounded-[2.5rem] overflow-hidden bg-white">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-2xl"><User size={20} /></div>
                <div>
                  <h3 className="font-bold text-lg">{order.customer_name}</h3>
                  <p className="text-xs opacity-60">{order.phone} | {new Date(order.created_at).toLocaleTimeString('he-IL')}</p>
                </div>
              </div>
              <button onClick={() => handlePrint(order)} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 border border-slate-700">
                <Printer size={20} />
              </button>
            </div>

            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-3">
                  <div className="text-xs font-bold text-slate-400 mb-2">פריטים לליקוט</div>
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono bg-white px-2 py-1 rounded border text-slate-400">{item.sku || '---'}</span>
                        <span className="font-bold text-slate-800">{item.item_name}</span>
                      </div>
                      <Badge className="bg-blue-600 text-white font-black text-lg px-4 py-1">x{item.quantity}</Badge>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center">
                  <div className={`mb-4 p-3 rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    {order.status === 'completed' ? <CheckCircle2 size={32} /> : <Package size={32} />}
                  </div>
                  
                  <Badge className={`mb-6 px-6 py-1 rounded-full font-black ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {order.status === 'completed' ? 'בוצע' : 'ממתין'}
                  </Badge>

                  {/* כפתור מתוקן עם אירוע מבודד ו-Z-Index גבוה */}
                  <button 
                    onClick={(e) => handleToggleStatus(e, order)}
                    disabled={updatingId === order.id}
                    className={`relative z-10 w-full py-4 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      order.status === 'completed' 
                        ? 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-100' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {updatingId === order.id && <Loader2 className="animate-spin" size={20} />}
                    {order.status === 'completed' ? "פתח מחדש" : "סמן כבוצע"}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
