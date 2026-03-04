import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GlobalErrorBoundary } from "../components/GlobalErrorBoundary";
import { BusinessConfigProvider } from "../context/BusinessConfigContext";
import { ChatActionsProvider } from "../context/ChatActionsContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ח. סבן AI - אסיסטנט טכני",
  description: "ייעוץ טכני חכם לחומרי בניין",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={inter.className}>
        <GlobalErrorBoundary>
          <BusinessConfigProvider>
            <ChatActionsProvider>
              {children}
            </ChatActionsProvider>
          </BusinessConfigProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
