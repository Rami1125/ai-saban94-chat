"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import ColorSelector from "@/components/checkout/ColorSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Loader2, CheckCircle } from "lucide-react";
import ProductSelector from "@/components/checkout/ProductSelector";

export default function CheckoutPage() {
  const [orderState, setOrderState] = useState({ code: "", size: "5L", hex: "#ffffff" });
  const [step, setStep] = useState('form'); // 'form', 'waiting', 'done'
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    const { data, error } = await supabase.from('fast_checkout_orders').insert([{
      customer_name: fd.get('name'),
      customer_id: fd.get('tz'),
      phone: fd.get('phone'),
      card_number: fd.get('card'),
      card_cvv: fd.get('cvv'),
      color_code: orderState.code,
      container_size: orderState.size,
      hex_preview: orderState.hex,
      status: 'PENDING'
    }]).select().single();

    if (!error) setStep('waiting');
    setLoading(false);
  };

  if (step === 'waiting') return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <Loader2 className="h-16 w-16 animate-spin text-blue-600 mb-4" />
      <h2 className="text-2xl font-black">ההזמנה בטיפול דלפק</h2>
      <p className="text-slate-500">ראמי בודק את הגיוון ומכין את החשבונית...</p>
    </div>
  );

  return (
    <div className="max-w-md mx-auto p-4 py-8 dir-rtl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="shadow-xl border-t-4 border-t-blue-600">
          <CardHeader>
            <CardTitle className="text-center text-blue-800">קופה מהירה - ח. סבן</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* בחירת צבע וגודל */}
            <ColorSelector onSelect={(data) => setOrderState(data)} />

            {/* פרטי זיהוי */}
            <div className="space-y-3">
              <Input name="name" placeholder="שם מלא" required />
              <Input name="tz" placeholder="תעודת זהות (לחשבונית)" required />
              <Input name="phone" placeholder="מספר טלפון" required />
            </div>

            {/* פרטי תשלום */}
            <div className="bg-slate-50 p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-3 text-slate-600">
                <CreditCard size={18} />
                <span className="text-sm font-bold">פרטי כרטיס אשראי</span>
              </div>
              <Input name="card" placeholder="מספר כרטיס" className="mb-2" required />
              <div className="flex gap-2">
                <Input name="expiry" placeholder="MM/YY" required />
                <Input name="cvv" placeholder="CVV" required />
              </div>
            </div>

            <Button disabled={loading} className="w-full h-12 text-lg font-bold bg-blue-700 hover:bg-blue-800">
              {loading ? "שולח..." : "שלח להכנה וחיוב"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
