"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, Save, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DynamicModalProps {
  tableName: string;
  columns: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function DynamicModal({ tableName, columns, onClose, onSuccess }: DynamicModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // סינון עמודות שלא אמורות להיות מוזנות ידנית
  const ignoredColumns = ["id", "created_at", "updated_at", "user_id"];
  const displayColumns = columns.length > 0 
    ? columns.filter(col => !ignoredColumns.includes(col))
    : ["setting_name", "setting_value", "description"]; // שדות ברירת מחדל אם הטבלה ריקה

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(formData).length === 0) {
      setError("אנא מלא לפחות שדה אחד");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: submitError } = await supabase
        .from(tableName)
        .insert([formData]);

      if (submitError) throw submitError;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Submission Error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black text-slate-900">הוספת רשומה חדשה</h2>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">{tableName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
            {displayColumns.map((col) => (
              <div key={col} className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mr-1">
                  {col.replace(/_/g, ' ')}
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder={`הזן ${col}...`}
                  onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold border border-red-100">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl font-black text-white shadow-lg shadow-blue-200 gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              שמור רשומה במאגר
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="h-14 px-8 rounded-2xl font-black border-slate-200 text-slate-600"
            >
              ביטול
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
