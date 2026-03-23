"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Search,
  MoreVertical,
  Send,
  Paperclip,
  Mic,
  Phone,
  Video,
  Check,
  CheckCheck,
  Bot,
  Cpu,
  Database,
  Globe,
  Zap,
  Settings,
  Users,
  Package,
  MapPin,
  ChevronLeft,
  Languages,
  History,
  Brain,
  Sparkles,
  Image as ImageIcon,
  HardDrive,
  Calendar,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RefreshCw,
  Bell,
  BellOff,
  Truck,
  FileText,
  Upload,
  Download,
} from "lucide-react";
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

// ==================== TYPES ====================

interface Contact {
  id: string;
  name: string;
  phone?: string;
  avatar?: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  typing?: boolean;
  orderDetected?: boolean;
  language?: "he" | "ar" | "auto";
}

interface Message {
  id: string;
  content: string;
  time: string;
  timestamp: number;
  type: "incoming" | "outgoing";
  status?: "sending" | "sent" | "delivered" | "read";
  orderData?: ParsedOrder | null;
  mediaType?: "voice" | "image" | null;
  mediaUrl?: string;
  voiceDuration?: number;
  contactId?: string;
}

interface ParsedOrder {
  items: string[];
  location?: string;
  quantity?: string;
  rawText: string;
  confidence: number;
}

interface FirebaseMessage {
  id: string;
  content: string;
  timestamp: number;
  phone?: string;
  contactName?: string;
}

type LanguageMode = "אוטומטי" | "עברית" | "ערבית";

// ==================== ORDER EXTRACTION ENGINE ====================

const ORDER_PATTERNS = {
  quantities: /(\d+)\s*(מכולות?|קוביות?|יחידות?|קרטונים?|משטחים?|טון|ק"ג|kg|units?|containers?|cubic|pallets?)/gi,
  locations: /(חולון|תל אביב|רמת גן|פתח תקווה|ראשון לציון|בת ים|הרצליה|נתניה|חיפה|באר שבע|ירושלים|אשדוד|אילת|Holon|Tel Aviv|Ramat Gan|Petah Tikva|Rishon LeZion|Bat Yam|Herzliya|Netanya|Haifa|Beer Sheva|Jerusalem|Ashdod|Eilat)/gi,
  urgency: /(דחוף|מיידי|urgent|asap|בהקדם|היום|מחר|today|tomorrow)/gi,
  addresses: /(רחוב|שדרות|כביש|מחסן|סניף|מפעל|street|road|warehouse|branch|factory)\s+[\u0590-\u05FFa-zA-Z0-9\s]+/gi,
};

function extractOrderFromMessage(content: string): ParsedOrder | null {
  const quantityMatches = content.match(ORDER_PATTERNS.quantities);
  const locationMatches = content.match(ORDER_PATTERNS.locations);
  const addressMatches = content.match(ORDER_PATTERNS.addresses);

  if (!quantityMatches && !locationMatches) return null;

  const items: string[] = [];
  if (quantityMatches) {
    items.push(...quantityMatches);
  }

  let location = "";
  if (locationMatches) {
    location = locationMatches.join(", ");
  }
  if (addressMatches) {
    location += (location ? " - " : "") + addressMatches.join(", ");
  }

  const confidence =
    (quantityMatches ? 0.5 : 0) +
    (locationMatches ? 0.3 : 0) +
    (addressMatches ? 0.2 : 0);

  if (confidence < 0.3) return null;

  return {
    items,
    location: location || undefined,
    quantity: quantityMatches?.[0]?.match(/\d+/)?.[0],
    rawText: content,
    confidence,
  };
}

// ==================== LANGUAGE DETECTION ====================

function detectLanguage(text: string): "he" | "ar" | "en" {
  const hebrewPattern = /[\u0590-\u05FF]/;
  const arabicPattern = /[\u0600-\u06FF]/;

  const hebrewCount = (text.match(/[\u0590-\u05FF]/g) || []).length;
  const arabicCount = (text.match(/[\u0600-\u06FF]/g) || []).length;

  if (hebrewCount > arabicCount && hebrewPattern.test(text)) return "he";
  if (arabicCount > hebrewCount && arabicPattern.test(text)) return "ar";
  return "en";
}

// ==================== AUDIO NOTIFICATION ====================

function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const playNotification = useCallback(() => {
    if (!soundEnabled) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (error) {
      console.log("Audio notification not available");
    }
  }, [soundEnabled]);

  return { playNotification, soundEnabled, setSoundEnabled };
}

// ==================== FIREBASE SIMULATION (Ready for Real Integration) ====================

