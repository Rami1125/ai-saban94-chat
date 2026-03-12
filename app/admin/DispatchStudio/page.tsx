"use client";
import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, MapPin, Phone, Calendar, Clock, Save } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  customer_name: z.string().min(2, "שם לקוח חובה"),
  phone_number: z.string().min(10, "מספר טלפון לא תקין"),
  delivery_address: z.string().min(5, "כתובת חובה"),
  project_name: z.string().optional(),
  driver_name: z.string().min(2, "חובה לבחור נהג"),
  scheduled_time: z.string(),
  truck_type: z.enum(["crane", "flatbed", "trailer"]),
});

export default function OrderForm({ onOrderCreated }: { onOrderCreated: () => void }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const supabase = getSupabase();
  
  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scheduled_time: "07:00",
      truck_type: "crane"
    }
  });

  const customerNameWatcher = watch("customer_name");

  // חיפוש היסטורי בזמן הקלדה
  useEffect(() => {
    if (customerNameWatcher && customerNameWatcher.length > 2) {
      const searchHistory = async () => {
        const { data } = await supabase
          .from('dispatch_orders')
          .select('customer_name, phone_number, delivery_address, project_name')
          .ilike('customer_name', `%${customerNameWatcher}%`)
          .limit(3);
        if (data) setSuggestions(data);
      };
      searchHistory();
    } else {
      setSuggestions([]);
    }
  }, [customerNameWatcher]);

  const selectSuggestion = (s: any) => {
    setValue("customer_name", s.customer_name);
    setValue("phone_number", s.phone_number);
    setValue("delivery_address", s.delivery_address);
    setValue("project_name", s.project_name);
    setSuggestions([]);
  };

// בתוך הקומפוננטה OrderForm
const supabase = getSupabase(); // קרא לזה פעם אחת למעלה

const onSubmit = async (values: z.infer<typeof formSchema>) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // וודא שאתה משתמש ב-values הנכונים
    const { data, error } = await supabase
      .from('dispatch_orders')
      .insert([{
        customer_name: values.customer_name,
        phone_number: values.phone_number,
        delivery_address: values.delivery_address,
        project_name: values.project_name,
        driver_name: values.driver_name,
        scheduled_time: values.scheduled_time,
        truck_type: values.truck_type,
        scheduled_date: today,
        status: 'pending'
      }]);

    if (error) throw error;
    
    toast.success("הזמנה נוצרה בהצלחה!");
    if (onOrderCreated) onOrderCreated(); // בדיקה שזה פונקציה לפני הקריאה
  } catch (err: any) {
    toast.error("שגיאה: " + err.message);
  }
};

  return (
    <Card className="border-none shadow-2xl bg-white/90 backdrop-blur-md" dir="rtl">
      <CardHeader>
        <CardTitle className="text-xl font-black flex items-center gap-2">
          <Save className="text-blue-600" /> יצירת הזמנה חדשה
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* לקוח עם השלמה אוטומטית */}
          <div className="relative">
            <label className="text-xs font-bold text-slate-500 mb-1 block">שם לקוח / חברה</label>
            <div className="relative">
              <User className="absolute right-3 top-3 text-slate-400" size={18} />
              <Input {...register("customer_name")} className="pr-10 h-12" placeholder="הקלד שם לחיפוש בהיסטוריה..." />
            </div>
            {suggestions.length > 0 && (
              <div className="absolute z-50 w-full bg-white border rounded-lg shadow-xl mt-1 overflow-hidden">
                {suggestions.map((s, i) => (
                  <div 
                    key={i} 
                    onClick={() => selectSuggestion(s)}
                    className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 text-sm"
                  >
                    <div className="font-bold">{s.customer_name}</div>
                    <div className="text-xs text-slate-400">{s.delivery_address}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">טלפון</label>
              <div className="relative">
                <Phone className="absolute right-3 top-3 text-slate-400" size={18} />
                <Input {...register("phone_number")} className="pr-10 h-12" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">שם הפרויקט</label>
              <Input {...register("project_name")} className="h-12" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">כתובת למשלוח</label>
            <div className="relative">
              <MapPin className="absolute right-3 top-3 text-slate-400" size={18} />
              <Input {...register("delivery_address")} className="pr-10 h-12" placeholder="עיר, רחוב, מספר..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">נהג משבץ</label>
              <Input {...register("driver_name")} className="h-12" placeholder="שם הנהג" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">שעת הגעה</label>
              <div className="relative">
                <Clock className="absolute right-3 top-3 text-slate-400" size={18} />
                <Input type="time" {...register("scheduled_time")} className="pr-10 h-12" />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-lg font-black rounded-xl shadow-lg mt-4">
            {isSubmitting ? "שומר..." : "צור הזמנה ושבץ בסידור"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
