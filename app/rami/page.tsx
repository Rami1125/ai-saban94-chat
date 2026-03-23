"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, Search, MoreVertical, Send, Paperclip, Mic, Phone, Video,
  Check, CheckCheck, Bot, Cpu, Database, Globe, Zap, Settings,
  Users, Package, MapPin, ChevronLeft, History, Brain, Sparkles, Languages
} from "lucide-react";
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, limitToLast, query } from 'firebase/database';
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Firebase Config
const firebaseConfig = { databaseURL: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app" };
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
}

// Main Component
export default function SabanOSCommandCenter() {
  const [incoming, setIncoming] = useState<Message[]>([]);
  const [outgoing, setOutgoing] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [language, setLanguage] = useState("אוטומטי");
  const [showCommandCenter, setShowCommandCenter] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // חיבור לצינור Firebase בזמן אמת
  useEffect(() => {
    // מאזין להודעות נכנסות (המלשינון)
    const inRef = query(ref(db, 'rami/incoming'), limitToLast(15));
    const unsubIn = onValue(inRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .map(([id, val]: any) => ({
            id,
            content: typeof val.body === 'object' ? Object.values(val.body).join('') : (val.body || "הודעה התקבלה"),
            time: val.timestamp ? new Date(val.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'עכשיו',
            type: "incoming" as const,
            from: val.from || "לקוח"
          }))
          .filter(i => i.id !== '__listener');
        setIncoming(list);
      }
    });

    // מאזין לתשובות AI
    const outRef = query(ref(db, 'rami/outgoing'), limitToLast(10));
    const unsubOut = onValue(outRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: any) => ({
          id,
          content: val.body,
          time: val.timestamp ? new Date(val.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '',
          type: "outgoing" as const,
          status: "read" as const
        }));
        setOutgoing(list);
      }
    });

    return () => { unsubIn(); unsubOut(); };
  }, []);

  // שילוב כל ההודעות לציר זמן אחד
  const allMessages = [...incoming, ...outgoing].sort((a, b) => a.id.localeCompare(b.id));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  return (
    <div className="h-screen w-full bg-[#ece5dd] flex flex-col font-sans" dir="rtl">
      {/* רקע ירוק של ווצאף במחשב */}
      <div className="hidden md:block h-[110px] bg-[#00a884] shrink-0" />

      <div className="flex-1 flex md:px-[3%] md:-mt-[90px] relative overflow-hidden">
        <div className="w-full flex bg-white md:shadow-2xl md:rounded-lg overflow-hidden border border-gray-200">
          
          {/* Sidebar - רשימת שיחות ופקודות */}
          <aside className={cn(
            "w-full md:w-[400px] flex flex-col border-l border-[#e9edef] bg-white transition-all",
            mobileView === "chat" && "hidden md:flex"
          )}>
            <header className="h-16 px-4 flex items-center justify-between bg-[#f0f2f5] shrink-0">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-[#00a884]">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback className="bg-[#00a884] text-white">RS</AvatarFallback>
                </Avatar>
                <div className="leading-tight">
                  <p className="font-bold text-[#111b21] text-sm">SABAN OS</p>
                  <p className="text-[10px] text-[#00a884] font-bold animate-pulse">צינור פעיל 🚀</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setShowCommandCenter(true)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <Menu className="w-5 h-5 text-[#54656f]" />
                </button>
              </div>
            </header>

            <div className="p-3 bg-white border-b border-gray-100">
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[#f0f2f5]">
                <Search className="w-4 h-4 text-gray-500" />
                <input placeholder="חפש בהיסטוריית ח. סבן" className="bg-transparent border-none outline-none text-sm w-full" />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div onClick={() => setMobileView("chat")} className="p-4 flex items-center gap-4 cursor-pointer bg-[#f0f2f5] border-r-4 border-[#00a884]">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">ח.ס</div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">קבוצת הזמנות ח. סבן</span>
                    <span className="text-[10px] text-gray-400">LIVE</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate italic">ה-AI מאזין לקבוצה זו 24/7</p>
                </div>
              </div>
            </ScrollArea>
          </aside>

          {/* Chat Window - חלון השיחה המרכזי */}
          <main className={cn(
            "flex-1 flex flex-col bg-[#efeae2] relative",
            mobileView === "list" && "hidden md:flex"
          )}>
             {/* דפוס רקע ווצאף */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')` }} />

            <header className="h-16 px-4 flex items-center justify-between bg-[#f0f2f5] border-b border-gray-200 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileView("list")} className="md:hidden"><ChevronLeft className="w-6 h-6 text-gray-600" /></button>
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">ח.ס</div>
                <div>
                  <h3 className="font-bold text-sm text-gray-800">הזמנות לקוחות ח. סבן</h3>
                  <p className="text-[10px] text-emerald-600 font-bold">AI Autopilot פעיל</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-white text-emerald-600 border-emerald-200">24/7 Monitoring</Badge>
              </div>
            </header>

            <ScrollArea className="flex-1 p-4 relative z-10">
              <div className="space-y-4 max-w-3xl mx-auto">
                {allMessages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex", msg.type === "outgoing" ? "justify-start" : "justify-end")}>
                    <div className={cn(
                      "max-w-[85%] p-3 rounded-xl shadow-sm relative",
                      msg.type === "outgoing" ? "bg-[#dcf8c6] rounded-tl-none border-r-4 border-emerald-500" : "bg-white rounded-tr-none border-l-4 border-blue-400"
                    )}>
                      {msg.from && <p className="text-[10px] font-black text-emerald-600 mb-1 uppercase tracking-tighter">{msg.from}</p>}
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

            {/* Input Area */}
            <footer className="p-3 bg-[#f0f2f5] flex items-center gap-2 z-10">
              <div className="flex-1 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100 flex items-center">
                <input 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="כתוב הודעה כמנהל..." 
                  className="bg-transparent border-none outline-none text-sm w-full py-1"
                />
              </div>
              <button className="w-11 h-11 bg-[#00a884] rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform">
                <Send className="w-5 h-5 mr-1" />
              </button>
            </footer>
          </main>
        </div>
      </div>

      {/* Command Center - תפריט ניהול המוח */}
      <Sheet open={showCommandCenter} onOpenChange={setShowCommandCenter}>
        <SheetContent side="right" className="w-[320px] p-0 border-none bg-white">
          <div className="h-full flex flex-col">
            <header className="p-6 bg-[#00a884] text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-xl"><Brain className="w-6 h-6" /></div>
                <h2 className="font-bold text-xl tracking-tighter">SABAN BRAIN</h2>
              </div>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">ניהול אימון וזיהוי הזמנות</p>
            </header>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Bot className="w-5 h-5" /></div>
                      <span className="font-bold text-sm">מענה אוטומטי</span>
                    </div>
                    <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
                  </div>

                  <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl border border-gray-100 transition-colors text-right group">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all"><History className="w-5 h-5" /></div>
                    <div>
                      <p className="font-bold text-sm">ייבוא היסטוריה</p>
                      <p className="text-[10px] text-gray-400">אימון על שיחות עבר</p>
                    </div>
                  </button>

                  <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl border border-gray-100 transition-colors text-right group">
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all"><Languages className="w-5 h-5" /></div>
                    <div>
                      <p className="font-bold text-sm">שפת AI</p>
                      <p className="text-[10px] text-gray-400">נוכחי: {language}</p>
                    </div>
                  </button>
                </div>

                <div className="p-5 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-3xl text-white shadow-xl relative overflow-hidden">
                   <div className="absolute -right-4 -bottom-4 opacity-20"><Zap className="w-24 h-24" /></div>
                   <h3 className="font-black text-lg mb-1 italic tracking-tighter">SABAN OS v3.0</h3>
                   <p className="text-[11px] opacity-80 leading-tight">המערכת מנטרת את קבוצת "ח. סבן" בשידור חי מהצינור של JONI.</p>
                </div>
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
