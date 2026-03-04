// config/business.config.ts
const getEnv = (key: string, defaultValue: string): string => {
  // בודק קודם את המשתנה הציבורי של Next.js, אחר כך את המשתנה הרגיל
  const value = process.env[`NEXT_PUBLIC_${key}`] || process.env[key];
  
  if (!value) {
    // מציג אזהרה רק ב-Development כדי לא ללכלך את ה-Production
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      console.warn(`[Config]: ${key} is missing, using default.`);
    }
    return defaultValue;
  }
  return value;
};

export const businessConfig = {
  businessId: getEnv("BUSINESS_ID", "saban"),
  businessName: getEnv("BUSINESS_NAME", "ח. סבן חומרי בניין"),
  primaryColor: getEnv("PRIMARY_COLOR", "#0B2C63"),
  apiUrl: getEnv("API_URL", "/api/chat"),
  features: {
    enableMaterialCalculator: getEnv("ENABLE_CALC", "true") === "true",
    enableVideoSupport: getEnv("ENABLE_VIDEO", "true") === "true",
    enableOrderSystem: getEnv("ENABLE_ORDER", "false") === "true",
  }
};
