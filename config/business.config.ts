import { BusinessConfig } from "../types";

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || process.env[`NEXT_PUBLIC_${key}`];
  
  // אם אנחנו בזמן Build (Prerendering), נאפשר fallback זמני כדי שה-Build לא יקרוס
  if (!value && process.env.NODE_ENV === "production" && typeof window === "undefined") {
    return defaultValue || "build_placeholder";
  }

  if (!value && !defaultValue) {
    throw new Error(`Fatal Error: Environment variable ${key} is missing. System cannot start.`);
  }
  
  return value || defaultValue || "";
};

export const businessConfig: BusinessConfig = {
  businessId: getEnv("BUSINESS_ID", "saban"),
  businessName: getEnv("BUSINESS_NAME", "ח. סבן AI"),
  primaryColor: getEnv("PRIMARY_COLOR", "#0B2C63"),
  apiUrl: getEnv("API_URL", "/api/chat"),
  features: {
    enableMaterialCalculator: getEnv("ENABLE_CALC", "true") === "true",
    enableVideoSupport: getEnv("ENABLE_VIDEO", "true") === "true",
    enableOrderSystem: getEnv("ENABLE_ORDER", "false") === "true",
  },
};
