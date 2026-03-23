import type { Config } from "tailwindcss";


const config: Config = {
  // הוספת סריקה רחבה כדי לתפוס את הנתיבים של GitHub
content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./rami1125/**/*.{js,ts,jsx,tsx,mdx}", // זה הנתיב שבו נמצא כל הקוד שלך באמת!
    "./**/*.{js,ts,jsx,tsx,mdx}",          // ליתר ביטחון סורק כל קובץ בפרויקט
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        whatsapp: {
          DEFAULT: "#00a884",
          light: "#dcf8c6",
          dark: "#128c7e",
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
