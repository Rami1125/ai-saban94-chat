"use client";
import React, { useState, useEffect } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, Save, Trash2, Play, CheckCircle, 
  AlertCircle, MessageSquare, Bot, Mail, Bell, Edit3
} from "lucide-react";
import { toast, Toaster } from "sonner";

export default function AiTrainer() {
  const [rules, setRules] = useState<any[]>([]);
  const [newRule, setNewRule] = useState({ name: '', text: '', cat: 'logic' });
  const [testQuery, setTestQuery] = useState("");
  const [simulationResult, setSimulationResult] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = getSupabase();

  useEffect(() => { fetchRules(); }, []);

  const fetchRules = async () => {
    const { data } = await supabase.from('ai_rules').select('*').order('created_at', { ascending: false });
    setRules(data || []);
  };

  const addRule = async () => {
    if (!newRule.name || !newRule.text) return toast.error("מלא שם ותוכן להנחיה");
    const { error } = await supabase.from('ai_rules').insert([{ 
      rule_name: newRule.name, 
      instruction: newRule.text,
      category: newRule.cat 
    }]);
    if (!error) {
      toast.success("החוק נשמר בזיכרון של ג'ימני");
      setNewRule({ name: '', text: '', cat: 'logic' });
      fetchRules();
    }
  };

  const deleteRule = async (id: string) => {
    const { error } = await supabase.from('ai_rules').delete().eq('id', id);
    if (!error) {
      toast.info("החוק נמחק מהמערכת");
      fetchRules();
    }
  };

  // סימולטור בזמן אמת
  const runSimulation = async () => {
    setLoading(true);
    setSimulationResult("ג'ימני בודק את ספר החוקים...");
    
    // כאן אנחנו שולחים את השאילתה ל-API יחד עם החוקים החדשים
    const res = await fetch('/api/ai/consult', {
      method: 'POST',
      body: JSON.stringify({ question: testQuery, testMode: true })
    });
    const data = await res.json();
    setSimulationResult(data.answer);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
      <Toaster position="top-center" richColors />
      
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-[#0B2C63] p-8 rounded-[2.5rem] text-white shadow-2xl">
          <div>
            <h1 className="text-3xl font-black italic flex items-center gap-3">
              <Brain className="text-blue-400" /> מרכז חינוך המוח - SABAN OS
            </h1>
            <p className="text-blue-200 font-bold mt-2 text-sm">נהל את חוקי הלוגיסטיקה והתראות ה-AI</p>
          </div>
          <Bot size={48} className="text-blue-400 opacity-50 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* עמודה 1: הוספת חוקים */}
          <Card className="rounded-[2rem] border-none shadow-xl bg-white p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Edit3 className="text-blue-600" /> הוספת הנחיה חדשה
              </CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <Input 
                placeholder="שם החוק (למשל: הגבלת סניף חכמת)" 
                value={newRule.name}
                onChange={e => setNewRule({...newRule, name: e.target.value})}
                className="rounded-xl h-12 font-bold"
              />
              <textarea 
                placeholder="כתוב את ההנחיה המפורטת לג'ימני..." 
                value={newRule.text}
                onChange={e => setNewRule({...newRule, text: e.target.value})}
                className="w-full h-32 p-4 rounded-xl border border-slate-200 font-bold focus:ring-2 ring-blue-500 outline-none"
              />
              <div className="flex gap-2">
                <Button onClick={addRule} className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-lg gap-2 shadow-lg">
                  <Save size={20} /> שמור ב-DNA
                </Button>
              </div>
            </div>
          </Card>

          {/* עמודה 2: סימולטור בזמן אמת */}
          <Card className="rounded-[2rem] border-none shadow-xl bg-slate-900 text-white p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <Play className="text-green-400" /> סימולטור "מוח"
              </CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div className="relative">
                <Input 
                  placeholder="שאל את המוח שאלה לבדיקה..." 
                  value={testQuery}
                  onChange={e => setTestQuery(e.target.value)}
                  className="rounded-xl h-14 bg-white/10 border-white/20 text-white pr-4 font-bold"
                />
                <Button 
                  onClick={runSimulation}
                  disabled={loading}
                  className="absolute left-2 top-2 h-10 bg-green-500 hover:bg-green-400 text-slate-900 font-black rounded-lg"
                >
                  בדוק
                </Button>
              </div>
              
              <div className="bg-black/40 rounded-2xl p-6 min-h-[160px] border border-white/5 relative">
                <p className="text-xs font-black text-green-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Bot size={14}/> תשובת ה-AI לפי החוקים:
                </p>
                <div className="text-sm font-bold leading-relaxed italic">
                  {simulationResult || "המתן לשאילתה..."}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-white/10 text-white rounded-xl gap-2 text-xs">
                  <Mail size={14} /> שלח פגישה למייל
                </Button>
                <Button variant="outline" className="flex-1 border-white/10 text-white rounded-xl gap-2 text-xs">
                  <Bell size={14} /> צור תזכורת
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* טבלת חוקים פעילה */}
        <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden">
          <div className="bg-slate-100 p-4 font-black text-slate-600 flex justify-between">
            <span>ספר החוקים הפעיל של ח. סבן</span>
            <Badge className="bg-blue-600">{rules.length} חוקים</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-slate-50 text-slate-400 text-xs">
                  <th className="p-4">שם ההנחיה</th>
                  <th className="p-4">תוכן החוק (DNA)</th>
                  <th className="p-4 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(rule => (
                  <tr key={rule.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-black text-blue-900">{rule.rule_name}</td>
                    <td className="p-4 text-sm text-slate-600 font-bold max-w-md">{rule.instruction}</td>
                    <td className="p-4 text-center">
                      <Button onClick={() => deleteRule(rule.id)} variant="ghost" className="text-red-400 hover:bg-red-50">
                        <Trash2 size={18} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
