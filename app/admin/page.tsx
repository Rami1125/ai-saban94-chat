"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Paintbucket } from "lucide-react";

export default function AdminPage() {
  // הגדרת ה-State עם מערך ריק כברירת מחדל למניעת שגיאת "not defined"
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      const { data, error } = await supabase
        .from('fast_checkout_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
      setLoading(false);
    }
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto dir-rtl" dir="rtl">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900">ניהול הזמנות - ח. סבן</h1>
        <Badge variant="outline" className="text-lg px-4 py-1">
          {orders.length} הזמנות
        </Badge>
      </header>

      <div className="grid gap-4">
        {/* בדיקה אם יש הזמנות לפני הרצת ה-map */}
        {orders && orders.length > 0 ? (
          orders.map((order) => (
            <Card key={order.id} className="overflow-hidden border-r-4 border-r-blue-600">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">{order.customer_name}</h3>
                    <p className="text-sm text-slate-500">טלפון: {order.phone}</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 uppercase text-[10px]">
                    {order.status || 'PENDING'}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  {/* פרטי צבע */}
                  {order.color_code && (
                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg">
                      <div 
                        className="w-10 h-10 rounded border shadow-sm" 
                        style={{ backgroundColor: order.hex_preview || '#eee' }}
                      />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">גוון</p>
                        <p className="font-bold text-sm">{order.color_code}</p>
                      </div>
                    </div>
                  )}

                  {/* פרטי אריזה */}
                  {order.container_size && (
                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg">
                      <div className="bg-white p-2 rounded border">
                        <Package size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">אריזה</p>
                        <p className="font-bold text-sm">{order.container_size}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed">
            <p className="text-slate-400 font-medium">אין הזמנות חדשות כרגע</p>
          </div>
        )}
      </div>
    </div>
  );
}
