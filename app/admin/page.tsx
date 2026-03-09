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

  // שליפת נתונים מ-Supabase (Join בין orders ל-order_items)
  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items (*)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("שגיאה בטעינת הזמנות");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();

    // האזנה לשינויים בזמן אמת - Realtime
    const channel = supabase
      .channel('admin-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- פונקציית הדפסת PDF (שימוש ב-Utility) ---
  const handleDownloadPDF = (order: any) => {
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

    // כותרת מסמך
    doc.setFontSize(22);
    doc.text(fixHebrewForPDF(`ח. סבן - רשימת ליקוט`), 200, 20, { align: "right" });

    // פרטי הזמנה
    doc.setFontSize(12);
    doc.text(fixHebrewForPDF(`לקוח: ${order.customer_name}`), 200, 32, { align: "right" });
    doc.text(fixHebrewForPDF(`טלפון: ${order.phone}`), 200, 40, { align: "right" });
    doc.text(fixHebrewForPDF(`תאריך: ${new Date(order.created_at).toLocaleString('he-IL')}`), 200, 48, { align: "right" });

    // טבלת מוצרים
    (doc as any).autoTable({
      head: [[
        fixHebrewForPDF('אריזה'),
        fixHebrewForPDF('כמות'),
        fixHebrewForPDF('מק"ט'),
        fixHebrewForPDF('שם מוצר')
      ]],
      body: prepareTableRows(order.order_items),
      startY: 55,
      styles: { font: 'helvetica', halign: 'right' },
      headStyles: { fillColor: [37, 99, 235], halign: 'right' }, // כחול מותג
      margin: { right: 10, left: 10 }
    });

    doc.save(`Order_${order.customer_name}.pdf`);
    toast.success("קובץ PDF הופק בהצלחה");
  };

  // --- שיתוף לוואטסאפ של המחסן ---
  const handleWhatsAppShare = (order: any) => {
    const itemsText = order.order_items
      .map((item: any) => `• ${item.item_name} | כמות: ${item.quantity} ${item.sku ? `[${item.sku}]` : ''}`)
      .join('%0A');

    const message = `*הזמנה חדשה להכנה - ח. סבן*%0A------------------%0A*לקוח:* ${order.customer_name}%0A*טלפון:* ${order.phone}%0A%0A*פירוט פריטים:*%0A${itemsText}%0A------------------%0A*נא לאשר הכנה במערכת.*`;
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const updateStatus = async (orderId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast.error("שגיאה בעדכון הסטטוס");
    } else {
      toast.success(newStatus === 'completed' ? "הזמנה סומנה כבוצעה" : "הזמנה הוחזרה למתנה");
      fetchOrders();
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 dir-rtl text-right" dir="rtl">
      <header className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">ניהול לוגיסטי</h1>
          <p className="text-slate-500 font-medium">מרכז הזמנות ח. סבן חומרי בניין</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-lg px-6 py-2 bg-white shadow-sm border-slate-200 rounded-2xl">
            {orders.length} הזמנות במערכת
          </Badge>
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid gap-6">
        {orders.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 text-xl">אין הזמנות פעילות כרגע</p>
          </div>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="border-none shadow-xl shadow-slate-200/60 rounded-[2rem] overflow-hidden bg-white transition-all hover:shadow-2xl hover:shadow-blue-100/50">
              {/* כותרת הכרטיס */}
              <div className="bg-slate-900 p-5 text-white flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-900/20">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-xl leading-tight">{order.customer_name}</h3>
                    <div className="flex items-center gap-3 mt-1 opacity-70">
                      <span className="text-sm flex items-center gap-1"><Phone size={14}/> {order.phone}</span>
                      <span className="text-sm flex items-center gap-1"><Clock size={14}/> {new Date(order.created_at).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleWhatsAppShare(order)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                  >
                    <MessageSquare size={18} /> שיתוף למחסן
                  </button>
                  <button 
                    onClick={() => handleDownloadPDF(order)}
                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                  >
                    <Printer size={18} /> הדפסת ליקוט
                  </button>
                </div>
              </div>

              {/* תוכן ההזמנה */}
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* רשימת פריטים */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">פריטים להכנה</h4>
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-blue-50/30 transition-colors">
                        <div className="flex items-center gap-4">
                          {item.hex_color ? (
                            <div className="w-12 h-12 rounded-xl border-4 border-white shadow-sm shrink-0" style={{ backgroundColor: item.hex_color }} />
                          ) : (
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 border border-slate-100 shrink-0">
                              <Package size={24} />
                            </div>
                          )}
                          <div>
                            <p className="font-black text-slate-800 leading-tight">{item.item_name}</p>
                            <p className="text-[11px] text-slate-500 font-bold mt-1">
                              {item.sku ? `מק"ט: ${item.sku}` : "גוון בהתאמה"} {item.container_size && ` | אריזה: ${item.container_size}`}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm min-w-[60px] text-center">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">כמות</p>
                          <p className="text-xl font-black text-blue-600">{item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* פעולות ניהול */}
                  <div className="flex flex-col justify-end gap-4 p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-500">סטטוס נוכחי:</span>
                      <Badge className={`${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'} px-4 py-1.5 rounded-lg font-black text-xs`}>
                        {order.status === 'completed' ? 'הושלם במחסן' : 'ממתין לליקוט'}
                      </Badge>
                    </div>
                    
                    <button 
                      onClick={() => updateStatus(order.id, order.status)}
                      className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black transition-all active:scale-95 shadow-md ${
                        order.status === 'completed' 
                          ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' 
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                      }`}
                    >
                      {order.status === 'completed' ? (
                        <><ArrowLeftRight size={20} /> החזר לטיפול</>
                      ) : (
                        <><CheckCircle2 size={20} /> סמן כבוצע - המוצרים מוכנים</>
                      )}
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
