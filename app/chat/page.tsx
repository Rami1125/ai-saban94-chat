"use client"; // העברה ל-Client Component כדי למנוע קריסת SSR

import { ChatWindow } from "@/components/ChatWindow";
import { useConfig } from "@/context/BusinessConfigContext";

export default function IntegratedChatPage() {
  const config = useConfig();

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
      <div className="w-full max-w-4xl space-y-4 mt-10">
        <header className="text-center">
          <h1 className="text-3xl font-black text-[#0B2C63]">
            {config.businessName}
          </h1>
          <p className="text-slate-500 font-bold italic">מערכת מידע ושירות לקוחות</p>
        </header>

        <ChatWindow />

        <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-400 font-bold uppercase">
          <div className="bg-white p-2 rounded-xl border flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            LIVE DATABASE CONNECTED
          </div>
          <div className="bg-white p-2 rounded-xl border flex items-center justify-end">
            v{process.env.NEXT_PUBLIC_VERSION || '2.2.0'}
          </div>
        </div>
      </div>
    </main>
  );
}
