// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter, Heebo } from "next/font/google";
import "./globals.css";
import { GlobalErrorBoundary } from "../components/GlobalErrorBoundary";
import { BusinessConfigProvider } from "../context/BusinessConfigContext";
import { ChatActionsProvider } from "../context/ChatActionsContext";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo" });

export const metadata: Metadata = {
  title: "ח. סבן – יועץ חומרים | ייעוץ טכני חכם לחומרי בניין",
  description:
    "ייעוץ טכני חכם לחומרי בניין – גבס, מלט, איטום, ברזל ועוד. חיפוש מוצרים, מפרטים טכניים והדרכות מקצועיות.",
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} ${inter.variable} font-sans`}>
        {/* טעינת סקריפט Google CSE פעם אחת לכל האתר */}
        <Script
          src="https://cse.google.com/cse.js?cx=9275b596f6d184447"
          strategy="afterInteractive"
        />

        {/* תיבת חיפוש גלובלית.
            ניתן להזיז ל-Header/Toolbar אם קיים כזה בפרויקט. */}
        <div className="gcse-search" />

        <GlobalErrorBoundary>
          <BusinessConfigProvider>
            <ChatActionsProvider>{children}</ChatActionsProvider>
          </BusinessConfigProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
