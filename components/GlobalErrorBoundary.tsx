// components/GlobalErrorBoundary.tsx
"use client";
import React from "react";

export class GlobalErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // כאן נשלח ל-Sentry בעתיד
    console.error("FATAL UI CRASH:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
          <h2 className="text-2xl font-black text-slate-900 mb-2">אופס, משהו השתבש...</h2>
          <p className="text-slate-500 mb-6">אנחנו כבר בודקים את הצינורות. בינתיים, נסה לרענן את הדף.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30"
          >
            רענן עכשיו
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