function useFirebaseMessages(contactId: string | undefined) {
  const [incomingMessages, setIncomingMessages] = useState<Message[]>([]);
  const [outgoingMessages, setOutgoingMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate Firebase connection status
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnected(true);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Firebase path structure: rami/incoming and rami/outgoing
  // This is a placeholder that simulates Firebase Realtime Database behavior
  // Replace with actual Firebase SDK integration:
  //
  // import { getDatabase, ref, onValue, push, serverTimestamp } from 'firebase/database';
  //
  // useEffect(() => {
  //   const db = getDatabase();
  //   const incomingRef = ref(db, `rami/incoming/${contactId}`);
  //   const outgoingRef = ref(db, `rami/outgoing/${contactId}`);
  //
  //   const unsubIncoming = onValue(incomingRef, (snapshot) => {
  //     const data = snapshot.val();
  //     if (data) {
  //       const messages = Object.entries(data).map(([id, msg]) => ({
  //         id,
  //         ...msg,
  //         type: 'incoming'
  //       }));
  //       setIncomingMessages(messages);
  //     }
  //   });
  //
  //   return () => {
  //     unsubIncoming();
  //   };
  // }, [contactId]);

  const sendMessage = useCallback(
    async (content: string): Promise<Message> => {
      const newMessage: Message = {
        id: `out_${Date.now()}`,
        content,
        time: new Date().toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestamp: Date.now(),
        type: "outgoing",
        status: "sending",
        contactId,
      };

      // Simulate network delay
      setTimeout(() => {
        setOutgoingMessages((prev) =>
          prev.map((m) =>
            m.id === newMessage.id ? { ...m, status: "sent" as const } : m
          )
        );
      }, 500);

      setTimeout(() => {
        setOutgoingMessages((prev) =>
          prev.map((m) =>
            m.id === newMessage.id ? { ...m, status: "delivered" as const } : m
          )
        );
      }, 1500);

      setOutgoingMessages((prev) => [...prev, newMessage]);
      return newMessage;
    },
    [contactId]
  );

  // Simulate incoming message (for demo purposes)
  const simulateIncoming = useCallback(
    (content: string, orderData?: ParsedOrder | null) => {
      const newMessage: Message = {
        id: `in_${Date.now()}`,
        content,
        time: new Date().toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestamp: Date.now(),
        type: "incoming",
        orderData,
        contactId,
      };

      setIncomingMessages((prev) => [...prev, newMessage]);
      return newMessage;
    },
    [contactId]
  );

  return {
    incomingMessages,
    outgoingMessages,
    isConnected,
    isLoading,
    sendMessage,
    simulateIncoming,
  };
}

// ==================== ONESIGNAL PLACEHOLDER ====================

function useOneSignal() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const requestPermission = useCallback(async () => {
    // OneSignal integration placeholder
    // Replace with actual OneSignal SDK:
    //
    // import OneSignal from 'react-onesignal';
    //
    // await OneSignal.init({
    //   appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
    // });
    //
    // const permission = await OneSignal.Notifications.requestPermission();
    // setPermissionGranted(permission);

    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setPermissionGranted(permission === "granted");
      setIsEnabled(permission === "granted");
    }
  }, []);

  const sendNotification = useCallback(
    (title: string, body: string) => {
      if (permissionGranted && "Notification" in window) {
        new Notification(title, {
          body,
          icon: "/saban-os-icon.png",
          tag: "saban-os",
        });
      }
    },
    [permissionGranted]
  );

  return { isEnabled, setIsEnabled, requestPermission, sendNotification };
}

// ==================== COMPONENTS ====================

function StatusIndicator({
  label,
  active,
  pulsing = false,
  icon: Icon,
}: {
  label: string;
  active: boolean;
  pulsing?: boolean;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f0f2f5]">
      {Icon && <Icon className="w-4 h-4 text-[#667781]" />}
      <div className="relative">
        <div
          className={cn(
            "w-3 h-3 rounded-full",
            active ? "bg-[#00a884]" : "bg-gray-400"
          )}
        />
        {pulsing && active && (
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-[#00a884] animate-ping opacity-75" />
        )}
      </div>
      <span className="text-sm font-medium text-[#111b21]">{label}</span>
      <span
        className={cn(
          "text-xs font-semibold mr-auto",
          active ? "text-[#00a884]" : "text-gray-400"
        )}
      >
        {active ? "פעיל" : "כבוי"}
      </span>
    </div>
  );
}

