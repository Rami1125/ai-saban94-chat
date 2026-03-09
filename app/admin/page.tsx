"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Phone, User, Printer, RefreshCw, Hash } from "lucide-react";
import { toast } from "sonner";

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items (*)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast.error("שגיאה בטעינת נתונים");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('admin_final_v6').on('postgres_changes', 
      { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handlePrint = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("נא לאפשר פופ-אפים בדפדפן");
      return;
    }

    // יצירת שורות הטבלה עם מק"ט, שם פריט וכמות
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
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #000; }
            .header { border-bottom: 4px solid #000; padding-bottom: 10px; margin-bottom: 20px; text-align: left; }
            .title { font-size: 28px; font-weight: 900; margin: 0; }
            .subtitle { font-size: 16px; margin: 5px 0; }
            .info-table { width: 100%; margin-bottom: 20px; font-size: 18px; }
            .items-table { width: 100%; border-collapse: collapse; }
            .items-table th { background: #f2f2f2; border: 1px solid #000; padding: 10px; font-size: 16px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">ח. סבן חומרי בניין 1994</h1>
            <p class="subtitle">רשימת ליקוט למחסן</p>
          </div>
          
          <table class="info-table">
            <tr>
              <td><strong>לקוח:</strong> ${order.customer_name}</td>
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
                <th style="width: 15%;">מק"ט</th>
                <th style="width: 70%;">מוצר / גוון</th>
                <th style="width: 15%;">כמות</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 40px; border-top: 1px dashed #000; padding-top: 10px; font-size: 12px; text-align: center;">
            הופק ע"י מערכת SabanOS - ניהול לוגיסטי חכם
          </div>

          <script>
            window.onload = function() { window.print(); setTimeout(() => { window.close(); }, 500); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const updateStatus = async (order: any) => {
    const { error } = await supabase.from('orders')
      .update({ status: order.status === 'completed' ? 'pending' : 'completed' })
      .eq('id', order.id);
    if (!error) toast.success("סטטוס עודכן");
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-right" dir="rtl">
      <header className="max-w-4xl mx-auto mb-8 flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border">
        <h1 className="text-2xl font-black text-slate-900">מרכז הזמנות - ח. סבן</h1>
        <button onClick={fetchOrders} className="p-2 hover:bg-slate-100 rounded-full"><RefreshCw size={24} /></button>
      </header>

      <div className="max-w-4xl mx-auto space-y-6">
        {orders.map((order) => (
          <Card key={order.id} className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-2xl"><User size={20} /></div>
                <div>
                  <h3 className="font-bold text-lg">{order.customer_name}</h3>
                  <p className="text-xs opacity-60 mt-1">{order.phone}</p>
                </div>
              </div>
              <button onClick={() => handlePrint(order)} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 border border-slate-700">
                <Printer size={20} />
              </button>
            </div>

            <CardContent className="p-6">
              <div className="space-y-3 mb-6">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border">
                    <div className="flex items-center gap-3">
                      <Hash size={14} className="text-slate-400" />
                      <span className="text-xs font-mono text-slate-500">{item.sku || '---'}</span>
                      <span className="font-bold text-slate-800 mr-2">{item.item_name}</span>
                    </div>
                    <Badge className="bg-blue-600 text-white font-black">x{item.quantity}</Badge>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <button 
                  onClick={() => updateStatus(order)}
                  className={`px-8 py-2 rounded-xl font-black transition-all ${
                    order.status === 'completed' ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white'
                  }`}
                >
                  {order.status === 'completed' ? "בוצע" : "סיים ליקוט"}
                </button>
                <Badge className={order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                  {order.status === 'completed' ? 'מוכן' : 'ממתין'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
