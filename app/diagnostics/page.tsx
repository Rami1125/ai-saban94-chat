"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { 
  Send, Truck, ShoppingBag, Search, Plus, Minus, 
  MessageCircle, Mic, Paperclip, MoreVertical, 
  CheckCheck, AlertTriangle, Activity, X 
} from "lucide-react";

export default function SabanWhatsAppFinal() {
  const [activeTab, setActiveTab] = useState('chats');
  const [message, setMessage] = useState('');
  const [inventory, setInventory] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<{msg: string, type: string, time: string}[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabase();

  const report = (msg: string, type: 'error' | 'success' | 'info' = 'info') => {
    const time = new Date().toLocaleTimeString('he-IL', { hour12: false });
    setLogs(prev => [{msg, type, time}, ...prev].slice(0, 10));
  };

  useEffect(() => {
    try {
      report("מערכת SabanOS אותחלה", "info");
      fetchInventory();
      fetchOrders();
    } catch (e) {
      console.error("Initialization failed", e);
    }
  }, []);

  const fetchInventory = async () => {
    try {
      const { data } = await supabase.from('inventory').select('*').limit(5);
      setInventory(data || []);
    } catch (e) { report("כשל בטעינת מלאי", "error"); }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await supabase.from('saban_master_dispatch').select('*').limit(5);
      setActiveOrders(data || []);
    } catch (e) { report("כשל בטעינת סידור", "error"); }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true);
    const currentMsg = message;
    setMessage('');
    report(`שולח: ${currentMsg.substring(0,15)}...`, "info");

    try {
      const res = await fetch('/api/pro_brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentMsg, userName: "ראמי" }),
      });
      if (res.ok) report("הודעה בוצעה", "success");
      else report(`שגיאת שרת: ${res.status}`, "error");
    } catch (e) {
      report("נתק בתקשורת", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#efeae2] overflow-hidden relative" dir="rtl">
      
      {/* מלשינון צף חסין קריסה */}
      {showLogs && (
        <div className="fixed top-20 left-4 right-4 z-[999] bg-black text-white p-3 rounded-lg text-[10px] font-mono shadow-2xl border border-white/20">
          <div className="flex justify-between mb-2 border-b border-white/10 pb-1">
            <span className="text-emerald-400">SABAN_LOGS</span>
            <X size={14} className="cursor-pointer" onClick={() => setShowLogs(false)} />
          </div>
          {logs.map((l, i) => (
            <div key={i} className={l.type === 'error' ? 'text-red-400' : 'text-gray-300'}>
              [{l.time}] {l.msg}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <header className="bg-[#008069] text-white p-3 pt-12 flex justify-between items-center shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="relative cursor-pointer" onClick={() => setShowLogs(!showLogs)}>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#008069] font-bold">AI</div>
            {logs.some(l => l.type === 'error') && <div className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full animate-ping" />}
          </div>
          <div>
            <h1 className="font-bold text-[16px]">ח. סבן Ai</h1>
            <span className="text-[11px] opacity-80">{isLoading ? 'מעבד...' : 'מחובר • LIVE'}</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        <div className="bg-white p-3 rounded-lg shadow-sm self-start max-w-[80%] border-l-4 border-[#008069]">
          <p className="text-sm">ראמי אחי, המערכת עלתה. אם יש שגיאה, לחץ על ה-AI למעלה. מה מבצעים? 🦾</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-3 bg-[#f0f2f5] flex items-center gap-2 pb-8 border-t">
        <input 
          className="flex-1 bg-white rounded-full px-4 py-2 outline-none text-sm" 
          placeholder="הודעה..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button 
          onClick={handleSendMessage}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${isLoading ? 'bg-gray-400' : 'bg-[#008069]'}`}
        >
          <Send size={20} />
        </button>
      </footer>
    </div>
  );
}
