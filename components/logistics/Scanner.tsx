"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScannerProps {
  onScan: (code: string) => void;
}

export default function Scanner({ onScan }: ScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const qrCodeRef = useRef<Html5Qrcode | null>(null);

  // פונקציה להשמעת צליל סריקה (Beep)
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  const stopScanner = async () => {
    if (qrCodeRef.current && qrCodeRef.current.isScanning) {
      try {
        await qrCodeRef.current.stop();
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  const startScanner = async () => {
    setError(null);
    setIsStarted(false);
    await stopScanner();

    const scanner = new Html5Qrcode("reader");
    qrCodeRef.current = scanner;

    // הגדרות אופטימליות למק"טים (ברקוד קווים)
    const config = {
      fps: 20,
      qrbox: { width: 300, height: 150 }, // מלבן רחב שמתאים לברקוד קווים
      aspectRatio: 1.0,
    };

    try {
      await scanner.start(
        { 
          facingMode: "environment",
          // ניסיון לכפות פוקוס ורזולוציה גבוהה
          advanced: [{ width: { min: 1280 }, height: { min: 720 } }, { focusMode: "continuous" } as any]
        } as any,
        config,
        (decodedText) => {
          if (decodedText !== lastCode) {
            setLastCode(decodedText);
            playBeep();
            onScan(decodedText);
          }
        },
        () => {} // שגיאות חיפוש שקטות
      );
      setIsStarted(true);
    } catch (err: any) {
      console.error("Scanner Error:", err);
      // ניסיון חוזר עם הגדרות בסיסיות אם HD נכשל
      try {
        await scanner.start({ facingMode: "environment" }, config, (text) => {
          setLastCode(text);
          playBeep();
          onScan(text);
        }, () => {});
        setIsStarted(true);
      } catch (fallbackErr) {
        setError("גישה למצלמה נכשלה. וודא שהרשאות מאושרות.");
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      startScanner();
    }, 800);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto space-y-4" dir="rtl">
      <div className="relative overflow-hidden rounded-[2.5rem] border-4 border-slate-900 bg-black aspect-square shadow-2xl">
        
        {/* Camera Viewport */}
        <div id="reader" className="w-full h-full object-cover"></div>

        {/* Scanner Overlay UI */}
        {isStarted && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[300px] h-[150px] border-2 border-blue-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] relative">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white"></div>
              {/* אנימציית לייזר סריקה */}
              <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan"></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/95 p-6 text-center">
            <AlertCircle className="text-red-500 mb-4" size={48} />
            <p className="text-white font-bold text-sm mb-6 leading-relaxed">{error}</p>
            <Button onClick={startScanner} className="bg-blue-600 hover:bg-blue-500 rounded-2xl font-black px-10 h-12">
              נסה שוב
            </Button>
          </div>
        )}

        {/* Loading State */}
        {!isStarted && !error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900 text-white">
            <Camera className="animate-pulse text-blue-500 mb-2" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">מתחבר למצלמת מסופון...</p>
          </div>
        )}

        {/* Refresh Button */}
        {isStarted && (
          <button 
            onClick={startScanner}
            className="absolute bottom-6 left-6 z-30 p-4 bg-white/10 backdrop-blur-xl rounded-full text-white border border-white/20 hover:bg-white/20 transition-all"
          >
            <RefreshCw size={20} />
          </button>
        )}
      </div>

      {/* Scanned Feedback Indicator */}
      {lastCode && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-green-600" size={20} />
            <div>
              <p className="text-[10px] font-black text-green-700 uppercase">נקלט בהצלחה</p>
              <p className="font-mono text-sm font-bold text-green-900 tracking-wider">{lastCode}</p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scan {
          position: absolute;
          animation: scan 2s linear infinite;
        }
        #reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
}
