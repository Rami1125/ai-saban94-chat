"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast, Toaster } from "sonner";
import { Truck, Calendar, Clock, User, MapPin, Warehouse, Send } from "lucide-react";
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
      toast.success("ההזמנה נשמרה בסידור בהצלחה!");
      // כאן ירוץ הצינור שמעצב הודעת ווטסאפ
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20 bg-slate-50 min-h-screen" dir="rtl">
      <Toaster position="top-center" richColors />
      
      <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-[#0B2C63] text-white p-6">
          <CardTitle className="flex items-center gap-2 text-2xl font-black">
            <Truck className="text-blue-400" /> הזנה לסידור הובלות
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* תאריך ושעה */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-1"><Calendar size={14}/> תאריך</Label>
              <Input type="date" value={formData.scheduled_date} onChange={e => setFormData({...formData, scheduled_date: e.target.value})} className="rounded-xl"/>
            </div>
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-1"><Clock size={14}/> שעה</Label>
              <Input type="time" onChange={e => setFormData({...formData, scheduled_time: e.target.value})} className="rounded-xl"/>
            </div>
          </div>

          {/* לקוח וכתובת */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-1"><User size={14}/> לקוח</Label>
              <Input placeholder="שם הלקוח..." onChange={e => setFormData({...formData, customer_name: e.target.value})} className="rounded-xl h-12 shadow-sm"/>
            </div>
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-1"><MapPin size={14}/> כתובת יעד</Label>
              <Input placeholder="רחוב, עיר..." onChange={e => setFormData({...formData, address: e.target.value})} className="rounded-xl h-12 shadow-sm"/>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* סוג הובלה - Grid של צ'קבוקסים */}
          <div className="space-y-3">
            <Label className="font-black text-blue-900">סוג פריקה והובלה</Label>
            <div className="grid grid-cols-2 gap-3">
              {deliveryTypes.map(type => (
                <div key={type.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl hover:bg-blue-50 transition-all cursor-pointer">
                  <Checkbox 
                    id={type.id} 
                    onCheckedChange={(checked) => setFormData({
                      ...formData, 
                      types: { ...formData.types, [type.id]: !!checked }
                    })}
                  />
                  <label htmlFor={type.id} className="text-sm font-bold leading-none cursor-pointer">{type.label}</label>
                </div>
              ))}
            </div>
          </div>

          {/* בחירת מחסן ונהג */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-1"><Warehouse size={14}/> מחסן מקור</Label>
              <select 
                className="w-full p-3 rounded-xl border border-slate-200 font-bold bg-white shadow-sm"
                onChange={e => setFormData({...formData, warehouse_source: e.target.value})}
              >
                <option>התלמיד</option>
                <option>החרש</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-1"><Truck size={14}/> נהג מבצע</Label>
              <select 
                className="w-full p-3 rounded-xl border border-slate-200 font-bold bg-white shadow-sm"
                onChange={e => setFormData({...formData, driver_name: e.target.value})}
              >
                <option>חכמת</option>
                <option>עלי</option>
              </select>
            </div>
          </div>

          <Button 
            onClick={handleSubmit}
            className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-xl font-black shadow-xl gap-2 mt-4"
          >
            <Send size={24} /> שמור ועדכן סידור
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
