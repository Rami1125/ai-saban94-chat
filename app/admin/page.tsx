"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Package, Phone, User, CheckCircle2, 
  Printer, MessageSquare, Clock, ArrowLeftRight 
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { fixHebrewForPDF, prepareTableRows } from "@/lib/pdf-utils";

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
      toast.error("שגיאה בטעינת הזמנות");
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

  const handleDownloadPDF = (order: any) => {
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

    // כותרת - יישור לימין (X=200)
    doc.setFontSize(22);
    doc.text(fixHebrewForPDF("ח. סבן - רשימת ליקוט"), 200, 20, { align: "right" });

    // פרטי הזמנה
    doc.setFontSize(12);
    doc.text(fixHebrewForPDF(`לקוח: ${order.customer_name}`), 200, 32, { align: "right" });
    doc.text(fixHebrewForPDF(`טלפון: ${order.phone}`), 200, 40, { align: "right" });
    doc.text(fixHebrewForPDF(`תאריך: ${new Date(order.created_at).toLocaleString('he-IL')}`), 200, 48, { align: "right" });

    // יצירת טבלה עם הגדרות RTL
    (doc as any).autoTable({
      head: [[
        fixHebrewForPDF('אריזה'),
        fixHebrewForPDF('כמות'),
        fixHebrewForPDF('מק"ט'),
        fixHebrewForPDF('שם מוצר')
      ]],
      body: prepareTableRows(order.order_items),
      startY: 55,
      styles: { 
        font: 'helvetica', 
        halign: 'right', // יישור תוכן התא לימין
        fontSize: 10
      },
      headStyles: { 
        fillColor: [37, 99, 235], 
        halign: 'right' 
      },
      columnStyles: {
        0: { halign: 'right' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      },
      margin: { right: 10, left: 10 }
    });

    doc.save(`Order_${order.customer_name}.pdf`);
    toast.success("קובץ PDF הופק");
  };

  const handleWhatsAppShare = (order: any) => {
    const itemsText = order.order_items
      .map((item: any) => `• ${item.item_name} | כמות: ${item.quantity}`)
      .join('%0A');

    const message = `*הזמנה להכנה - ח. סבן*%0A*לקוח:* ${order.customer_name}%0A*פריטים:*%0A${itemsText}`;
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const updateStatus = async (orderId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (!error) {
      toast.success("סטטוס עודכן");
      fetchOrders();
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 dir-rtl text-right" dir="rtl">
      <header className="max-w-6xl mx-auto mb-10 flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900">ניהול הזמנות ח. סבן</h1>
        <Badge className="bg-blue-600 px-4 py-2 rounded-xl">{orders.length} הזמנות</Badge>
      </header>

      <div className="max-w-6xl mx-auto grid gap-6">
        {orders.map((order) => (
          <Card key={order.id} className="border-none shadow-lg rounded-[2rem] overflow-hidden bg-white">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-2xl"><User size={24} /></div>
                <div>
                  <h3 className="font-bold text-xl">{order.customer_name}</h3>
                  <p className="text-slate-400 text-sm">{order.phone} | {new Date(order.created_at).toLocaleTimeString('he-IL')}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleWhatsAppShare(order)} className="p-3 bg-green-600 rounded-2xl hover:bg-green-700 transition-all"><MessageSquare size={20}/></button>
                <button onClick={() => handleDownloadPDF(order)} className="p-3 bg-slate-700 rounded-2xl hover:bg-slate-600 transition-all"><Printer size={20}/></button>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-4">
                        {item.hex_color ? (
                          <div className="w-10 h-10 rounded-lg border shadow-sm" style={{ backgroundColor: item.hex_color }} />
                        ) : (
                          <Package className="text-blue-500" size={24} />
                        )}
                        <p className="font-bold text-slate-800">{item.item_name}</p>
                      </div>
                      <span className="font-black text-blue-600 bg-white px-3 py-1 rounded-lg border">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col justify-center items-center bg-slate-50 rounded-2xl border-2 border-dashed p-6">
                  <Badge className={`mb-4 px-4 py-1 ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {order.status === 'completed' ? 'בוצע' : 'ממתין'}
                  </Badge>
                  <button 
                    onClick={() => updateStatus(order.id, order.status)}
                    className={`w-full py-4 rounded-2xl font-black transition-all ${order.status === 'completed' ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white shadow-lg'}`}
                  >
                    {order.status === 'completed' ? "החזר לטיפול" : "סמן כבוצע - מוכן"}
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
