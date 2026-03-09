"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, User, Printer, RefreshCw, CheckCircle2, Share2, CreditCard, Banknote, Phone } from "lucide-react";
import { toast } from "sonner";

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
    const channel = supabase.channel('admin_v11')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleShareWhatsApp = (order: any) => {
    const itemsList = order.order_items?.map((i: any) => `* [${i.sku || '---'}] ${i.item_name} (כמות: ${i.quantity})`).join('\n') || "אין פריטים";
    const paymentStatus = order.payment_method === 'counter' ? 'מזומן בקופה' : 'שולם באשראי';
    const message = encodeURIComponent(
      `*הזמנה חדשה - ח. סבן*\n` +
      `*לקוח:* ${order.customer_name}\n` +
      `*תשלום:* ${paymentStatus}\n\n` +
      `*פירוט פריטים (מק"ט):*\n${itemsList}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handlePrint = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error("נא לאפשר פופ-אפים");

    const itemsHtml = order.order_items?.map((item: any) => `
      <tr>
        <td style="border: 1px solid #000; padding: 10px; text-align: center;">${item.sku || '---'}</td>
        <td style="border: 1px solid #000; padding: 10px; text-align: right;">${item.item_name}</td>
        <td style="border: 1px solid #000; padding: 10px; text-align: center;">${item.quantity}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl">
        <head><style>body { font-family: Arial; padding: 20px; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #000; padding: 10px; }</style></head>
        <body>
          <h1>ח. סבן - רשימת ליקוט</h1>
          <p>לקוח: ${order.customer_name} | תשלום: ${order.payment_method === 'counter' ? 'מזומן בקופה' : 'אשראי'}</p>
          <table><thead><tr><th>מק"ט</th><th>פריט</th><th>כמות</th></tr></thead><tbody>${itemsHtml}</tbody></table>
          <script>window.onload = () => { window.print(); window.close(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const toggleStatus = async (id: string, current: string) => {
    setUpdatingId(id);
    const { error } = await supabase.from('orders').update({ status: current === 'completed' ? 'pending' : 'completed' }).eq('id', id);
    if (error) toast.error("עדכון נכשל");
    else toast.success("עודכן בהצלחה");
    setUpdatingId(null);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-100 p-6" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="rounded-[2rem] shadow-lg border-none overflow-hidden bg-white">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <User size={20} className="text-blue-400" />
                <span className="font-bold">{order.customer_name}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleShareWhatsApp(order)} className="p-2 bg-green-600 rounded-lg"><Share2 size={16}/></button>
                <button onClick={() => handlePrint(order)} className="p-2 bg-slate-700 rounded-lg"><Printer size={16}/></button>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <div className="flex gap-2 mb-3">
                    {order.payment_method === 'counter' ? 
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">תשלום בקופה</Badge> : 
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">שולם באשראי</Badge>}
                  </div>
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between p-3 bg-slate-50 rounded-xl border">
                      <span className="text-xs font-mono text-slate-400">[{item.sku || '---'}]</span>
                      <span className="font-medium">{item.item_name}</span>
                      <span className="font-black text-blue-600">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col items-center justify-center border-r pr-6 relative">
                  <button 
                    onClick={() => toggleStatus(order.id, order.status)}
                    disabled={updatingId === order.id}
                    className={`z-50 w-full py-4 rounded-2xl font-black transition-all shadow-md ${
                      order.status === 'completed' ? 'bg-slate-200 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {updatingId === order.id ? <Loader2 className="animate-spin mx-auto" /> : (order.status === 'completed' ? "בוצע (פתח מחדש)" : "סמן כבוצע")}
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
