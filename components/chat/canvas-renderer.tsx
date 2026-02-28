"use client"

import { motion } from "framer-motion"
import { Calculator, Package, Info } from "lucide-react"

export function CanvasRenderer({ data }: { data: any }) {
  if (!data?.components) return null;

  return (
    <div className="flex flex-col gap-3 w-full max-w-sm mt-2">
      {data.components.map((comp: any, i: number) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full"
        >
          {comp.type === "calcCard" && (
            <div className="bg-[#0B2C63] border border-[#10B981]/30 p-4 rounded-2xl flex items-center gap-4 text-white">
              <Calculator className="text-[#10B981] w-6 h-6" />
              <div>
                <p className="text-[10px] opacity-60 font-bold uppercase">תוצאת חישוב</p>
                <p className="text-lg font-black">{comp.props.boxes} קרטונים</p>
              </div>
            </div>
          )}

          {comp.type === "productCard" && (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="h-32 bg-white p-3 flex items-center justify-center">
                <img src={comp.props.image || "/placeholder.svg"} className="h-full object-contain" />
              </div>
              <div className="p-3 bg-stone-50 border-t flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-stone-800">{comp.props.name}</p>
                  <p className="text-[9px] text-stone-400 italic">SKU: {comp.props.sku}</p>
                </div>
                <div className="text-left">
                  <span className="text-[#10B981] font-black text-sm">₪{comp.props.price}</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}
