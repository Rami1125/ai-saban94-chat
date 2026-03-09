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
  const [activeExportId, setActiveExportId] = useState<string | null>(null);

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
    const channel = supabase.channel('admin_final').on('postgres_changes', 
      { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleExportPDF = async (order: any) => {
    setActiveExportId(order.id);
    try {
      // טעינה דינמית למניעת שגיאות preload
      const [jsPDF, html2canvas] = await Promise.all([
        import("jspdf").then(m => m.default),
        import("html2canvas").then(m => m.default)
      ]);

      const element = document.getElementById(`print-box-${order.id}`);
      if (!element) return;

      // הכנת האלמנט לצילום - מחוץ למסך
      element.style.display = "block";
      element.style.position = "fixed";
      element.style.left = "-9999px";
      element.style.top = "0";

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        // התעלמות מכל מה שלא קשור להדפסה כדי למנוע שגיאות LAB
        ignoreElements: (el) => el.tagName === 'SVG' && !el.closest(`#print-box-${order.id}`)
      });

      element.style.display = "none";

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Order_${order.customer_name.replace(/\s+/g, '_')}.pdf`);
      toast.success("קובץ PDF נוצר");
    } catch (err) {
      console.error("PDF Crash:", err);
      toast.error("שגיאה ביצירת הקובץ - נסה שוב");
    } finally {
      setActiveExportId(null);
    }
  };

  const updateStatus = async (order: any) => {
    const newStatus = order.status === 'completed' ? 'pending' : 'completed';
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
    if (!error) toast.success("סטטוס עודכן");
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-right" dir="rtl">
      <header className="max-w-4xl mx-auto mb-10 flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
        <h1 className="text-2xl font-black text-slate-900">ניהול לוגיסטי ח. סבן</h1>
        <button onClick={fetchOrders} className="p-3 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-all">
          <RefreshCw size={24} className="text-blue-600" />
        </button>
      </header>

      <div className="max-w-4xl mx-auto space-y-6">
        {orders.map((order) => (
          <Card key={order.id} className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20"><User size={24} /></div>
                <div>
                  <h3 className="font-bold text-xl">{order.customer_name}</h3>
                  <p className="text-xs opacity-60 mt-1">{order.phone} | {new Date(order.created_at).toLocaleTimeString('he-IL')}</p>
                </div>
              </div>
              <button 
                disabled={activeExportId === order.id}
                onClick={() => handleExportPDF(order)} 
                className="p-4 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-all"
              >
                {activeExportId === order.id ? <Loader2 size={20} className="animate-spin" /> : <Printer size={20} />}
              </button>
            </div>

            <CardContent className="p-8">
              {/* רכיב הדפסה מבודד - ללא Tailwind Classes כדי למנוע שגיאות LAB */}
              <div id={`print-box-${order.id}`} style={{ display: 'none', background: '#ffffff', width: '800px', padding: '50px', color: '#000000', fontFamily: 'Arial, sans-serif' }}>
                <div style={{ borderBottom: '5px solid #000', paddingBottom: '20px', marginBottom: '30px' }}>
                  <h1 style={{ fontSize: '36px', fontWeight: '900', margin: '0' }}>ח. סבן חומרי בניין 1994</h1>
                  <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '5px 0' }}>רשימת ליקוט להזמנה</p>
                </div>
                
                <div style={{ marginBottom: '40px', fontSize: '22px', lineHeight: '1.6' }}>
                  <p style={{ margin: '5px 0' }}><strong>לקוח:</strong> {order.customer_name}</p>
                  <p style={{ margin: '5px 0' }}><strong>טלפון:</strong> {order.phone}</p>
                  <p style={{ margin: '5px 0' }}><strong>תאריך:</strong> {new Date(order.created_at).toLocaleString('he-IL')}</p>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '22px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ border: '2px solid #000', padding: '15px', textAlign: 'right' }}>שם הפריט / גוון</th>
                      <th style={{ border: '2px solid #000', padding: '15px', textAlign: 'center', width: '120px' }}>כמות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.order_items?.map((item: any) => (
                      <tr key={item.id}>
                        <td style={{ border: '2px solid #000', padding: '15px', fontWeight: 'bold' }}>{item.item_name}</td>
                        <td style={{ border: '2px solid #000', padding: '15px', textAlign: 'center', fontWeight: '900', fontSize: '28px' }}>{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div style={{ marginTop: '50px', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>
                  SabanOS System - הדפסת מחסן
                </div>
              </div>

              {/* תצוגה למסך */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-3">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <Package className="text-blue-500" size={20} />
                        <span className="font-bold text-slate-800">{item.item_name}</span>
                      </div>
                      <Badge className="bg-white text-blue-600 border border-blue-100 font-black">x{item.quantity}</Badge>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center">
                  <Badge className={`mb-4 px-6 py-1 rounded-full font-black ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {order.status === 'completed' ? 'מוכן' : 'ממתין'}
                  </Badge>
                  <button 
                    onClick={() => updateStatus(order)}
                    className={`w-full py-4 rounded-2xl font-black transition-all ${
                      order.status === 'completed' ? 'bg-slate-200 text-slate-500' : 'bg-blue-600 text-white shadow-lg'
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
