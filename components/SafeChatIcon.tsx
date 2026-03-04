"use client";

import React from "react";
import dynamic from "next/dynamic";
import { LucideProps } from "lucide-react";

/**
 * טעינה דינמית של האייקון הספציפי שגרם לשגיאה.
 * ssr: false מבטיח שהקוד לא ירוץ בשרת, שם window/lucide עלולים לא להיות מוגדרים.
 */
const DynamicMessageSquare = dynamic(
  () => import("lucide-react").then((m) => m.MessageSquare),
  { 
    ssr: false,
    loading: () => <div className="w-5 h-5 bg-slate-200 animate-pulse rounded-full" />
  }
);

export function SafeChatIcon(props: LucideProps) {
  return <DynamicMessageSquare {...props} />;
}

export default SafeChatIcon;
