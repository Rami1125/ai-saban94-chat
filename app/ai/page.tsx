"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const [newCustomerPhone, setNewCustomerPhone] = useState("");
const [newCustomerName, setNewCustomerName] = useState("");
const [showAddCustomer, setShowAddCustomer] = useState(false);

const handleAddAndShare = async () => {
  if (!newCustomerPhone || !newCustomerName) return toast.error("נא למלא שם וטלפון");

  try {
    // 1. שמירה בבסיס הנתונים (CRM)
    const { error } = await supabase.from('saban_customers').upsert({
      phone: newCustomerPhone,
      full_name: newCustomerName,
    }, { onConflict: 'phone' });

    if (error) throw error;

    // 2. בניית לינק הקסם והודעת הוואטסאפ
    const baseUrl = window.location.origin;
    const magicLink = `${baseUrl}/order/magic?phone=${newCustomerPhone}`;
    
    const whatsappMessage = `*ברוך הבא למערכת ההזמנות של ח. סבן!* 🏗️\n\nשלום ${newCustomerName}, שמחים שהצטרפת אלינו.\nמעכשיו תוכל לבצע הזמנות ולבדוק סטטוס בקליק אחד דרך הלינק האישי שלך:\n\n🔗 ${magicLink}\n\n*איך זה עובד?*\n✅ לביצוע הזמנה: לחץ על הלינק, בחר סוג הובלה והדבק רשימה.\n✅ לבדיקת סטטוס: כנס ללינק בכל זמן ותראה איפה הנהג נמצא.\n\nאנחנו כאן לכל שאלה! 🦾`;

    // 3. פתיחת וואטסאפ
    window.open(`https://wa.me/${newCustomerPhone}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
    
    toast.success("לקוח נוסף והודעת פתיחה נשלחה!");
    setShowAddCustomer(false);
    setNewCustomerPhone("");
    setNewCustomerName("");
  } catch (e: any) {
    toast.error("שגיאה ברישום הלקוח");
  }
};

// --- בתוך ה-JSX (מתחת ל-Header או ליד כפתור "חדש +") ---
<div className="max-w-[1800px] mx-auto px-4 mb-6">
  {!showAddCustomer ? (
    <Button 
      onClick={() => setShowAddCustomer(true)}
      className="bg-white text-[#0B2C63] border-2 border-[#0B2C63] hover:bg-[#0B2C63] hover:text-white rounded-2xl font-black gap-2 h-12 transition-all px-6 cursor-pointer shadow-sm"
    >
      <UserCheck size={20} /> צרף לקוח חדש למערכת
    </Button>
  ) : (
    <Card className="p-6 rounded-[2.5rem] bg-white shadow-2xl border-2 border-blue-100 animate-in zoom-in-95">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-black text-[#0B2C63] italic uppercase">רישום לקוח ולינק קסם</h3>
        <button onClick={() => setShowAddCustomer(false)} className="text-slate-400 border-none bg-transparent cursor-pointer"><X size={20}/></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input 
          placeholder="שם הלקוח" 
          value={newCustomerName} 
          onChange={e => setNewCustomerName(e.target.value)}
          className="h-14 bg-slate-50 rounded-xl px-4 font-bold border-none outline-none focus:ring-2 ring-blue-500 text-right"
        />
        <input 
          placeholder="מספר טלפון (למשל 972...)" 
          value={newCustomerPhone} 
          onChange={e => setNewCustomerPhone(e.target.value)}
          className="h-14 bg-slate-50 rounded-xl px-4 font-bold border-none outline-none focus:ring-2 ring-blue-500 text-right"
        />
        <Button 
          onClick={handleAddAndShare}
          className="h-14 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black gap-2 border-none shadow-lg shadow-green-100 cursor-pointer"
        >
          <Share2 size={20} /> שמור ושלח לינק פתיחה
        </Button>
      </div>
    </Card>
  )}
</div>
