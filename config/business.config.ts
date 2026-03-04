// config/business.config.ts
const getEnv = (key: string, defaultValue: string): string => {
  const value = process.env[key] || process.env[`NEXT_PUBLIC_${key}`];
  if (!value) {
    // בזמן ריצה אמיתית (Client) אנחנו רוצים לדעת אם חסר, אבל ב-Build לא נכשיל את המערכת
    if (typeof window !== "undefined") {
      console.warn(`Missing ENV: ${key}`);
    }
    return defaultValue;
  }
  return value;
};

export const businessConfig = {
  businessId: getEnv("BUSINESS_ID", "saban"),
  businessName: getEnv("BUSINESS_NAME", "ח. סבן AI"),
  primaryColor: getEnv("PRIMARY_COLOR", "#0B2C63"),
  apiUrl: getEnv("API_URL", "/api/chat"),
  // ... שאר ההגדרות
};
