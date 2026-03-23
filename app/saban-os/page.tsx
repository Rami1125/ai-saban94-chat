"use client";

import React, { useState, useEffect, useRef } from "react";
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
  ArrowRight,
  Check,
  CheckCheck,
  Clock,
  Bot,
  Cpu,
  Database,
  Globe,
  Zap,
  Settings,
  Users,
  Package,
  MapPin,
  X,
  ChevronLeft,
  Wifi,
  WifiOff,
  Languages,
  History,
  Brain,
  Sparkles,
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

// Types
interface Contact {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  typing?: boolean;
  orderDetected?: boolean;
}

interface Message {
  id: string;
  content: string;
  time: string;
  type: "incoming" | "outgoing";
  status?: "sent" | "delivered" | "read";
  orderData?: ParsedOrder | null;
}

interface ParsedOrder {
  items: string[];
  location?: string;
  quantity?: string;
}

// Mock Data
const mockContacts: Contact[] = [
  {
    id: "1",
    name: "שלמה - מפעל חולון",
    lastMessage: "אני צריך 10 מכולות קוביה לחולון",
    time: "12:45",
    unread: 3,
    online: true,
    orderDetected: true,
  },
  {
    id: "2",
    name: "דוד - סניף תל אביב",
    lastMessage: "ההזמנה הגיעה בזמן, תודה!",
    time: "11:30",
    unread: 0,
    online: true,
  },
  {
    id: "3",
    name: "מרים - רמת גן",
    lastMessage: "מתי האספקה הבאה?",
    time: "10:15",
    unread: 1,
    online: false,
  },
  {
    id: "4",
    name: "יוסי - פתח תקווה",
    lastMessage: "צריך לעדכן את הכתובת",
    time: "אתמול",
    unread: 0,
    online: false,
  },
  {
    id: "5",
    name: "רחל - ראשון לציון",
    lastMessage: "אפשר לקבל הצעת מחיר?",
    time: "אתמול",
    unread: 2,
    online: true,
  },
  {
    id: "6",
    name: "אברהם - בת ים",
    lastMessage: "נהג יצא אליכם עכשיו",
    time: "שלשום",
    unread: 0,
    online: false,
  },
];

const mockMessages: Message[] = [
  {
    id: "1",
    content: "שלום, אני צריך הזמנה דחופה",
    time: "12:30",
    type: "incoming",
  },
  {
    id: "2",
    content: "שלום שלמה, מה תרצה להזמין?",
    time: "12:31",
    type: "outgoing",
    status: "read",
  },
  {
    id: "3",
    content: "אני צריך 10 מכולות קוביה לחולון, למחסן הראשי",
    time: "12:35",
    type: "incoming",
    orderData: {
      items: ["10 מכולות קוביה"],
      location: "חולון - מחסן ראשי",
      quantity: "10",
    },
  },
  {
    id: "4",
    content: "קיבלתי את ההזמנה. אני מעביר לצוות הלוגיסטיקה",
    time: "12:36",
    type: "outgoing",
    status: "read",
  },
  {
    id: "5",
    content: "מתי אפשר לצפות למשלוח?",
    time: "12:40",
    type: "incoming",
  },
  {
    id: "6",
    content: "המשלוח יצא תוך שעתיים. תקבל עדכון כשהנהג יוצא",
    time: "12:42",
    type: "outgoing",
    status: "delivered",
  },
  {
    id: "7",
    content: "מעולה, תודה רבה!",
    time: "12:45",
    type: "incoming",
  },
];

