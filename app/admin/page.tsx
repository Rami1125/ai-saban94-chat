"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Package, Phone, User, CheckCircle2, 
  Printer, MessageSquare, Clock, RefreshCw 
} from "lucide-react";
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
      console.error("Fetch error:", error);
      toast.error("שגיאה בטעינת הזמנות");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('admin_realtime_v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- פונקציית הדפסה חסינה (ייבוא דינמי בזמן לחיצה) ---
  const handleExportPDF = async (order: any) => {
    setIsExporting(order.id);
    try {
      // טעינת הספריות רק בזמן הלחיצה למניעת שגיאות preload
      const [jsPDF, html2canvas] = await Promise.all([
        import("jspdf").then(m => m.default),
        import("html2canvas").then(m => m.default)
      ]);

      const element = document.getElementById(`order-print-${order.id}`);
      if (!element) throw new Error("Element not found");

      // הצגה זמנית לצורך צילום
      element.style.display = "block";
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      element.style.display = "none";

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Saban_Order_${order.customer_name}.pdf`);
      toast.success("PDF מוכן");
    } catch (error) {
      console.error(error);
      toast.error("שגיאה ביצירת הקובץ");
    } finally {
      setIsExporting(null);
    }
  };

  const handleWhatsAppShare = (order: any) => {
    const items = order.order_items.map((i: any) => `• ${i.item_name} (x${i.quantity})`).join('%0A');
    const msg = `*הזמנה להכנה - ח. סבן*%0A*לקוח:* ${order.customer_name}%0A*פריטים:*%0A${items}`;
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const updateStatus = async (order: any) => {
    const newStatus = order.status === 'completed' ? 'pending' : 'completed';
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
    if (!error) toast.success("סטטוס עודכן");
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans" dir="rtl">
      <header className="max-w-4xl mx-auto mb-8 flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900">מרכז הזמנות ח. סבן</h1>
          <p className="text-slate-500 text-sm">ניהול מלאי וליקוט בזמן אמת</p>
        </div>
        <button onClick={fetchOrders} className="p-2 bg-slate-100 rounded-xl hover:bg-blue-100 transition-colors">
          <RefreshCw size={20} className="text-blue-600" />
        </button>
      </header>

      <div className="max-w-4xl mx-auto space-y-6">
        {orders.map((order) => (
          <Card key={order.id} className="border-none shadow-md rounded-[2rem] overflow-hidden bg-white">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-2xl"><User size={20} /></div>
                <div>
                  <h3 className="font-bold text-lg">{order.customer_name}</h3>
                  <span className="text-xs opacity-70 flex items-center gap-1 mt-1"><Phone size={12} /> {order.phone}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleWhatsAppShare(order)} className="p-3 bg-green-600 rounded-xl hover:bg-green-700">
                  <MessageSquare size={18} />
                </button>
                <button 
                  disabled={isExporting === order.id}
                  onClick={() => handleExportPDF(order)} 
                  className="p-3 bg-slate-700 rounded-xl hover:bg-slate-600"
                >
                  {isExporting === order.id ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
                </button>
              </div>
            </div>

            <CardContent className="p-6">
              {/* רכיב נסתר להדפסה בלבד */}
              <div id={`order-print-${order.id}`} style={{ display: 'none', padding: '40px', background: 'white' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '10px' }}>ח. סבן חומרי בניין</h1>
                <p><strong>לקוח:</strong> {order.customer_name}</p>
                <p><strong>טלפון:</strong> {order.phone}</p>
                <p><strong>תאריך:</strong> {new Date(order.created_at).toLocaleString('he-IL')}</p>
                <hr style={{ margin: '20px 0' }} />
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'right' }}>מוצר</th>
                      <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>כמות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.order_items?.map((item: any) => (
                      <tr key={item.id}>
                        <td style={{ border: '1px solid #ddd', padding: '12px' }}>{item.item_name}</td>
                        <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* תצוגה במסך */}
              <div className="space-y-3">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <Package className="text-blue-500" size={18} />
                      <span className="font-bold text-slate-800">{item.item_name}</span>
                    </div>
                    <Badge variant="secondary" className="font-black text-blue-700 bg-white border">x{item.quantity}</Badge>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t flex justify-between items-center">
                <button 
                  onClick={() => updateStatus(order)}
                  className={`px-6 py-2 rounded-xl font-bold transition-all ${
                    order.status === 'completed' ? 'bg-slate-100 text-slate-500' : 'bg-blue-600 text-white shadow-md'
                  }`}
                >
                  {order.status === 'completed' ? "בוצע (לחץ להחזרה)" : "סיים הכנה"}
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
