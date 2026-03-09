"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Package, Phone, User, CheckCircle2, 
  Printer, MessageSquare, Clock, RefreshCw 
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const orderRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items (*)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Supabase Error:", error);
      toast.error("שגיאה במשיכת נתונים");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('admin_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleExportPDF = async (order: any) => {
    const element = orderRefs.current[order.id];
    if (!element) return;

    setProcessingId(order.id);
    try {
      // תיקון שגיאת ה-LAB: html2canvas לעיתים נכשל על פונקציות צבע מורכבות. 
      // אנחנו מבטיחים רקע לבן נקי.
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff", // הבטחת רקע HEX פשוט
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Order_${order.customer_name.replace(/\s+/g, '_')}.pdf`);
      toast.success("PDF הופק בהצלחה");
    } catch (error) {
      toast.error("שגיאה ברינדור ה-PDF. וודא שאין צבעים לא תקינים.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleWhatsAppShare = (order: any) => {
    const items = order.order_items.map((i: any) => `• ${i.item_name} (x${i.quantity})`).join('%0A');
    const msg = `*הזמנה חדשה - ח. סבן*%0A*לקוח:* ${order.customer_name}%0A*פריטים:*%0A${items}`;
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const toggleStatus = async (order: any) => {
    const newStatus = order.status === 'completed' ? 'pending' : 'completed';
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
    if (!error) {
      toast.success("סטטוס עודכן");
      fetchOrders();
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-right font-sans" dir="rtl">
      <header className="max-w-5xl mx-auto mb-10 flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900">ניהול לוגיסטי - ח. סבן</h1>
        <button onClick={fetchOrders} className="p-2 hover:rotate-180 transition-transform duration-500">
          <RefreshCw size={24} className="text-blue-600" />
        </button>
      </header>

      <div className="max-w-5xl mx-auto space-y-6">
        {orders.map((order) => (
          <Card key={order.id} className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
            {/* Header של כרטיס הזמנה */}
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-xl"><User size={24} /></div>
                <div>
                  <h3 className="font-bold text-xl">{order.customer_name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                    <Phone size={14} /> {order.phone} | <Clock size={14} /> {new Date(order.created_at).toLocaleTimeString('he-IL')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleWhatsAppShare(order)} className="p-3 bg-green-600 rounded-xl hover:bg-green-700 transition-colors">
                  <MessageSquare size={20} />
                </button>
                <button 
                  disabled={processingId === order.id}
                  onClick={() => handleExportPDF(order)} 
                  className="p-3 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors"
                >
                  {processingId === order.id ? <Loader2 size={20} className="animate-spin" /> : <Printer size={20} />}
                </button>
              </div>
            </div>

            <CardContent className="p-6">
              {/* אלמנט ה-PDF הנסתר (רנדור נקי ללא צבעי LAB) */}
              <div className="hidden">
                <div 
                  ref={(el) => (orderRefs.current[order.id] = el)}
                  className="p-10 bg-white w-[800px] text-right"
                  style={{ color: '#000000' }} // הבטחת צבע HEX פשוט
                >
                  <h1 className="text-2xl font-black mb-4">ח. סבן - הזמנת ליקוט</h1>
                  <p className="mb-2"><strong>לקוח:</strong> {order.customer_name}</p>
                  <p className="mb-6 border-b pb-4"><strong>טלפון:</strong> {order.phone}</p>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2">מוצר</th>
                        <th className="border p-2 text-center">כמות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.order_items?.map((item: any) => (
                        <tr key={item.id}>
                          <td className="border p-2 font-bold">{item.item_name}</td>
                          <td className="border p-2 text-center font-black">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* תצוגה במסך הניהול */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <Package className="text-blue-500" size={20} />
                        <span className="font-bold">{item.item_name}</span>
                      </div>
                      <Badge variant="outline" className="font-black text-blue-600 border-blue-200 bg-white">
                        x{item.quantity}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col justify-center items-center p-6 bg-slate-50 rounded-2xl border-2 border-dashed">
                  <Badge className={`mb-4 px-4 py-1 rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {order.status === 'completed' ? 'בוצע' : 'ממתין'}
                  </Badge>
                  <button 
                    onClick={() => toggleStatus(order)}
                    className={`w-full py-4 rounded-xl font-black transition-all ${
                      order.status === 'completed' ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white shadow-lg'
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
