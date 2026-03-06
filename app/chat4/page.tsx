"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Smile, MoreVertical, Phone, Video, Search, Check, CheckCheck } from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: "1",
    content: "שלום! אני העוזר הדיגיטלי של <b>ח. סבן 1994</b>.<br><br>איך אוכל לעזור לך היום?<br>• מידע על מוצרים<br>• מחירים ומלאי<br>• ייעוץ מקצועי",
    role: "assistant",
    timestamp: new Date(Date.now() - 60000),
  },
];

export default function WhatsAppChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getAIResponse(inputValue),
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    if (input.includes("מחיר") || input.includes("עלות")) {
      return "בשמחה! על איזה מוצר תרצה לקבל מחיר?<br><br>אנחנו מציעים מגוון רחב של:<br>• <b>גבס וחיפויים</b><br>• <b>מלט ובטון</b><br>• <b>חומרי איטום</b><br>• <b>ברזל ופלדה</b>";
    }
    if (input.includes("גבס")) {
      return "<b>לוחות גבס - קנאוף</b><br><br>מק״ט: GYP-12.5<br>מידות: 2.60 x 1.20 מ׳<br>עובי: 12.5 מ״מ<br><br><b>מחיר: ₪45 ליחידה</b><br>במלאי: 500+ יחידות";
    }
    if (input.includes("שעות") || input.includes("פתוח")) {
      return "<b>שעות פעילות:</b><br><br>ימים א׳-ה׳: 07:00-18:00<br>יום ו׳: 07:00-13:00<br>שבת: סגור<br><br>📍 כתובת: אזור התעשייה, באר שבע";
    }
    return "תודה על פנייתך!<br><br>אני כאן לעזור בכל שאלה על <b>חומרי בניין</b>.<br>מה תרצה לדעת?";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-[#efeae2] dark:bg-[#0b141a]" dir="rtl">
      {/* WhatsApp Background Pattern */}
      <div 
        className="fixed inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-[#075e54] dark:bg-[#1f2c34] px-3 py-2 shadow-md">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Company Avatar */}
            <div className="relative">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm md:text-base shadow-lg">
                ס
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 bg-[#25d366] rounded-full border-2 border-[#075e54] dark:border-[#1f2c34]" />
            </div>

            <div className="flex flex-col">
              <h1 className="text-white font-semibold text-[15px] md:text-base leading-tight">
                ח. סבן 1994
              </h1>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-200 text-[11px] md:text-xs">פעיל עכשיו</span>
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-4 text-white/90">
            <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors hidden md:block">
              <Video size={20} />
            </button>
            <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors hidden md:block">
              <Phone size={20} />
            </button>
            <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
              <Search size={20} />
            </button>
            <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto px-3 py-4 md:px-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-2">
          {/* Date Divider */}
          <div className="flex justify-center mb-2">
            <span className="bg-white/90 dark:bg-[#1d2a32] text-[#54656f] dark:text-[#8696a0] text-[11px] px-3 py-1 rounded-lg shadow-sm">
              היום
            </span>
          </div>

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`relative max-w-[85%] md:max-w-[70%] px-3 py-2 rounded-lg shadow-sm ${
                  message.role === "assistant"
                    ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef]"
                    : "bg-white dark:bg-[#1d2a32] text-[#111b21] dark:text-[#e9edef]"
                }`}
                style={{
                  borderTopRightRadius: message.role === "assistant" ? "4px" : "12px",
                  borderTopLeftRadius: message.role === "user" ? "4px" : "12px",
                }}
              >
                {/* Message Tail */}
                <div
                  className={`absolute top-0 w-3 h-3 ${
                    message.role === "assistant"
                      ? "-right-1.5 bg-[#d9fdd3] dark:bg-[#005c4b]"
                      : "-left-1.5 bg-white dark:bg-[#1d2a32]"
                  }`}
                  style={{
                    clipPath: message.role === "assistant" 
                      ? "polygon(100% 0, 0 0, 100% 100%)"
                      : "polygon(0 0, 100% 0, 0 100%)",
                  }}
                />

                {/* Message Content with HTML Support */}
                <div
                  className="text-[14.5px] leading-relaxed [&_b]:font-semibold [&_br]:block"
                  dangerouslySetInnerHTML={{ __html: message.content }}
                />

                {/* Timestamp and Status */}
                <div className={`flex items-center gap-1 mt-1 ${
                  message.role === "assistant" ? "justify-start" : "justify-end"
                }`}>
                  <span className="text-[11px] text-[#667781] dark:text-[#8696a0]">
                    {formatTime(message.timestamp)}
                  </span>
                  {message.role === "user" && (
                    <CheckCheck size={16} className="text-[#53bdeb]" />
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-end">
              <div className="bg-[#d9fdd3] dark:bg-[#005c4b] px-4 py-3 rounded-lg shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-[#667781] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-[#667781] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-[#667781] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="sticky bottom-0 bg-[#f0f2f5] dark:bg-[#1f2c34] px-3 py-2 md:px-6 md:py-3 border-t border-[#d1d7db]/50 dark:border-[#2a3942]">
        <div className="max-w-3xl mx-auto flex items-center gap-2 md:gap-3">
          {/* Emoji Button */}
          <button className="p-2 text-[#54656f] dark:text-[#8696a0] hover:text-[#075e54] dark:hover:text-emerald-400 transition-colors">
            <Smile size={24} />
          </button>

          {/* Input Field */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="הקלד הודעה..."
              className="w-full bg-white dark:bg-[#2a3942] text-[#111b21] dark:text-[#e9edef] placeholder-[#667781] dark:placeholder-[#8696a0] rounded-full px-4 py-2.5 md:py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#25d366]/50 transition-all"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={`p-2.5 md:p-3 rounded-full transition-all ${
              inputValue.trim()
                ? "bg-[#25d366] text-white hover:bg-[#20ba5a] shadow-lg hover:shadow-emerald-500/25 active:scale-95"
                : "bg-[#e9edef] dark:bg-[#3b4a54] text-[#8696a0]"
            }`}
          >
            <Send size={20} className="rotate-180" />
          </button>
        </div>

        {/* Powered by JONI Badge */}
        <div className="flex justify-center mt-2 pb-1">
          <span className="text-[10px] md:text-[11px] text-[#667781] dark:text-[#8696a0] tracking-wide">
            Powered by <span className="font-semibold text-[#075e54] dark:text-emerald-400">JONI</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
