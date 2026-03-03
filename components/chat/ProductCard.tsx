"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Clock, MessageCircle, PlayCircle } from "lucide-react";

type Product = {
  product_name?: string;
  sku?: string;
  price?: number;
  image_url?: string;
  video_url?: string;
  drying_time?: string;
  coverage?: string;
  [key: string]: any;
};

type OnConsult = (p: Product, t: string) => void;

function getYouTubeId(input?: string | null): string | null {
  if (!input) return null;
  // מזהה ישיר
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  try {
    const url = new URL(input);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1);
    if (url.searchParams.get("v")) return url.searchParams.get("v");
    const parts = url.pathname.split("/embed/");
    if (parts[1]) return parts[1].split(/[/?#&]/)[0];
  } catch {
    // not a URL
  }
  return null;
}

export function ProductCard({
  product,
  onConsult,
}: {
  product: Product;
  onConsult?: OnConsult;
}) {
  const [showVideo, setShowVideo] = useState(false);
  if (!product) return null;

  const safeConsult = (p: Product, t: string) => {
    if (typeof onConsult === "function") {
      onConsult(p, t);
    } else {
      console.error("❌ onConsult אינו פונקציה!", { onConsult, product: p, type: t });
    }
  };

  const ytId = getYouTubeId(product.video_url);

  return (
    <motion.div
      className="bg-white dark:bg-slate-900 border border-slate-200 rounded-[30px] overflow-hidden w-full max-w-[320px] shadow-xl"
      dir="rtl"
    >
      <div className="w-full h-40 bg-slate-100 relative">
        {!showVideo ? (
          <>
            <img
              src={product.image_url}
              className="w-full h-full object-contain p-4"
              alt={product.product_name || "תמונת מוצר"}
            />
            {ytId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVideo(true);
                }}
                className="absolute inset-0 flex items-center justify-center bg-black/5 hover:bg-black/10"
                type="button"
              >
                <PlayCircle size={40} className="text-white drop-shadow-lg" />
              </button>
            )}
          </>
        ) : (
          <div className="absolute inset-0 bg-black">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title={product.product_name || "וידאו מוצר"}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowVideo(false);
              }}
              className="absolute top-2 right-2 text-white bg-black/50 px-2 rounded-full text-xs"
              type="button"
            >
              סגור
            </button>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-black text-[#0B2C63] dark:text-white text-lg mb-2">
          {product.product_name || "מוצר"}
        </h3>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              safeConsult(product, "זמן ייבוש");
            }}
            className="flex-1 bg-slate-50 p-2 rounded-xl text-[10px] font-bold"
          >
            <Clock size={14} className="mx-auto mb-1 text-orange-500" />{" "}
            {product.drying_time || "24 שעות"}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              safeConsult(product, "חישוב כמויות");
            }}
            className="flex-1 bg-slate-50 p-2 rounded-xl text-[10px] font-bold"
          >
            <Calculator size={14} className="mx-auto mb-1 text-blue-500" />{" "}
            {product.coverage || "לפי מפרט"}
          </button>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            safeConsult(product, "התייעצות כללית");
          }}
          className="w-full bg-[#0B2C63] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-blue-800"
        >
          <MessageCircle size={18} /> התייעצות כאן
        </button>
      </div>
    </motion.div>
  );
}
