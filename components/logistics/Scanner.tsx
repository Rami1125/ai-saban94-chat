"use client";

import { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function Scanner({ onScan }: { onScan: (code: string) => void }) {
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
      /* verbose= */ false
    );

    scannerRef.current.render(
      (decodedText: string) => {
        onScan(decodedText);
        // אפשר להשמיע צליל "ביפ" כאן
      },
      (error: any) => {
        // שגיאות סריקה שקטות (חיפוש ברקוד)
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err: any) => console.error(err));
      }
    };
  }, [onScan]);

  return (
    <div className="overflow-hidden rounded-3xl border-4 border-slate-900 shadow-2xl bg-black">
      <div id="reader" className="w-full"></div>
    </div>
  );
}
