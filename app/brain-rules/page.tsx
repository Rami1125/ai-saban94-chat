"use client";
import React, { useState, useEffect } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, Plus, Save, Trash2, ShieldCheck, 
  AlertCircle, Scale, Brain, Zap, Loader2 
} from "lucide-react";
import { toast, Toaster } from "sonner";

export default function BrainRulesStudio() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [newRule, setNewRule] = useState({
    rule_name: '',
    rule_description: '',
    category: 'logistics',
    priority: 1
  });

  const supabase = getSupabase();

  useEffect(() => { fetchRules(); }, []);

  const fetchRules = async () => {
    setLoading(true);
    const { data } = await supabase.from('saban_brain_rules').select('*').order('priority', { ascending: false });
    setRules(data || []);
    setLoading(false);
  };

  const saveRule = async () => {
    if (!newRule.rule_name || !newRule.rule_description) return toast.error("מלא שם ותיאור לחוק");
    setSaving(true);
    const { error } = await supabase.from('saban_brain_rules').insert([newRule]);
    if (!error) {
      toast.success("החוק נוסף לספר החוקים");
      setNewRule({ rule_name: '', rule_description: '', category: 'logistics', priority: 1 });
      fetchRules();
    }
    setSaving(false);
  };

  const deleteRule = async (id: string) => {
    const { error } = await supabase.from('saban_brain_rules').delete().eq('id', id);
    if (!error) {
      toast.success("החוק נמחק");
      fetchRules();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-[#0B2C63] rounded-[2rem] text-white shadow-xl">
            <BookOpen size={30} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#0B2C63]">ספר החוקים של SabanOS</h1>
            <p className="text-slate-400 font-bold">הנחיות הפעולה של המוח הדיגיטלי</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border shadow-sm">
           <Brain className="text-blue-500 animate-pulse" size={20}/>
           <span className="font-black text-sm text-slate-700">המוח מסונכרן</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid gap-8">
        {/* טופס הוספת חוק חדש */}
        <Card className="p-8 rounded-[2.5rem] border-none shadow-xl bg-white">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-slate-800">
            <Plus size={20} className="text-blue-600"/> הוספת הנחיה חדשה
          </h2>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                placeholder="שם החוק (למשל: תעדוף דחיפות)" 
                value={newRule.rule_name}
                onChange={e => setNewRule({...newRule, rule_name: e.target.value})}
                className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold"
              />
              <select 
                value={newRule.category}
                onChange={e => setNewRule({...newRule, category: e.target.value})}
                className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold px-4 outline-none">
                <option value="logistics">לוגיסטיקה/סידור נהגים</option>
                <option value="urgent">מקרים דחופים</option>
                <option value="customer_service">שירות לקוחות</option>
              </select>
            </div>
            <Textarea 
              placeholder="כתוב כאן את ההנחיה המדויקת למוח..." 
              value={newRule.rule_description}
              onChange={e => setNewRule({...newRule, rule_description: e.target.value})}
              className="h-32 rounded-2xl border-slate-100 bg-slate-50 font-medium p-4"
            />
            <Button onClick={saveRule} disabled={saving} className="h-14 bg-[#0B2C63] hover:bg-blue-900 rounded-2xl font-black text-lg gap-2 shadow-lg">
              {saving ? <Loader2 className="animate-spin"/> : <Save size={20}/>}
              שמור חוק במערכת
            </Button>
          </div>
        </Card>

        {/* רשימת החוקים הקיימים */}
        <div className="space-y-4">
          <h3 className="font-black text-slate-500 px-2 flex items-center gap-2 uppercase text-xs tracking-widest">
            <ShieldCheck size={16}/> הנחיות פעילות ({rules.length})
          </h3>
          {loading ? (
            <div className="text-center py-10 text-slate-400 font-bold italic">טוען ספר חוקים...</div>
          ) : rules.map((rule) => (
            <Card key={rule.id} className="p-6 rounded-[2rem] border-none shadow-sm bg-white group hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-blue-600">
                    <Scale size={24}/>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-lg text-slate-800">{rule.rule_name}</span>
                      <Badge className="bg-blue-50 text-blue-600 border-none text-[10px]">{rule.category}</Badge>
                    </div>
                    <p className="text-slate-500 font-medium leading-relaxed max-w-2xl">{rule.rule_description}</p>
                  </div>
                </div>
                <Button onClick={() => deleteRule(rule.id)} variant="ghost" className="text-slate-300 hover:text-red-500 rounded-xl">
                  <Trash2 size={20}/>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
