import type { Metadata, Viewport } from "next";
import { Inter, Heebo } from "next/font/google";
import "./globals.css";
import { GlobalErrorBoundary } from "../components/GlobalErrorBoundary";
import { BusinessConfigProvider } from "../context/BusinessConfigContext";
import { ChatActionsProvider } from "../context/ChatActionsContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo" });

export const metadata: Metadata = {
  title: "ח. סבן – יועץ חומרים | ייעוץ טכני חכם לחומרי בניין",
  description: "ייעוץ טכני חכם לחומרי בניין – גבס, מלט, איטום, ברזל ועוד.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // תיקון: camelCase במקום user-scalable
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} ${inter.variable} font-sans overscroll-none`}>
        <GlobalErrorBoundary>
          <BusinessConfigProvider>
            <ChatActionsProvider>{children}</ChatActionsProvider>
          </BusinessConfigProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
