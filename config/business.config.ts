// config/business.config.ts
const getEnv = (key: string, defaultValue: string): string => {
  // בודק קודם את המשתנה הציבורי של Next.js, אחר כך את המשתנה הרגיל
  const value = process.env[`NEXT_PUBLIC_${key}`] || process.env[key];
  
  // מחזיר את הערך או את ברירת המחדל בשקט - אין צורך באזהרות כשיש ברירות מחדל תקינות
  return value || defaultValue;
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
