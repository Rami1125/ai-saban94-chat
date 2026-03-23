"use client";
import React, { useState, useEffect } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Send, Database, MessageCircle, Terminal, ShoppingCart, Truck, Search, ChevronLeft } from "lucide-react";
import ProductCard from "@/components/ProductCard";

export default function SabanInfinityUI() {
  const [activeTab, setActiveTab] = useState('chats');
  const [selectedTable, setSelectedTable] = useState('dispatch_orders');
  const [tableData, setTableData] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const supabase = getSupabase();

  useEffect(() => {
    setIsMounted(true);
    loadTableData(selectedTable);
  }, [selectedTable]);

  const loadTableData = async (table: string) => {
    const { data } = await supabase.from(table).select('*').limit(20);
    setTableData(data || []);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;
    const userMsg = { role: 'user', content: message, time: new Date().toLocaleTimeString() };
    setChatMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/pro_brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg.content, userName: "ראמי", sessionId: "saban_1" }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.answer, time: new Date().toLocaleTimeString() }]);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  if (!isMounted) return null;

  return (
    <div className="flex h-screen bg-[#0b141a] text-white font-sans overflow-hidden" dir="rtl">
      
      {/* --- סייר נתונים (צד ימין - 50%) --- */}
      <div className="w-1/2 border-l border-white/10 bg-[#111b21] flex flex-col">
        <header className="p-4 bg-[#202c33] flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-2 text-emerald-500">
            <Database size={20} />
            <h2 className="font-bold tracking-tight text-sm">SABAN DATA EXPLORER</h2>
          </div>
          <select 
            value={selectedTable} 
            onChange={(e) => setSelectedTable(e.target.value)}
            className="bg-[#2a3942] text-xs p-2 rounded-lg border-none outline-none text-emerald-400"
          >
            {['dispatch_orders', 'inventory', 'drivers', 'ai_rules', 'ai_knowledge_base', 'customer_memory', 'color_fans'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </header>

        <div className="flex-1 overflow-auto p-2 scrollbar-hide">
          <table className="w-full text-[10px] border-collapse text-right">
            <thead className="bg-[#202c33] sticky top-0">
              <tr>
                {tableData[0] && Object.keys(tableData[0]).map(k => <th key={k} className="p-2 border border-white/5">{k}</th>)}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, i) => (
                <tr key={i} className="hover:bg-white/5 border-b border-white/5">
                  {Object.values(row).map((v: any, j) => <td key={j} className="p-2 truncate max-w-[120px]">{JSON.stringify(v)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- צ'אט וואטסאפ (צד שמאל - 50%) --- */}
      <div className="w-1/2 flex flex-col bg-[#0b141a] relative">
        <header className="bg-[#202c33] p-3 flex items-center justify-between shadow-lg z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold">AI</div>
            <div>
              <h1 className="font-bold text-sm">המוח של סבן</h1>
              <span className="text-[10px] text-emerald-500 animate-pulse">מחובר לכל הטבלאות</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-90">
          {chatMessages.map((m, i) => (
            <div key={i} className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-md ${
              m.role === 'user' ? 'self-end bg-[#005c4b] text-white rounded-tr-none' : 'self-start bg-[#202c33] text-white rounded-tl-none border-l-4 border-emerald-500'
            }`}>
              <p className="whitespace-pre-wrap">{m.content}</p>
              <span className="text-[9px] opacity-50 block text-left mt-1">{m.time}</span>
            </div>
          ))}
          {isLoading && <div className="text-[10px] italic text-emerald-500 animate-bounce">המוח חוקר בטבלאות...</div>}
        </main>

        <footer className="p-3 bg-[#202c33] flex items-center gap-2 border-t border-white/5 pb-10">
          <input 
            type="text" 
            placeholder="כתוב פקודה (למשל: 'מי הנהג הפנוי להובלה בסטרומה?')" 
            className="flex-1 bg-[#2a3942] rounded-full px-5 py-2.5 text-sm outline-none placeholder:text-gray-500"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button onClick={handleSendMessage} className="w-11 h-11 bg-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-500">
            <Send size={20} />
          </button>
        </footer>
      </div>
    </div>
  );
}
