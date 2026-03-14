"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { rtdb } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";
import {
  BadgeCheck,
  Ruler,
  Zap,
  Package,
  PlayCircle,
  Maximize2,
  X,
  Send,
  User,
  Building2,
  CheckCircle2,
  ShoppingCart,
  ShieldCheck,
  Play,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// --- Message Type ---
interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  text?: string;
  product?: Product | null;
  timestamp?: number;
  to?: string;
  from?: string;
  receiver?: string;
}

interface Product {
  product_name?: string;
  name?: string;
  image_url?: string;
  video_url?: string;
  description?: string;
  sku?: string;
}

// --- Typewriter Effect for AI responses ---
const TypewriterEffect = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!text) return;
    setDisplayedText("");
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (!text) return;
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, 15);
      return () => clearTimeout(timeout);
    }
  }, [index, text]);

  return (
    <div className="whitespace-pre-wrap leading-relaxed">{displayedText}</div>
  );
};

// --- Product Card with Image and Video Support ---
const ProductMediaCard = ({ product }: { product: Product }) => {
  const [showVideo, setShowVideo] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!product) return null;

  const productName = product.product_name || product.name || "מוצר";
  const imageUrl =
    !imageError && product.image_url
      ? product.image_url
      : "https://via.placeholder.com/300x200?text=Saban+Logistics";

  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/watch")) {
      return url.replace("watch?v=", "embed/");
    }
    if (url.includes("youtu.be/")) {
      return url.replace("youtu.be/", "youtube.com/embed/");
    }
    return url;
  };

  return (
    <div className="my-4 bg-background rounded-3xl overflow-hidden shadow-xl border border-border max-w-[320px] animate-in zoom-in-95 duration-300">
      {/* Product Image */}
      <div className="relative group bg-card p-4">
        <img
          src={imageUrl}
          className="w-full h-48 object-contain mix-blend-multiply transition-transform group-hover:scale-105"
          alt={productName}
          onError={() => setImageError(true)}
          crossOrigin="anonymous"
        />
        <button
          onClick={() => product.video_url && setShowVideo(true)}
          className="absolute inset-0 bg-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <span className="p-3 bg-card/80 backdrop-blur-md rounded-full text-foreground">
            <Maximize2 size={20} />
          </span>
        </button>
        {product.sku && (
          <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-black px-3 py-1 rounded-full uppercase">
            #{product.sku}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-5 text-right bg-card" dir="rtl">
        <h4 className="font-black text-card-foreground text-lg leading-tight mb-2">
          {productName}
        </h4>
        <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
          {product.description || "מוצר איכותי מבית ח. סבן"}
        </p>

        {/* Features */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
            <span>אספקה מיידית</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
            <span>אחריות יצרן מלאה</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border">
          {product.video_url && (
            <button
              onClick={() => setShowVideo(true)}
              className="flex items-center justify-center gap-2 h-11 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl text-xs font-bold transition-colors"
            >
              <Play size={14} className="fill-current" />
              וידאו
            </button>
          )}
          <button
            className={`flex items-center justify-center gap-2 h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-black transition-colors shadow-lg ${
              !product.video_url ? "col-span-2" : ""
            }`}
          >
            <ShoppingCart size={14} />
            הזמן עכשיו
          </button>
        </div>
      </div>

      {/* Quality Badge */}
      <div className="bg-primary/10 p-2.5 flex justify-center items-center gap-2">
        <ShieldCheck size={14} className="text-primary" />
        <span className="text-[10px] text-primary font-black uppercase tracking-wider">
          אספקה מיידית - חמ"ל ח. סבן
        </span>
      </div>

      {/* Video Modal */}
      {showVideo && product.video_url && (
        <div className="fixed inset-0 z-[100] bg-foreground/90 backdrop-blur-xl flex items-center justify-center p-4">
          <button
            onClick={() => setShowVideo(false)}
            className="absolute top-6 right-6 text-background hover:text-background/80 transition-colors"
          >
            <X size={32} />
          </button>
          <iframe
            src={getEmbedUrl(product.video_url)}
            className="w-full max-w-4xl aspect-video rounded-2xl"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      )}
    </div>
  );
};

// --- Main Chat Content Component ---
function Chat7Content() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const phone = "972508860896";

  // Load saved user name
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("saban_user_name");
      if (savedName) setUserName(savedName);
    }
  }, []);

  // Connect to Firebase RTDB with try-catch for permission errors
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const chatRef = ref(rtdb, "saban94");
      const unsubscribe = onValue(
        chatRef,
        (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const incoming: Message[] = data.inbound
              ? Object.entries(data.inbound).map(([id, m]: [string, any]) => ({
                  ...m,
                  id,
                  role: "user" as const,
                  content: m.text || m.content || "",
                }))
              : [];
            const outgoing: Message[] = data.send
              ? Object.entries(data.send).map(([id, m]: [string, any]) => ({
                  ...m,
                  id,
                  role: "assistant" as const,
                  content: m.text || m.content || "",
                }))
              : [];
            const combined = [...incoming, ...outgoing]
              .filter(
                (m) =>
                  m.to === phone || m.from === phone || m.receiver === phone
              )
              .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            setMessages(combined);
          }
        },
        (error) => {
          console.error("Firebase read error:", error);
        }
      );
      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase connection error:", error);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message handler
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const content = input.trim();
    setInput("");
    setIsLoading(true);

    // Add optimistic user message
    const userMessage: Message = {
      role: "user",
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content }],
          phone,
          userName,
        }),
      });

      const data: { answer: string; product: Product | null } =
        await response.json();

      // Add AI response to messages
      const aiMessage: Message = {
        role: "assistant",
        content: data.answer || "אני כאן לעזור. במה אוכל לסייע?",
        product: data.product || null,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Try to update Firebase (wrapped in try-catch for permission errors)
      try {
        const chatRef = ref(rtdb, `saban94/send/${Date.now()}`);
        await update(chatRef, {
          text: data.answer,
          product: data.product || null,
          timestamp: Date.now(),
          to: phone,
        });
      } catch (firebaseError) {
        console.warn("Firebase update permission denied:", firebaseError);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "שגיאה בחיבור. נסה שוב.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, userName]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Name entry screen
  if (!userName) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background p-4"
        dir="rtl"
      >
        <Card className="w-full max-w-md p-8 bg-card rounded-3xl shadow-2xl text-center border-none">
          <div className="bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Building2 className="text-primary-foreground" size={32} />
          </div>
          <h2 className="text-2xl font-black mb-2 text-card-foreground">
            ח. סבן לוגיסטיקה
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            מערכת ייעוץ חכמה למוצרי בניין
          </p>
          <Input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="איך קוראים לך?"
            className="h-14 rounded-2xl bg-secondary text-center font-bold mb-4 border-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && nameInput.trim()) {
                localStorage.setItem("saban_user_name", nameInput.trim());
                setUserName(nameInput.trim());
              }
            }}
          />
          <button
            onClick={() => {
              if (nameInput.trim()) {
                localStorage.setItem("saban_user_name", nameInput.trim());
                setUserName(nameInput.trim());
              }
            }}
            disabled={!nameInput.trim()}
            className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-black hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            כניסה לצ'אט
          </button>
        </Card>
      </div>
    );
  }

  // Main chat UI
  return (
    <div className="flex h-screen bg-background overflow-hidden" dir="rtl">
      {/* Sidebar */}
      <aside className="w-[360px] border-l border-border bg-card hidden lg:flex flex-col shadow-xl">
        <header className="p-6 border-b border-border flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
            <Zap className="text-primary-foreground" size={24} fill="currentColor" />
          </div>
          <div>
            <h1 className="font-black text-xl text-card-foreground">SABAN OS</h1>
            <p className="text-[10px] font-black text-primary uppercase tracking-wider">
              V4.0 AI
            </p>
          </div>
        </header>
        <div className="p-6 space-y-4 flex-1">
          <button className="w-full p-5 bg-foreground text-background rounded-2xl font-black flex items-center justify-between group hover:bg-foreground/90 transition-colors">
            <div className="flex items-center gap-3">
              <Ruler size={20} />
              <span>חישוב מ"ר</span>
            </div>
            <BadgeCheck size={18} className="text-primary" />
          </button>
          <div className="p-4 bg-secondary rounded-2xl">
            <p className="text-xs text-muted-foreground mb-1">מחובר כ:</p>
            <p className="font-bold text-secondary-foreground">{userName}</p>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-background">
        {/* Header */}
        <header className="h-20 bg-card/80 backdrop-blur-md border-b border-border flex justify-between items-center px-6 z-10">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-secondary rounded-xl flex items-center justify-center">
              <User size={20} className="text-secondary-foreground" />
            </div>
            <div>
              <div className="font-black text-card-foreground leading-none">
                מרכז ייעוץ
              </div>
              <div className="text-[10px] text-emerald-600 font-bold uppercase mt-1 flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Online
              </div>
            </div>
          </div>
          <div className="lg:hidden">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Zap className="text-primary-foreground" size={18} fill="currentColor" />
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Package size={32} className="text-muted-foreground" />
              </div>
              <h3 className="font-bold text-card-foreground mb-2">
                שלום {userName}!
              </h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                אני כאן לעזור לך למצוא את המוצרים המתאימים ביותר לפרויקט שלך
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={m.id || i}
              className={`flex flex-col ${
                m.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-3xl shadow-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-lg font-bold"
                    : "bg-card text-card-foreground rounded-bl-lg border border-border"
                }`}
              >
                {m.role === "assistant" && i === messages.length - 1 ? (
                  <TypewriterEffect text={m.content || m.text || ""} />
                ) : (
                  <span className="whitespace-pre-wrap leading-relaxed">
                    {m.content || m.text}
                  </span>
                )}
              </div>
              {m.product && <ProductMediaCard product={m.product} />}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start">
              <div className="bg-card border border-border p-4 rounded-3xl rounded-bl-lg">
                <div className="flex items-center gap-2 text-primary">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <span
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <span
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* Input Footer */}
        <footer className="p-4 absolute bottom-0 w-full z-20 bg-gradient-to-t from-background via-background to-transparent pt-8">
          <div className="max-w-3xl mx-auto bg-card/95 backdrop-blur-xl border border-border p-2 rounded-2xl shadow-2xl flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="מה נבצע היום?"
              className="flex-1 h-12 border-none bg-transparent font-medium text-base focus-visible:ring-0 placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-primary p-3 rounded-xl text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}

// --- Dynamic import with ssr: false to prevent hydration errors ---
const DynamicChat7 = dynamic(() => Promise.resolve(Chat7Content), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Zap className="text-primary-foreground" size={28} />
        </div>
        <p className="text-muted-foreground font-medium">טוען...</p>
      </div>
    </div>
  ),
});

export default function Chat7Page() {
  return <DynamicChat7 />;
}
