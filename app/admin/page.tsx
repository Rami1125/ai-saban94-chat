"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Phone, User, Printer, RefreshCw, Hash, Clock, CheckCircle2, Share2 } from "lucide-react";
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
    const channel = supabase.channel('admin_final_fix')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // תיקון שיתוף: שליחה ישירה לווצאפ
  const handleShareWhatsApp = (order: any) => {
    const itemsList = order.order_items.map((i: any) => `* ${i.item_name} (כמות: ${i.quantity})`).join('\n');
    const message = encodeURIComponent(
      `*הזמנה חדשה - ח. סבן*\n\n` +
      `*לקוח:* ${order.customer_name}\n` +
      `*טלפון:* ${order.phone}\n\n` +
      `*פריטים לליקוט:*\n${itemsList}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  // הדפסה בעיצוב תעודת משלוח (חסין LAB Color)
  const handlePrint = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error("נא לאפשר פופ-אפים");

    const itemsHtml = order.order_items?.map((item: any) => `
      <tr>
        <td style="border: 1px solid #000; padding: 10px; text-align: center;">${item.sku || '---'}</td>
        <td style="border: 1px solid #000; padding: 10px; text-align: right;">${item.item_name}</td>
        <td style="border: 1px solid #000; padding: 10px; text-align: center; font-weight: bold;">${item.quantity}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <style>
            body { font-family: Arial; padding: 20px; }
            .header { border-bottom: 4px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 10px; }
            th { background: #f0f0f0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ח. סבן חומרי בניין 1994</h1>
            <p>רשימת ליקוט למחסן | ${new Date(order.created_at).toLocaleDateString('he-IL')}</p>
          </div>
          <p><strong>לקוח:</strong> ${order.customer_name} | <strong>טלפון:</strong> ${order.phone}</p>
          <table>
            <thead><tr><th>מק"ט</th><th>שם פריט</th><th>כמות</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <script>window.onload = () => { window.print(); window.close(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // תיקון כפתור סמן כבוצע: הוספת Z-index ובידוד אירוע
  const handleToggleStatus = async (e: React.MouseEvent, order: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    setUpdatingId(order.id);
    const newStatus = order.status === 'completed' ? 'pending' : 'completed';
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;
      toast.success(newStatus === 'completed' ? "הליקוט בוצע" : "הוחזר לרשימה");
    } catch (err) {
      toast.error("שגיאה בעדכון הסטטוס");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans" dir="rtl">
      <header className="max-w-5xl mx-auto mb-8 flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-none">SabanOS Admin</h1>
          <p className="text-blue-600 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Logistics Management</p>
        </div>
        <button onClick={fetchOrders} className="p-3 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-colors">
          <RefreshCw size={24} className="text-blue-600" />
        </button>
      </header>

      <div className="max-w-5xl mx-auto space-y-6">
        {orders.map((order) => (
          <Card key={order.id} className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20"><User size={20} /></div>
                <div>
                  <h3 className="font-bold text-lg leading-none">{order.customer_name}</h3>
                  <p className="text-[10px] opacity-50 mt-1 font-mono">{order.phone}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleShareWhatsApp(order)}
                  className="p-3 bg-green-600/20 text-green-400 rounded-xl hover:bg-green-600 hover:text-white border border-green-600/30 transition-all"
                >
                  <Share2 size={18} />
                </button>
                <button 
                  onClick={() => handlePrint(order)}
                  className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 border border-slate-700 transition-all"
                >
                  <Printer size={18} />
                </button>
              </div>
            </div>

            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-3">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono bg-white px-2 py-1 rounded border text-slate-400">{item.sku || '---'}</span>
                        <span className="font-bold text-slate-800 text-sm">{item.item_name}</span>
                      </div>
                      <Badge className="bg-blue-600 text-white font-black px-4">x{item.quantity}</Badge>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center relative">
                  <div className={`mb-4 p-3 rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    {order.status === 'completed' ? <CheckCircle2 size={32} /> : <Package size={32} />}
                  </div>
                  
                  <Badge className={`mb-6 px-6 py-1 rounded-full font-black text-xs ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {order.status === 'completed' ? 'לוקט' : 'ממתין'}
                  </Badge>

                  {/* כפתור סיום ליקוט - תיקון לחיצה סופי */}
                  <button 
                    onClick={(e) => handleToggleStatus(e, order)}
                    disabled={updatingId === order.id}
                    className={`relative z-50 cursor-pointer pointer-events-auto w-full py-4 rounded-2xl font-black text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      order.status === 'completed' 
                        ? 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-100' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                    }`}
                  >
                    {updatingId === order.id ? <Loader2 className="animate-spin" size={16} /> : null}
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
