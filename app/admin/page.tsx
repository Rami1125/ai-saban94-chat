"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Phone, User, CheckCircle2, Printer, Share2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchOrders() {
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
  }

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('admin-sync').on('postgres_changes', 
      { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- פונקציית הדפסה ל-PDF ---
  const generatePDF = (order) => {
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    
    // הגדרות בסיסיות (הערה: PDF לא תומך בעברית ללא פונט מותאם, נשתמש באנגלית/מספרים או ייצוא גרפי)
    doc.setFontSize(20);
    doc.text(`Order ID: ${order.id.slice(0,8)}`, 10, 20);
    doc.setFontSize(12);
    doc.text(`Customer: ${order.customer_name}`, 10, 30);
    doc.text(`Phone: ${order.phone}`, 10, 38);
    doc.text(`Date: ${new Date(order.created_at).toLocaleString('he-IL')}`, 10, 46);

    const tableRows = order.order_items.map(item => [
      item.item_name,
      item.sku || '-',
      item.quantity.toString(),
      item.container_size || '-'
    ]);

    (doc as any).autoTable({
      head: [['Item', 'SKU', 'Qty', 'Size']],
      body: tableRows,
      startY: 55,
      theme: 'grid',
      styles: { halign: 'left' }
    });

    doc.save(`Order_${order.customer_name}.pdf`);
    toast.success("קובץ PDF נוצר");
  };

  // --- פונקציית שיתוף לוואטסאפ ---
  const shareToWhatsApp = (order) => {
    const itemsText = order.order_items
      .map(item => `• ${item.item_name} (כמות: ${item.quantity}) ${item.sku ? `[${item.sku}]` : ''}`)
      .join('%0A');

    const text = `*הזמנה חדשה - ח. סבן*%0A------------------%0A*לקוח:* ${order.customer_name}%0A*טלפון:* ${order.phone}%0A*פריטים:*%0A${itemsText}%0A------------------%0A*נא להכין במחסן!*`;
    
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const updateStatus = async (orderId, newStatus) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (!error) {
      toast.success("סטטוס עודכן");
      fetchOrders();
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 dir-rtl" dir="rtl">
      <header className="max-w-5xl mx-auto mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">ניהול הזמנות ח. סבן</h1>
        <Badge className="bg-blue-600 text-lg px-4">{orders.length}</Badge>
      </header>

      <div className="max-w-5xl mx-auto grid gap-6">
        {orders.map((order) => (
          <Card key={order.id} className="border-none shadow-lg rounded-3xl overflow-hidden bg-white">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-2 rounded-lg"><User size={20} /></div>
                <div>
                  <h3 className="font-bold text-lg">{order.customer_name}</h3>
                  <p className="text-slate-400 text-xs">{order.phone}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => shareToWhatsApp(order)} className="p-2 bg-green-600 rounded-full hover:bg-green-700 transition-colors">
                  <MessageSquare size={18} />
                </button>
                <button onClick={() => generatePDF(order)} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600 transition-colors">
                  <Printer size={18} />
                </button>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="space-y-3">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      {item.hex_color ? <div className="w-10 h-10 rounded-lg border" style={{ backgroundColor: item.hex_color }} /> : <Package size={20} className="text-blue-500"/>}
                      <div>
                        <p className="font-bold text-sm">{item.item_name}</p>
                        <p className="text-[10px] text-slate-500">{item.sku || 'ללא מק"ט'}</p>
                      </div>
                    </div>
                    <div className="text-center bg-white px-3 py-1 rounded-lg border">
                      <p className="text-lg font-black text-blue-600">{item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t flex justify-between items-center">
                <button 
                  onClick={() => updateStatus(order.id, 'completed')}
                  disabled={order.status === 'completed'}
                  className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${order.status === 'completed' ? 'bg-slate-100 text-slate-400' : 'bg-green-500 text-white hover:bg-green-600'}`}
                >
                  <CheckCircle2 size={18} /> {order.status === 'completed' ? 'בוצע' : 'סמן כבוצע'}
                </button>
                <Badge className={order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                  {order.status === 'completed' ? 'הושלם' : 'ממתין'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
