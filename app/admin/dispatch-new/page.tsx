"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast, Toaster } from "sonner";
import { Truck, Calendar, Clock, User, MapPin, Warehouse, Send, Eye, MessageCircle, Copy } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

const deliveryTypes = [
  { id: 'is_truck_delivery', label: 'הובלת משאית' },
  { id: 'is_crane_delivery', label: 'הובלת מנוף' },
  { id: 'is_crane_15m', label: 'מנוף 15 מטר' },
  { id: 'is_self_pickup', label: 'משיכה עצמית' },
  { id: 'is_external_driver', label: 'מוביל חיצוני' },
  { id: 'is_waste_collection', label: 'איסוף בלות' },
  { id: 'is_site_access_crane', label: 'גישה לאתר+מנוף' },
  { id: 'is_crane_work_only', label: 'עבודת מנוף בלבד' },
];

export default function NewDispatch() {
  const [formData, setFormData] = useState({
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '',
    customer_name: '',
    address: '',
    warehouse_source: 'התלמיד',
    driver_name: 'חכמת',
    types: {} as Record<string, boolean>
  });

  const [previewMsg, setPreviewMsg] = useState("");

  // יצירת הודעת ווטסאפ מעוצבת להצגה
  const generatePreview = () => {
    const selectedTypes = deliveryTypes
      .filter(t => formData.types[t.id])
      .map(t => t.label)
      .join(' + ');

    const emoji = formData.driver_name === 'חכמת' ? '🏗️' : '🚚';
    const warehouseEmoji = formData.warehouse_source === 'התלמיד' ? '🏠' : '🏭';

    let msg = `*דוח הזמנה חדשה - ח. סבן*\n`;
    msg += `------------------------------\n`;
    msg += `⏰ ${formData.scheduled_time || '--:--'} | 👤 ${formData.customer_name || 'לקוח'}\n`;
    msg += `📍 ${formData.address || 'כתובת'}\n`;
    msg += `${warehouseEmoji} מחסן: ${formData.warehouse_source}\n`;
    msg += `🚛 נהג: *${formData.driver_name}*\n`;
    if (selectedTypes) msg += `🛠️ סוג: ${selectedTypes}\n`;
    msg += `------------------------------\n`;
    msg += `🤖 *לשאלות ה-AI על הסידור:* \n`;
    msg += `https://saban-os.vercel.app/ai-ask\n`;

    setPreviewMsg(msg);
  };

  const handleSubmit = async () => {
    const supabase = getSupabase();
    const payload = {
      scheduled_date: formData.scheduled_date,
      scheduled_time: formData.scheduled_time,
      customer_name: formData.customer_name,
      address: formData.address,
      warehouse_source: formData.warehouse_source,
      driver_name: formData.driver_name,
      ...formData.types
    };

    const { error } = await supabase.from('saban_dispatch').insert([payload]);

    if (error) {
      toast.error("שגיאה בשמירה: " + error.message);
    } else {
      toast.success("ההזמנה נשמרה בסידור! הצינור עודכן 🔥");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20 bg-slate-50 min-h-screen" dir="rtl">
      <Toaster position="top-center" richColors />
      
      <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
        <CardHeader className="bg-[#0B2C63] text-white p-6">
          <CardTitle className="flex items-center justify-between text-2xl font-black">
            <div className="flex items-center gap-2 italic">SABAN<span className="text-blue-400">OS</span></div>
            <Truck size={28} className="text-blue-400" />
          </CardTitle>
          <p className="text-blue-200 text-xs font-bold mt-1">הזנת סידור עבודה וניהול לוגיסטי</p>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* תאריך ושעה */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-1 text-slate-700 text-sm"><Calendar size={14}/> תאריך</Label>
              <Input type="date" value={formData.scheduled_date} onChange={e => setFormData({...formData, scheduled_date: e.target.value})} className="rounded-xl border-slate-200 focus:ring-blue-500"/>
            </div>
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-1 text-slate-700 text-sm"><Clock size={14}/> שעה</Label>
              <Input type="time" onChange={e => setFormData({...formData, scheduled_time: e.target.value})} className="rounded-xl border-slate-200 focus:ring-blue-500"/>
            </div>
          </div>

          {/* לקוח וכתובת */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-1 text-slate-700 text-sm"><User size={14}/> שם לקוח</Label>
              <Input placeholder="מי הלקוח?" onChange={e => setFormData({...formData, customer_name: e.target.value})} className="rounded-xl h-12 border-slate-200"/>
            </div>
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-1 text-slate-700 text-sm"><MapPin size={14}/> כתובת למסירה</Label>
              <Input placeholder="עיר, רחוב, מספר..." onChange={e => setFormData({...formData, address: e.target.value})} className="rounded-xl h-12 border-slate-200"/>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* סוג הובלה */}
          <div className="space-y-3">
            <Label className="font-black text-[#0B2C63] text-lg">סוג פריקה / שירות</Label>
            <div className="grid grid-cols-2 gap-3">
              {deliveryTypes.map(type => (
                <div key={type.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-blue-50 transition-all cursor-pointer">
                  <Checkbox 
                    id={type.id} 
                    onCheckedChange={(checked) => setFormData({
                      ...formData, 
                      types: { ...formData.types, [type.id]: !!checked }
                    })}
                  />
                  <label htmlFor={type.id} className="text-xs font-bold leading-tight cursor-pointer text-slate-700">{type.label}</label>
                </div>
              ))}
            </div>
          </div>

          {/* מחסן ונהג */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-1 text-slate-700 text-sm"><Warehouse size={14}/> מחסן</Label>
              <select 
                className="w-full p-3 rounded-xl border border-slate-200 font-bold bg-white text-sm"
                onChange={e => setFormData({...formData, warehouse_source: e.target.value})}
              >
                <option>התלמיד</option>
                <option>החרש</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-1 text-slate-700 text-sm"><Truck size={14}/> נהג</Label>
              <select 
                className="w-full p-3 rounded-xl border border-slate-200 font-bold bg-white text-sm"
                onChange={e => setFormData({...formData, driver_name: e.target.value})}
              >
                <option>חכמת</option>
                <option>עלי</option>
              </select>
            </div>
          </div>

          {/* כפתורי פעולה */}
          <div className="flex gap-3 pt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  onClick={generatePreview}
                  className="flex-1 h-14 rounded-2xl border-2 border-slate-200 font-bold gap-2 text-slate-600"
                >
                  <Eye size={20} /> תצוגה
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xs rounded-3xl" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="text-center font-black">הודעת ווטסאפ מעוצבת</DialogTitle>
                </DialogHeader>
                <div className="bg-[#DCF8C6] p-4 rounded-2xl text-sm font-mono whitespace-pre-wrap shadow-inner">
                  {previewMsg}
                </div>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(previewMsg);
                    toast.success("ההודעה הועתקה! שלח לקבוצה");
                  }}
                >
                  <Copy size={18} /> העתק ושדר
                </Button>
              </DialogContent>
            </Dialog>

            <Button 
              onClick={handleSubmit}
              className="flex-[2] h-14 rounded-2xl bg-[#0B2C63] hover:bg-slate-800 text-white font-black shadow-xl gap-2 transition-transform active:scale-95"
            >
              <Send size={20} /> שמור בסידור
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
