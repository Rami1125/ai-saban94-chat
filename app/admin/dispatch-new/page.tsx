"use client";
import React, { useState } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Send, Share2, Truck, Crane, Calendar, 
  User, Hash, Clock, CheckCircle2 
} from "lucide-react";
import { toast, Toaster } from "sonner";

// הגדרת נהגי המפתח כפי שביקשת
const DRIVERS = {
  HAKMAT: { name: 'חכמת', icon: <Crane className="text-orange-500" />, type: 'מנוף 🏗️' },
  ALI: { name: 'עלי', icon: <Truck className="text-blue-500" />, type: 'משאית 🚛' }
};

export default function QuickDispatchPage() {
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState({
    customerName: '',
    orderId: '',
    driver: 'HAKMAT' as keyof typeof DRIVERS
  });

  const supabase = getSupabase();

  // פונקציית שמירה ל-Supabase ושיתוף בוואטסאפ
  const handleMagicShare = async () => {
    if (!orderData.customerName || !orderData.orderId) {
      toast.error("אחי, חסר שם לקוח או מספר הזמנה");
      return;
    }

    setLoading(true);
    const driver = DRIVERS[orderData.driver];

    try {
      // 1. שמירה לטבלת היסטוריה ב-Supabase (כפי שביקשת)
      const { error } = await supabase.from('orders_history').insert([{
        customer_name: orderData.customerName,
        order_id: orderData.orderId,
        driver_name: driver.name,
        delivery_type: driver.type,
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;

      // 2. יצירת התבנית המעוצבת לשיתוף
      const message = `*📦 הזמנה חדשה בסידור - ח.סבן*\n` +
                      `---------------------------\n` +
                      `👤 *לקוח:* ${orderData.customerName}\n` +
                      `🆔 *מספר:* ${orderData.orderId}\n` +
                      `🚚 *מוביל:* ${driver.name} (${driver.type})\n` +
                      `⏳ *סטטוס:* בטיפול (און-ליין)\n` +
                      `---------------------------\n` +
                      `_נשלח מלוח הבקרה SabanOS_`;

      // 3. כפתור הקסם - פתיחת וואטסאפ
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
      
      toast.success("נשמר בהיסטוריה ונשלח לוואטסאפ!");
      setOrderData({ ...orderData, orderId: '', customerName: '' }); // איפוס מהיר
    } catch (err) {
      console.error(err);
      toast.error("שגיאה בשמירה ל-Supabase");
    } finally {
      setLoading(false);
    }
  };

  const sendMorningReport = () => {
    const report = `☀️ *דוח בוקר - סידור הובלות ח.סבן*\n` +
                   `---------------------------\n` +
                   `🏗️ *חכמת (מנוף):* העמסה 06:30 | התחייבות 07:00 (סניף החרש)\n` +
                   `🚛 *עלי (משאית):* העמסה 06:30 | יציאה 07:00 (סניף התלמיד)\n` +
                   `---------------------------\n` +
                   `📅 תאריך: ${new Date().toLocaleDateString('he-IL')}\n` +
                   `_נא לאשר קבלת סידור_ ✅`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(report)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20 font-sans" dir="rtl">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="max-w-md mx-auto mb-6 text-center">
        <h1 className="text-3xl font-black text-[#0B2C63]">Saban<span className="text-blue-500">OS</span></h1>
        <p className="text-slate-500 font-bold">ממשק שליחה מהיר לערוץ</p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        {/* כרטיס יצירת הזמנה */}
        <Card className="p-6 border-t-4 border-t-blue-600 rounded-3xl shadow-xl">
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <Send className="text-blue-600" size={20} /> הזמנה חדשה
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black text-slate-400 mr-2">שם לקוח (קבוע/מזדמן)</label>
              <Input 
                value={orderData.customerName}
                onChange={(e) => setOrderData({...orderData, customerName: e.target.value})}
                placeholder="למשל: אוניל מהלה"
                className="h-12 rounded-xl font-bold border-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-400 mr-2">מספר הזמנה (קומקס)</label>
              <Input 
                value={orderData.orderId}
                onChange={(e) => setOrderData({...orderData, orderId: e.target.value})}
                placeholder="62100614"
                className="h-12 rounded-xl font-bold border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {Object.entries(DRIVERS).map(([key, driver]) => (
                <button
                  key={key}
                  onClick={() => setOrderData({...orderData, driver: key as any})}
                  className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${
                    orderData.driver === key 
                    ? 'border-blue-600 bg-blue-50 shadow-md' 
                    : 'border-slate-100 bg-white opacity-60'
                  }`}
                >
                  {driver.icon}
                  <span className="font-black text-sm mt-1">{driver.name}</span>
                  <span className="text-[10px] text-slate-500">{driver.type}</span>
                </button>
              ))}
            </div>

            <Button 
              onClick={handleMagicShare}
              disabled={loading}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-lg shadow-lg"
            >
              {loading ? "שומר..." : "כפתור קסם - שגר לערוץ 🚀"}
            </Button>
          </div>
        </Card>

        {/* כרטיס דוח בוקר */}
        <Card className="p-5 rounded-3xl shadow-lg border-none bg-[#0B2C63] text-white">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-black flex items-center gap-2">
              <Calendar size={18} /> דוח בוקר יומי
            </h2>
            <Clock size={18} className="text-blue-300" />
          </div>
          <p className="text-xs text-blue-200 mb-4 font-bold">שליחה מהירה לחכמת ועלי (06:30)</p>
          <Button 
            onClick={sendMorningReport}
            className="w-full bg-white text-[#0B2C63] hover:bg-blue-50 rounded-xl font-black gap-2"
          >
            <Share2 size={18} /> שלח דוח בוקר לצוות
          </Button>
        </Card>
      </div>

      {/* תחתית הדף - לינק מהיר לעוזר ה-AI שכבר בנית */}
      <div className="fixed bottom-4 left-0 right-0 px-4">
        <div 
          onClick={() => window.location.href='/ai-ask'}
          className="max-w-md mx-auto bg-white p-3 rounded-2xl shadow-inner border border-slate-100 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full"><CheckCircle2 className="text-blue-600" size={16}/></div>
            <span className="text-xs font-black text-slate-600">צריך עזרה מה-AI של סבן?</span>
          </div>
          <span className="text-blue-600 font-black text-xs">לחץ כאן ←</span>
        </div>
      </div>
    </div>
  );
}
