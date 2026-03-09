"use client";

import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Camera, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Scanner({ onScan }: { onScan: (code: string) => void }) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScannerReady, setIsScannerReady] = useState(false);
  const scannerRef = useRef<any>(null);

  const startScanner = () => {
    // בדיקה שהאלמנט קיים ב-DOM
    const readerElement = document.getElementById("reader");
    if (!readerElement) return;

    // אתחול הסורק
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 15, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        rememberLastUsedCamera: true,
        // עדיפות למצלמה אחורית (Environment)
        videoConstraints: { facingMode: "environment" }
      },
      false
    );

    scannerRef.current.render(
      (decodedText: string) => {
        onScan(decodedText);
      },
      (error: any) => {
        // שגיאות סריקה רגילות בזמן חיפוש
      }
    );
    setIsScannerReady(true);
  };

  useEffect(() => {
    // בקשת הרשאה ראשונית מהדפדפן
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => {
        setHasPermission(true);
        startScanner();
      })
      .catch((err) => {
        console.error("Camera permission denied:", err);
        setHasPermission(false);
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-[2.5rem] border-4 border-slate-900 bg-slate-950 aspect-square shadow-2xl">
      
      {/* אזור המצלמה */}
      <div id="reader" className="w-full h-full"></div>

      {/* הודעת חוסר הרשאה */}
      {hasPermission === false && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/90 p-6 text-center">
          <AlertTriangle className="text-amber-400 mb-4" size={48} />
          <h3 className="text-white font-black text-lg mb-2">המצלמה חסומה</h3>
          <p className="text-slate-400 text-xs mb-6">יש לאשר גישה למצלמה בהגדרות הדפדפן כדי להשתמש במסופון.</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-white text-slate-900 hover:bg-slate-200 rounded-2xl font-black px-8"
          >
            נסה שוב
          </Button>
        </div>
      )}

      {/* Overlay בזמן טעינה או מסך שחור */}
      {!isScannerReady && hasPermission !== false && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900 text-white">
          <Camera className="animate-pulse text-blue-500 mb-2" size={40} />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-50">מאתחל מצלמה...</p>
        </div>
      )}

      {/* כפתור רענון ידני קטן בצד */}
      {isScannerReady && (
        <button 
          onClick={() => {
            scannerRef.current?.clear().then(() => startScanner());
          }}
          className="absolute bottom-4 left-4 z-30 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all"
        >
          <RefreshCw size={18} />
        </button>
      )}
    </div>
  );
}
