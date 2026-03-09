"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Package, Phone, User, CheckCircle2, 
  Printer, MessageSquare, Clock, RefreshCw, Trash2 
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Ref להחזקת האלמנטים של ההזמנות לצורך צילום ל-PDF
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
      toast.error("שגיאה בטעינת נתונים מהשרת");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // סנכרון זמן אמת
    const channel = supabase.channel('admin_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- פונקציית הדפסה חסינת ג'יבריש ---
  const handleExportPDF = async (order: any) => {
    const element = orderRefs.current[order.id];
    if (!element) return;

    setProcessingId(order.id);
    try {
      // יצירת Canvas מהאלמנט (תומך בעברית מושלם כי זה צילום)
      const canvas = await html2canvas(element, {
        scale: 2, // רזולוציה גבוהה להדפסה
        useCORS: true,
        backgroundColor: "#ffffff",
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
      pdf.save(`Saban_Order_${order.customer_name.replace(/\s+/g, '_')}.pdf`);
      
      toast.success("קובץ PDF נוצר בהצלחה");
    } catch (error) {
      console.error(error);
      toast.error("נכשלה יצירת הקובץ");
    } finally {
      setProcessingId(null);
    }
  };

  const handleWhatsAppShare = (order: any) => {
    const items = order.order_items.map((i: any) => `• ${i.item_name} (x${i.quantity})`).join('%0A');
    const msg = `*הזמנה חדשה - ח. סבן*%0A*לקוח:* ${order.customer_name}%0A*טלפון:* ${order.phone}%0A%0A*פריטים:*%0A${items}`;
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const toggleStatus = async (order: any) => {
    const newStatus = order.status === 'completed' ? 'pending' : 'completed';
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
    if (!error) toast.success("סטטוס עודכן");
  };

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 text-right font-sans" dir="rtl">
      <header className="max-w-5xl mx-auto mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">ניהול הזמנות</h1>
          <p className="text-slate-500 font-medium mt-1 italic">ח. סבן חומרי בניין 1994 בע"מ</p>
        </div>
        <button onClick={fetchOrders} className="p-3 bg-white rounded-2xl shadow-sm border hover:bg-slate-50">
          <RefreshCw size={20} className="text-slate-600" />
        </button>
      </header>

      <div className="max-w-5xl mx-auto space-y-8">
        {orders.map((order) => (
          <Card key={order.id} className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-500/20 text-white">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black">{order.customer_name}</h2>
                  <div className="flex gap-4 mt-1 opacity-80 text-sm font-medium">
                    <span className="flex items-center gap-1"><Phone size={14} /> {order.phone}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {new Date(order.created_at).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => handleWhatsAppShare(order)}
                  className="p-3 bg-green-600 hover:bg-green-700 rounded-2xl transition-all shadow-lg shadow-green-900/20"
                >
                  <MessageSquare size={22} />
                </button>
                <button 
                  disabled={processingId === order.id}
                  onClick={() => handleExportPDF(order)}
                  className="p-3 bg-slate-700 hover:bg-slate-600 rounded-2xl transition-all shadow-lg"
                >
                  {processingId === order.id ? <Loader2 size={22} className="animate-spin" /> : <Printer size={22} />}
                </button>
              </div>
            </div>

            <CardContent className="p-8">
              {/* רכיב נסתר שמשמש לצילום ה-PDF */}
              <div className="sr-only">
                <div 
                  ref={(el) => (orderRefs.current[order.id] = el)}
                  className="p-10 bg-white w-[800px] text-right"
                  dir="rtl"
                >
                  <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-center">
                    <div>
                      <h1 className="text-3xl font-black text-slate-900">ח. סבן חומרי בניין 1994</h1>
                      <p className="text-xl font-bold text-blue-600">רשימת ליקוט להזמנה #{order.id.slice(0,5)}</p>
                    </div>
                    <div className="text-left font-bold text-slate-500">
                      <p>{new Date(order.created_at).toLocaleDateString('he-IL')}</p>
                      <p>{new Date(order.created_at).toLocaleTimeString('he-IL')}</p>
                    </div>
                  </div>
                  <div className="mb-8 space-y-2 text-2xl">
                    <p><strong>לקוח:</strong> {order.customer_name}</p>
                    <p><strong>טלפון:</strong> {order.phone}</p>
                  </div>
                  <table className="w-full border-collapse text-2xl">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border-2 border-slate-200 p-4">פריט</th>
                        <th className="border-2 border-slate-200 p-4">מק"ט</th>
                        <th className="border-2 border-slate-200 p-4 text-center">כמות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.order_items?.map((item: any) => (
                        <tr key={item.id}>
                          <td className="border-2 border-slate-200 p-4 font-black">{item.item_name}</td>
                          <td className="border-2 border-slate-200 p-4 font-mono">{item.sku || '-'}</td>
                          <td className="border-2 border-slate-200 p-4 text-center font-black text-3xl">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-12 pt-6 border-t border-slate-200 text-center text-slate-400 font-bold">
                    הופק באמצעות מערכת SabanOS
                  </div>
                </div>
              </div>

              {/* תצוגה במסך הניהול */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">פירוט פריטים</h4>
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between bg-slate-50 p-5 rounded-3xl border border-slate-100 group hover:bg-blue-50/50 transition-colors">
                      <div className="flex items-center gap-5">
                        {item.hex_color ? (
                          <div className="w-14 h-14 rounded-2xl border-4 border-white shadow-sm shrink-0" style={{ backgroundColor: item.hex_color }} />
                        ) : (
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 border border-slate-200 shrink-0 shadow-sm">
                            <Package size={28} />
                          </div>
                        )}
                        <div>
                          <p className="font-black text-slate-800 text-lg leading-tight">{item.item_name}</p>
                          <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-tighter">
                            {item.sku ? `מק"ט: ${item.sku}` : "ללא מק\"ט"} {item.container_size && ` | אריזה: ${item.container_size}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-center bg-white px-5 py-2 rounded-2xl border border-slate-100 shadow-sm min-w-[70px]">
                        <p className="text-[10px] text-slate-400 font-black uppercase">כמות</p>
                        <p className="text-2xl font-black text-blue-600">{item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col justify-between p-6 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <div className="text-center mb-6">
                    <p className="text-xs font-black text-slate-400 mb-2">סטטוס הזמנה</p>
                    <Badge className={`px-6 py-2 rounded-full text-sm font-black ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {order.status === 'completed' ? 'הושלם' : 'ממתין לליקוט'}
                    </Badge>
                  </div>
                  <button 
                    onClick={() => toggleStatus(order)}
                    className={`w-full py-5 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg ${
                      order.status === 'completed' 
                        ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
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
