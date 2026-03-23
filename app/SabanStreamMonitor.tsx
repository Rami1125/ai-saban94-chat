"use client";
import React, { useState, useEffect } from 'react';
import { adminDb } from "@/lib/firebaseAdmin"; // חיבור ה-SDK של פיירבייס
import { Activity, Send, MessageSquare, CheckCircle, AlertCircle } from "lucide-react";

export default function SabanStreamMonitor() {
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
    // 1. האזנה להודעות נכנסות מ-JONI
    const inRef = adminDb.ref('incoming');
    inRef.limitToLast(10).on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) setIncoming(Object.values(data).reverse());
      setStatus("online");
    });

    // 2. האזנה לתשובות המוח ב-Outgoing
    const outRef = adminDb.ref('outgoing');
    outRef.limitToLast(10).on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) setOutgoing(Object.values(data).reverse());
    });

    return () => { inRef.off(); outRef.off(); };
  }, []);

  return (
    <div className="p-6 bg-[#0b141a] min-h-screen text-white font-sans" dir="rtl">
      <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Activity className={status === "online" ? "text-emerald-500 animate-pulse" : "text-red-500"} />
          <h1 className="text-xl font-bold">Saban OS - צינור זרימה JONI</h1>
        </div>
        <div className="px-4 py-1 bg-[#202c33] rounded-full text-xs border border-emerald-500/30 text-emerald-400">
          סטטוס שרת: {status.toUpperCase()}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* --- טור נכנס (מהווצאפ) --- */}
        <div className="bg-[#111b21] rounded-xl border border-white/5 overflow-hidden">
          <div className="p-4 bg-[#202c33] flex items-center gap-2 border-b border-white/5">
            <MessageSquare size={18} className="text-blue-400" />
            <h2 className="font-semibold text-sm">הודעות נכנסות (Incoming)</h2>
          </div>
          <div className="h-[400px] overflow-y-auto p-4 space-y-3">
            {incoming.map((msg, i) => (
              <div key={i} className="p-3 bg-[#202c33] rounded-lg border-r-4 border-blue-500 text-xs">
                <div className="flex justify-between opacity-50 mb-1">
                  <span>מאת: {msg.from || msg.pushName}</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="font-medium">{msg.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* --- טור יוצא (מענה AI) --- */}
        <div className="bg-[#111b21] rounded-xl border border-white/5 overflow-hidden">
          <div className="p-4 bg-[#202c33] flex items-center gap-2 border-b border-white/5">
            <CheckCircle size={18} className="text-emerald-500" />
            <h2 className="font-semibold text-sm">מענה אוטומטי (Outgoing)</h2>
          </div>
          <div className="h-[400px] overflow-y-auto p-4 space-y-3">
            {outgoing.map((msg, i) => (
              <div key={i} className="p-3 bg-[#005c4b] rounded-lg border-r-4 border-emerald-300 text-xs text-white">
                <div className="flex justify-between opacity-70 mb-1">
                  <span>אל: {msg.to}</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="font-medium">{msg.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-200">
        TL;DR: הממשק מאזין ל-Realtime Database. ברגע ש-JONI מזריק הודעה ל-Incoming, המוח מעבד ומזריק ל-Outgoing.
      </div>
    </div>
  );
}
