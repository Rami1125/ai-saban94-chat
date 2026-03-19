"use client";
import React, { useState, useEffect } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Search, User, Mail, MapPin, X, ChevronDown, 
  Send, History, Loader2, BellRing 
} from "lucide-react";
import { toast, Toaster } from "sonner";

export default function ItzikInterface() {
    const [mode, setMode] = useState<'NEW' | 'HISTORY'>('NEW');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [customerResults, setCustomerResults] = useState<any[]>([]);
    const [showExtraFields, setShowExtraFields] = useState(false);
    
    const [form, setForm] = useState({
        customerName: '',
        docNum: '',
        email: '',
        address: '',
        requestType: 'הזמנה 📦'
    });

    const supabase = getSupabase();

    // חיפוש לקוח תוך כדי הקלדה
    useEffect(() => {
        if (form.customerName.length > 2) {
            supabase.from('customers')
                .select('*')
                .ilike('name', `%${form.customerName}%`)
                .limit(3)
                .then(({ data }) => setCustomerResults(data || []));
        } else {
            setCustomerResults([]);
        }
    }, [form.customerName]);

    const handleSend = async () => {
        setLoading(true);
        const { error } = await supabase.from('saban_requests').insert([{
            requester_name: 'איציק זהבי',
            customer_name: form.customerName,
            doc_number: form.docNum,
            request_type: form.requestType,
            extra_data: { email: form.email, address: form.address },
            status: 'ממתין'
        }]);

        if (!error) {
            toast.success("נשלח לסידור בהצלחה!");
            setForm({ customerName: '', docNum: '', email: '', address: '', requestType: 'הזמנה 📦' });
        }
        setLoading(false);
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 p-4 pb-24" dir="rtl">
            <Toaster position="top-center" />
            
            <div className="flex gap-2 mb-6">
                <Button onClick={() => setMode('NEW')} className={`flex-1 rounded-2xl h-12 ${mode === 'NEW' ? 'bg-[#0B2C63]' : 'bg-white text-slate-500'}`}>בקשה חדשה</Button>
                <Button onClick={() => setMode('HISTORY')} className={`flex-1 rounded-2xl h-12 ${mode === 'HISTORY' ? 'bg-[#0B2C63]' : 'bg-white text-slate-500'}`}>היסטוריה</Button>
            </div>

            {mode === 'NEW' ? (
                <Card className="p-6 rounded-[2rem] shadow-xl border-none space-y-4">
                    <div className="relative">
                        <label className="text-xs font-black mr-2">שם לקוח</label>
                        <Input 
                            value={form.customerName}
                            onChange={(e) => setForm({...form, customerName: e.target.value})}
                            placeholder="הקלד שם לחיפוש..."
                            className="h-14 rounded-2xl border-2 focus:border-blue-500"
                        />
                        {customerResults.length > 0 && (
                            <div className="absolute z-10 w-full bg-white shadow-lg rounded-xl mt-1 border">
                                {customerResults.map(c => (
                                    <div key={c.id} onClick={() => { setForm({...form, customerName: c.name}); setCustomerResults([]); }}
                                         className="p-3 hover:bg-blue-50 cursor-pointer text-sm font-bold border-b last:border-none">
                                        {c.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-black mr-2">מספר מסמך (חשבונית/הזמנה)</label>
                        <Input 
                            value={form.docNum}
                            onChange={(e) => setForm({...form, docNum: e.target.value})}
                            className="h-14 rounded-2xl border-2"
                        />
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-2">
                        <Button variant="ghost" onClick={() => setShowExtraFields(!showExtraFields)} className="w-full justify-between font-bold">
                            <div className="flex items-center gap-2"><Plus size={18}/> הוסף שדות (אימייל/כתובת)</div>
                            <ChevronDown size={18} className={showExtraFields ? 'rotate-180' : ''}/>
                        </Button>
                        
                        {showExtraFields && (
                            <div className="p-2 space-y-3 animate-in slide-in-from-top-2">
                                <Input placeholder="כתובת למשלוח" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="bg-white rounded-xl" />
                                <Input placeholder="אימייל לקוח" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="bg-white rounded-xl" />
                            </div>
                        )}
                    </div>

                    <Button onClick={handleSend} disabled={loading} className="w-full h-16 bg-[#0B2C63] rounded-2xl font-black text-xl shadow-lg">
                        {loading ? <Loader2 className="animate-spin" /> : "שלח בקשה 🚀"}
                    </Button>
                </Card>
            ) : (
                <div className="space-y-3">
                    <div className="relative mb-4">
                        <Search className="absolute right-3 top-3 text-slate-400" size={18}/>
                        <Input 
                            placeholder="חפש בהיסטוריה..." 
                            className="pr-10 h-12 rounded-xl bg-white"
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {/* כאן תבוא רשימת ההיסטוריה עם פילטר לפי searchQuery */}
                </div>
            )}
        </div>
    );
}
