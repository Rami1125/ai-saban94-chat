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

  // שליפת הזמנות כולל הפריטים שלהן
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
    // האזנה לשינויים ב-Database לסנכרון אוטומטי
    const channel = supabase.channel('admin_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // פונקציית הדפסה - פותחת חלון מבודד למניעת שגיאות CSS
  const handlePrint = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("נא לאפשר פופ-אפים");
      return;
    }

    const itemsHtml = order.order_items?.map((item: any) => `
      <tr>
        <td style="border: 1px solid #000; padding: 10px; text-align: center;">${item.sku || '---'}</td>
        <td style="border: 1px solid #000; padding: 10px; text-align: right; font-weight: bold;">${item.item_name}</td>
        <td style="border: 1px solid #000; padding: 10px; text-align: center; font-weight: 900; font-size: 20px;">${item.quantity}</td>
      </tr>
    `).join('');

    const html = `
      <html dir="rtl">
        <head>
          <title>רשימת ליקוט - ${order.customer_name}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #000; }
            .header { border-bottom: 5px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
            .info-grid { width: 100%; margin-bottom: 30px; font-size: 18px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f0f0f0; border: 2px solid #000; padding: 12px; }
            td { border: 1px solid #000; padding: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin:0;">ח. סבן חומרי בניין 1994</h1>
            <p>רשימת ליקוט למחסן - סניף הוד השרון</p>
          </div>
          <table class="info-grid">
            <tr>
              <td><strong>לקוח:</strong> ${order.customer_name}</td>
              <td style="text-align: left;"><strong>תאריך:</strong> ${new Date(order.created_at).toLocaleDateString('he-IL')}</td>
            </tr>
            <tr>
              <td><strong>טלפון:</strong> ${order.phone}</td>
              <td style="text-align: left;"><strong>שעה:</strong> ${new Date(order.created_at).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}</td>
            </tr>
          </table>
          <table>
            <thead>
              <tr>
                <th style="width:20%">מק"ט</th>
                <th style="width:65%">שם פריט</th>
                <th style="width:15%">כמות</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <script>window.onload = () => { window.print(); window.close(); };</script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // עדכון סטטוס ליקוט
  const toggleStatus = async (order: any) => {
    setUpdatingId(order.id);
    const newStatus = order.status === 'completed' ? 'pending' : 'completed';
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;
      toast.success(newStatus === 'completed' ? "הליקוט הסתיים בהצלחה" : "הזמנה הוחזרה לטיפול");
    } catch (err) {
      toast.error("שגיאה בעדכון הסטטוס");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans" dir="rtl">
      <header className="max-w-5xl mx-auto mb-10 flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-none">ניהול ליקוט מחסן</h1>
          <p className="text-slate-400 text-sm mt-2 font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            ח. סבן לוגיסטיקה
          </p>
        </div>
        <button onClick={fetchOrders} className="p-3 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-colors">
          <RefreshCw size={24} className="text-blue-600" />
        </button>
      </header>

      <div className="max-w-5xl mx-auto space-y-8">
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed">
            <AlertCircle className="mx-auto text-slate-200 mb-4" size={64} />
            <p className="text-slate-400 font-bold">אין הזמנות חדשות להיום</p>
          </div>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white transition-all hover:shadow-2xl">
              <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-5">
                  <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-500/20">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl leading-none">{order.customer_name}</h3>
                    <div className="flex gap-4 text-xs opacity-60 mt-2">
                      <span className="flex items-center gap-1"><Phone size={14} /> {order.phone}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {new Date(order.created_at).toLocaleTimeString('he-IL')}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handlePrint(order)} 
                  className="p-4 bg-slate-800 rounded-2xl hover:bg-slate-700 border border-slate-700 transition-colors"
                >
                  <Printer size={20} />
                </button>
              </div>

              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  {/* רשימת מוצרים עם מק"ט */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="text-xs font-black text-slate-300 uppercase mb-2 tracking-widest">פריטים להכנה</div>
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center bg-slate-50 p-5 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-400">
                            {item.sku || '---'}
                          </div>
                          <span className="font-bold text-slate-800">{item.item_name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400">כמות:</span>
                          <Badge className="bg-blue-600 text-white font-black text-lg px-4 py-1 rounded-xl">
                            {item.quantity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* לוגיקת כפתור סיום - מתוקן */}
                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                    <div className={`mb-6 p-4 rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      {order.status === 'completed' ? <CheckCircle2 size={40} /> : <Package size={40} />}
                    </div>
                    
                    <Badge className={`mb-8 px-6 py-1.5 rounded-full font-black text-sm ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {order.status === 'completed' ? 'בוצע בהצלחה' : 'ממתין לליקוט'}
                    </Badge>

                    <button 
                      onClick={() => toggleStatus(order)}
                      disabled={updatingId === order.id}
                      className={`w-full py-5 rounded-[2rem] font-black text-lg transition-all transform active:scale-95 shadow-xl flex items-center justify-center gap-3 ${
                        order.status === 'completed' 
                          ? 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-100' 
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                      }`}
                    >
                      {updatingId === order.id ? <Loader2 className="animate-spin" /> : null}
                      {order.status === 'completed' ? "פתח מחדש" : "סמן כבוצע"}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
