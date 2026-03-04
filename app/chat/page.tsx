import { ChatWindow } from "@/components/ChatWindow";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export default async function IntegratedChatPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // שליפת פרטי העסק להזרקה למיתוג
  const { data: business } = await supabase
    .from('business_info')
    .select('*')
    .single();

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
      <div className="w-full max-w-4xl space-y-4 mt-10">
        <header className="text-center">
          <h1 className="text-3xl font-black text-[#0B2C63]">
            {business?.name || "ח. סבן חומרי בניין"}
          </h1>
          <p className="text-slate-500 font-bold">מערכת מידע ושירות לקוחות אוטומטית</p>
        </header>

        {/* חלון הצ'אט - כבר מחובר ל-Context ששולף מה-API החדש */}
        <ChatWindow />

        <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-400 font-bold uppercase">
          <div className="bg-white p-2 rounded-xl border flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            מחובר למסד נתונים: PUBLIC
          </div>
          <div className="bg-white p-2 rounded-xl border flex items-center justify-end">
            SABAN-DB-v2.1
          </div>
        </div>
      </div>
    </main>
  );
}
