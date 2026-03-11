import type { Metadata, Viewport } from "next";
import { Inter, Heebo } from "next/font/google";
import "./globals.css";
import { GlobalErrorBoundary } from "../components/GlobalErrorBoundary";
import { BusinessConfigProvider } from "../context/BusinessConfigContext";
import { ChatActionsProvider } from "../context/ChatActionsContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo" });

export const metadata: Metadata = {
  title: "Saban AI Studio",
  description: "ייעוץ טכני חכם לחומרי בניין - ניהול חוקים ומערכת",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Saban Studio",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  user-scalable: false,
  viewportFit: "cover", // מבטיח ניצול מלא של המסך ב-Note 25
};

// פונקציית עזר גלובלית לצליל אישור (ניתן להשתמש בה דרך ה-Window או להעביר ב-Context)
const playSuccessSound = () => {
  if (typeof window !== "undefined") {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // צליל גבוה ונקי
    oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.2);
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${heebo.variable} ${inter.variable} font-sans overscroll-none`}>
        <GlobalErrorBoundary>
          <BusinessConfigProvider>
            <ChatActionsProvider>
              {children}
            </ChatActionsProvider>
          </BusinessConfigProvider>
        </GlobalErrorBoundary>
        
        {/* הזרקת פונקציית הצליל לחלון הגלובלי לשימוש קל */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.playSuccessSound = ${playSuccessSound.toString()};
            `,
          }}
        />
      </body>
    </html>
  );
}
