"use client";
import { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface ModalProps {
  tableName: string;
  columns: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function DynamicModal({ tableName, columns, onClose, onSuccess }: ModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // נסנן עמודות מערכת שלא צריכות הזנה ידנית
  const ignoredColumns = ['id', 'created_at', 'updated_at'];
  const editableColumns = columns.filter(col => !ignoredColumns.includes(col));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from(tableName)
      .insert([formData]);

    if (!error) {
      onSuccess();
      onClose();
    } else {
      alert("שגיאה בשמירת הנתונים: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-900">הוספת רשומה חדשה</h3>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest italic">{tableName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto px-2 custom-scrollbar">
            {editableColumns.map((col) => (
              <div key={col} className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase px-1">
                  {col.replace('_', ' ')}
                </label>
                <input
                  required
                  type={col.includes('price') || col.includes('stock') ? 'number' : 'text'}
                  placeholder={`הזן ${col}...`}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                />
              </div>
            ))}
          </div>

          <div className="pt-6 flex gap-3">
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl font-black gap-2 shadow-lg shadow-blue-100"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
              שמור רשומה במאגר
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="px-8 h-14 rounded-2xl font-black border-slate-200"
            >
              ביטול
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
