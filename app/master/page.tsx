"use client";
import React, { useState, useEffect } from 'react';
import { 
  Zap, ShieldCheck, Trash2, Edit3, Plus, 
  Search, Eye, MessageSquare, AlertTriangle, 
  CheckCircle, Play, Send, Calendar, Crown
} from "lucide-react";
import { SabanSentinel } from "@/lib/ai/precision-engine"; // הקובץ שיצרנו קודם

export default function SabanMasterOS() {
  // --- State ניהול חוקים ---
  const [rules, setRules] = useState([
    { id: '1', instruction: 'חכמת מוגבל לסניף החרש 10 בלבד.', category: 'logistics' },
    { id: '2', instruction: 'בכל שאלה על סיקה, הצג כרטיס אלי מסיקה.', category: 'sales' },
    { id: '3', instruction: 'בר (אורניל) תמיד לסטרומה 4 הרצליה.', category: 'vip' }
  ]);
  const [newRule, setNewRule] = useState("");

  // --- State סימולטור ומלשינון ---
  const [simInput, setSimInput] = useState("");
  const [simOutput, setSimOutput] = useState("");
  const [snitchReports, setSnitchReports] = useState<string[]>([]);

  // --- לוגיקה: הרצת סימולטור ובדיקת המלשינון ---
  const runSimulation = () => {
    // מדמה תשובת AI (כאן יבוא החיבור ל-API האמיתי שלך)
    let response = `שלום, לגבי ${simInput}, אנחנו בח.סבן נותנים לך מעטפת מלאה...`;
    
    // הפעלת ה-Sentinel (המלשינון)
    const sentinel = new SabanSentinel(rules.map(r => ({ ...r, id: r.id, category: r.category as any })));
    const auditFlags = sentinel.auditResponse(response, { client: simInput.includes("בר") ? "בר" : "" });
    
    setSimOutput(response);
    setSnitchReports(auditFlags);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 md:p-10 font-sans" dir="rtl">
      
      {/* Header יוקרתי */}
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-center bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 rounded-[3rem] border border-blue-500/20 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="bg-blue-600 p-4 rounded-3xl shadow-[0_0_30px_rgba(37,99,235,0.4)]">
            <Crown size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter italic">SABAN MASTER OS</h1>
            <p className="text-blue-400 font-bold flex items-center gap-2">
              <ShieldCheck size={18} /> ניהול חוקים, סימולטור ומלשינון דיוק
            </p>
          </div>
        </div>
        <div className="flex gap-4 mt-6 md:mt-0">
          <div className="bg-slate-800 px-6 py-3 rounded-2xl border border-slate-700">
            <span className="text-xs block text-slate-500 font-bold uppercase">סה"כ חוקים</span>
            <span className="text-2xl font-black text-white">{rules.length}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* עמודה ימנית: ניהול חוקים (6/12) */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-[#0f172a] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <Zap className="text-yellow-400" /> ספר החוקים (DNA)
              </h2>
              <button className="bg-blue-600 hover:bg-blue-500 p-2 rounded-xl transition-colors">
                <Plus size={20} />
              </button>
            </div>

            {/* טבלת חוקים */}
            <div className="overflow-hidden rounded-2xl border border-slate-800">
              <table className="w-full text-right">
                <thead className="bg-slate-800/50 text-slate-400 text-xs font-bold uppercase">
                  <tr>
                    <th className="p-4">הנחיה</th>
                    <th className="p-4 w-24 text-center">קטגוריה</th>
                    <th className="p-4 w-32 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-sm font-medium">{rule.instruction}</td>
                      <td className="p-4 text-center">
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-bold uppercase">
                          {rule.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button className="p-2 text-slate-400 hover:text-white"><Edit3 size={16} /></button>
                          <button 
                            onClick={() => setRules(rules.filter(r => r.id !== rule.id))}
                            className="p-2 text-slate-400 hover:text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* עמודה שמאלית: סימולטור ומלשינון (5/12) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* סימולטור ה-DNA */}
          <section className="bg-gradient-to-b from-slate-900 to-black border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
            <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-blue-400">
              <Play size={20} /> סימולטור "מוח"
            </h2>
            <textarea 
              value={simInput}
              onChange={(e) => setSimInput(e.target.value)}
              placeholder="הדבק פנייה של לקוח לבדיקה..."
              className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm focus:border-blue-500 outline-none transition-all mb-4"
            />
            <button 
              onClick={runSimulation}
              className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-lg"
            >
              הרץ בדיקה לוגית
            </button>
            
            {simOutput && (
              <div className="mt-6 p-4 bg-black/40 border border-slate-800 rounded-2xl animate-in fade-in">
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase italic">פלט המוח:</p>
                <p className="text-sm leading-relaxed text-slate-300">{simOutput}</p>
              </div>
            )}
          </section>

          {/* המלשינון - דוח דיוק ומקור פניות */}
          <section className="bg-red-500/5 border border-red-500/20 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <AlertTriangle size={80} className="text-red-500" />
            </div>
            <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-red-400">
              <Eye size={20} /> המלשינון (Audit Log)
            </h2>
            
            <div className="space-y-4">
              {snitchReports.length === 0 ? (
                <div className="flex items-center gap-3 text-green-400 bg-green-400/10 p-4 rounded-2xl border border-green-400/20">
                  <CheckCircle size={18} />
                  <span className="font-bold text-sm">ביצוע מושלם. לא נמצאו חריגות DNA.</span>
                </div>
              ) : (
                snitchReports.map((report, i) => (
                  <div key={i} className="flex items-start gap-3 text-red-400 bg-red-400/10 p-4 rounded-2xl border border-red-400/20">
                    <AlertTriangle size={18} className="shrink-0 mt-1" />
                    <span className="font-bold text-sm leading-tight">{report}</span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-red-500/10">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">פניות אחרונות שנסרקו</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold bg-white/5 p-2 rounded-lg">
                  <span>איציק (משרד)</span>
                  <span className="text-slate-500">לפני 2 דק'</span>
                </div>
                <div className="flex justify-between text-xs font-bold bg-white/5 p-2 rounded-lg">
                  <span>בר (אורניל)</span>
                  <span className="text-slate-500">לפני 15 דק'</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
