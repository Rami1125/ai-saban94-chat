"use client";
import React, { createContext, useContext, ReactNode } from "react";
import { businessConfig } from "../config/business.config";
import { BusinessConfig } from "../types";

const BusinessConfigContext = createContext<BusinessConfig | null>(null);

export function BusinessConfigProvider({ children }: { children: ReactNode }) {
  // ב-SaaS אמיתי כאן ניתן להוסיף fetch לטעינת קונפיגורציה לפי דומיין
  return (
    <BusinessConfigContext.Provider value={businessConfig}>
      {children}
    </BusinessConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(BusinessConfigContext);
  if (!context) throw new Error("useConfig must be used within BusinessConfigProvider");
  return context;
}
