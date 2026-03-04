"use client";

import React from "react";
import * as LucideIcons from "lucide-react";
import { LucideProps } from "lucide-react";

interface SafeIconProps extends LucideProps {
  name: string;
}

/**
 * רכיב אייקון בטוח המונע שגיאות "is not defined" בזמן Build וריצה.
 * שואב את האייקון מתוך הספרייה בצורה דינמית ובטוחה.
 */
export const SafeIcon = ({ name, size = 20, className, ...props }: SafeIconProps) => {
  // גישה בטוחה לאייקון לפי שם
  // @ts-ignore
  const IconComponent = LucideIcons[name];

  if (!IconComponent) {
    // Fallback במידה והאייקון לא נמצא - מציג ריבוע ריק למניעת קריסה
    return (
      <div 
        style={{ width: size, height: size }} 
        className={`bg-slate-200/50 rounded-sm inline-block ${className}`}
      />
    );
  }

  return <IconComponent size={size} className={className} {...props} />;
};

export default SafeIcon;
