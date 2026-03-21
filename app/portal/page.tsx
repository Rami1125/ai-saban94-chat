"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  X,
  Bell,
  User,
  PackagePlus,
  Truck,
  History,
  MessageSquare,
  MapPin,
  Send,
  Mic,
  ChevronLeft,
  Package,
  CheckCircle2,
  Clock,
  Navigation,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

// --- Types ---
type Message = {
  id: string;
  role: "ai" | "user";
  text: string;
  timestamp: Date;
};

type OrderStatus = "preparation" | "on_the_way" | "delivered";

type QuickAction = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  command?: string;
};

// --- Main Component ---
export default function SabanPortal() {
  const [activeView, setActiveView] = useState<"home" | "chat" | "track" | "history">("home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      text: "שלום בר! אני כאן לעזור לך עם כל מה שקשור להזמנות ומכולות. מה תרצה לעשות היום?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [chatContext, setChatContext] = useState<"default" | "success" | "active" | "urgent">("default");
  const [currentOrderStatus] = useState<OrderStatus>("on_the_way");
  const [hasNotifications] = useState(true);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isThinking]);

  // Quick Actions Data
  const quickActions: QuickAction[] = [
    {
      id: "new_order",
      title: "הזמנה חדשה",
      description: "הזמנת מכולה או חומרי בניין",
      icon: PackagePlus,
      color: "from-[#0B2C63] to-[#1a4a8f]",
      command: "אני רוצה להזמין מכולה חדשה",
    },
    {
      id: "track",
      title: "מעקב משאית",
      description: "צפייה במיקום בזמן אמת",
      icon: Truck,
      color: "from-orange-500 to-orange-600",
    },
    {
      id: "history",
      title: "היסטוריית הזמנות",
      description: "צפייה בכל ההזמנות",
      icon: History,
      color: "from-slate-600 to-slate-700",
    },
    {
      id: "talk",
      title: "דבר עם רמי",
      description: "שיחה ישירה עם הצוות",
      icon: MessageSquare,
      color: "from-emerald-500 to-emerald-600",
    },
  ];

  // Chat context colors based on state
  const getContextColors = () => {
    switch (chatContext) {
      case "success":
        return { bg: "bg-emerald-50/50", accent: "border-emerald-200" };
      case "active":
        return { bg: "bg-orange-50/50", accent: "border-orange-200" };
      case "urgent":
        return { bg: "bg-red-50/50", accent: "border-red-200" };
      default:
        return { bg: "bg-slate-50/30", accent: "border-slate-100" };
    }
  };

  // Send message handler
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isThinking) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsThinking(true);

    // Simulate AI thinking
    await new Promise((r) => setTimeout(r, 1500));

    // Context-aware responses
    let aiResponse = "";
    let newContext: typeof chatContext = "default";

    if (inputValue.includes("הזמנה") || inputValue.includes("מכולה")) {
      aiResponse = "מצוין! אני רואה שאתה רוצה להזמין מכולה. לאיזה פרויקט - ויצמן 4 רעננה?";
      newContext = "active";
    } else if (inputValue.includes("מעקב") || inputValue.includes("משאית")) {
      aiResponse = "המשאית שלך נמצאת כרגע ב-5 דקות ממך! הנהג יעקב כבר בדרך.";
      newContext = "success";
    } else {
      aiResponse = "אני כאן לעזור! תוכל לבקש הזמנה חדשה, מעקב משאית, או כל דבר אחר שתצטרך.";
    }

    setChatContext(newContext);

    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: aiResponse,
        timestamp: new Date(),
      },
    ]);

    setIsThinking(false);
  };

  // Handle quick action click
  const handleQuickAction = (action: QuickAction) => {
    if (action.command) {
      setActiveView("chat");
      setInputValue(action.command);
      setTimeout(() => handleSendMessage(), 100);
    } else if (action.id === "track") {
      setActiveView("track");
    } else if (action.id === "history") {
      setActiveView("history");
    } else if (action.id === "talk") {
      setActiveView("chat");
      setChatContext("default");
    }
  };

  // Order status steps
  const orderSteps = [
    { id: "preparation", label: "בהכנה", icon: Package },
    { id: "on_the_way", label: "בדרך אליך", icon: Truck },
    { id: "delivered", label: "סופק", icon: CheckCircle2 },
  ];

  const contextColors = getContextColors();

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans" dir="rtl">
      {/* Glassmorphism Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#0B2C63]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 px-5 py-4 backdrop-blur-xl bg-white/70 border-b border-white/50">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0B2C63] to-[#1a4a8f] rounded-2xl flex items-center justify-center shadow-lg shadow-[#0B2C63]/20">
              <span className="text-white font-black text-sm italic">S</span>
            </div>
            <div>
              <h1 className="text-lg font-black text-[#0B2C63] tracking-tight">SABAN OS</h1>
              <Badge variant="secondary" className="text-[8px] font-bold bg-[#0B2C63]/5 text-[#0B2C63] border-0">
                CLIENT PORTAL
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-3 rounded-2xl bg-white/80 backdrop-blur border border-slate-100 shadow-sm transition-all active:scale-95">
              <Bell className="w-5 h-5 text-slate-600" />
              {hasNotifications && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white" />
              )}
            </button>

            {/* Profile */}
            <button className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0B2C63] to-[#1a4a8f] flex items-center justify-center shadow-lg shadow-[#0B2C63]/20 transition-all active:scale-95">
              <User className="w-5 h-5 text-white" />
            </button>

            {/* Menu Trigger */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <button className="p-3 rounded-2xl bg-white/80 backdrop-blur border border-slate-100 shadow-sm transition-all active:scale-95">
                  <Menu className="w-5 h-5 text-slate-600" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-white/95 backdrop-blur-xl border-l border-slate-100">
                <SheetHeader>
                  <SheetTitle className="text-right font-black text-[#0B2C63]">תפריט</SheetTitle>
                </SheetHeader>
                <nav className="mt-8 space-y-2">
                  {[
                    { id: "home", label: "מרכז בקרה", icon: Package },
                    { id: "chat", label: "צאט AI", icon: MessageSquare },
                    { id: "track", label: "מעקב משלוחים", icon: Truck },
                    { id: "history", label: "היסטוריה", icon: History },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id as typeof activeView);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-right ${
                        activeView === item.id
                          ? "bg-[#0B2C63] text-white shadow-lg shadow-[#0B2C63]/20"
                          : "hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-bold">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-5 pb-32">
        {/* Home View */}
        {activeView === "home" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Welcome Section */}
            <section className="pt-6">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-800">שלום, בר!</h2>
                <span className="text-2xl">👋</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-slate-500">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">ארניאל-מחלה, ויצמן 4, רעננה</span>
              </div>
            </section>

            {/* Quick Actions Grid */}
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">פעולות מהירות</h3>
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    className="group relative aspect-square p-5 rounded-3xl bg-white/80 backdrop-blur border border-white/50 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center gap-3 transition-all active:scale-95 hover:shadow-2xl overflow-hidden"
                  >
                    {/* Gradient Overlay on Hover/Active */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300`} />

                    {/* Icon Container */}
                    <div className={`relative z-10 p-4 rounded-2xl bg-gradient-to-br ${action.color} shadow-lg group-hover:bg-white/20 transition-all`}>
                      <action.icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Text */}
                    <div className="relative z-10 text-center">
                      <p className="font-black text-slate-800 group-hover:text-white transition-colors">{action.title}</p>
                      <p className="text-[10px] text-slate-400 group-hover:text-white/70 transition-colors mt-1">{action.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Live Status Card */}
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">סטטוס הזמנה פעילה</h3>
              <div className="relative p-6 rounded-3xl bg-white/80 backdrop-blur border border-white/50 shadow-xl shadow-slate-200/50 overflow-hidden">
                {/* Glassmorphism inner glow */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0B2C63] via-orange-500 to-emerald-500" />

                {/* Order Info */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">הזמנה #12847</p>
                    <p className="text-lg font-black text-slate-800">מכולת פסולת 8 קוב</p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-700 border-0 font-bold">בדרך אליך</Badge>
                </div>

                {/* Timeline Stepper */}
                <div className="flex items-center justify-between">
                  {orderSteps.map((step, index) => {
                    const stepIndex = orderSteps.findIndex((s) => s.id === currentOrderStatus);
                    const isActive = index <= stepIndex;
                    const isCurrent = step.id === currentOrderStatus;

                    return (
                      <React.Fragment key={step.id}>
                        <div className="flex flex-col items-center gap-2">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                              isActive
                                ? isCurrent
                                  ? "bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30 animate-pulse"
                                  : "bg-gradient-to-br from-emerald-500 to-emerald-600"
                                : "bg-slate-100"
                            }`}
                          >
                            <step.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                          </div>
                          <span className={`text-[10px] font-bold ${isActive ? "text-slate-800" : "text-slate-400"}`}>
                            {step.label}
                          </span>
                        </div>
                        {index < orderSteps.length - 1 && (
                          <div className={`flex-1 h-1 mx-2 rounded-full ${index < stepIndex ? "bg-emerald-500" : "bg-slate-100"}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* ETA */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-bold text-slate-600">זמן הגעה משוער: 5 דקות</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Chat View */}
        {activeView === "chat" && (
          <div className="h-[calc(100vh-180px)] flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Chat Header */}
            <div className="py-4 flex items-center gap-4">
              <button
                onClick={() => setActiveView("home")}
                className="p-2 rounded-xl bg-white/80 backdrop-blur border border-slate-100 shadow-sm transition-all active:scale-95"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex-1">
                <h2 className="text-lg font-black text-slate-800">צאט AI</h2>
                <p className="text-xs text-slate-400">המוח של ח. סבן לשירותך</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-600">מחובר</span>
              </div>
            </div>

            {/* Chat Messages */}
            <div
              ref={chatScrollRef}
              className={`flex-1 overflow-y-auto rounded-3xl ${contextColors.bg} border ${contextColors.accent} p-4 space-y-4 transition-colors duration-500`}
            >
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[85%] p-4 rounded-3xl shadow-sm ${
                      message.role === "user"
                        ? "bg-white border border-slate-100 rounded-tr-none"
                        : "bg-gradient-to-br from-[#0B2C63] to-[#1a4a8f] text-white rounded-tl-none shadow-lg shadow-[#0B2C63]/20"
                    }`}
                  >
                    <p className="text-sm font-medium leading-relaxed">{message.text}</p>
                    <p className={`text-[10px] mt-2 ${message.role === "user" ? "text-slate-400" : "text-white/60"}`}>
                      {message.timestamp.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isThinking && (
                <div className="flex justify-end">
                  <div className="bg-gradient-to-br from-[#0B2C63] to-[#1a4a8f] p-4 rounded-3xl rounded-tl-none shadow-lg shadow-[#0B2C63]/20 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="pt-4">
              <div className="flex items-center gap-3 p-3 rounded-3xl bg-white/80 backdrop-blur border border-white/50 shadow-xl shadow-slate-200/50">
                <button className="p-3 rounded-2xl bg-slate-100 text-slate-400 transition-all active:scale-95 hover:bg-slate-200">
                  <Mic className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="כתוב הודעה..."
                  className="flex-1 bg-transparent text-slate-800 font-medium placeholder:text-slate-400 outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isThinking}
                  className="p-3 rounded-2xl bg-gradient-to-br from-[#0B2C63] to-[#1a4a8f] text-white shadow-lg shadow-[#0B2C63]/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Track View */}
        {activeView === "track" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div className="py-4 flex items-center gap-4">
              <button
                onClick={() => setActiveView("home")}
                className="p-2 rounded-xl bg-white/80 backdrop-blur border border-slate-100 shadow-sm transition-all active:scale-95"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex-1">
                <h2 className="text-lg font-black text-slate-800">מעקב משאית</h2>
                <p className="text-xs text-slate-400">הזמנה #12847</p>
              </div>
            </div>

            {/* Live Map Placeholder */}
            <div className="relative h-64 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500 flex items-center justify-center animate-pulse shadow-lg shadow-orange-500/30">
                    <Truck className="w-8 h-8 text-white" />
                  </div>
                  <p className="font-bold text-slate-600">המשאית בדרך אליך</p>
                  <p className="text-sm text-slate-400 mt-1">~5 דקות</p>
                </div>
              </div>
              {/* Decorative road lines */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-300 rounded-full" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Driver Card */}
            <div className="p-5 rounded-3xl bg-white/80 backdrop-blur border border-white/50 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0B2C63] to-[#1a4a8f] flex items-center justify-center shadow-lg">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-black text-slate-800">יעקב לוי</p>
                  <p className="text-sm text-slate-400">נהג משאית</p>
                </div>
                <button className="p-3 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-all active:scale-95">
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Button */}
            <button className="w-full p-5 rounded-3xl bg-gradient-to-br from-[#0B2C63] to-[#1a4a8f] text-white font-black flex items-center justify-center gap-3 shadow-xl shadow-[#0B2C63]/20 transition-all active:scale-95">
              <Navigation className="w-5 h-5" />
              פתח ניווט Waze
            </button>
          </div>
        )}

        {/* History View */}
        {activeView === "history" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div className="py-4 flex items-center gap-4">
              <button
                onClick={() => setActiveView("home")}
                className="p-2 rounded-xl bg-white/80 backdrop-blur border border-slate-100 shadow-sm transition-all active:scale-95"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex-1">
                <h2 className="text-lg font-black text-slate-800">היסטוריית הזמנות</h2>
                <p className="text-xs text-slate-400">כל ההזמנות שלך</p>
              </div>
            </div>

            {/* Order List */}
            <div className="space-y-4">
              {[
                { id: "12847", type: "מכולת פסולת 8 קוב", date: "היום", status: "בדרך", statusColor: "bg-orange-500" },
                { id: "12832", type: "מכולת פסולת 6 קוב", date: "15/03/2026", status: "סופק", statusColor: "bg-emerald-500" },
                { id: "12815", type: "בלוקים 20 ס\"מ", date: "12/03/2026", status: "סופק", statusColor: "bg-emerald-500" },
                { id: "12798", type: "מלט בשקים", date: "08/03/2026", status: "סופק", statusColor: "bg-emerald-500" },
              ].map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-3xl bg-white/80 backdrop-blur border border-white/50 shadow-lg flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Package className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{order.type}</p>
                    <p className="text-xs text-slate-400">
                      #{order.id} • {order.date}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full ${order.statusColor} text-white text-xs font-bold`}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-5 right-5 z-50">
        <div className="flex items-center justify-around p-3 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl shadow-slate-300/30">
          {[
            { id: "home", icon: Package, label: "ראשי" },
            { id: "chat", icon: MessageSquare, label: "צאט" },
            { id: "track", icon: Truck, label: "מעקב" },
            { id: "history", icon: History, label: "היסטוריה" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as typeof activeView)}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${
                activeView === item.id ? "bg-[#0B2C63] text-white shadow-lg shadow-[#0B2C63]/20" : "text-slate-400"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
