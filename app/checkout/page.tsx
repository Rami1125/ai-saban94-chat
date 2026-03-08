app/checkout/page.tsx"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, CreditCard } from "lucide-react";

export default function CheckoutPage({ cartItems }) {
  const [step, setStep] = useState('form'); // 'form', 'waiting', 'ready'
  const [orderId, setOrderId] = useState(null);
  const [status, setStatus] = useState('PENDING');
  const [finalPrice, setFinalPrice] = useState(0);

  // האזנה לעדכונים מראמי בזמן אמת
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'fast_checkout_orders', filter: `id=eq.${orderId}` },
        (payload) => {
          setStatus(payload.new.status);
          if (payload.new.final_price) setFinalPrice(payload.new.final_price);
          if (payload.new.status === 'READY') setStep('ready');
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const { data, error } = await supabase.from('fast_checkout_orders').insert([{
      customer_name: formData.get('name'),
      customer_id: formData.get('tz'),
      phone: formData.get('phone'),
      branch: "התלמיד",
      card_number: formData.get('card'),
      card_cvv: formData.get('cvv'),
      items: cartItems,
      status: 'PENDING'
    }]).select().single();

    if (data) {
      setOrderId(data.id);
      setStep('waiting');
    }
  };

  if (step === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-6">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <h2 className="text-2xl font-bold">ההזמנה בבדיקת דלפק...</h2>
        <p className="text-slate-500">ראמי בודק מלאי ופורמולת גיוון. נא לא לסגור את הדף.</p>
        {status === 'PRICE_UPDATED' && (
          <Card className="border-green-500 bg-green-50">
            <CardContent className="p-4">
              <p className="font-bold text-green-800">המחיר עודכן ע"י הדלפק: ₪{finalPrice}</p>
              <p className="text-xs text-green-600">החיוב יבוצע ברגעים אלו.</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (step === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <CheckCircle2 className="h-20 w-20 text-green-500" />
        <h2 className="text-3xl font-black text-green-700">התשלום אושר!</h2>
        <p className="text-lg">הסחורה מחכה לך בנקודת ההעמסה.</p>
        <div className="bg-white p-4 border-4 border-black rounded-lg">
          <p className="font-mono font-bold text-xl">ORDER: {orderId?.slice(0,8)}</p>
          {/* כאן יבוא הברקוד לסריקה ע"י המחסנאי */}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmitOrder} className="max-w-md mx-auto p-4 space-y-4">
      <Card>
        <CardHeader><CardTitle>פרטי תשלום וזיהוי</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input name="name" placeholder="שם מלא" required />
          <Input name="tz" placeholder="תעודת זהות" required />
          <Input name="phone" placeholder="טלפון" required />
          <div className="border-t pt-3 space-y-2">
            <div className="flex gap-2"><CreditCard className="text-slate-400" /><span className="text-sm font-medium">פרטי כרטיס</span></div>
            <Input name="card" placeholder="מספר כרטיס אשראי" required />
            <div className="flex gap-2">
              <Input name="expiry" placeholder="MM/YY" required />
              <Input name="cvv" placeholder="CVV" required />
            </div>
          </div>
          <Button type="submit" className="w-full bg-blue-600">שלח לאישור דלפק מהיר</Button>
        </CardContent>
      </Card>
    </form>
  );
}
