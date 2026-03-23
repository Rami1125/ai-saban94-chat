"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, Search, MoreVertical, Send, Paperclip, Mic, Phone, Video,
  Check, CheckCheck, Bot, Cpu, Database, Globe, Zap, Settings,
  Users, Package, MapPin, ChevronLeft, Languages, History, Brain,
  Sparkles, Image as ImageIcon, HardDrive, Calendar, Volume2,
  VolumeX, Play, Pause, RefreshCw, Bell, BellOff, Truck, FileText,
  Upload, Download,
} from "lucide-react";

// Firebase Integration
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, limitToLast, query, push, set } from 'firebase/database';

import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Firebase Config
const firebaseConfig = { 
  databaseURL: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app" 
};
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

// Types
interface Message {
  id: string;
  content: string;
  time: string;
  type: "incoming" | "outgoing";
  status?: "sent" | "delivered" | "read";
  from?: string;
  pushName?: string;
}

export default function SabanOSCommandCenter() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [mobileView, setMobileView] = useState<"list" | "chat">("chat");
  const [language, setLanguage] = useState("אוטומטי");
  const [showCommandCenter, setShowCommandCenter] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Notification Sound
  const playNotification = useCallback(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    audio.play().catch(() => {});
  }, []);

  // Real-time Firebase Sync
  useEffect(() => {
    // Incoming Messages
    const inRef = query(ref(db, 'rami/incoming'), limitToLast(20));
    const unsubIn = onValue(inRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const inList = Object.entries(data)
          .map(([id, val]: any) => ({
            id,
            content: typeof val.body === 'object' ? Object.values(val.body).join('') : (val.body || ""),
            time: val.timestamp ? new Date(val.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'עכשיו',
            type: "incoming" as const,
            from: val.from || "לקוח",
            pushName: val.pushName
          }))
          .filter(i => i.id !== '__listener');
        
        setMessages(prev => {
          const prevIn = prev.filter(m => m.type === "incoming").length;
          if (inList.length > prevIn && prevIn > 0) playNotification();
          const outMsgs = prev.filter(m => m.type === "outgoing");
          return [...inList, ...outMsgs].sort((a,b) => a.id.localeCompare(b.id));
        });
      }
    });

    // Outgoing Messages
    const outRef = query(ref(db, 'rami/outgoing'), limitToLast(15));
    const unsubOut = onValue(outRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const outList = Object.entries(data).map(([id, val]: any) => ({
          id: `out_${id}`,
          content: val.body,
          time: val.timestamp ? new Date(val.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '',
          type: "outgoing" as const,
          status: "read" as const
        }));
        setMessages(prev => {
          const inMsgs = prev.filter(m => m.type === "incoming");
          return [...inMsgs, ...outList].sort((a,b) => a.id.localeCompare(b.id));
        });
      }
    });

    return () => { unsubIn(); unsubOut(); };
  }, [playNotification]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const outgoingRef = ref(db, 'rami/outgoing');
    await push(outgoingRef, {
      body: inputValue,
      to: "972508861080",
      timestamp: Date.now(),
      manual: true
    });
    setInputValue("");
  };

  return (
    <div className="h-screen w-full bg-[#ece5dd] flex flex-col font-sans overflow-hidden" dir="rtl">
      {/* Desktop Banner */}
      <div className="hidden md:block h-[120px] bg-[#00a884] shrink-0" />

      {/* Main UI Container */}
      <div className="flex-1 flex md:px-[3%] md:-mt-[100px] relative overflow-hidden">
        <div className="w-full flex bg-white md:shadow-2xl md:rounded-lg overflow-hidden border border-gray-200">
          
          {/* Sidebar */}
          <aside className={cn("w-full md:w-[420px] flex flex-col border-l border-[#e9edef] bg-white", mobileView === "chat" && "hidden md:flex")}>
            <header className="h-16 px-4 flex items-center justify-between bg-[#f0f2f5] shrink-0">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-[#00a884]">
                  <AvatarFallback className="bg-[#00a884] text-white font-bold">RS</AvatarFallback>
                </Avatar>
                <div className="leading-tight text-right">
                  <p className="font-bold text-sm">SABAN OS</p>
                  <p className="text-[10px] text-[#00a884] font-bold animate-pulse">צינור פעיל 🚀</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setShowCommandCenter(true)} className="p-2 hover:bg-[#d1d7db] rounded-full transition-colors">
                  <Menu className="w-5 h-5 text-[#54656f]" />
                </button>
              </div>
            </header>

            <div className="p-3 bg-white border-b border-[#e9edef]">
              <div className="flex items-center gap-3 px-4 py-1.5 rounded-lg bg-[#f0f2f5]">
                <Search className="w-4 h-4 text-[#54656f]" />
                <input placeholder="חפש הזמנה או לקוח" className="bg-transparent border-none outline-none text-sm w-full py-1" />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div onClick={() => setMobileView("chat")} className="p-4 flex items-center gap-4 cursor-pointer bg-[#f0f2f5] border-r-4 border-[#00a884] hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">ח.ס</div>
                <div className="flex-1 overflow-hidden text-right">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">הזמנות ח. סבן</span>
                    <span className="text-[10px] text-gray-400">LIVE</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate italic">ה-AI מאזין לקבוצה זו 24/7</p>
                </div>
              </div>
            </ScrollArea>
          </aside>

          {/* Chat Window */}
          <main className={cn("flex-1 flex flex-col bg-[#efeae2] relative", mobileView === "list" && "hidden md:flex")}>
            <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')` }} />
            
            <header className="h-16 px-4 flex items-center justify-between bg-[#f0f2f5] border-b border-gray-200 z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileView("list")} className="md:hidden p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md">ח.ס</div>
                <div className="text-right">
                  <h3 className="font-bold text-sm text-[#111b21]">קבוצת ח. סבן - הזמנות</h3>
                  <p className="text-[10px] text-emerald-600 font-bold tracking-tight">AI Autopilot ON</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-[#54656f] cursor-pointer" />
                <Phone className="w-5 h-5 text-[#54656f] cursor-pointer" />
                <MoreVertical className="w-5 h-5 text-[#54656f] cursor-pointer" />
              </div>
            </header>

            <ScrollArea className="flex-1 p-4 relative z-10">
              <div className="space-y-4 max-w-2xl mx-auto">
                {messages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cn("flex", msg.type === "outgoing" ? "justify-start" : "justify-end")}>
                    <div className={cn(
                      "max-w-[85%] p-3 rounded-xl shadow-sm relative",
                      msg.type === "outgoing" ? "bg-[#dcf8c6] rounded-tl-none border-r-4 border-emerald-500 text-right" : "bg-white rounded-tr-none border-l-4 border-blue-400 text-right"
                    )}>
                      {msg.from && <p className="text-[10px] font-black text-emerald-600 mb-1 uppercase tracking-tighter">{msg.pushName || msg.from}</p>}
                      <p className="text-sm md:text-base font-medium leading-relaxed">{msg.content}</p>
                      <div className="flex justify-end items-center gap-1 mt-1">
                        <span className="text-[9px] text-gray-400 font-bold">{msg.time}</span>
                        {msg.type === "outgoing" && <CheckCheck className="w-3 h-3 text-blue-400" />}
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <footer className="p-3 bg-[#f0f2f5] flex items-center gap-2 z-10">
              <div className="flex gap-2">
                <Paperclip className="w-6 h-6 text-[#54656f] cursor-pointer" />
              </div>
              <div className="flex-1 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100 flex items-center">
                <input 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="הודעה ללקוח..." 
                  className="bg-transparent border-none outline-none text-sm w-full py-1 text-right"
                />
              </div>
              <button onClick={handleSend} className="w-11 h-11 bg-[#00a884] rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-all">
                {inputValue.trim() ? <Send className="w-5 h-5 mr-1" /> : <Mic className="w-6 h-6" />}
              </button>
            </footer>
          </main>
        </div>
      </div>

      {/* Command Center Sheet */}
      <Sheet open={showCommandCenter} onOpenChange={setShowCommandCenter}>
        <SheetContent side="right" className="w-[340px] p-0 border-none bg-white">
          <SheetHeader className="p-6 bg-[#00a884] text-white space-y-2">
            <SheetTitle className="text-white text-xl font-bold flex items-center gap-2 italic">
              <Brain className="w-6 h-6" /> SABAN BRAIN OS
            </SheetTitle>
          </SheetHeader>
          <div className="p-6 space-y-8">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 text-right">
                <Bot className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-sm">טייס אוטומטי AI</span>
              </div>
              <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} className="data-[state=checked]:bg-[#00a884]" />
            </div>

            <div className="space-y-4 text-right">
              <h4 className="text-xs font-black text-gray-400 uppercase mr-1">ניהול אימון</h4>
              <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl border border-gray-100 transition-all group">
                <History className="w-5 h-5 text-blue-500" />
                <div className="flex-1 text-right">
                  <p className="font-bold text-sm">סנכרון היסטוריה</p>
                  <p className="text-[10px] text-gray-400">אימון מבוסס קובץ ח. סבן</p>
                </div>
              </button>
              
              <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl border border-gray-100 transition-all group">
                <Languages className="w-5 h-5 text-purple-500" />
                <div className="flex-1 text-right">
                  <p className="font-bold text-sm">שפת מענה</p>
                  <p className="text-[10px] text-gray-400">נוכחי: {language}</p>
                </div>
              </button>
            </div>

            <div className="p-5 bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-[2rem] text-white shadow-xl relative overflow-hidden mt-10 text-right">
               <Zap className="absolute -left-4 -bottom-4 w-24 h-24 opacity-20 rotate-12" />
               <h3 className="font-black text-lg mb-1 tracking-tighter">SYSTEM ONLINE</h3>
               <p className="text-[11px] opacity-90 leading-tight italic">ניטור קבוצת ח. סבן בשידור חי מהצינור של JONI.</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
