"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Calculator, Truck, Package, 
  ChevronLeft, Ruler, Info, ShoppingCart 
} from "lucide-react";

export const ActionOverlays = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [overlayType, setOverlayType] = useState<'calculator' | 'quote' | 'inventory' | null>(null);
  const [sqm, setSqm] = useState<string>("");
  const [calculation, setCalculation] = useState<any>(null);

  // האזנה לאירועים גלובליים מהצ'אט (כמו שלחצנו בסידבר)
  useEffect(() => {
    const handleOpen = (e: any) => {
      setOverlayType(e.detail.type);
      setIsOpen(true);
    };
    window.addEventListener('open-action-overlay', handleOpen);
    return () => window.removeEventListener('open-action-overlay', handleOpen);
  }, []);

  // לוגיקת מחשבון גבס מקצועי - ח. סבן 2026
  const calculateMaterials = (val: string) => {
    const area = parseFloat(val);
    if (isNaN(area) || area <= 0) return setCalculation(null);

    // נוסחאות תקן גבס (לוחות 1.2/2.6 = 3.12 מ"ר ללוח)
    const results = {
      boards: Math.ceil(area / 3.12),
      studs: Math.ceil(area * 1.8), // ניצבים (ממוצע 0.6 מ')
      tracks: Math.ceil(area * 0.8), // מסלולים
      screws: Math.ceil(area * 30),  // ברגים (30 למ"ר)
      jointCompound: (area * 0.7).toFixed(1) // שפכטל בק"ג
    };
    setCalculation(results);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end p-4 pointer-events-none">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
          />

          {/* Side Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-[400px] h-[90vh] bg-white dark:bg-zinc-900 shadow-2xl rounded-[32px] border border-slate-200 dark:border-zinc-800 pointer-events-auto overflow-hidden flex flex-col"
          >
            {/* Header */}
            <header className="p-6 border-b flex justify-between items-center bg-slate-50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-xl text-white">
                  {overlayType === 'calculator' && <Calculator size={20} />}
                  {overlayType === 'inventory' && <Package size={20} />}
                </div>
                <div>
                  <h3 className="font-black text-slate-800 dark:text-white">
                    {overlayType === 'calculator' ? 'מחשבון כמויות גבס' : 'פרטי הזמנה'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">H. Saban Logistics Tool</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {overlayType === 'calculator' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                    <label className="block text-xs font-bold text-blue-600 mb-2">הזן מ"ר של הקיר/תקרה:</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={sqm}
                        onChange={(e) => { setSqm(e.target.value); calculateMaterials(e.target.value); }}
                        className="w-full p-4 bg-white dark:bg-zinc-800 rounded-xl text-2xl font-black outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="0"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-300 italic">SQM</span>
                    </div>
                  </div>

                  {calculation && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-2 gap-3"
                    >
                      <ResultCard icon="🪜" label="לוחות גבס" value={calculation.boards} unit="יח'" color="blue" />
                      <ResultCard icon="📏" label="ניצבים" value={calculation.studs} unit="יח'" color="indigo" />
                      <ResultCard icon="🛤️" label="מסלולים" value={calculation.tracks} unit="יח'" color="slate" />
                      <ResultCard icon="🔩" label="ברגים" value={calculation.screws} unit="יח'" color="orange" />
                      <div className="col-span-2 bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 flex justify-between items-center">
                        <span className="text-sm font-bold text-emerald-700">שפכטל / קלסימו:</span>
                        <span className="font-black text-emerald-600 text-lg">{calculation.jointCompound} ק"ג</span>
                      </div>
                    </motion.div>
                  )}

                  <div className="p-4 bg-slate-50 dark:bg-zinc-800 rounded-2xl flex items-start gap-3">
                    <Info size={16} className="text-slate-400 mt-1" />
                    <p className="text-[11px] text-slate-500 leading-relaxed italic">
                      החישוב מבוסס על לוח סטנדרטי 1.2/2.6 מ'. מומלץ להוסיף 10% פחת להזמנה הסופית בח. סבן.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <footer className="p-6 border-t bg-slate-50 dark:bg-zinc-800/30">
              <button 
                onClick={() => {
                  // שליחת התוצאות חזרה לצ'אט
                  const text = `חישוב עבור ${sqm} מ"ר גבס:\n- לוחות: ${calculation?.boards}\n- ניצבים: ${calculation?.studs}\n- מסלולים: ${calculation?.tracks}`;
                  window.dispatchEvent(new CustomEvent('send-to-chat', { detail: { text } }));
                  setIsOpen(false);
                }}
                className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl active:scale-95"
              >
                <ShoppingCart size={18} />
                הוסף תוצאות להזמנה
              </button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ResultCard = ({ icon, label, value, unit, color }: any) => (
  <div className={`p-4 bg-${color}-50 dark:bg-${color}-900/10 rounded-2xl border border-${color}-100 dark:border-${color}-800`}>
    <div className="text-xl mb-1">{icon}</div>
    <div className="text-[10px] font-bold text-slate-400 uppercase">{label}</div>
    <div className="flex items-baseline gap-1">
      <span className="text-xl font-black text-slate-800 dark:text-white">{value}</span>
      <span className="text-[10px] font-medium text-slate-500">{unit}</span>
    </div>
  </div>
);
