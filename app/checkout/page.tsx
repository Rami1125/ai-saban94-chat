"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Banknote, Loader2, User, Phone } from "lucide-react";
import { toast } from "sonner";

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'credit' | 'counter'>('credit');
  const [form, setForm] = useState({ name: "", phone: "" });
  const router = useRouter();

  const handleOrder = async () => {
    if (!form.name || !form.phone) return toast.error("נא למלא שם וטלפון");
    
    setLoading(true);
    try {
      const { data, error } = await supabase.from('orders').insert([{
        customer_name: form.name,
        phone: form.phone,
        payment_method: method,
        status: 'pending'
      }]).select().single();

      if (error) {
        console.error("Supabase Error:", error);
        throw new Error("ודא שהעמודות payment_method קיימות ב-DB");
      }

      router.push(method === 'credit' ? `/payment?id=${data.id}` : `/success?order=${data.id}`);
    } catch (err: any) {
      toast.error(err.message || "שגיאה בחיבור לשרת");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <Card className="w-full max-w-md rounded-[2.5rem] shadow-2xl border-none">
        <CardHeader className="bg-slate-900 text-white p-6 rounded-t-[2.5rem]">
          <CardTitle className="text-center">פרטי הזמנה ותשלום</CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute right-4 top-4 text-slate-400" size={18} />
              <input 
                className="w-full p-4 pr-12 rounded-2xl bg-slate-100 border-none font-bold" 
                placeholder="שם מלא"
                value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              />
            </div>
            <div className="relative">
              <Phone className="absolute right-4 top-4 text-slate-400" size={18} />
              <input 
                className="w-full p-4 pr-12 rounded-2xl bg-slate-100 border-none font-bold" 
                placeholder="טלפון"
                value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setMethod('credit')}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${method === 'credit' ? 'border-blue-600 bg-blue-50' : 'border-slate-100'}`}
            >
              <CreditCard className={method === 'credit' ? 'text-blue-600' : 'text-slate-400'} />
              <span className="text-xs font-bold">אשראי</span>
            </button>
            <button 
              onClick={() => setMethod('counter')}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${method === 'counter' ? 'border-orange-600 bg-orange-50' : 'border-slate-100'}`}
            >
              <Banknote className={method === 'counter' ? 'text-orange-600' : 'text-slate-400'} />
              <span className="text-xs font-bold">בקופה</span>
            </button>
          </div>

          <button 
            disabled={loading} onClick={handleOrder}
            className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-lg hover:bg-blue-600 transition-all shadow-xl"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "סיום והזמנה"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
