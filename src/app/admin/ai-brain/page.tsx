"use client";

import React, { useState } from "react";
import { Brain, Save, Settings, MessageSquare, Phone, Wifi, BatteryCharging, ExternalLink, Bot, Database } from "lucide-react";
import { SafeIcon } from "@/components/SafeIcon";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// --- קומפוננטת סימולטור אייפון ---
function IphoneSimulator({ children }: { children: React.ReactNode }) {
  const currentTime = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="relative mx-auto border-gray-900 bg-gray-900 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl overflow-hidden group">
      {/* Notch */}
      <div className="w-[120px] h-[18px] bg-gray-900 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute z-20"></div>
      
      {/* כפתורי צד (מדומים) */}
      <div className="h-[46px] w-[3px] bg-gray-900 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
      <div className="h-[46px] w-[3px] bg-gray-900 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
      <div className="h-[64px] w-[3px] bg-gray-900 absolute -right-[17px] top-[142px] rounded-r-lg"></div>

      {/* מסך הפנימי */}
      <div className="rounded-[1.3rem] overflow-hidden w-full h-full bg-slate-50 flex flex-col" dir="rtl">
        {/* Status Bar */}
        <div className="h-10 px-6 pt-2 flex justify-between items-center text-xs font-medium text-black z-10 relative">
          <span>{currentTime}</span>
          <div className="flex items-center gap-1">
            <SafeIcon icon={Wifi} size={14} />
            <SafeIcon icon={BatteryCharging} size={14} className="text-emerald-600" />
          </div>
        </div>
        
        {/* תוכן הצ'אט (מדומה) */}
        <div className="flex-1 p-4 bg-slate-100 overflow-y-auto space-y-3">
          {children}
        </div>
        
        {/* Input Bar (מדומה) */}
        <div className="h-14 bg-white border-t p-2 flex items-center gap-2">
          <div className="flex-1 h-10 bg-slate-100 rounded-full px-4 text-sm text-slate-500 flex items-center justify-end">
            הקלד הודעה...
          </div>
          <div className="w-10 h-10 bg-[#0B2C63] rounded-full flex items-center justify-center text-white">
            <SafeIcon icon={MessageSquare} size={18} />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- הודעת צ'אט מדומה (לסימולטור) ---
function MockMessage({ sender, text }: { sender: 'bot' | 'user'; text: string }) {
  const isBot = sender === 'bot';
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[80%] p-3 rounded-xl text-sm ${isBot ? 'bg-white text-slate-900 rounded-br-none shadow-sm' : 'bg-[#0B2C63] text-white rounded-bl-none'}`}>
        {text}
      </div>
    </div>
  );
}

// --- הדף הראשי: ניהול מוח AI ---
export default function AiBrainStudioPage() {
  const [systemPrompt, setSystemPrompt] = useState(
    "אתה העוזר החכם של חברת 'ח. סבן חומרי בניין'. התפקיד שלך הוא לתת שירות מהיר, מקצועי ואדיב ללקוחות המעוניינים ברכישת חומרי בניין. עליך להתבסס אך ורק על המידע שסופק לך ולסייע להם למצוא מוצרים, לבדוק מלאי ולקבל הצעות מחיר."
  );

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50 min-h-screen text-right" dir="rtl">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#0B2C63]/10 rounded-2xl text-[#0B2C63]">
              <SafeIcon icon={Brain} size={28} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-950">AI Brain Studio</h1>
          </div>
          <p className="text-slate-600 mt-2 max-w-lg">מרכז השליטה בבינה המלאכותית של ח. סבן. נהל את ההנחיות, הידע וממשק הצ''אט המדמה.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* לינק קצה לצד הלקוח */}
          <a 
            href="https://ai-saban94-chat.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 md:flex-initial"
          >
            <Button variant="outline" className="w-full gap-2 text-slate-700 border-slate-300 hover:bg-slate-100">
              לצד הלקוח <SafeIcon icon={ExternalLink} size={16} />
            </Button>
          </a>
          <Button className="flex-1 md:flex-initial bg-[#0B2C63] hover:bg-blue-800 gap-2">
            שמור שינויים <SafeIcon icon={Save} size={18} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* הגדרות קונטקסט (2/3 מהרוחב) */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-100/50 border-b border-slate-200">
              <CardTitle className="text-xl font-bold flex items-center gap-2.5">
                <SafeIcon icon={Settings} className="text-blue-600" />
                הנחיות מערכת יסודיות (System Prompt)
              </CardTitle>
              <CardDescription>
                הגדר ל-AI את "אישיותו", גבולות הגזרה שלו, ואופן ההתנהגות מול הלקוח.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <Textarea 
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="הכנס את הנחיות המערכת כאן..." 
                className="min-h-[250px] bg-white border-slate-200 text-sm leading-relaxed resize-none focus:ring-2 focus:ring-[#0B2C63]"
              />
              <p className="text-xs text-slate-400 mt-3">קונטקסט זה נשלח ל-Model בכל תחילת שיחה.</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-slate-200">
             <CardHeader className="bg-slate-100/50 border-b border-slate-200">
              <CardTitle className="text-xl font-bold flex items-center gap-2.5">
                <SafeIcon icon={Database} className="text-emerald-600" />
                מאגר ידע ייעודי (ai_knowledge_base)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 flex justify-between items-center">
              <p className="text-slate-700">כאן ניתן לנהל את הברכות והתשובות לשאלות אקראיות של לקוחות.</p>
              <Button variant="secondary" className="gap-2">
                ערוך שאלות/תשובות <SafeIcon icon={MessageSquare} size={16} />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* סימולטור iPhone (1/3 מהרוחב) */}
        <div className="xl:col-span-1 flex justify-center items-start pt-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <IphoneSimulator>
              <MockMessage sender="bot" text="שלום! ברוכים הבאים ל-ח. סבן חומרי בניין. איך אני יכול לעזור לך היום?" />
              <MockMessage sender="user" text="היי, אני צריך בלה חול למחר בבוקר." />
              <MockMessage sender="bot" text="מצוין! חול לבן או חול ים? יש לנו גם טיט מוכן. לאיזו כתובת המשלוח דרוש?" />
              <MockMessage sender="user" text="חול לבן, לרחוב הבנאי 15." />
              <MockMessage sender="bot" text="הבנתי, חול לבן לרחוב הבנאי 15. אני בודק זמינות מלאי ומחיר מעודכן כולל הובלה..." />
            </IphoneSimulator>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