// Status Indicator Component
function StatusIndicator({
  label,
  active,
  pulsing = false,
}: {
  label: string;
  active: boolean;
  pulsing?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f0f2f5]">
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

// Order Panel Component
function OrderPanel({ orders }: { orders: ParsedOrder[] }) {
  if (orders.length === 0) return null;

  return (
    <div className="bg-white border-t border-[#e9edef] p-4">
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
            <div
              key={idx}
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
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// Contact Item Component
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
              contact.unread > 0 ? "text-[#00a884] font-medium" : "text-[#667781]"
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

// Message Bubble Component
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
        {message.orderData && (
          <div className="mb-2 p-2 rounded-lg bg-[#00a884]/10 border border-[#00a884]/30">
            <div className="flex items-center gap-1.5 mb-1">
              <Package className="w-3.5 h-3.5 text-[#00a884]" />
              <span className="text-xs font-semibold text-[#00a884]">
                זוהתה הזמנה
              </span>
            </div>
            {message.orderData.items.map((item, i) => (
              <p key={i} className="text-xs text-[#111b21]">
                {item}
              </p>
            ))}
          </div>
        )}
        <p className="text-[#111b21] text-sm leading-relaxed">
          {message.content}
        </p>
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

// AI Training Sheet Content
function AITrainingContent({
  language,
  setLanguage,
}: {
  language: string;
  setLanguage: (lang: string) => void;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-3">
        <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#f0f2f5] hover:bg-[#e9edef] transition-colors text-right">
          <History className="w-5 h-5 text-[#00a884]" />
          <div className="flex-1">
            <p className="font-medium text-[#111b21]">סנכרן היסטוריה</p>
            <p className="text-xs text-[#667781]">ייבא שיחות קודמות לאימון</p>
          </div>
        </button>
        <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#f0f2f5] hover:bg-[#e9edef] transition-colors text-right">
          <Brain className="w-5 h-5 text-[#00a884]" />
          <div className="flex-1">
            <p className="font-medium text-[#111b21]">הזרק הקשר</p>
            <p className="text-xs text-[#667781]">הוסף מידע עסקי ספציפי</p>
          </div>
        </button>
      </div>
      <div className="pt-2 border-t border-[#e9edef]">
        <p className="text-sm font-medium text-[#111b21] mb-2 flex items-center gap-2">
          <Languages className="w-4 h-4 text-[#00a884]" />
          שפה
        </p>
        <div className="flex gap-2">
          {["אוטומטי", "עברית", "ערבית"].map((lang) => (
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

// Main Component
export default function SabanOSCommandCenter() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(
    mockContacts[0]
  );
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [firebaseConnected] = useState(true);
  const [sabanAIActive] = useState(true);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [language, setLanguage] = useState("אוטומטי");
  const [showCommandCenter, setShowCommandCenter] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract orders from messages
  const parsedOrders = messages
    .filter((m) => m.orderData)
    .map((m) => m.orderData as ParsedOrder);

  // Filter contacts based on search
  const filteredContacts = mockContacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle send message
  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      time: new Date().toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "outgoing",
      status: "sent",
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    inputRef.current?.focus();
  };

  // Handle contact selection
  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setMobileView("chat");
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

              {/* Status Indicators */}
              <div className="space-y-3">
                <h3 className="font-semibold text-[#111b21] text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#00a884]" />
                  סטטוס מערכת
                </h3>
                <StatusIndicator
                  label="Firebase Pipe"
                  active={firebaseConnected}
                  pulsing
                />
                <StatusIndicator
                  label="Saban AI"
                  active={sabanAIActive}
                  pulsing
                />
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
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-[#e9edef]">
            <p className="text-center text-xs text-[#667781]">
              Saban OS v2.0 | Powered by AI
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
              <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse" />
              מחובר
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
                        {selectedContact.online ? "מחובר עכשיו" : "לא מחובר"}
                      </p>
                    </div>
                  </SheetHeader>
                  <div className="p-4">
                    <h4 className="font-semibold text-[#111b21] mb-3 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-[#00a884]" />
                      אימון AI
                    </h4>
                    <AITrainingContent
                      language={language}
                      setLanguage={setLanguage}
                    />
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
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Order Panel */}
          {parsedOrders.length > 0 && (
            <div className="relative z-10">
              <OrderPanel orders={parsedOrders} />
            </div>
          )}

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
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#00a884] to-[#128c7e] flex items-center justify-center mb-6 shadow-lg">
            <Cpu className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#111b21] mb-2">
            Saban OS Command Center
          </h2>
          <p className="text-[#667781] text-center max-w-md px-4">
            בחר שיחה מהרשימה כדי להתחיל. המערכת מנתחת הודעות באופן אוטומטי ומזהה
            הזמנות.
          </p>
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
