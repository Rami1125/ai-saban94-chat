"use client"

import { motion } from "framer-motion"
import { Calculator, Package, Info, ExternalLink } from "lucide-react"

export function CanvasRenderer({ data }: { data: any }) {
  if (!data?.components) return null

  return (
    <div className="flex flex-col gap-3 w-full max-w-[400px]">
      {data.components.map((comp: any, i: number) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="w-full"
        >
          {comp.type === "calcCard" && (
            <div className="bg-[#0B2C63]/80 border border-[#10B981]/40 p-4 rounded-2xl flex items-center gap-4 shadow-xl">
              <div className="bg-[#10B981]/20 p-2 rounded-lg">
                <Calculator className="text-[#10B981] w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-white/50 font-bold uppercase">תוצאת חישוב</p>
                <p className="text-lg font-black text-white">{comp.props.boxes} קרטונים</p>
              </div>
            </div>
          )}

          {comp.type === "productCard" && (
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
              <div className="h-32 bg-white p-3 flex items-center justify-center">
                <img src={comp.props.image || "/placeholder.svg"} className="h-full object-contain" alt={comp.props.name} />
              </div>
              <div className="p-3 bg-stone-50 flex justify-between items-center border-t border-stone-100">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-stone-800">{comp.props.name}</span>
                  <span className="text-[9px] text-stone-400 font-mono italic">SKU: {comp.props.sku}</span>
                </div>
                <div className="text-left">
                  <span className="text-[#10B981] font-black text-sm block">₪{comp.props.price}</span>
                  <button className="text-[8px] bg-[#0B2C63] text-white px-3 py-1.5 rounded-full font-black mt-1 uppercase">הוסף</button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}
