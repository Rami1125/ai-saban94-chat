"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Phone, User, Printer, RefreshCw, Clock } from "lucide-react";
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
      toast.error("שגיאה במשיכת נתונים");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('admin_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // פונקציית הדפסה חסינה - עוקפת את שגיאת ה-LAB COLOR
  const handlePrint = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("נא לאפשר חלונות קופצים בדפדפן");
      return;
    }

    const itemsHtml = order.order_items?.map((item: any) => `
      <tr>
        <td style="border: 1px solid #000; padding: 12px; text-align: right;">${item.item_name}</td>
        <td style="border: 1px solid #000; padding: 12px; text-align: center; font-weight: bold; font-size: 20px;">${item.quantity}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html dir="rtl">
        <head>
          <title>הזמנת ליקוט - ${order.customer_name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #000; }
            .header { border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f2f2f2; border: 1px solid #000; padding: 12px; text-align: center; }
            .info { font-size: 18px; margin-bottom: 20px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin:0;">ח. סבן חומרי בניין 1994</h1>
            <p style="margin:5px 0;">רשימת ליקוט למחסן</p>
          </div>
          <div class="info">
            <p><strong>לקוח:</strong> ${order.customer_name}</p>
            <p><strong>טלפון:</strong> ${order.phone}</p>
            <p><strong>תאריך:</strong> ${new Date(order.created_at).toLocaleString('he-IL')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>מוצר / גוון</th>
                <th>כמות</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
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
  };

  const updateStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    if (!error) toast.success("סטטוס עודכן");
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-right" dir="rtl">
      <header className="max-w-4xl mx-auto mb-8 flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-none">ניהול הזמנות</h1>
          <p className="text-slate-500 text-sm mt-1">SabanOS Logistics Control</p>
        </div>
        <button onClick={fetchOrders} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-colors">
          <RefreshCw size={24} />
        </button>
      </header>

      <div className="max-w-4xl mx-auto space-y-6">
        {orders.map((order) => (
          <Card key={order.id} className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-2xl"><User size={24} /></div>
                <div>
                  <h3 className="font-bold text-xl">{order.customer_name}</h3>
                  <div className="flex gap-4 text-xs opacity-60 mt-1">
                    <span className="flex items-center gap-1"><Phone size={14} /> {order.phone}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {new Date(order.created_at).toLocaleTimeString('he-IL')}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handlePrint(order)} 
                className="p-4 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-all border border-slate-700"
              >
                <Printer size={20} />
              </button>
            </div>

            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-3">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <Package className="text-blue-500" size={20} />
                        <span className="font-bold text-slate-800">{item.item_name}</span>
                      </div>
                      <Badge className="bg-white text-blue-600 border border-blue-100 px-3 font-black">x{item.quantity}</Badge>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center">
                  <Badge className={`mb-4 px-6 py-1 rounded-full font-black ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {order.status === 'completed' ? 'מוכן' : 'ממתין'}
                  </Badge>
                  <button 
                    onClick={() => updateStatus(order.id, order.status)}
                    className={`w-full py-4 rounded-2xl font-black transition-all ${
                      order.status === 'completed' ? 'bg-slate-200 text-slate-500' : 'bg-blue-600 text-white shadow-lg'
                    }`}
                  >
                    {order.status === 'completed' ? "החזר לרשימה" : "סיים הכנה"}
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
