"use client";
import React, { useEffect, useState } from 'react';
import { getSupabase } from "@/lib/supabase";

export default function Diagnostics() {
  const [logs, setLogs] = useState<any[]>([]);
  const supabase = getSupabase();

  const fetchLogs = async () => {
    const { data } = await supabase.from('saban_debug_logs').select('*').order('created_at', { ascending: false }).limit(20);
    setLogs(data || []);
  };

  const testLog = async () => {
    await supabase.from('saban_debug_logs').insert([{ step: "MANUAL_TEST", payload: { msg: "בדיקת קשר!" } }]);
    fetchLogs();
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="p-8 font-mono bg-black text-green-500 min-h-screen" dir="rtl">
      <h1 className="text-2xl mb-4 border-b border-green-800 pb-2">מכ"ם לוגים - סבן OS</h1>
      <button onClick={testLog} className="bg-green-900 text-white px-4 py-2 rounded mb-4 hover:bg-green-700">בצע בדיקת דופק 💓</button>
      <div className="space-y-2">
        {logs.map(log => (
          <div key={log.id} className="border border-green-900 p-2 text-xs">
            <span className="text-gray-500">[{new Date(log.created_at).toLocaleTimeString()}]</span>
            <span className="mx-2 font-bold">[{log.step}]</span>
            <pre className="mt-1 text-gray-300">{JSON.stringify(log.payload)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
