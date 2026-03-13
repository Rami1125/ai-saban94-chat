"use client";
import React from 'react';
import { MapPin, Navigation, Clock, Building2 } from 'lucide-react';

export default function PickupCard({ branch }: { branch: 'התלמיד' | 'החרש' }) {
  const branchData = {
    'התלמיד': {
      address: 'רחוב התלמיד 6, הוד השרון',
      waze: 'https://waze.com/ul/hsv8y8u6u4',
      mapImg: 'https://sidor.vercel.app/maps/hatalmid.png' // לינק למפה המעוצבת שלך
    },
    'החרש': {
      address: 'רחוב החרש 8, הוד השרון',
      waze: 'https://waze.com/ul/hsv8y8u6u5',
      mapImg: 'https://sidor.vercel.app/maps/hacharash.png'
    }
  };

  const selected = branchData[branch];

  return (
    <div className="w-full max-w-sm bg-[#0F172A] rounded-[2.5rem] overflow-hidden border border-blue-500/20 shadow-2xl" dir="rtl">
      {/* תמונת מפה מעוצבת / דף תדמית */}
      <div className="relative h-40 bg-slate-800 overflow-hidden">
        <img src={selected.mapImg} alt="מפת הגעה" className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent"></div>
        <div className="absolute bottom-4 right-6 flex items-center gap-2">
          <Building2 className="text-blue-500" size={20} />
          <span className="text-white font-black text-lg">סניף {branch}</span>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <MapPin className="text-blue-500 shrink-0" size={18} />
            <p className="text-slate-300 text-sm font-bold">{selected.address}</p>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-xs">
            <Clock size={16} />
            <span>שעות פעילות: א'-ה' 06:30-16:30, ו' 06:30-12:00</span>
          </div>
        </div>

        {/* כפתור WAZE מעוצב */}
        <button 
          onClick={() => window.open(selected.waze, '_blank')}
          className="w-full h-14 bg-[#33CCFF] hover:bg-[#2BB5E3] text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
        >
          <Navigation size={20} fill="white" />
          ניווט מהיר ב-Waze
        </button>
      </div>
      
      <div className="bg-white/5 p-3 text-center">
        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic">SABAN LOGISTICS • SMART PICKUP</p>
      </div>
    </div>
  );
}
