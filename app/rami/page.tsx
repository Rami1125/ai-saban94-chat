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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const firebaseConfig = { databaseURL: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app" };
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function SabanOSCommandCenter() {
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [showCommandCenter, setShowCommandCenter] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const inRef = query(ref(db, 'rami/incoming'), limitToLast(20));
    const unsubIn = onValue(inRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .map(([id, val]: any) => ({
            id,
            content: typeof val.body === 'object' ? Object.values(val.body).join('') : (val.body || ""),
            time: val.timestamp ? new Date(val.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'עכשיו',
            type: "incoming",
            from: val.from || val.pushName || "לקוח"
          }))
          .filter(i => i.id !== '__listener');
        setIncoming(list);
      }
    });

    const outRef = query(ref(db, 'rami/outgoing'), limitToLast(10));
    const unsubOut = onValue(outRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: any) => ({
          id,
          content: val.body,
          time: val.timestamp ? new Date(val.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '',
          type: "outgoing",
          status: "read"
        }));
        setOutgoing(list);
      }
    });

    return () => { unsubIn(); unsubOut(); };
  }, []);

  const allMessages = [...incoming, ...outgoing].sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div className="h-screen w-full bg-[#ece5dd] flex flex-col font-sans overflow-hidden" dir="rtl">
      <div className="hidden md:block h-[110px] bg-[#00a884] shrink-0" />

      <div className="flex-1 flex md:px-[3%] md:-mt-[90px] relative overflow-hidden">
        <div className="w-full flex bg-white md:shadow-2xl md:rounded-lg overflow-hidden border border-gray-200">
          
          {/* Sidebar */}
          <aside className={cn("w-full md:w-[400px] flex flex-col border-l border-[#e9edef] bg-white", mobileView === "chat" && "hidden md:flex")}>
            <header className="h-16 px-4 flex items-center justify-between bg-[#f0f2f5] shrink-0">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-[#00a884]">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>RS</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-sm">SABAN OS</p>
                  <p className="text-[10px] text-[#00a884] font-bold">LIVE 🚀</p>
                </div>
              </div>
              <button onClick={() => setShowCommandCenter(true)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <Menu className="w-5 h-5 text-[#54656f]" />
              </button>
            </header>

            <ScrollArea className="flex-1">
              <div onClick={() => setMobileView("chat")} className="p-4 flex items-center gap-4 cursor-pointer bg-[#f0f2f5] border-r-4 border-[#00a884]">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">ח.ס</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center"><span className="font-bold text-sm">הזמנות ח. סבן</span></div>
                  <p className="text-xs text-gray-500 truncate italic">AI Autopilot מאומן מהיסטוריה ✅</p>
                </div>
              </div>
            </ScrollArea>
          </aside>

          {/* Chat Window */}
          <main className={cn("flex-1 flex flex-col bg-[#efeae2] relative", mobileView === "list" && "hidden md:flex")}>
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')` }} />
            
            <header className="h-16 px-4 flex items-center justify-between bg-[#f0f2f5] border-b border-gray-200 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileView("list")} className="md:hidden"><ChevronLeft className="w-6 h-6" /></button>
                <h3 className="font-bold text-sm">חלונית שיחה - ח. סבן</h3>
              </div>
            </header>

            <ScrollArea className="flex-1 p-4 relative z-10">
              <div className="space-y-4 max-w-2xl mx-auto">
                {allMessages.map((msg: any) => (
                  <div key={msg.id} className={cn("flex", msg.type === "outgoing" ? "justify-start" : "justify-end")}>
                    <div className={cn("max-w-[85%] p-3 rounded-xl shadow-sm", msg.type === "outgoing" ? "bg-[#dcf8c6] rounded-tl-none" : "bg-white rounded-tr-none")}>
                      <p className="text-[10px] font-bold text-emerald-600 mb-1">{msg.from}</p>
                      <p className="text-sm font-medium">{msg.content}</p>
                      <span className="text-[9px] text-gray-400 block text-left mt-1">{msg.time}</span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </main>
        </div>
      </div>

      {/* Command Center - Sheet עם כותרות תקינות לנגישות */}
      <Sheet open={showCommandCenter} onOpenChange={setShowCommandCenter}>
        <SheetContent side="right" className="w-[320px] p-0 border-none bg-white">
          <SheetHeader className="p-6 bg-[#00a884] text-white space-y-1">
            <SheetTitle className="text-white text-xl font-bold flex items-center gap-2">
              <Brain className="w-6 h-6" /> SABAN BRAIN
            </SheetTitle>
            <SheetDescription className="text-white/80 text-[10px] font-bold uppercase">
              ניהול אימון המוח והגדרות AI
            </SheetDescription>
          </SheetHeader>
          
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <Bot className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-sm">מענה אוטומטי</span>
              </div>
              <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
            </div>
            {/* כפתורי אימון נוספים כאן */}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
