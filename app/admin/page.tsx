"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Phone, User, Printer, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<string | null>(null);

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
    const channel = supabase.channel('admin_final_fix').on('postgres_changes', 
      { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handlePrint = (order: any) => {
    setIsExporting(order.id);
    
    // יצירת חלון חדש ונקי לחלוטין - מונע שגיאות LAB/CSS
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      toast.error("נא לאפשר פופ-אפים בדפדפן");
      setIsExporting(null);
      return;
    }

    const itemsHtml = order.order_items?.map((item: any) => `
      <tr>
        <td style="border: 1px solid #000; padding: 12px; text-align: right; font-weight: bold;">${item.item_name}</td>
        <td style="border: 1px solid #000; padding: 12px; text-align: center; font-weight: 900; font-size: 22px;">${item.quantity}</td>
      </tr>
    `).join('');

    const html = `
      <html dir="rtl">
        <head>
          <title>הזמנה - ${order.customer_name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #000; }
            .header { border-bottom: 4px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f0f0f0; border: 1px solid #000; padding: 12px; }
            .footer { margin-top: 50px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin:0; font-size: 28px;">ח. סבן חומרי בניין 1994</h1>
            <h2 style="margin:5px 0; font-size: 18px;">רשימת ליקוט להזמנה #${order.id.toString().slice(-4)}</h2>
          </div>
          <div style="font-size: 18px; margin-bottom: 30px;">
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
          <div class="footer">הופק באמצעות מערכת SabanOS Logistics</div>
          <script>
            window.onload = function() { 
              window.print(); 
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setIsExporting(null);
    toast.success("נפתח חלון הדפסה");
  };

  const updateStatus = async (order: any) => {
    await supabase.from('orders')
      .update({ status: order.status === 'completed' ? 'pending' : 'completed' })
      .eq('id', order.id);
    toast.success("סטטוס עודכן");
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-right" dir="rtl">
      <header className="max-w-4xl mx-auto mb-10 flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-none tracking-tight">ניהול הזמנות</h1>
          <p className="text-blue-600 text-xs mt-1 font-bold uppercase tracking-widest">SabanOS Logistics</p>
        </div>
        <button onClick={fetchOrders} className="p-3 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-all text-blue-600">
          <RefreshCw size={24} />
        </button>
      </header>

      <div className="max-w-4xl mx-auto space-y-6">
        {orders.map((order) => (
          <Card key={order.id} className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20"><User size={24} /></div>
                <div>
                  <h3 className="font-bold text-xl leading-none">{order.customer_name}</h3>
                  <p className="text-xs opacity-60 mt-2 font-mono">{order.phone}</p>
                </div>
              </div>
              <button 
                onClick={() => handlePrint(order)} 
                className="p-4 bg-slate-800 rounded-2xl hover:bg-slate-700 border border-slate-700 flex items-center gap-2"
              >
                {isExporting === order.id ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
                <span className="text-sm font-bold">הדפס רשימה</span>
              </button>
            </div>

            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-3">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <Package className="text-blue-500" size={18} />
                        <span className="font-bold text-slate-800">{item.item_name}</span>
                      </div>
                      <Badge className="bg-white text-blue-600 border border-blue-100 font-black px-4">x{item.quantity}</Badge>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center">
                  <Badge className={`mb-4 px-6 py-1 rounded-full font-black ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {order.status === 'completed' ? 'בוצע' : 'ממתין'}
                  </Badge>
                  <button 
                    onClick={() => updateStatus(order)}
                    className={`w-full py-4 rounded-2xl font-black transition-all ${
                      order.status === 'completed' ? 'bg-slate-200 text-slate-500' : 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    }`}
                  >
                    {order.status === 'completed' ? "החזר לרשימה" : "סיים ליקוט"}
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
