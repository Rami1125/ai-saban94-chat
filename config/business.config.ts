import { BusinessConfig } from "../types";

const getEnv = (key: string): string => {
  const value = process.env[key] || process.env[`NEXT_PUBLIC_${key}`];
  if (!value) {
    throw new Error(`Fatal Error: Environment variable ${key} is missing. System cannot start.`);
  }
  return value;
};

export const businessConfig: BusinessConfig = {
  businessId: getEnv("BUSINESS_ID"),
  businessName: getEnv("BUSINESS_NAME"),
  primaryColor: getEnv("PRIMARY_COLOR"),
  apiUrl: getEnv("API_URL"),
  features: {
    enableMaterialCalculator: getEnv("ENABLE_CALC") === "true",
    enableVideoSupport: getEnv("ENABLE_VIDEO") === "true",
    enableOrderSystem: getEnv("ENABLE_ORDER") === "true",
  },
};