function OrderPanel({ orders }: { orders: ParsedOrder[] }) {
  if (orders.length === 0) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="bg-white border-t border-[#e9edef] overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-[#00a884]" />
          <h3 className="font-semibold text-[#111b21]">הזמנות שזוהו</h3>
          <Badge
            variant="secondary"
            className="bg-[#00a884] text-white text-xs mr-auto"
          >
            {orders.length}
          </Badge>
        </div>
        <ScrollArea className="max-h-40">
          <div className="space-y-2">
            {orders.map((order, idx) => (
              <motion.div
                key={idx}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="p-3 rounded-xl bg-gradient-to-l from-[#dcf8c6]/50 to-[#f0f2f5] border border-[#00a884]/20"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#00a884] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    {order.items.map((item, i) => (
                      <p key={i} className="font-medium text-[#111b21] text-sm">
                        {item}
                      </p>
                    ))}
                    {order.location && (
                      <p className="text-xs text-[#667781] mt-1">
                        {order.location}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] border-[#00a884] text-[#00a884]"
                      >
                        דיוק: {Math.round(order.confidence * 100)}%
                      </Badge>
                      <button className="text-[10px] text-[#00a884] hover:underline">
                        אשר הזמנה
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  );
}

function ContactItem({
  contact,
  isSelected,
  onClick,
}: {
  contact: Contact;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 cursor-pointer transition-colors",
        isSelected ? "bg-[#f0f2f5]" : "hover:bg-[#f5f6f6]"
      )}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative">
        <Avatar className="w-12 h-12 border-2 border-[#00a884]/30">
          <AvatarImage src={contact.avatar} />
          <AvatarFallback className="bg-gradient-to-br from-[#00a884] to-[#128c7e] text-white font-bold">
            {contact.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        {contact.online && (
          <div className="absolute bottom-0 left-0 w-3.5 h-3.5 bg-[#00a884] rounded-full border-2 border-white" />
        )}
      </div>
      <div className="flex-1 min-w-0 border-b border-[#e9edef] pb-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-[#111b21] truncate">
            {contact.name}
          </h3>
          <span
            className={cn(
              "text-xs",
              contact.unread > 0
                ? "text-[#00a884] font-medium"
                : "text-[#667781]"
            )}
          >
            {contact.time}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#667781] truncate flex-1">
            {contact.typing ? (
              <span className="text-[#00a884]">מקליד...</span>
            ) : (
              contact.lastMessage
            )}
          </p>
          <div className="flex items-center gap-2">
            {contact.orderDetected && (
              <Badge className="bg-[#ff9500] text-white text-[10px] px-1.5 py-0">
                הזמנה
              </Badge>
            )}
            {contact.unread > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#00a884] text-white text-xs flex items-center justify-center font-medium">
                {contact.unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function VoiceNotePlayer({
  duration,
  url,
}: {
  duration?: number;
  url?: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return p + 2;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-[#00a884]/10 min-w-[200px]">
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="w-8 h-8 rounded-full bg-[#00a884] text-white flex items-center justify-center"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 mr-[-2px]" />
        )}
      </button>
      <div className="flex-1">
        <div className="h-1 bg-[#e9edef] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00a884] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-[#667781] mt-1">
          {duration ? `0:${String(duration).padStart(2, "0")}` : "0:00"}
        </p>
      </div>
      <button className="text-[10px] text-[#00a884] hover:underline">
        תמלל
      </button>
    </div>
  );
}

function ImageAttachment({ url }: { url?: string }) {
  return (
    <div className="rounded-lg overflow-hidden bg-[#f0f2f5] mb-2">
      <div className="aspect-video bg-gradient-to-br from-[#e9edef] to-[#d1d7db] flex items-center justify-center">
        <ImageIcon className="w-8 h-8 text-[#667781]" />
      </div>
      <div className="p-2 flex items-center justify-between">
        <span className="text-xs text-[#667781]">image.jpg</span>
        <button className="flex items-center gap-1 text-xs text-[#00a884] hover:underline">
          <HardDrive className="w-3 h-3" />
          שמור ל-Drive
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isOutgoing = message.type === "outgoing";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn("flex", isOutgoing ? "justify-start" : "justify-end")}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-lg px-3 py-2 shadow-sm relative",
          isOutgoing
            ? "bg-[#dcf8c6] rounded-tl-none"
            : "bg-white rounded-tr-none"
        )}
      >
        {/* Media Attachments */}
        {message.mediaType === "image" && (
          <ImageAttachment url={message.mediaUrl} />
        )}
        {message.mediaType === "voice" && (
          <VoiceNotePlayer
            duration={message.voiceDuration}
            url={message.mediaUrl}
          />
        )}

        {/* Order Detection Badge */}
        {message.orderData && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-2 p-2 rounded-lg bg-[#00a884]/10 border border-[#00a884]/30"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Package className="w-3.5 h-3.5 text-[#00a884]" />
              <span className="text-xs font-semibold text-[#00a884]">
                זוהתה הזמנה
              </span>
              <Badge
                variant="outline"
                className="text-[8px] border-[#00a884] text-[#00a884] mr-auto"
              >
                {Math.round(message.orderData.confidence * 100)}%
              </Badge>
            </div>
            {message.orderData.items.map((item, i) => (
              <p key={i} className="text-xs text-[#111b21]">
                {item}
              </p>
            ))}
            {message.orderData.location && (
              <p className="text-[10px] text-[#667781] mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {message.orderData.location}
              </p>
            )}
          </motion.div>
        )}

        {/* Message Content */}
        {!message.mediaType && (
          <p className="text-[#111b21] text-sm leading-relaxed">
            {message.content}
          </p>
        )}

        {/* Timestamp & Status */}
        <div
          className={cn(
            "flex items-center gap-1 mt-1",
            isOutgoing ? "justify-end" : "justify-start"
          )}
        >
          <span className="text-[10px] text-[#667781]">{message.time}</span>
          {isOutgoing && (
            <span className="text-[#53bdeb]">
              {message.status === "read" ? (
                <CheckCheck className="w-4 h-4" />
              ) : message.status === "delivered" ? (
                <CheckCheck className="w-4 h-4 text-[#667781]" />
              ) : message.status === "sending" ? (
                <RefreshCw className="w-3 h-3 text-[#667781] animate-spin" />
              ) : (
                <Check className="w-4 h-4 text-[#667781]" />
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function AITrainingContent({
  language,
  setLanguage,
  onSyncHistory,
  onInjectContext,
}: {
  language: LanguageMode;
  setLanguage: (lang: LanguageMode) => void;
  onSyncHistory: () => void;
  onInjectContext: () => void;
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    // Simulate CSV processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSyncing(false);
    onSyncHistory();
  };

  const handleInject = async () => {
    setIsInjecting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsInjecting(false);
    onInjectContext();
  };

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-3">
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#f0f2f5] hover:bg-[#e9edef] transition-colors text-right disabled:opacity-50"
        >
          {isSyncing ? (
            <RefreshCw className="w-5 h-5 text-[#00a884] animate-spin" />
          ) : (
            <History className="w-5 h-5 text-[#00a884]" />
          )}
          <div className="flex-1">
            <p className="font-medium text-[#111b21]">סנכרן היסטוריה</p>
            <p className="text-xs text-[#667781]">
              {isSyncing ? "מעבד נתוני H. Saban CSV..." : "ייבא שיחות קודמות לאימון"}
            </p>
          </div>
        </button>

        <button
          onClick={handleInject}
          disabled={isInjecting}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#f0f2f5] hover:bg-[#e9edef] transition-colors text-right disabled:opacity-50"
        >
          {isInjecting ? (
            <RefreshCw className="w-5 h-5 text-[#00a884] animate-spin" />
          ) : (
            <Brain className="w-5 h-5 text-[#00a884]" />
          )}
          <div className="flex-1">
            <p className="font-medium text-[#111b21]">הזרק הקשר</p>
            <p className="text-xs text-[#667781]">
              {isInjecting ? "מזריק הקשר עסקי..." : "הוסף מידע עסקי ספציפי"}
            </p>
          </div>
        </button>

        {/* CSV Upload */}
        <div className="p-3 rounded-xl border-2 border-dashed border-[#e9edef] hover:border-[#00a884] transition-colors">
          <label className="flex flex-col items-center gap-2 cursor-pointer">
            <Upload className="w-6 h-6 text-[#667781]" />
            <span className="text-xs text-[#667781]">העלה קובץ CSV</span>
            <input type="file" accept=".csv" className="hidden" />
          </label>
        </div>
      </div>

      {/* Language Selector */}
      <div className="pt-2 border-t border-[#e9edef]">
        <p className="text-sm font-medium text-[#111b21] mb-2 flex items-center gap-2">
          <Languages className="w-4 h-4 text-[#00a884]" />
          שפת תגובה
        </p>
        <div className="flex gap-2">
          {(["אוטומטי", "עברית", "ערבית"] as LanguageMode[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                language === lang
                  ? "bg-[#00a884] text-white"
                  : "bg-[#f0f2f5] text-[#111b21] hover:bg-[#e9edef]"
              )}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function SabanOSCommandCenter() {
  // Initial mock contacts (will be replaced by Firebase)
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: "1",
      name: "שלמה - מפעל חולון",
      phone: "+972501234567",
      lastMessage: "אני צריך 10 מכולות קוביה לחולון",
      time: "12:45",
      unread: 3,
      online: true,
      orderDetected: true,
    },
    {
      id: "2",
      name: "דוד - סניף תל אביב",
      phone: "+972509876543",
      lastMessage: "ההזמנה הגיעה בזמן, תודה!",
      time: "11:30",
      unread: 0,
      online: true,
    },
    {
      id: "3",
      name: "مريم - رمات غان",
      phone: "+972508765432",
      lastMessage: "متى التوصيل القادم؟",
      time: "10:15",
      unread: 1,
      online: false,
      language: "ar",
    },
    {
      id: "4",
      name: "יוסי - פתח תקווה",
      phone: "+972507654321",
      lastMessage: "צריך לעדכן את הכתובת",
      time: "אתמול",
      unread: 0,
      online: false,
    },
    {
      id: "5",
      name: "רחל - ראשון לציון",
      phone: "+972506543210",
      lastMessage: "אפשר לקבל הצעת מחיר?",
      time: "אתמול",
      unread: 2,
      online: true,
    },
  ]);

  const [selectedContact, setSelectedContact] = useState<Contact | null>(
    contacts[0]
  );
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "שלום, אני צריך הזמנה דחופה",
      time: "12:30",
      timestamp: Date.now() - 900000,
      type: "incoming",
    },
    {
      id: "2",
      content: "שלום שלמה, מה תרצה להזמין?",
      time: "12:31",
      timestamp: Date.now() - 840000,
      type: "outgoing",
      status: "read",
    },
    {
      id: "3",
      content: "אני צריך 10 מכולות קוביה לחולון, למחסן הראשי",
      time: "12:35",
      timestamp: Date.now() - 600000,
      type: "incoming",
      orderData: {
        items: ["10 מכולות קוביה"],
        location: "חולון - מחסן ראשי",
        quantity: "10",
        rawText: "אני צריך 10 מכולות קוביה לחולון, למחסן הראשי",
        confidence: 0.95,
      },
    },
    {
      id: "4",
      content: "קיבלתי את ההזמנה. אני מעביר לצוות הלוגיסטיקה",
      time: "12:36",
      timestamp: Date.now() - 540000,
      type: "outgoing",
      status: "read",
    },
    {
      id: "5",
      content: "",
      time: "12:38",
      timestamp: Date.now() - 420000,
      type: "incoming",
      mediaType: "voice",
      voiceDuration: 15,
    },
    {
      id: "6",
      content: "המשלוח יצא תוך שעתיים. תקבל עדכון כשהנהג יוצא",
      time: "12:42",
      timestamp: Date.now() - 180000,
      type: "outgoing",
      status: "delivered",
    },
    {
      id: "7",
      content: "מעולה, תודה רבה!",
      time: "12:45",
      timestamp: Date.now() - 60000,
      type: "incoming",
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [language, setLanguage] = useState<LanguageMode>("אוטומטי");
  const [showCommandCenter, setShowCommandCenter] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { playNotification, soundEnabled, setSoundEnabled } =
    useNotificationSound();
  const {
    isEnabled: oneSignalEnabled,
    setIsEnabled: setOneSignalEnabled,
    requestPermission: requestOneSignalPermission,
    sendNotification,
  } = useOneSignal();
  const {
    incomingMessages,
    outgoingMessages,
    isConnected: firebaseConnected,
    sendMessage: firebaseSendMessage,
    simulateIncoming,
  } = useFirebaseMessages(selectedContact?.id);

  // AI Brain status (simulated)
  const [sabanAIActive] = useState(true);

  // Extract orders from messages
  const parsedOrders = messages
    .filter((m) => m.orderData)
    .map((m) => m.orderData as ParsedOrder);

  // Filter contacts based on search
  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery)
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle new incoming messages (from Firebase)
  useEffect(() => {
    if (incomingMessages.length > 0) {
      const lastMessage = incomingMessages[incomingMessages.length - 1];
      if (!messages.find((m) => m.id === lastMessage.id)) {
        // Check for order data
        const orderData = extractOrderFromMessage(lastMessage.content);

        setMessages((prev) => [...prev, { ...lastMessage, orderData }]);

        // Play notification sound
        playNotification();

        // Send browser notification
        if (oneSignalEnabled && selectedContact) {
          sendNotification("הודעה חדשה", lastMessage.content);
        }

        // Update contact's last message
        if (lastMessage.contactId) {
          setContacts((prev) =>
            prev.map((c) =>
              c.id === lastMessage.contactId
                ? {
                    ...c,
                    lastMessage: lastMessage.content,
                    time: lastMessage.time,
                    unread: c.unread + 1,
                    orderDetected: !!orderData,
                  }
                : c
            )
          );
        }
      }
    }
  }, [
    incomingMessages,
    messages,
    playNotification,
    oneSignalEnabled,
    sendNotification,
    selectedContact,
  ]);

  // Handle send message
  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const newMessage = await firebaseSendMessage(inputValue);

    // Check for order data in outgoing message
    const orderData = extractOrderFromMessage(inputValue);

    setMessages((prev) => [...prev, { ...newMessage, orderData }]);
    setInputValue("");
    inputRef.current?.focus();
  };

  // Handle contact selection
  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setMobileView("chat");

    // Clear unread count
    setContacts((prev) =>
      prev.map((c) => (c.id === contact.id ? { ...c, unread: 0 } : c))
    );
  };

  // Simulate incoming message (demo)
  const handleSimulateMessage = () => {
    const demoMessages = [
      "אני צריך 5 משטחים לתל אביב דחוף",
      "מחר בבוקר אפשר 20 קרטונים להרצליה?",
      "متى يمكن توصيل 15 وحدة إلى حيفا؟",
      "צריך עדכון על ההזמנה מאתמול",
    ];
    const randomMessage =
      demoMessages[Math.floor(Math.random() * demoMessages.length)];
    const orderData = extractOrderFromMessage(randomMessage);
    simulateIncoming(randomMessage, orderData);
  };

  // Command Center Drawer
  const CommandCenterDrawer = () => (
    <Sheet open={showCommandCenter} onOpenChange={setShowCommandCenter}>
      <SheetContent side="right" className="w-80 p-0 border-r-0">
        <div className="h-full flex flex-col bg-white">
          {/* Header */}
          <div className="bg-gradient-to-l from-[#00a884] to-[#128c7e] p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Saban OS</h2>
                <p className="text-white/80 text-sm">Command Center</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {/* Master AI Switch */}
              <div className="p-4 rounded-2xl bg-gradient-to-l from-[#dcf8c6]/50 to-[#f0f2f5] border border-[#00a884]/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00a884] flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-[#111b21]">AI Autopilot</p>
                      <p className="text-xs text-[#667781]">מצב אוטומטי מלא</p>
                    </div>
                  </div>
                  <Switch
                    checked={aiEnabled}
                    onCheckedChange={setAiEnabled}
                    className="data-[state=checked]:bg-[#00a884]"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-[#667781]">
                  <Sparkles className="w-3.5 h-3.5 text-[#00a884]" />
                  <span>זיהוי הזמנות, מענה אוטומטי, ניתוב חכם</span>
                </div>
              </div>

              {/* System Status */}
              <div className="space-y-3">
                <h3 className="font-semibold text-[#111b21] text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#00a884]" />
                  סטטוס מערכת
                </h3>
                <StatusIndicator
                  label="Firebase Pipe"
                  active={firebaseConnected}
                  pulsing
                  icon={Database}
                />
                <StatusIndicator
                  label="AI Brain"
                  active={sabanAIActive}
                  pulsing
                  icon={Brain}
                />
              </div>

              {/* Training Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-[#111b21] text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#00a884]" />
                  אימון AI
                </h3>
                <AITrainingContent
                  language={language}
                  setLanguage={setLanguage}
                  onSyncHistory={() => console.log("Sync history from CSV")}
                  onInjectContext={() => console.log("Inject business context")}
                />
              </div>

              {/* Notification Settings */}
              <div className="space-y-3">
                <h3 className="font-semibold text-[#111b21] text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#00a884]" />
                  התראות
                </h3>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#f0f2f5]">
                  <div className="flex items-center gap-2">
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-[#00a884]" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-[#667781]" />
                    )}
                    <span className="text-sm text-[#111b21]">צליל התראה</span>
                  </div>
                  <Switch
                    checked={soundEnabled}
                    onCheckedChange={setSoundEnabled}
                    className="data-[state=checked]:bg-[#00a884]"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#f0f2f5]">
                  <div className="flex items-center gap-2">
                    {oneSignalEnabled ? (
                      <Bell className="w-4 h-4 text-[#00a884]" />
                    ) : (
                      <BellOff className="w-4 h-4 text-[#667781]" />
                    )}
                    <span className="text-sm text-[#111b21]">Push (OneSignal)</span>
                  </div>
                  <Switch
                    checked={oneSignalEnabled}
                    onCheckedChange={(checked) => {
                      if (checked) requestOneSignalPermission();
                      else setOneSignalEnabled(false);
                    }}
                    className="data-[state=checked]:bg-[#00a884]"
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <h3 className="font-semibold text-[#111b21] text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#00a884]" />
                  פעולות מהירות
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button className="p-3 rounded-xl bg-[#f0f2f5] hover:bg-[#e9edef] transition-colors text-center">
                    <Users className="w-5 h-5 text-[#00a884] mx-auto mb-1" />
                    <span className="text-xs font-medium text-[#111b21]">
                      אנשי קשר
                    </span>
                  </button>
                  <button className="p-3 rounded-xl bg-[#f0f2f5] hover:bg-[#e9edef] transition-colors text-center">
                    <Package className="w-5 h-5 text-[#00a884] mx-auto mb-1" />
                    <span className="text-xs font-medium text-[#111b21]">
                      הזמנות
                    </span>
                  </button>
                  <button className="p-3 rounded-xl bg-[#f0f2f5] hover:bg-[#e9edef] transition-colors text-center">
                    <Database className="w-5 h-5 text-[#00a884] mx-auto mb-1" />
                    <span className="text-xs font-medium text-[#111b21]">
                      מלאי
                    </span>
                  </button>
                  <button className="p-3 rounded-xl bg-[#f0f2f5] hover:bg-[#e9edef] transition-colors text-center">
                    <Globe className="w-5 h-5 text-[#00a884] mx-auto mb-1" />
                    <span className="text-xs font-medium text-[#111b21]">
                      OneSignal
                    </span>
                  </button>
                </div>
              </div>

              {/* Sidor Integration */}
              <div className="space-y-3">
                <h3 className="font-semibold text-[#111b21] text-sm flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#00a884]" />
                  סידור משלוחים
                </h3>
                <Link href="/sidor">
                  <button className="w-full p-4 rounded-xl bg-gradient-to-l from-[#00a884]/10 to-[#f0f2f5] border border-[#00a884]/20 hover:border-[#00a884]/40 transition-colors text-right">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#00a884] flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[#111b21]">Sidor</p>
                        <p className="text-xs text-[#667781]">
                          טבלת סידור משלוחים
                        </p>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-[#667781]" />
                    </div>
                  </button>
                </Link>
              </div>

              {/* Demo Button */}
              <button
                onClick={handleSimulateMessage}
                className="w-full p-3 rounded-xl bg-[#f0f2f5] hover:bg-[#e9edef] transition-colors text-center border-2 border-dashed border-[#e9edef]"
              >
                <Sparkles className="w-5 h-5 text-[#00a884] mx-auto mb-1" />
                <span className="text-xs font-medium text-[#667781]">
                  סימולציה - הודעה נכנסת
                </span>
              </button>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-[#e9edef]">
            <p className="text-center text-xs text-[#667781]">
              Saban OS v2.0 | Production Ready
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  // Sidebar Component
  const Sidebar = () => (
    <div className="w-full md:w-[380px] h-full flex flex-col bg-white border-l border-[#e9edef]">
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between bg-[#f0f2f5]">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-[#00a884]">
            <AvatarFallback className="bg-gradient-to-br from-[#00a884] to-[#128c7e] text-white font-bold text-sm">
              סבן
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-[#111b21] text-sm">Saban OS</p>
            <p className="text-[10px] text-[#00a884] font-medium flex items-center gap-1">
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  firebaseConnected
                    ? "bg-[#00a884] animate-pulse"
                    : "bg-gray-400"
                )}
              />
              {firebaseConnected ? "מחובר" : "מתחבר..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowCommandCenter(true)}
            className="w-10 h-10 rounded-full hover:bg-[#e9edef] flex items-center justify-center transition-colors"
          >
            <Menu className="w-5 h-5 text-[#54656f]" />
          </button>
          <button className="w-10 h-10 rounded-full hover:bg-[#e9edef] flex items-center justify-center transition-colors">
            <MoreVertical className="w-5 h-5 text-[#54656f]" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 bg-white">
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#f0f2f5]">
          <Search className="w-5 h-5 text-[#54656f]" />
          <input
            type="text"
            placeholder="חפש או התחל צאט חדש"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-[#111b21] placeholder:text-[#667781]"
          />
        </div>
      </div>

      {/* AI Status Bar */}
      <div className="px-3 py-2 bg-gradient-to-l from-[#dcf8c6]/30 to-transparent border-b border-[#e9edef]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#00a884]" />
            <span className="text-xs font-medium text-[#111b21]">
              AI Autopilot
            </span>
            {aiEnabled && (
              <Badge className="bg-[#00a884] text-white text-[8px] px-1">
                פעיל
              </Badge>
            )}
          </div>
          <Switch
            checked={aiEnabled}
            onCheckedChange={setAiEnabled}
            className="scale-75 data-[state=checked]:bg-[#00a884]"
          />
        </div>
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1">
        <div>
          {filteredContacts.map((contact) => (
            <ContactItem
              key={contact.id}
              contact={contact}
              isSelected={selectedContact?.id === contact.id}
              onClick={() => handleSelectContact(contact)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  // Chat Window Component
  const ChatWindow = () => (
    <div className="flex-1 flex flex-col bg-[#efeae2] relative">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {selectedContact ? (
        <>
          {/* Chat Header */}
          <div className="h-16 px-4 flex items-center justify-between bg-[#f0f2f5] border-b border-[#e9edef] relative z-10">
            <div className="flex items-center gap-3">
              {/* Back button for mobile */}
              <button
                onClick={() => setMobileView("list")}
                className="md:hidden w-10 h-10 rounded-full hover:bg-[#e9edef] flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-[#54656f]" />
              </button>

              <Sheet>
                <SheetTrigger asChild>
                  <div className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <Avatar className="w-10 h-10 border-2 border-[#00a884]/30">
                        <AvatarImage src={selectedContact.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-[#00a884] to-[#128c7e] text-white font-bold">
                          {selectedContact.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {selectedContact.online && (
                        <div className="absolute bottom-0 left-0 w-3 h-3 bg-[#00a884] rounded-full border-2 border-[#f0f2f5]" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#111b21]">
                        {selectedContact.name}
                      </h3>
                      <p className="text-xs text-[#667781]">
                        {selectedContact.online ? (
                          <span className="text-[#00a884]">מחובר</span>
                        ) : (
                          "לא מחובר"
                        )}
                      </p>
                    </div>
                  </div>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0">
                  <SheetHeader className="p-0">
                    <div className="bg-gradient-to-l from-[#00a884] to-[#128c7e] p-6 text-white text-right">
                      <div className="flex justify-center mb-4">
                        <Avatar className="w-24 h-24 border-4 border-white/30">
                          <AvatarImage src={selectedContact.avatar} />
                          <AvatarFallback className="bg-white/20 text-white font-bold text-3xl">
                            {selectedContact.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <SheetTitle className="text-white text-center text-xl">
                        {selectedContact.name}
                      </SheetTitle>
                      <p className="text-white/80 text-center text-sm mt-1">
                        {selectedContact.phone || "אין מספר טלפון"}
                      </p>
                      <p className="text-white/60 text-center text-xs mt-1">
                        {selectedContact.online ? "מחובר עכשיו" : "לא מחובר"}
                      </p>
                    </div>
                  </SheetHeader>
                  <div className="p-4">
                    <h4 className="font-semibold text-[#111b21] mb-3 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-[#00a884]" />
                      אימון AI לאיש קשר זה
                    </h4>
                    <AITrainingContent
                      language={language}
                      setLanguage={setLanguage}
                      onSyncHistory={() =>
                        console.log("Sync contact history")
                      }
                      onInjectContext={() =>
                        console.log("Inject contact context")
                      }
                    />

                    {/* Media Actions */}
                    <div className="mt-4 pt-4 border-t border-[#e9edef]">
                      <h4 className="font-semibold text-[#111b21] mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#00a884]" />
                        מדיה ומסמכים
                      </h4>
                      <div className="space-y-2">
                        <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#f0f2f5] hover:bg-[#e9edef] transition-colors text-right">
                          <ImageIcon className="w-5 h-5 text-[#00a884]" />
                          <div className="flex-1">
                            <p className="font-medium text-[#111b21] text-sm">
                              תמונות ומדיה
                            </p>
                            <p className="text-xs text-[#667781]">12 פריטים</p>
                          </div>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#f0f2f5] hover:bg-[#e9edef] transition-colors text-right">
                          <Download className="w-5 h-5 text-[#00a884]" />
                          <div className="flex-1">
                            <p className="font-medium text-[#111b21] text-sm">
                              ייצא שיחה
                            </p>
                            <p className="text-xs text-[#667781]">CSV / PDF</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex items-center gap-1">
              <button className="w-10 h-10 rounded-full hover:bg-[#e9edef] flex items-center justify-center transition-colors">
                <Video className="w-5 h-5 text-[#54656f]" />
              </button>
              <button className="w-10 h-10 rounded-full hover:bg-[#e9edef] flex items-center justify-center transition-colors">
                <Phone className="w-5 h-5 text-[#54656f]" />
              </button>
              <button className="w-10 h-10 rounded-full hover:bg-[#e9edef] flex items-center justify-center transition-colors">
                <Search className="w-5 h-5 text-[#54656f]" />
              </button>
              <button className="w-10 h-10 rounded-full hover:bg-[#e9edef] flex items-center justify-center transition-colors">
                <MoreVertical className="w-5 h-5 text-[#54656f]" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 relative z-10">
            <div className="p-4 space-y-3 pb-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Order Panel */}
          <AnimatePresence>
            {parsedOrders.length > 0 && (
              <div className="relative z-10">
                <OrderPanel orders={parsedOrders} />
              </div>
            )}
          </AnimatePresence>

          {/* Input Area */}
          <div className="p-3 bg-[#f0f2f5] relative z-10">
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-full hover:bg-[#e9edef] flex items-center justify-center transition-colors shrink-0">
                <Paperclip className="w-6 h-6 text-[#54656f]" />
              </button>
              <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-full bg-white">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="הקלד הודעה"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 bg-transparent outline-none text-sm text-[#111b21] placeholder:text-[#667781]"
                />
              </div>
              <button
                onClick={handleSend}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0",
                  inputValue.trim()
                    ? "bg-[#00a884] text-white"
                    : "hover:bg-[#e9edef]"
                )}
              >
                {inputValue.trim() ? (
                  <Send className="w-5 h-5" />
                ) : (
                  <Mic className="w-6 h-6 text-[#54656f]" />
                )}
              </button>
            </div>
          </div>
        </>
      ) : (
        // Empty State
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#00a884] to-[#128c7e] flex items-center justify-center mb-6 shadow-lg"
          >
            <Cpu className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-[#111b21] mb-2">
            Saban OS Command Center
          </h2>
          <p className="text-[#667781] text-center max-w-md px-4">
            בחר שיחה מהרשימה כדי להתחיל. המערכת מנתחת הודעות באופן אוטומטי ומזהה
            הזמנות.
          </p>
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#f0f2f5]">
              <Database
                className={cn(
                  "w-4 h-4",
                  firebaseConnected ? "text-[#00a884]" : "text-gray-400"
                )}
              />
              <span className="text-sm text-[#111b21]">Firebase</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#f0f2f5]">
              <Brain
                className={cn(
                  "w-4 h-4",
                  sabanAIActive ? "text-[#00a884]" : "text-gray-400"
                )}
              />
              <span className="text-sm text-[#111b21]">AI Brain</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen w-full bg-[#ece5dd] flex flex-col" dir="rtl">
      {/* Desktop Header Bar */}
      <div className="hidden md:block h-[110px] bg-[#00a884]" />

      {/* Main Container */}
      <div className="flex-1 flex md:px-[3%] md:-mt-[90px] relative">
        <div className="w-full flex bg-white md:shadow-lg md:max-h-[calc(100vh-40px)] overflow-hidden">
          {/* Mobile View */}
          <div className="md:hidden w-full h-full">
            <AnimatePresence mode="wait">
              {mobileView === "list" ? (
                <motion.div
                  key="list"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <Sidebar />
                </motion.div>
              ) : (
                <motion.div
                  key="chat"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <ChatWindow />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop View */}
          <div className="hidden md:flex w-full h-full">
            <Sidebar />
            <ChatWindow />
          </div>
        </div>
      </div>

      {/* Command Center Drawer */}
      <CommandCenterDrawer />
    </div>
  );
}
