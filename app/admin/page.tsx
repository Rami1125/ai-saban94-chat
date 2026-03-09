"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Phone, User, Printer, MessageSquare, Clock, RefreshCw } from "lucide-react";
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
    const channel = supabase.channel('admin_v3').on('postgres_changes', 
      { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleExportPDF = async (order: any) => {
    setIsExporting(order.id);
    try {
      const [jsPDF, html2canvas] = await Promise.all([
        import("jspdf").then(m => m.default),
        import("html2canvas").then(m => m.default)
      ]);

      const element = document.getElementById(`print-area-${order.id}`);
      if (!element) return;

      // הצגה זמנית לטובת הצילום
      element.style.display = "block";

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        // פתרון שגיאת ה-LAB: מונע מהספרייה לקרוס על פונקציות צבע לא נתמכות
        ignoreElements: (el) => el.classList.contains('no-pdf'),
      });

      element.style.display = "none";

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Order_${order.customer_name}.pdf`);
      toast.success("PDF הופק בהצלחה");
    } catch (err) {
      console.error(err);
      toast.error("שגיאה ביצירת הקובץ");
    } finally {
      setIsExporting(null);
    }
  };

  const updateStatus = async (order: any) => {
    const newStatus = order.status === 'completed' ? 'pending' : 'completed';
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
    if (!error) toast.success("סטטוס עודכן");
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans" dir="rtl">
      <header className="max-w-4xl mx-auto mb-8 flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-black text-slate-900">ניהול לוגיסטי - ח. סבן</h1>
        <button onClick={fetchOrders} className="p-2 hover:bg-slate-100 rounded-full transition-all"><RefreshCw size={20}/></button>
      </header>

      <div className="max-w-4xl mx-auto space-y-6">
        {orders.map((order) => (
          <Card key={order.id} className="border-none shadow-lg rounded-[2.5rem] overflow-hidden bg-white">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-2xl"><User size={20} /></div>
                <div>
                  <h3 className="font-bold text-lg leading-none">{order.customer_name}</h3>
                  <p className="text-xs opacity-60 mt-2 font-mono">{order.phone}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  disabled={isExporting === order.id}
                  onClick={() => handleExportPDF(order)} 
                  className="p-3 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors"
                >
                  {isExporting === order.id ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
                </button>
              </div>
            </div>

            <CardContent className="p-6">
              {/* אלמנט נסתר להדפסה בלבד - נקי מצבעי LAB */}
              <div id={`print-area-${order.id}`} style={{ display: 'none', padding: '40px', background: '#ffffff', width: '750px', color: '#000000' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', marginBottom: '10px' }}>ח. סבן חומרי בניין 1994 בע"מ</h1>
                <p style={{ fontSize: '18px', marginBottom: '20px' }}>רשימת ליקוט - {order.customer_name}</p>
                <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '10px', marginBottom: '20px' }}>
                  <p><strong>לקוח:</strong> {order.customer_name}</p>
                  <p><strong>טלפון:</strong> {order.phone}</p>
                  <p><strong>תאריך:</strong> {new Date(order.created_at).toLocaleString('he-IL')}</p>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1e293b', color: '#ffffff' }}>
                      <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #334155' }}>מוצר</th>
                      <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #334155' }}>כמות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.order_items?.map((item: any) => (
                      <tr key={item.id}>
                        <td style={{ padding: '12px', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>{item.item_name}</td>
                        <td style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', fontSize: '20px' }}>{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* תצוגה במסך הניהול */}
              <div className="space-y-3 mb-6">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="font-bold text-slate-800">{item.item_name}</span>
                    <Badge variant="secondary" className="font-black text-blue-700">x{item.quantity}</Badge>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center border-t pt-4">
                <button 
                  onClick={() => updateStatus(order)}
                  className={`px-6 py-2 rounded-xl font-black transition-all ${
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
