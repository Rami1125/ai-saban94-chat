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
  phone_number: z.string().min(10, "טלפון לא תקין"),
  delivery_address: z.string().min(5, "כתובת חובה"),
  driver_name: z.string().min(2, "חובה נהג"),
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

  const nameInput = watch("customer_name");

  useEffect(() => {
    if (nameInput?.length > 2) {
      const search = async () => {
        const { data } = await supabase.from('dispatch_orders')
          .select('customer_name, phone_number, delivery_address')
          .ilike('customer_name', `%${nameInput}%`).limit(3);
        if (data) setSuggestions(data);
      };
      search();
    } else setSuggestions([]);
  }, [nameInput, supabase]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { error } = await supabase.from('dispatch_orders').insert([{
      ...values,
      scheduled_date: new Date().toISOString().split('T')[0],
      status: 'pending'
    }]);

    if (!error) {
      toast.success("הזמנה נשמרה בסידור");
      reset();
      onOrderCreated();
    }
  };

  return (
    <Card className="border-none shadow-2xl overflow-hidden" dir="rtl">
      <CardHeader className="bg-blue-600 text-white p-6 text-right">
        <CardTitle className="flex items-center gap-2 text-xl font-black uppercase">
          <Truck size={24} /> יצירת הזמנה חדשה
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="relative">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">שם לקוח / חברה</label>
            <Input {...register("customer_name")} className="h-14 pr-12 text-lg font-bold" placeholder="חיפוש בהיסטוריה..." />
            <User className="absolute right-4 top-9 text-slate-400" size={20} />
            {suggestions.length > 0 && (
              <div className="absolute z-50 w-full bg-white border-2 border-blue-100 rounded-xl shadow-2xl mt-1 overflow-hidden">
                {suggestions.map((s, i) => (
                  <div key={i} onClick={() => {
                    setValue("customer_name", s.customer_name);
                    setValue("phone_number", s.phone_number);
                    setValue("delivery_address", s.delivery_address);
                    setSuggestions([]);
                  }} className="p-4 hover:bg-blue-50 cursor-pointer border-b last:border-0">
                    <div className="font-black text-slate-800">{s.customer_name}</div>
                    <div className="text-xs text-slate-400">{s.delivery_address}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input {...register("phone_number")} className="h-12 font-bold" placeholder="טלפון לקוח" />
            <Input {...register("driver_name")} className="h-12 font-bold" placeholder="שם נהג" />
          </div>

          <Input {...register("delivery_address")} className="h-14 font-bold" placeholder="כתובת פרויקט מדויקת" />

          <div className="grid grid-cols-2 gap-4">
            <Input type="time" {...register("scheduled_time")} className="h-12 font-mono text-center text-lg" />
            <select {...register("truck_type")} className="h-12 border-2 border-slate-100 rounded-md px-3 font-bold bg-white">
              <option value="crane">מנוף</option>
              <option value="flatbed">פתוחה</option>
            </select>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-slate-900 hover:bg-black text-white text-xl font-black rounded-2xl shadow-xl mt-4">
            {isSubmitting ? "שומר..." : "שבץ בסידור ושמור היסטוריה"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
