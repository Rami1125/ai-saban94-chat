"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Phone, User, Printer, RefreshCw, Hash, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // שליפת נתונים מ-Supabase
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
      toast.error("שגיאה בטעינת נתונים מהשרת");
    } finally {
      setLoading(false);
    }
  };

  // האזנה לשינויים בזמן אמת (Realtime)
  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('admin_live_v8')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchOrders())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // לוגיקת הדפסה מבודדת (Native Print) - פותר את שגיאות ה-LAB Color
  const handlePrint = (order: any) => {
    setIsExporting(order.id);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("נא לאפשר חלונות קופצים בדפדפן");
      setIsExporting(null);
      return;
    }

    const itemsHtml = order.order_items?.map((item: any) => `
      <tr>
        <td style="border: 1px solid #000; padding: 10px; text-align: center;">${item.sku || '---'}</td>
        <td style="border: 1px solid #000; padding: 10px; text-align: right; font-weight: bold;">${item.item_name}</td>
        <td style="border: 1px solid #000; padding: 10px; text-align: center; font-weight: 900; font-size: 20px;">${item.quantity}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html dir="rtl">
        <head>
          <title>רשימת ליקוט - ${order.customer_name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #000; background: #fff; }
            .header { border-bottom: 5px solid #000; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
            .company-info h1 { font-size: 32px; font-weight: 900; margin: 0; }
            .company-info p { font-size: 16px; margin: 5px 0; }
            .doc-title { font-size: 24px; font-weight: bold; border: 2px solid #000; padding: 5px 15px; }
            .order-meta { width: 100%; margin-bottom: 30px; border-collapse: collapse; font-size: 18px; }
            .order-meta td { padding: 5px 0; }
            .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .items-table th { background: #f2f2f2; border: 2px solid #000; padding: 12px; font-size: 16px; }
            .items-table td { border: 1px solid #000; padding: 12px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; border-top: 1px solid #ddd; padding-top: 10px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h1>ח. סבן חומרי בניין 1994</h1>
              <p>סניף הוד השרון | טל: 09-7602010</p>
            </div>
            <div class="doc-title">רשימת ליקוט</div>
          </div>
          
          <table class="order-meta">
            <tr>
              <td style="width: 50%;"><strong>לכבוד:</strong> ${order.customer_name}</td>
              <td style="text-align: left;"><strong>תאריך:</strong> ${new Date(order.created_at).toLocaleDateString('he-IL')}</td>
            </tr>
            <tr>
              <td><strong>טלפון:</strong> ${order.phone}</td>
              <td style="text-align: left;"><strong>שעה:</strong> ${new Date(order.created_at).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</td>
            </tr>
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 20%;">מק"ט</th>
                <th style="width: 65%;">שם פריט / תיאור</th>
                <th style="width: 15%;">כמות</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="footer">
            הופק ע"י מערכת SabanOS Logistics | מחסן ח. סבן
          </div>

          <script>
            window.onload = function() { 
              window.print(); 
              setTimeout(() => { window.close(); }, 500); 
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setIsExporting(null);
  };

  // עדכון סטטוס הזמנה (ממתין / בוצע)
  const toggleOrderStatus = async (order: any) => {
    const newStatus = order.status === 'completed' ? 'pending' : 'completed';
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;
      toast.success(newStatus === 'completed' ? "הליקוט הסתיים" : "הזמנה הוחזרה לממתינים");
    } catch (error) {
      toast.error("שגיאה בעדכון הסטטוס");
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans" dir="rtl">
      {/* כותרת עליונה */}
      <header className="max-w-5xl mx-auto mb-10 flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-none tracking-tight">ניהול לוגיסטי - ח. סבן</h1>
          <p className="text-blue-600 text-xs mt-2 font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            SabanOS Live Dashboard
          </p>
        </div>
        <button 
          onClick={fetchOrders} 
          className="p-3 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-all text-blue-600"
        >
          <RefreshCw size={24} />
        </button>
      </header>

      {/* רשימת הזמנות */}
      <div className="max-w-5xl mx-auto space-y-8">
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <Package className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-bold">אין הזמנות חדשות במערכת</p>
          </div>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white transition-all hover:shadow-2xl">
              {/* כותרת כרטיס */}
              <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-5">
                  <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-500/20">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl leading-none">{order.customer_name}</h3>
                    <div className="flex gap-4 text-xs opacity-60 mt-2 font-mono">
                      <span className="flex items-center gap-1"><Phone size={14} /> {order.phone}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {new Date(order.created_at).toLocaleTimeString('he-IL')}</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => handlePrint(order)} 
                  disabled={isExporting === order.id}
                  className="p-4 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-all border border-slate-700 flex items-center gap-3"
                >
                  {isExporting === order.id ? <Loader2 size={20} className="animate-spin" /> : <Printer size={20} />}
                  <span className="text-sm font-bold">הדפס רשימה</span>
                </button>
              </div>

              {/* תוכן כרטיס */}
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  {/* פירוט פריטים */}
                  <div className="lg:col-span-2 space-y-3">
                    <h4 className="text-sm font-black text-slate-400 mb-4 uppercase tracking-tighter">פריטים לליקוט:</h4>
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="bg-white p-2 rounded-lg border border-slate-200 text-slate-400">
                            <Hash size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-mono text-slate-400 block">{item.sku || 'ללא מק"ט'}</span>
                            <span className="font-bold text-slate-800">{item.item_name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-slate-300 font-light italic">כמות</span>
                          <Badge className="bg-blue-600 text-white font-black text-lg px-4 py-1 rounded-xl shadow-md">
                            {item.quantity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* בקרה וסטטוס */}
                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                      order.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {order.status === 'completed' ? <CheckCircle2 size={32} /> : <Package size={32} />}
                    </div>
                    
                    <Badge className={`mb-6 px-8 py-1.5 rounded-full font-black text-sm ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {order.status === 'completed' ? 'הליקוט בוצע' : 'ממתין לליקוט'}
                    </Badge>
                    
                    <button 
                      onClick={() => toggleOrderStatus(order)}
                      className={`w-full py-5 rounded-3xl font-black text-lg transition-all transform active:scale-95 shadow-xl ${
                        order.status === 'completed' 
                          ? 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-100' 
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                      }`}
                    >
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
