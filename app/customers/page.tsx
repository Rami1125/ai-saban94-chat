"use client";
import React, { useState, useEffect } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, Users, Share2, Edit3, X, 
  Phone, MapPin, Loader2, Save, Trash2, ExternalLink
} from "lucide-react";
import { toast, Toaster } from "sonner";

// רכיב מגירה פשוט לעריכה
const EditDrawer = ({ customer, onClose, onSave }: any) => {
    const [data, setData] = useState(customer);
    return (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/20 backdrop-blur-sm transition-all">
            <Card className="w-full max-w-md h-full bg-white rounded-none p-8 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
                <div className="flex justify-between items-center mb-10">
                    <h2 className="text-2xl font-black italic text-blue-700 uppercase">עריכת תיק לקוח</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X/></button>
                </div>
                
                <div className="space-y-6 flex-1">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">שם מלא</label>
                        <input value={data.full_name} onChange={e => setData({...data, full_name: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl outline-none font-bold border-none ring-1 ring-slate-100 focus:ring-blue-500 text-right"/>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">טלפון</label>
                        <input value={data.phone} onChange={e => setData({...data, phone: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl outline-none font-bold border-none ring-1 ring-slate-100 focus:ring-blue-500 text-right"/>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">כתובת פרויקט</label>
                        <input value={data.address} onChange={e => setData({...data, address: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl outline-none font-bold border-none ring-1 ring-slate-100 focus:ring-blue-500 text-right"/>
                    </div>
                </div>

                <button 
                    onClick={() => onSave(data)}
                    className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-blue-200 active:scale-95 transition-all mt-6"
                >
                    <Save size={20}/> שמור שינויים בתיק
                </button>
            </Card>
        </div>
    );
};

export default function SabanCustomerManager() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({ customer_id: '', full_name: '', phone: '', address: '' });
  const supabase = getSupabase();

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('saban_customers').select('*').order('created_at', { ascending: false });
    if (error) toast.error("שגיאה בטעינת לקוחות");
    else setCustomers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('saban_customers').insert([formData]);
    if (error) toast.error("שגיאה ביצירת לקוח");
    else {
        toast.success("לקוח חדש הוקם בהצלחה!");
        setFormData({ customer_id: '', full_name: '', phone: '', address: '' });
        setIsAdding(false);
        fetchCustomers();
    }
  };

  const handleUpdateCustomer = async (updatedData: any) => {
    const { error } = await supabase.from('saban_customers').update(updatedData).eq('id', updatedData.id);
    if (error) toast.error("שגיאה בעדכון הנתונים");
    else {
        toast.success("התיק של " + updatedData.full_name + " עודכן!");
        setEditingCustomer(null);
        fetchCustomers();
    }
  };

  const shareMagicLink = (customer: any) => {
    const link = `https://ai-saban94-chat.vercel.app/client/${customer.customer_id}`;
    const text = `*שלום ${customer.full_name}*, 🚛\nמצורף לינק לדף המעקב והפקודות האישי שלך בחברת *ח. סבן*.\nכאן תוכל לבצע הזמנות, החלפות ולעקוב אחרי הסטטוס:\n\n🔗 ${link}`;
    window.open(`https://wa.me/${customer.phone?.replace(/\D/g,'')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 text-right" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {editingCustomer && (
        <EditDrawer 
            customer={editingCustomer} 
            onClose={() => setEditingCustomer(null)} 
            onSave={handleUpdateCustomer}
        />
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
                <h1 className="text-4xl font-black italic text-blue-700 tracking-tighter uppercase">ניהול תיקי לקוחות</h1>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-1 italic">SabanOS CRM Intelligence</p>
            </div>
            <button 
                onClick={() => setIsAdding(!isAdding)}
                className="bg-blue-600 text-white px-8 py-4 rounded-[2rem] font-black flex items-center justify-center gap-3 shadow-2xl shadow-blue-100 active:scale-95 transition-all"
            >
                {isAdding ? <X size={20}/> : <UserPlus size={20}/>}
                {isAdding ? "ביטול פעולה" : "הוספת לקוח חדש"}
            </button>
        </header>

        {isAdding && (
          <Card className="p-8 border-none shadow-2xl rounded-[3rem] bg-white animate-in zoom-in duration-300">
            <form onSubmit={handleAddCustomer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input required placeholder="מספר לקוח" value={formData.customer_id} onChange={e => setFormData({...formData, customer_id: e.target.value})} className="bg-slate-50 p-4 rounded-2xl outline-none font-bold text-sm border-none ring-1 ring-slate-100 focus:ring-blue-500 text-right"/>
                <input required placeholder="שם מלא" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="bg-slate-50 p-4 rounded-2xl outline-none font-bold text-sm border-none ring-1 ring-slate-100 focus:ring-blue-500 text-right"/>
                <input required placeholder="טלפון" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-slate-50 p-4 rounded-2xl outline-none font-bold text-sm border-none ring-1 ring-slate-100 focus:ring-blue-500 text-right"/>
                <input required placeholder="כתובת פרויקט" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="bg-slate-50 p-4 rounded-2xl outline-none font-bold text-sm border-none ring-1 ring-slate-100 focus:ring-blue-500 text-right"/>
                <button className="lg:col-span-4 bg-blue-700 text-white p-5 rounded-2xl font-black shadow-xl hover:bg-blue-800 transition-colors">שמור לקוח במערכת</button>
            </form>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {loading ? (
                <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48}/></div>
            ) : customers.map(customer => (
                <Card key={customer.id} className="bg-white border-none p-8 rounded-[3rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-2xl transition-all group border-t-8 border-transparent hover:border-blue-600 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                            <Users size={28}/>
                        </div>
                        <Badge className="bg-slate-50 text-slate-400 border-slate-100 font-black italic px-4 py-1">#{customer.customer_id}</Badge>
                    </div>
                    
                    <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight italic">{customer.full_name}</h3>
                    
                    <div className="space-y-4 mb-8 text-sm font-bold text-slate-400 italic">
                        <div className="flex items-center gap-3"><Phone size={16} className="text-blue-500 opacity-50"/> {customer.phone}</div>
                        <div className="flex items-center gap-3"><MapPin size={16} className="text-blue-500 opacity-50"/> {customer.address}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <button 
                            onClick={() => shareMagicLink(customer)}
                            className="flex items-center justify-center gap-2 bg-green-50 text-green-700 p-4 rounded-[1.5rem] font-black text-xs hover:bg-green-600 hover:text-white transition-all shadow-sm"
                        >
                            <Share2 size={16}/> שיתוף דף קסם
                        </button>
                        <button 
                            onClick={() => setEditingCustomer(customer)}
                            className="flex items-center justify-center gap-2 bg-slate-50 text-slate-700 p-4 rounded-[1.5rem] font-black text-xs hover:bg-slate-800 hover:text-white transition-all shadow-sm"
                        >
                            <Edit3 size={16}/> עריכת תיק
                        </button>
                    </div>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
