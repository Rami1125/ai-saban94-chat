"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Phone, User, Printer, Clock, RefreshCw } from "lucide-react";
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
    const channel = supabase.channel('admin_final_v5').on('postgres_changes', 
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

      // יצירת אלמנט נקי לחלוטין מחוץ ל-DOM הראשי למניעת זליגת CSS
      const printDiv = document.createElement('div');
      printDiv.dir = "rtl";
      printDiv.style.position = 'fixed';
      printDiv.style.top = '-9999px';
      printDiv.style.left = '0';
      printDiv.style.width = '800px';
      printDiv.style.padding = '40px';
      printDiv.style.backgroundColor = '#ffffff';
      printDiv.style.color = '#000000';
      printDiv.style.fontFamily = 'Arial, sans-serif';

      printDiv.innerHTML = `
        <div style="border-bottom: 4px solid #000; padding-bottom: 20px; mb: 30px;">
          <h1 style="font-size: 32px; margin: 0;">ח. סבן חומרי בניין 1994</h1>
          <p style="font-size: 20px; margin: 5px 0;">רשימת ליקוט למחסן</p>
        </div>
        <div style="margin: 25px 0; font-size: 20px;">
          <p><strong>לקוח:</strong> ${order.customer_name}</p>
          <p><strong>טלפון:</strong> ${order.phone}</p>
          <p><strong>תאריך:</strong> ${new Date(order.created_at).toLocaleString('he-IL')}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 20px;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="border: 2px solid #000; padding: 12px; text-align: right;">פריט / גוון</th>
              <th style="border: 2px solid #000; padding: 12px; text-align: center; width: 100px;">כמות</th>
            </tr>
          </thead>
          <tbody>
            ${order.order_items?.map((item: any) => `
              <tr>
                <td style="border: 2px solid #000; padding: 12px; font-weight: bold;">${item.item_name}</td>
                <td style="border: 2px solid #000; padding: 12px; text-align: center; font-weight: 900; font-size: 24px;">${item.quantity}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      document.body.appendChild(printDiv);

      const canvas = await html2canvas(printDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      document.body.removeChild(printDiv);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Order_${order.customer_name.replace(/\s+/g, '_')}.pdf`);
      toast.success("קובץ הופק בהצלחה");
    } catch (err) {
      console.error("PDF Final Error:", err);
      toast.error("שגיאה בהפקה. וודא שאין חוסם פופ-אפים.");
    } finally {
      setIsExporting(null);
    }
  };

  const updateStatus = async (order: any) => {
    const { error } = await supabase.from('orders')
      .update({ status: order.status === 'completed' ? 'pending' : 'completed' })
      .eq('id', order.id);
    if (!error) toast.success("סטטוס עודכן");
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-right" dir="rtl">
      <header className="max-w-4xl mx-auto mb-10 flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-none">ניהול לוגיסטי</h1>
          <p className="text-slate-400 text-sm mt-1 font-bold">ח. סבן חומרי בניין 1994 בע"מ</p>
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
                <div className="bg-blue-600 p-3 rounded-2xl"><User size={24} /></div>
                <div>
                  <h3 className="font-bold text-xl leading-none">{order.customer_name}</h3>
                  <p className="text-xs opacity-60 mt-2">{order.phone} | {new Date(order.created_at).toLocaleTimeString('he-IL')}</p>
                </div>
              </div>
              <button 
                disabled={isExporting === order.id}
                onClick={() => handleExportPDF(order)} 
                className="p-4 bg-slate-800 rounded-2xl hover:bg-slate-700 border border-slate-700"
              >
                {isExporting === order.id ? <Loader2 size={20} className="animate-spin" /> : <Printer size={20} />}
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
