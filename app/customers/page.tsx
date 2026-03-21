"use client";
import React, { useState, useEffect } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // <--- היבוא שהיה חסר וגרם לשגיאה
import { 
  UserPlus, Users, Share2, Edit3, X, 
  Phone, MapPin, Loader2 
} from "lucide-react";
import { toast, Toaster } from "sonner";

export default function SabanCustomerManager() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ customer_id: '', full_name: '', phone: '', address: '' });
  const supabase = getSupabase();

  // טעינת לקוחות מה-DB
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saban_customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (err: any) {
      console.error("SabanOS Error:", err.message);
      toast.error("שגיאה בטעינת לקוחות");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchCustomers(); 
  }, []);

  // יצירת לקוח חדש
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('saban_customers')
        .insert([formData]);
      
      if (error) throw error;
      
      toast.success("לקוח חדש הוקם בסידור!");
      setFormData({ customer_id: '', full_name: '', phone: '', address: '' });
      setIsAdding(false);
      fetchCustomers();
    } catch (err: any) {
      toast.error("שגיאה ביצירת לקוח: " + err.message);
    }
  };

  // שיתוף דף קסם לווטסאפ
  const shareMagicLink = (customer: any) => {
    const link = `https://ai-saban94-chat.vercel.app/client/${customer.customer_id}`;
    const text = `שלום ${customer.full_name}, מצורף לינק לדף המעקב והפקודות האישי שלך בחברת ח. סבן: ${link}`;
    window.open(`https://wa.me/${customer.phone?.replace(/\D/g,'')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 text-right" dir="rtl">
      <Toaster position="top-center" richColors />
      
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-black italic text-blue-700 tracking-tighter uppercase">ניהול תיקי לקוחות</h1>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1 italic">SabanOS Client Folders</p>
            </div>
            <button 
                onClick={() => setIsAdding(!isAdding)}
                className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all"
            >
                {isAdding ? <X size={20}/> : <UserPlus size={20}/>}
                {isAdding ? "ביטול" : "הוספת לקוח חדש"}
            </button>
        </header>

        {/* טופס הוספה */}
        {isAdding && (
          <Card className="p-6 border-none shadow-xl rounded-[2.5rem] bg-white animate-in fade-in zoom-in duration-300">
            <form onSubmit={handleAddCustomer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input required placeholder="מספר לקוח" value={formData.customer_id} onChange={e => setFormData({...formData, customer_id: e.target.value})} className="bg-slate-50 p-4 rounded-2xl outline-none font-bold text-sm border-none ring-1 ring-slate-100 focus:ring-blue-500 text-right"/>
                <input required placeholder="שם מלא" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="bg-slate-50 p-4 rounded-2xl outline-none font-bold text-sm border-none ring-1 ring-slate-100 focus:ring-blue-500 text-right"/>
                <input required placeholder="טלפון" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-slate-50 p-4 rounded-2xl outline-none font-bold text-sm border-none ring-1 ring-slate-100 focus:ring-blue-500 text-right"/>
                <input required placeholder="כתובת פרויקט" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="bg-slate-50 p-4 rounded-2xl outline-none font-bold text-sm border-none ring-1 ring-slate-100 focus:ring-blue-500 text-right"/>
                <button className="lg:col-span-4 bg-blue-700 text-white p-4 rounded-2xl font-black shadow-lg">שמור לקוח במערכת</button>
            </form>
          </Card>
        )}

        {/* גריד לקוחות */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
                <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48}/></div>
            ) : customers.length === 0 ? (
                <div className="col-span-full text-center py-20 text-slate-400 font-black italic">אין לקוחות רשומים כרגע</div>
            ) : customers.map(customer => (
                <Card key={customer.id} className="bg-white border-none p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group border-t-4 border-transparent hover:border-blue-600">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <Users size={24}/>
                        </div>
                        <Badge className="bg-slate-100 text-slate-500 border-none font-black italic">#{customer.customer_id}</Badge>
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-800 mb-4 tracking-tight italic">{customer.full_name}</h3>
                    
                    <div className="space-y-3 mb-6 text-sm font-bold text-slate-500">
                        <div className="flex items-center gap-2"><Phone size={14}/> {customer.phone}</div>
                        <div className="flex items-center gap-2"><MapPin size={14}/> {customer.address}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <button 
                            onClick={() => shareMagicLink(customer)}
                            className="flex items-center justify-center gap-2 bg-green-50 text-green-700 p-3 rounded-xl font-black text-xs hover:bg-green-600 hover:text-white transition-all"
                        >
                            <Share2 size={14}/> שיתוף דף קסם
                        </button>
                        <button className="flex items-center justify-center gap-2 bg-slate-50 text-slate-700 p-3 rounded-xl font-black text-xs hover:bg-slate-800 hover:text-white transition-all">
                            <Edit3 size={14}/> עריכת תיק
                        </button>
                    </div>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
