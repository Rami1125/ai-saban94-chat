import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = 'force-dynamic';

export default async function StreamMonitorPage() {
  if (!adminDb) return <div className="p-10 text-red-500">חסר חיבור ל-Firebase</div>;

  // שליפת 10 הודעות אחרונות מכל צד
  const [inSnap, outSnap] = await Promise.all([
    adminDb.ref('incoming').limitToLast(10).once('value'),
    adminDb.ref('outgoing').limitToLast(10).once('value')
  ]);

  const incoming = inSnap.val() ? Object.values(inSnap.val()).reverse() : [];
  const outgoing = outSnap.val() ? Object.values(outSnap.val()).reverse() : [];

  return (
    <div className="min-h-screen bg-[#0b141a] text-white p-8 font-sans" dir="rtl">
      <h1 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4">🚀 Saban-OS: ניטור צינור JONI</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* הודעות נכנסות */}
        <div className="bg-[#111b21] rounded-xl p-4 border border-blue-500/20">
          <h2 className="text-blue-400 font-bold mb-4 flex items-center gap-2">📩 הודעות נכנסות (WhatsApp)</h2>
          <div className="space-y-3">
            {incoming.map((msg: any, i: number) => (
              <div key={i} className="p-3 bg-[#202c33] rounded border-r-4 border-blue-500 text-sm">
                <p className="opacity-50 text-xs">מאת: {msg.from}</p>
                <p>{msg.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* תשובות AI */}
        <div className="bg-[#111b21] rounded-xl p-4 border border-emerald-500/20">
          <h2 className="text-emerald-400 font-bold mb-4 flex items-center gap-2">🤖 מענה AI אוטומטי</h2>
          <div className="space-y-3">
            {outgoing.map((msg: any, i: number) => (
              <div key={i} className="p-3 bg-[#005c4b] rounded border-r-4 border-emerald-400 text-sm">
                <p className="opacity-70 text-xs">אל: {msg.to}</p>
                <p>{msg.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
