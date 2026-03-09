"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Banknote, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'counter'>('credit');
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const router = useRouter();

  const handleCompleteOrder = async () => {
    if (!customerName || !phone) {
      toast.error("נא למלא פרטי לקוח");
      return;
    }

    setLoading(true);
    try {
      // יצירת ההזמנה ב-Database
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          customer_name: customerName,
          phone: phone,
          payment_method: paymentMethod,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      if (paymentMethod === 'credit') {
        // מעבר לדף הזנת כרטיס אשראי
        router.push(`/payment?orderId=${order.id}`);
      } else {
        // מעבר לדף הצלחה עם הנחיה לגשת לקופה
        router.push(`/success?method=counter`);
      }
    } catch (err) {
      toast.error("שגיאה ביצירת הזמנה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center font-sans" dir="rtl">
      <Card className="w-full max-w-md rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white">
        <CardHeader className="bg-slate-900 text-white p-8">
          <CardTitle className="text-2xl font-black text-center">סיום הזמנה</CardTitle>
          <p className="text-center text-slate-400 text-sm mt-2">ח. סבן חומרי בניין 1994</p>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-4">
            <input 
              type="text" placeholder="שם מלא" value={customerName} 
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 font-bold"
            />
            <input 
              type="tel" placeholder="מספר טלפון" value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 font-bold"
            />
          </div>

          <div className="space-y-3">
            <p className="font-black text-slate-800 mr-2">בחר אמצעי תשלום:</p>
            <div 
              onClick={() => setPaymentMethod('credit')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${paymentMethod === 'credit' ? 'border-blue-600 bg-blue-50' : 'border-slate-100'}`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className={paymentMethod === 'credit' ? 'text-blue-600' : 'text-slate-400'} />
                <span className="font-bold">כרטיס אשראי (הקלדה כעת)</span>
              </div>
            </div>

            <div 
              onClick={() => setPaymentMethod('counter')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${paymentMethod === 'counter' ? 'border-orange-600 bg-orange-50' : 'border-slate-100'}`}
            >
              <div className="flex items-center gap-3">
                <Banknote className={paymentMethod === 'counter' ? 'text-orange-600' : 'text-slate-400'} />
                <span className="font-bold">תשלום בקופה (מזומן/דלפק)</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleCompleteOrder}
            disabled={loading}
            className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "בצע הזמנה"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
