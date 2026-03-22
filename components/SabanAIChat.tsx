"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, Send, X, Sparkles, Loader2, Truck, 
  ArrowLeftRight, Calculator, ShoppingCart 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function SabanAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string, type?: string, metadata?: any}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabase();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      // פנייה ל-API המאוחד של המולטי-בריין (v12.3)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage, history: messages }),
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: data.aiResponse, 
        type: data.executionResult?.includes('הזמנה') ? 'order' : 'chat',
        metadata: data.shareLink
      }]);
      
      setIsTyping(false);
      if (typeof window !== 'undefined' && (window as any).playNotificationSound) {
        (window as any).playNotificationSound();
      }

    } catch (error) {
      toast.error("משהו השתבש במוח של סבן...");
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* כפתור הפעלה יוקרתי */}
      <motion.div 
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-16 h-16 rounded-full shadow-[0_0_20px_rgba(11,44,99,0.4)] transition-all duration-500 ${isOpen ? 'bg-red-500 rotate-90' : 'bg-[#0B2C63] hover:bg-[#153a7a]'}`}
        >
          {isOpen ? <X size={28} /> : <Bot size={28} className="animate-pulse" />}
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-[400px] h-[600px] z-50"
          >
            <Card className="w-full h-full bg-white/95 backdrop-blur-md shadow-2xl rounded-[2.5rem] border border-slate-200 flex flex-col overflow-hidden" dir="rtl">
              {/* Header Luxury */}
              <div className="bg-[#0B2C63] p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-2.5 rounded-2xl shadow-lg">
                      <Sparkles size={22} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-black text-xl leading-none tracking-tight">SABAN AI</h3>
                      <span className="text-[10px] text-blue-200 font-bold uppercase tracking-[0.2em]">Multi-Brain Intelligence</span>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-3">LIVE SYNC</Badge>
                </div>
              </div>

              {/* Messages Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                      <Bot size={40} className="text-[#0B2C63] opacity-40" />
                    </div>
                    <p className="text-slate-500 text-sm font-bold leading-relaxed">אהלן ראמי אחי!<br/><span className="text-slate-400 font-medium">המוחות מסונכרנים. מה נבצע היום?</span></p>
                  </div>
                )}
                
                {messages.map((msg, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-bold shadow-sm leading-relaxed ${
                      msg.role === 'user' 
                      ? 'bg-white text-slate-800 rounded-tr-none border border-slate-100' 
                      : 'bg-[#0B2C63] text-white rounded-tl-none'
                    }`}>
                      {msg.type === 'order' && <Truck size={16} className="mb-2 text-blue-300" />}
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      {msg.metadata && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 w-full rounded-xl bg-white/10 border-white/20 text-[11px] hover:bg-white/20"
                          onClick={() => window.open(msg.metadata, '_blank')}
                        >
                          מעקב הזמנה בלייב 🚀
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex justify-end">
                    <div className="bg-blue-50 p-4 rounded-3xl rounded-tl-none border border-blue-100">
                      <Loader2 size={20} className="animate-spin text-[#0B2C63]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-5 bg-white border-t border-slate-100">
                <div className="flex gap-2 items-center bg-slate-100 p-1.5 rounded-[1.5rem] focus-within:ring-2 ring-[#0B2C63]/10 transition-all">
                  <Input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="דבר עם המוח של סבן..."
                    className="flex-1 h-12 border-none bg-transparent font-bold placeholder:text-slate-400 focus-visible:ring-0"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    className="h-11 w-11 bg-[#0B2C63] hover:bg-[#153a7a] rounded-2xl p-0 shadow-lg flex-shrink-0"
                  >
                    <Send size={18} />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
