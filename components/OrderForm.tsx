"use client";
import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, MapPin, Phone, Clock, Save, Truck } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  customer_name: z.string().min(2, "שם לקוח חובה"),
  phone_number: z.string().min(10, "מספר טלפון לא תקין"),
  delivery_address: z.string().min(5, "כתובת חובה"),
  project_name: z.string().optional(),
  driver_name: z.string().min(2, "חובה לבחור נהג"),
  scheduled_time: z.string(),
  truck_type: z.string()
});

export default function OrderForm({ onOrderCreated }: { onOrderCreated: () => void }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const supabase = getSupabase();
  
  const { register, handleSubmit, setValue, watch, reset, formState: { isSubmitting } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { scheduled_time: "07:00", truck_type: "crane" }
  });

  const customerName = watch("customer_name");

  useEffect(() => {
    if (customerName?.length > 2) {
      const search = async () => {
        const { data } = await supabase.from('dispatch_orders')
          .select('customer_name, phone_number, delivery_address, project_name')
          .ilike('customer_name', `%${customerName}%`).limit(3);
        if (data) setSuggestions(data);
      };
      search();
    } else setSuggestions([]);
  }, [customerName, supabase]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { error } = await supabase.from('dispatch_orders').insert([{
      ...values,
      scheduled_date: new Date().toISOString().split('T')[0],
      status: 'pending'
    }]);

    if (!error) {
      toast.success("הזמנה נשמרה במוח של סבן");
      reset();
      onOrderCreated();
    } else toast.error("שגיאה בשמירה");
  };

  return (
    <Card className="border-none shadow-xl" dir="rtl">
      <CardHeader className="bg-slate-900 text-white rounded-t-xl">
        <CardTitle className="text-lg font-black flex items-center gap-2">
          <Truck size={20} className="text-blue-400" /> הזמנה חדשה למחר
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="relative">
            <Input {...register("customer_name")} className="h-12 pr-10" placeholder="שם הלקוח (חיפוש בהיסטוריה...)" />
            <User className="absolute right-3 top-3.5 text-slate-400" size={18} />
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border rounded-lg shadow-2xl mt-1">
                {suggestions.map((s, i) => (
                  <div key={i} onClick={() => {
                    setValue("customer_name", s.customer_name);
                    setValue("phone_number", s.phone_number);
                    setValue("delivery_address", s.delivery_address);
                    setSuggestions([]);
                  }} className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-0">
                    <div className="font-bold text-sm">{s.customer_name}</div>
                    <div className="text-[10px] text-slate-500">{s.delivery_address}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input {...register("phone_number")} className="h-12" placeholder="טלפון לקוח" />
            <Input {...register("driver_name")} className="h-12" placeholder="שם הנהג" />
          </div>

          <Input {...register("delivery_address")} className="h-12" placeholder="כתובת פרויקט מדויקת" />

          <div className="grid grid-cols-2 gap-4">
             <div className="relative">
               <Input type="time" {...register("scheduled_time")} className="h-12 pr-10" />
               <Clock className="absolute right-3 top-3.5 text-slate-400" size={18} />
             </div>
             <select {...register("truck_type")} className="h-12 border rounded-md px-3 bg-white text-sm font-bold">
               <option value="crane">מנוף</option>
               <option value="flatbed">פתוחה</option>
             </select>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-xl shadow-lg shadow-blue-100">
            {isSubmitting ? "מעבד נתונים..." : "שבץ בסידור ושמור היסטוריה"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
